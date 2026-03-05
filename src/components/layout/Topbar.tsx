import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, UserCircle, Sun, Moon, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useSidebarStore } from '@/hooks/useSidebar';
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
  const { theme, toggle: toggleTheme } = useThemeStore();
  const { toggle: toggleSidebar } = useSidebarStore();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 md:px-6">
      {/* Left: hamburger (mobile) + title */}
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={toggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{title}</h1>
          {adminBadge && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300">
              Панель администратора
            </Badge>
          )}
        </div>
      </div>

      {/* Right: theme toggle + bell + user dropdown */}
      <div className="flex items-center gap-1">
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
        >
          {theme === 'dark'
            ? <Sun  className="h-5 w-5" />
            : <Moon className="h-5 w-5" />
          }
        </button>

        {/* Notification bell (placeholder) */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>

        {/* User dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent transition-colors">
                <UserAvatar user={user} size="sm" />
                <span className="text-sm font-medium max-w-[120px] truncate hidden sm:block">
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
                Профиль
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

