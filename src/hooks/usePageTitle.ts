import { useLocation } from 'react-router-dom';

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Панель управления',
  '/vms': 'Виртуальные машины',
  '/networks': 'Сети',
  '/profile': 'Профиль',
  '/admin': 'Панель администратора',
  '/admin/tenants': 'Арендаторы',
  '/admin/vms': 'Все виртуальные машины',
  '/admin/audit': 'Журнал аудита',
  '/onboarding': 'Настройка рабочего пространства',
};

export function usePageTitle(): string {
  const { pathname } = useLocation();

  // Exact match first
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];

  // Dynamic segments: /vms/:id → "VM Details", /admin/tenants/:id → "Tenant Details"
  if (/^\/vms\/.+/.test(pathname)) return 'Детали VM';
  if (/^\/admin\/tenants\/.+/.test(pathname)) return 'Детали арендатора';

  return 'CloudIaaS';
}
