export function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-warmwhite">
      <div className="h-8 w-8 rounded-full border border-gold/40 border-t-gold animate-spin" />
      <p className="animate-shimmer font-display text-lg tracking-wide text-mutedgray">Opening the archive…</p>
    </div>
  )
}
