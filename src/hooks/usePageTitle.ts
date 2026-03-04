import { useLocation } from 'react-router-dom';

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/vms': 'Virtual Machines',
  '/networks': 'Networks',
  '/profile': 'Profile',
  '/admin': 'Admin Dashboard',
  '/admin/tenants': 'Tenants',
  '/admin/vms': 'All Virtual Machines',
  '/admin/audit': 'Audit Log',
  '/onboarding': 'Setup Workspace',
};

export function usePageTitle(): string {
  const { pathname } = useLocation();

  // Exact match first
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];

  // Dynamic segments: /vms/:id → "VM Details", /admin/tenants/:id → "Tenant Details"
  if (/^\/vms\/.+/.test(pathname)) return 'VM Details';
  if (/^\/admin\/tenants\/.+/.test(pathname)) return 'Tenant Details';

  return 'CloudIaaS';
}
