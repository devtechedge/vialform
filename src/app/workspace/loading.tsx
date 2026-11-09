export default function WorkspaceLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-5 py-8" aria-busy="true" aria-label="Loading workspace">
      <div className="h-8 w-64 animate-pulse rounded bg-surface-2" />
      <div className="h-24 animate-pulse rounded-xl bg-surface-2" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-40 animate-pulse rounded-xl bg-surface-2" />
        <div className="h-40 animate-pulse rounded-xl bg-surface-2" />
      </div>
    </div>
  );
}