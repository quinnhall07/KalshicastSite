// components/NavBar.tsx
import Link from "next/link";
import UtcClock from "./UtcClock";

export default function NavBar() {
  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left Side: Logo & Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-emerald-400">⚡</span> Kalshicast
          </Link>
          
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <Link href="/" className="hover:text-emerald-400 transition-colors">
              Live Bets
            </Link>
            <Link href="/stats" className="hover:text-emerald-400 transition-colors">
              Stats Matrix
            </Link>
            {/* Added Health Dashboard Link */}
            <Link href="/health" className="hover:text-emerald-400 transition-colors">
              System Health
            </Link>
          </div>
        </div>

        {/* Right Side: UTC Clock */}
        <div className="flex items-center">
          <UtcClock />
        </div>
        
      </div>
    </nav>
  );
}