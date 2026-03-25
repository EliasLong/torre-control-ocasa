export default function Loading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--color-accent-cyan)] border-t-transparent" />
    </div>
  );
}
