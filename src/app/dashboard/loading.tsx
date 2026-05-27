export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="h-32 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="h-64 rounded-lg bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}
