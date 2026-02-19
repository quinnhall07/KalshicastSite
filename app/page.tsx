// app/page.tsx
import { supabase } from '../utils/supabase';
import Link from 'next/link';

export const revalidate = 0; 

export default async function Home() {
  const { data: bets, error } = await supabase
    .from('vw_best_bets')
    .select('*');

  if (error) {
    console.error('Error fetching best bets:', error);
    return <div className="p-8 text-red-500">Error loading bets. Check server logs.</div>;
  }

  return (
    <main className="min-h-screen p-8 bg-slate-950 text-slate-50 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold">Quantitative Weather Bets</h1>
            <p className="text-slate-400 mt-1">Live Edge & Market Probabilities</p>
          </div>
          <Link href="/stats" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
            View Model Stats →
          </Link>
        </div>

        {/* Bets Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bets?.map((bet, index) => (
            <div key={index} className="p-5 bg-slate-900 rounded-xl shadow-lg border border-slate-800 flex flex-col gap-3">
              <div className="border-b border-slate-800 pb-2">
                <h2 className="text-xl font-bold text-blue-400">
                  {bet.city_name || bet.station_id}
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
      </div>
    </main>
  );
}