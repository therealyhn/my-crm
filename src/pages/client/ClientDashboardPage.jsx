import AppShell from '../../components/layout/AppShell'

export default function ClientDashboardPage() {
  return (
    <AppShell title="Client Dashboard">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Client Area Ready</h2>
        <p className="mt-2 text-sm text-slate-600">
          Session auth and client/admin route separation are enabled. Feature pages come in the next milestone.
        </p>
      </div>
    </AppShell>
  )
}