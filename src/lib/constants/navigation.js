import { USER_ROLES } from './roles'

export const NAV_BY_ROLE = {
  [USER_ROLES.ADMIN]: [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/clients', label: 'Clients' },
    { to: '/admin/projects', label: 'Projects' },
    { to: '/admin/tasks', label: 'Tasks' },
    { to: '/admin/reports', label: 'Reports' },
  ],
  [USER_ROLES.CLIENT]: [
    { to: '/client/dashboard', label: 'Dashboard' },
    { to: '/client/projects', label: 'Projects' },
  ],
}
