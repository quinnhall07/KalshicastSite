export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Kalshicast</span>
          <span>by Knowlu</span>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Weather prediction market intelligence. Not financial advice.
        </p>
      </div>
    </footer>
  )
}
