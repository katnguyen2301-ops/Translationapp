export function ExerciseProgress({ current, total }: { current: number; total: number }) {
  const pct = total === 0 ? 0 : Math.min(100, Math.round((current / total) * 100))
  return (
    <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-brand transition-all duration-300 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
