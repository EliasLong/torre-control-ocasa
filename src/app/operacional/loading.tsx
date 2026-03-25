export default function OperacionalLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Header skeleton */}
      <div className="h-8 w-64 bg-[var(--color-border)] rounded-lg opacity-30" />

      {/* KPI skeletons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 h-24"
          >
            <div className="h-3 w-20 bg-[var(--color-border)] rounded opacity-40 mb-3" />
            <div className="h-6 w-16 bg-[var(--color-border)] rounded opacity-40" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
        <div className="h-5 w-32 bg-[var(--color-border)] rounded opacity-40 mb-4" />
        <div className="h-[380px] bg-[var(--color-border)] rounded-lg opacity-20" />
      </div>

      {/* Table skeleton */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
        <div className="h-5 w-28 bg-[var(--color-border)] rounded opacity-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 bg-[var(--color-border)] rounded opacity-20" />
          ))}
        </div>
      </div>
    </div>
  );
}
