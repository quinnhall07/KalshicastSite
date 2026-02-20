import Link from "next/link"
import { CloudSun, BarChart3 } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 border border-primary/20">
            <CloudSun className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              Kalshicast
            </h1>
            <p className="text-xs text-muted-foreground leading-none">
              by Knowlu
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors"
          >
            <CloudSun className="w-4 h-4" />
            <span className="hidden sm:inline">Best Bets</span>
          </Link>
          <Link
            href="/stats"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Model Stats</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
