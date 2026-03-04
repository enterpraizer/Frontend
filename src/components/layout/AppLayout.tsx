import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function AppLayout() {
  const title = usePageTitle();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      {/* Offset content by sidebar width */}
      <div className="flex flex-1 flex-col ml-64 min-w-0">
        <Topbar title={title} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

