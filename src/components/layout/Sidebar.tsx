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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useSidebarStore } from '@/hooks/useSidebar';
import UserAvatar from '@/components/features/users/UserAvatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
      { label: 'Dashboard',        to: '/dashboard', icon: <LayoutDashboard className="h-4 w-4 shrink-0" /> },
      { label: 'Virtual Machines', to: '/vms',       icon: <Server          className="h-4 w-4 shrink-0" /> },
    ],
  },
  {
    heading: 'NETWORKING',
    items: [{ label: 'Networks', to: '/networks', icon: <Network className="h-4 w-4 shrink-0" /> }],
  },
  {
    heading: 'ACCOUNT',
    items: [{ label: 'Profile', to: '/profile', icon: <User className="h-4 w-4 shrink-0" /> }],
  },
  {
    heading: 'ADMINISTRATION',
    adminOnly: true,
    items: [
      { label: 'Admin Dashboard', to: '/admin',         icon: <Shield        className="h-4 w-4 shrink-0" /> },
      { label: 'Tenants',         to: '/admin/tenants', icon: <Building2     className="h-4 w-4 shrink-0" /> },
      { label: 'All VMs',         to: '/admin/vms',     icon: <Layers        className="h-4 w-4 shrink-0" /> },
      { label: 'Audit Log',       to: '/admin/audit',   icon: <ClipboardList className="h-4 w-4 shrink-0" /> },
    ],
  },
];

// ─── Nav link ──────────────────────────────────────────────────────────────────
// isCollapsed = user explicitly collapsed on desktop.
// md:* classes handle tablet icon-only independently of isCollapsed.

function SidebarLink({
  to, icon, label, isCollapsed, onClick,
}: NavItem & { isCollapsed: boolean; onClick?: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to={to}
          end={to !== '/vms' && to !== '/admin/tenants'}
          onClick={onClick}
          className={({ isActive }) =>
            cn(
              'flex items-center rounded-md text-sm font-medium transition-all duration-150 cursor-pointer',
              'text-slate-400 hover:bg-slate-700 hover:text-white',
              // Mobile: full row
              'gap-3 px-3 py-2',
              // Tablet (md–xl): icon-only centered
              'md:justify-center md:px-2',
              // Desktop (xl): full if not collapsed, icon-only if collapsed
              isCollapsed
                ? 'xl:justify-center xl:px-2'
                : 'xl:justify-start xl:gap-3 xl:px-3',
              // Active state — blue accent
              isActive
                ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400 pl-[10px]'
                : 'border-l-2 border-transparent',
            )
          }
        >
          {icon}
          {/* Text: visible on mobile, hidden tablet, visible xl when not collapsed */}
          <span className={cn('truncate', 'md:hidden', isCollapsed ? 'xl:hidden' : 'xl:block')}>
            {label}
          </span>
        </NavLink>
      </TooltipTrigger>
      {/* Tooltip shows on tablet always; on desktop only when collapsed */}
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuthStore();
  const { isOpen, isCollapsed, close, collapse } = useSidebarStore();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const workspaceName = user?.tenant_id ?? 'No workspace';

  return (
    <TooltipProvider delayDuration={200}>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex flex-col bg-slate-900 text-white transition-all duration-200',
          // Mobile: off-screen default, on-screen when open
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Tablet+: always on-screen
          'md:translate-x-0',
          // Width: mobile always w-64; tablet w-16; desktop w-64 (or w-16 if collapsed)
          'w-64 md:w-16',
          isCollapsed ? 'xl:w-16' : 'xl:w-64',
        )}
      >
        {/* ── Logo + collapse toggle ─────────────────────────────────── */}
        <div className={cn(
          'flex items-center border-b border-slate-800',
          'py-4 px-4 gap-3',        // mobile: full
          'md:justify-center md:px-2 md:gap-0', // tablet: centered
          isCollapsed
            ? 'xl:justify-center xl:px-2 xl:gap-0'  // desktop collapsed
            : 'xl:justify-between xl:px-4 xl:gap-3', // desktop full
        )}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500">
            <Cloud className="h-4 w-4 text-white" />
          </div>

          {/* Workspace text — hidden on tablet, on desktop only when not collapsed */}
          <div className={cn('flex-1 min-w-0', 'md:hidden', isCollapsed ? 'xl:hidden' : 'xl:block')}>
            <p className="text-sm font-semibold leading-tight truncate">CloudIaaS</p>
            <p className="text-xs text-slate-400 truncate" title={workspaceName}>{workspaceName}</p>
          </div>

          {/* Collapse button — desktop only */}
          <button
            onClick={collapse}
            className={cn(
              'shrink-0 flex items-center justify-center h-7 w-7 rounded-md text-slate-400',
              'hover:bg-slate-800 hover:text-white transition-colors',
              'hidden xl:flex',
            )}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* ── Navigation ─────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
          {NAV_SECTIONS.map((section) => {
            if (section.adminOnly && !isAdmin) return null;
            return (
              <div key={section.heading}>
                {/* Section heading — hidden on tablet, on desktop when not collapsed */}
                <p className={cn(
                  'px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500',
                  'md:hidden',
                  isCollapsed ? 'xl:hidden' : 'xl:block',
                )}>
                  {section.heading}
                </p>
                <ul className="space-y-0.5">
                  {section.items.map((item) => (
                    <li key={item.to}>
                      <SidebarLink {...item} isCollapsed={isCollapsed} onClick={close} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* ── User footer ────────────────────────────────────────────── */}
        {user && (
          <div className={cn(
            'border-t border-slate-800 px-3 py-3 flex items-center',
            'gap-3',                  // mobile
            'md:justify-center md:gap-0', // tablet
            isCollapsed
              ? 'xl:justify-center xl:gap-0'
              : 'xl:justify-start xl:gap-3',
          )}>
            <div className={cn('md:hidden', isCollapsed ? 'xl:hidden' : 'xl:block')}>
              <UserAvatar user={user} size="sm" />
            </div>
            <div className={cn('flex-1 min-w-0', 'md:hidden', isCollapsed ? 'xl:hidden' : 'xl:block')}>
              <p className="text-sm font-medium leading-tight truncate">{user.username}</p>
              <span className={cn(
                'inline-block text-[10px] px-1.5 py-0.5 rounded font-medium',
                user.role === 'admin'
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'bg-slate-700 text-slate-400',
              )}>
                {user.role}
              </span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="shrink-0 text-slate-400 hover:text-white transition-colors"
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
