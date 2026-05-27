export default function DashboardLoading() {
  return (
    <div className="page-shell">
      <div className="space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-32" />
        <div className="skeleton h-64" />
      </div>
    </div>
  );
}
