import AppShell from '../../components/layout/AppShell'

export default function AdminDashboardPage() {
  return (
    <AppShell title="Admin Dashboard">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Admin Area Ready</h2>
        <p className="mt-2 text-sm text-slate-600">
          Routing, auth state, and role protection are active. Next milestone adds full pages and API data integration.
        </p>
      </div>
    </AppShell>
  )
}
