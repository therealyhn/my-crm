import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/shared/ProtectedRoute'
import { USER_ROLES } from './lib/constants/roles'
import AdminClientsPage from './pages/admin/AdminClientsPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminProjectsPage from './pages/admin/AdminProjectsPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import AdminTaskDetailPage from './pages/admin/AdminTaskDetailPage'
import AdminTasksPage from './pages/admin/AdminTasksPage'
import LoginPage from './pages/auth/LoginPage'
import ClientDashboardPage from './pages/client/ClientDashboardPage'
import ClientProjectDetailPage from './pages/client/ClientProjectDetailPage'
import ClientProjectsPage from './pages/client/ClientProjectsPage'
import ClientTaskDetailPage from './pages/client/ClientTaskDetailPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]} />}>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/clients" element={<AdminClientsPage />} />
        <Route path="/admin/projects" element={<AdminProjectsPage />} />
        <Route path="/admin/tasks" element={<AdminTasksPage />} />
        <Route path="/admin/tasks/:id" element={<AdminTaskDetailPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.CLIENT]} />}>
        <Route path="/client/dashboard" element={<ClientDashboardPage />} />
        <Route path="/client/projects" element={<ClientProjectsPage />} />
        <Route path="/client/projects/:id" element={<ClientProjectDetailPage />} />
        <Route path="/client/tasks/:id" element={<ClientTaskDetailPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
