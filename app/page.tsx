// app/page.tsx
import { supabase } from '@/utils/supabase';

// Define the shape of our data based on your SQL View
interface BestBet {
  target_date: string;
  station_id: string;
  city_name: string;
  state: string;
  target_type: 'high' | 'low';
  bin_even: number;
  bin_odd: number;
  mu_opt: number;
  sigma_opt: number;
  p_yes: number;
  margin: number;
  edge_ratio: number;
}

// Force Next.js to dynamically render this page on every request
export const revalidate = 0; 

export default async function Home() {
  // 1. Fetch data directly from the Supabase View
  const { data: bets, error } = await supabase
    .from('vw_best_bets')
    .select('*');

  if (error) {
    console.error('Error fetching best bets:', error);
    return <div className="p-8 text-red-500">Error loading bets. Check server logs.</div>;
  }

  // 2. Render the UI
  return (
    <main className="min-h-screen p-8 bg-slate-950 text-slate-50 font-sans">
      <h1 className="text-3xl font-bold mb-8">Quantitative Weather Bets</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bets?.map((bet: BestBet, index: number) => (
          <div key={index} className="p-5 bg-slate-900 rounded-xl shadow-lg border border-slate-800 flex flex-col gap-3">
            <div className="border-b border-slate-800 pb-2">
              <h2 className="text-xl font-bold text-blue-400">
                {bet.city_name}, {bet.state}
              </h2>
              <p className="text-slate-400 text-sm font-medium">
                {bet.target_type.toUpperCase()} • {new Date(bet.target_date).toLocaleDateString()}
              </p>
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Kalshi Market:</span>
                <span className="font-mono">{bet.bin_even}° to {bet.bin_odd}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Model P(Yes):</span>
                <span className="font-mono font-bold text-emerald-400">
                  {(bet.p_yes * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Margin:</span>
                <span className="font-mono">{bet.margin}°F</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Edge Ratio:</span>
                <span className="font-mono">{bet.edge_ratio}</span>
              </div>
            </div>
          </div>
        ))}
        
        {(!bets || bets.length === 0) && (
          <p className="text-slate-400">No active markets found.</p>
        )}
      </div>
    </main>
  );
}
