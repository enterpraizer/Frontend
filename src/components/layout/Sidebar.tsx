import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  Network,
  User,
  Shield,
  Building2,
  Layers,
  ClipboardList,
  LogOut,
  Cloud,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import UserAvatar from '@/components/features/users/UserAvatar';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

interface NavSection {
  heading: string;
  items: NavItem[];
  adminOnly?: boolean;
}

const NAV_SECTIONS: NavSection[] = [
  {
    heading: 'COMPUTE',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: 'Virtual Machines', to: '/vms', icon: <Server className="h-4 w-4" /> },
    ],
  },
  {
    heading: 'NETWORKING',
    items: [
      { label: 'Networks', to: '/networks', icon: <Network className="h-4 w-4" /> },
    ],
  },
  {
    heading: 'ACCOUNT',
    items: [
      { label: 'Profile', to: '/profile', icon: <User className="h-4 w-4" /> },
    ],
  },
  {
    heading: 'ADMINISTRATION',
    adminOnly: true,
    items: [
      { label: 'Admin Dashboard', to: '/admin', icon: <Shield className="h-4 w-4" /> },
      { label: 'Tenants', to: '/admin/tenants', icon: <Building2 className="h-4 w-4" /> },
      { label: 'All VMs', to: '/admin/vms', icon: <Layers className="h-4 w-4" /> },
      { label: 'Audit Log', to: '/admin/audit', icon: <ClipboardList className="h-4 w-4" /> },
    ],
  },
];

function SidebarLink({ to, icon, label }: NavItem) {
  return (
    <NavLink
      to={to}
      end={to !== '/vms' && to !== '/admin/tenants'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
          'text-slate-300 hover:bg-slate-800 hover:text-white',
          isActive &&
            'bg-slate-800 text-white border-l-2 border-blue-400 rounded-l-none pl-[10px]',
        )
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const workspaceName = user?.tenant_id ?? 'No workspace';

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-slate-900 text-white">
      {/* Logo + workspace */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500">
          <Cloud className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight truncate">CloudIaaS</p>
          <p className="text-xs text-slate-400 truncate" title={workspaceName}>
            {workspaceName}
          </p>
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {NAV_SECTIONS.map((section) => {
          if (section.adminOnly && !isAdmin) return null;
          return (
            <div key={section.heading}>
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {section.heading}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <SidebarLink {...item} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      {user && (
        <div className="border-t border-slate-800 px-3 py-3 flex items-center gap-3">
          <UserAvatar user={user} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-tight truncate">{user.username}</p>
            <span
              className={cn(
                'inline-block text-[10px] px-1.5 py-0.5 rounded font-medium',
                user.role === 'admin'
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'bg-slate-700 text-slate-400',
              )}
            >
              {user.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="shrink-0 text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </aside>
  );
}
