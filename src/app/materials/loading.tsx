export default function MaterialsLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8" aria-busy="true" aria-label="Loading materials">
      <div className="h-8 w-48 animate-pulse rounded bg-surface-2" />
      <div className="mt-6 h-24 animate-pulse rounded-xl bg-surface-2" />
      <div className="mt-6 space-y-3">
        {[0, 1, 2, 3, 4].map((row) => <div key={row} className="h-12 animate-pulse rounded-lg bg-surface-2" />)}
      </div>
    </div>
  );
}