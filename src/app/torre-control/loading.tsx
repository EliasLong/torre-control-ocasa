export default function Loading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-8 w-56 bg-[var(--color-border)] rounded-lg opacity-30" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-[var(--color-border)] rounded-xl opacity-20" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-[var(--color-border)] rounded-xl opacity-20" />
        ))}
      </div>
    </div>
  );
}
