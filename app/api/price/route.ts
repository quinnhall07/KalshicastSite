// app/api/price/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'edge'; // Runs on Vercel's Edge Network for lower latency

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tickers = searchParams.get('tickers');

  if (!tickers) {
    return NextResponse.json({ error: 'No tickers provided' }, { status: 400 });
  }

  const KALSHI_API_KEY = process.env.KALSHI_API_KEY;

  try {
    // We use the 'tickers' query param to fetch multiple markets in one single HTTP request
    // This is much faster than looping through them individually.
    const response = await fetch(
      `https://api.kalshi.com/trade-api/v2/markets?tickers=${tickers}`,
      {
        headers: {
          'Authorization': `Bearer ${KALSHI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 1 }, // Cache for 1 second to prevent rate limiting
      }
    );

    if (!response.ok) {
      throw new Error(`Kalshi API Error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform the heavy Kalshi response into a lightweight map: Ticker -> Prices
    // This reduces the data sent to the client significantly.
    const priceMap: Record<string, any> = {};
    
    data.markets.forEach((market: any) => {
      priceMap[market.ticker] = {
        yes_bid: market.yes_bid,
        yes_ask: market.yes_ask,
        last_price: market.last_price,
      };
    });

    return NextResponse.json(priceMap);

  } catch (error) {
    console.error('Error fetching Kalshi prices:', error);
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
  }
}
