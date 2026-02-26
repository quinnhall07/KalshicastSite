// app/page.tsx
import { supabase } from '../utils/supabase';
import PredictionChart from '../components/PredictionChart';
import ErrorDistributionChart from '../components/ErrorDistributionChart';
import VolatilitySparkline from '../components/VolatilitySparkline';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // --- 1. DATA FETCHING ---
  
  // A. Fetch latest daily observations for the Volatility Matrix
  // Increased to 200 so we have enough historical rows to build 7-day sparklines
  const { data: rawObs } = await supabase
    .from('observations')
    .select(`
      date,
      observed_high,
      observed_low,
      station_id,
      locations ( city, state )
    `)
    .order('date', { ascending: false })
    .limit(200);

  // B. Fetch the largest recent forecast errors for the Truth Tracker
  const { data: rawErrors } = await supabase
    .from('forecast_errors')
    .select(`
      target_date,
      err_high,
      err_low,
      mae,
      station_id,
      locations ( city ),
      forecast_runs ( source )
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  // C. Fetch REAL Chart Data for KNYC (Line Chart)
  const chartStationId = 'KNYC'; 
  
  const { data: chartObs } = await supabase
    .from('observations')
    .select('date, observed_high')
    .eq('station_id', chartStationId)
    .order('date', { ascending: false })
    .limit(100);

  const { data: chartForecasts } = await supabase
    .from('forecasts_daily')
    .select('target_date, high_f')
    .eq('station_id', chartStationId)
    .order('target_date', { ascending: false })
    .limit(100);

  // D. Fetch a larger dataset for the Global Error Distribution (Bar Chart)
  const { data: rawMae } = await supabase
    .from('forecast_errors')
    .select('mae')
    .not('mae', 'is', null)
    .order('created_at', { ascending: false })
    .limit(500);


  // --- 2. DATA PROCESSING ---

  // Process Volatility
  const obsByStation = new Map();
  rawObs?.forEach(obs => {
    if (!obsByStation.has(obs.station_id)) {
      obsByStation.set(obs.station_id, []);
    }
    obsByStation.get(obs.station_id).push(obs);
  });

  const volatilityData = Array.from(obsByStation.values())
    .filter(obsList => obsList.length >= 2)
    .map(obsList => {
      const latest = obsList[0];
      const previous = obsList[1];
      const deltaHigh = latest.observed_high - previous.observed_high;
      
      const loc = latest.locations as any;
      const cityName = (Array.isArray(loc) ? loc[0]?.city : loc?.city) || latest.station_id;
      
      // Build 7-day history for the sparkline (reversed so oldest is on the left)
      const sparklineData = obsList
        .slice(0, 7)
        .reverse()
        .map((o: any) => ({ temp: o.observed_high }));

      // Determine sparkline color based on volatility
      let sparklineColor = '#94a3b8'; // default gray
      if (deltaHigh >= 10) sparklineColor = '#f87171'; // red for huge spike
      else if (deltaHigh <= -10) sparklineColor = '#60a5fa'; // blue for huge drop
      else if (Math.abs(deltaHigh) >= 5) sparklineColor = '#fbbf24'; // yellow for moderate

      return {
        station_id: latest.station_id,
        city: cityName,
        temp_now: latest.observed_high,
        temp_prev: previous.observed_high,
        delta: deltaHigh,
        date: latest.date,
        sparklineData,
        sparklineColor
      };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 6);

  // Process Errors (Busts)
  const bustsData = (rawErrors || [])
    .filter(err => err.mae !== null)
    .sort((a, b) => (b.mae ?? 0) - (a.mae ?? 0))
    .slice(0, 8)
    .map(err => {
      const loc = err.locations as any;
      const run = err.forecast_runs as any;
      
      const cityName = (Array.isArray(loc) ? loc[0]?.city : loc?.city) || err.station_id;
      const sourceName = (Array.isArray(run) ? run[0]?.source : run?.source) || 'Unknown';

      return {
        station_id: err.station_id,
        city: cityName,
        source: sourceName,
        target_date: err.target_date,
        err_high: err.err_high,
        err_low: err.err_low,
        mae: err.mae
      };
    });

  // Process Line Chart Data
  const chartDataMap = new Map();

  chartObs?.forEach(obs => {
    const cleanDate = obs.date.split('T')[0];
    if (!chartDataMap.has(cleanDate)) {
      const dateParts = cleanDate.split('-');
      const month = new Date(`${dateParts[0]}-${dateParts[1]}-01`).toLocaleString('default', { month: 'short' });
      const formattedDate = `${month} ${parseInt(dateParts[2])}`; 
      
      chartDataMap.set(cleanDate, {
        date: formattedDate,
        actual: obs.observed_high,
        predicted: null 
      });
    }
  });

  chartForecasts?.forEach(forecast => {
    const cleanTargetDate = forecast.target_date.split('T')[0];
    if (chartDataMap.has(cleanTargetDate)) {
      const entry = chartDataMap.get(cleanTargetDate);
      if (entry.predicted === null) {
        entry.predicted = forecast.high_f;
      }
    }
  });

  const realChartData = Array.from(chartDataMap.values())
    .filter(day => day.predicted !== null && day.actual !== null)
    .reverse()
    .slice(-14); 

  // Process Bar Chart Distribution Bins
  const bins = {
    '0-1°': 0,
    '1-2°': 0,
    '2-3°': 0,
    '3-4°': 0,
    '4-5°': 0,
    '5°+': 0
  };

  rawMae?.forEach(row => {
    const err = row.mae;
    if (err < 1) bins['0-1°']++;
    else if (err < 2) bins['1-2°']++;
    else if (err < 3) bins['2-3°']++;
    else if (err < 4) bins['3-4°']++;
    else if (err < 5) bins['4-5°']++;
    else bins['5°+']++;
  });

  const distributionData = Object.entries(bins).map(([bin, count]) => ({ bin, count }));

  // --- 3. RENDER UI ---
  return (
    <main className="min-h-screen p-8 bg-slate-950 text-slate-50 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* --- SECTION 1: DAILY VOLATILITY MATRIX --- */}
        <section>
          <div className="mb-6 border-b border-slate-800 pb-2 flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                <span className="text-blue-400">🌊</span> High Temp Volatility
              </h2>
              <p className="text-slate-400 text-sm mt-1">Day-over-day changes in maximum temperatures</p>
            </div>
          </div>

          {volatilityData.length === 0 ? (
            <div className="p-8 text-center border border-slate-800 rounded-xl bg-slate-900/50 text-slate-400">
              Not enough daily observation data to calculate swings yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {volatilityData.map((cond, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-200">{cond.city}</h3>
                      <p className="text-xs font-mono text-slate-500">{cond.date}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-bold font-mono rounded-md border ${
                      Math.abs(cond.delta) >= 10 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                      Math.abs(cond.delta) >= 5 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {cond.delta > 0 ? '+' : ''}{cond.delta.toFixed(1)}°
                    </span>
                  </div>

                  {/* Sparkline layout integration */}
                  <div className="flex items-end justify-between mt-2">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Latest High</p>
                      <p className="text-3xl font-mono font-bold">{cond.temp_now}°</p>
                    </div>
                    
                    {/* The New Sparkline Component! */}
                    <VolatilitySparkline data={cond.sparklineData} color={cond.sparklineColor} />
                    
                    <div className="text-right">
                      <p className="text-xs text-slate-400 mb-1">Previous High</p>
                      <p className="text-xl font-mono text-slate-500">{cond.temp_prev}°</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>


        {/* --- SECTION 2: THE TRUTH TRACKER --- */}
        <section>
          <div className="mb-6 border-b border-slate-800 pb-2">
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <span className="text-red-400">⚠️</span> The Truth Tracker: Worst Model Busts
            </h2>
            <p className="text-slate-400 text-sm mt-1">Recent forecasts with the highest Mean Absolute Error (MAE)</p>
          </div>

          {bustsData.length === 0 ? (
            <div className="p-8 text-center border border-slate-800 rounded-xl bg-slate-900/50 text-slate-400">
              No forecast errors logged yet. Check your ingestion pipeline.
            </div>
          ) : (
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-4 font-semibold">Target Date</th>
                      <th className="p-4 font-semibold">City</th>
                      <th className="p-4 font-semibold">Model Source</th>
                      <th className="p-4 font-semibold text-right">High Error</th>
                      <th className="p-4 font-semibold text-right">Low Error</th>
                      <th className="p-4 font-semibold text-right">Overall Miss (MAE)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {bustsData.map((bust, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 font-mono text-slate-400">{bust.target_date}</td>
                        <td className="p-4 font-medium text-blue-400">
                          {bust.city} <span className="text-slate-500 text-xs ml-1">{bust.station_id}</span>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-300">{bust.source}</td>
                        <td className="p-4 text-right font-mono text-slate-400">
                          {bust.err_high !== null ? `${bust.err_high > 0 ? '+' : ''}${bust.err_high}°` : '-'}
                        </td>
                        <td className="p-4 text-right font-mono text-slate-400">
                          {bust.err_low !== null ? `${bust.err_low > 0 ? '+' : ''}${bust.err_low}°` : '-'}
                        </td>
                        <td className="p-4 text-right font-mono">
                          <span className="px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-bold">
                            {bust.mae.toFixed(1)}°
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* --- SECTION 3: QUANTITATIVE CHARTS --- */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PredictionChart 
            data={realChartData} 
            title="Prediction vs. Reality" 
            stationId={chartStationId} 
          />
          <ErrorDistributionChart 
            data={distributionData} 
            title="Global Error Distribution" 
          />
        </section>

      </div>
    </main>
  );
}