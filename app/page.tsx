import { supabase } from "../utils/supabase"
import { Header } from "@/components/header"
import { BetCard } from "@/components/bet-card"
import { SummaryStats } from "@/components/summary-stats"
import { Footer } from "@/components/footer"
import { CloudOff } from "lucide-react"

export const dynamic = "force-dynamic"

interface BestBet {
  station_id: string
  city_name: string
  target_type: string
  target_date: string
  bin_even: number
  bin_odd: number
  p_yes: number
  margin: number
  edge_ratio: number
}

export default async function Home() {
  const { data: bets, error } = await supabase
    .from("vw_best_bets")
    .select("*")

  if (error) {
    console.error("Error fetching best bets:", error)
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <CloudOff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">
              Unable to Load Data
            </h2>
            <p className="text-muted-foreground">
              Could not connect to the weather data service. Please try again
              later.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const sortedBets = (bets as BestBet[])?.sort(
    (a, b) => b.edge_ratio - a.edge_ratio
  )

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Hero Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground tracking-tight text-balance">
              Weather Market Intelligence
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl text-pretty">
              Our quantitative models analyze weather forecasts to find the
              highest-edge opportunities on Kalshi prediction markets. Sorted by
              edge ratio for your convenience.
            </p>
          </div>

          {/* Summary Stats */}
          {sortedBets && sortedBets.length > 0 && (
            <div className="mb-8">
              <SummaryStats bets={sortedBets} />
            </div>
          )}

          {/* Bet Cards Grid */}
          {sortedBets && sortedBets.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {sortedBets.map((bet, index) => (
                <BetCard key={`${bet.station_id}-${bet.target_date}-${bet.target_type}-${index}`} bet={bet} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <CloudOff className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">
                No Active Markets
              </h3>
              <p className="text-muted-foreground text-sm">
                Check back soon for new weather betting opportunities.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
