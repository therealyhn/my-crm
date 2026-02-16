import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/shared/ProtectedRoute'
import { USER_ROLES } from './lib/constants/roles'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import LoginPage from './pages/auth/LoginPage'
import ClientDashboardPage from './pages/client/ClientDashboardPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]} />}>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.CLIENT]} />}>
        <Route path="/client/dashboard" element={<ClientDashboardPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
