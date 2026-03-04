import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSidebarStore } from '@/hooks/useSidebar';
import { cn } from '@/lib/utils';

export default function AdminLayout() {
  const title = usePageTitle();
  const { isCollapsed } = useSidebarStore();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className={cn(
        'flex flex-1 flex-col min-w-0 transition-all duration-200',
        'ml-0',
        'md:ml-16',
        isCollapsed ? 'xl:ml-16' : 'xl:ml-64',
      )}>
        <Topbar title={title} adminBadge />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


