import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

function FullPageState({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-700">
      <div className="rounded-lg border border-slate-200 bg-white px-6 py-4 text-sm">{children}</div>
    </div>
  )
}

export default function ProtectedRoute({ allowedRoles }) {
  const { loading, user, isAuthenticated } = useAuth()

  if (loading) {
    return <FullPageState>Loading session...</FullPageState>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/client/dashboard'} replace />
  }

  return <Outlet />
}
