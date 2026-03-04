import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, UserCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import UserAvatar from '@/components/features/users/UserAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface TopbarProps {
  title: string;
  adminBadge?: boolean;
}

export default function Topbar({ title, adminBadge = false }: TopbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6">
      {/* Left: title */}
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
        {adminBadge && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
            Admin Panel
          </Badge>
        )}
      </div>

      {/* Right: bell + user dropdown */}
      <div className="flex items-center gap-3">
        {/* Notification bell (placeholder) */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>

        {/* User dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100 transition-colors">
                <UserAvatar user={user} size="sm" />
                <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate hidden sm:block">
                  {user.username}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium truncate">{user.username}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <UserCircle className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
