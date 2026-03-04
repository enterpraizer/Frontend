import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSidebarStore } from '@/hooks/useSidebar';
import { cn } from '@/lib/utils';

export default function AppLayout() {
  const title = usePageTitle();
  const { isCollapsed } = useSidebarStore();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      {/* Main content — offset matches sidebar width at each breakpoint */}
      <div className={cn(
        'flex flex-1 flex-col min-w-0 transition-all duration-200',
        'ml-0',                                    // mobile: no offset (sidebar is overlay)
        'md:ml-16',                                // tablet: icon sidebar offset
        isCollapsed ? 'xl:ml-16' : 'xl:ml-64',    // desktop: full or collapsed
      )}>
        <Topbar title={title} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


