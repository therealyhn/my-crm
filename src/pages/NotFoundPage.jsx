import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600">The route you requested does not exist.</p>
        <Link to="/login" className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800">
          Back to login
        </Link>
      </div>
    </div>
  )
}
