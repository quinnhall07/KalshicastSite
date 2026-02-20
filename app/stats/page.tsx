import { supabase } from "../../utils/supabase"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { StatsTable } from "@/components/stats-table"
import { BarChart3 } from "lucide-react"

export const dynamic = "force-dynamic"

interface DashboardStat {
  station_id: string
  source: string
  n: number
  bias: number
  mae: number
  rmse: number
  pct_within_1f: number
}

export default async function StatsDashboard() {
  const { data: stats, error } = await supabase
    .from("dashboard_stats")
    .select("*")
    .eq("kind", "both")
    .eq("lead_days", 1)
    .order("mae", { ascending: true })

  if (error) {
    console.error("Error fetching stats:", error)
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">
              Unable to Load Stats
            </h2>
            <p className="text-muted-foreground">
              Could not connect to the analytics service. Please try again
              later.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground tracking-tight text-balance">
              Model Performance Matrix
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl text-pretty">
              Accuracy metrics for our weather forecasting models across all
              tracked stations. 1-day lead time, highs and lows combined.
            </p>
          </div>

          {/* Stats Table */}
          <StatsTable stats={stats as DashboardStat[]} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
