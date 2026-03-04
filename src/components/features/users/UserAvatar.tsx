import type { User } from '@/types';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
} as const;

// 8 distinct bg colors for initials fallback
const PALETTE = [
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-blue-500',
  'bg-violet-500',
  'bg-pink-500',
] as const;

function hashUsername(username: string): number {
  let h = 0;
  for (let i = 0; i < username.length; i++) {
    h = (h * 31 + username.charCodeAt(i)) >>> 0;
  }
  return h % PALETTE.length;
}

function getInitials(user: User): string {
  if (user.first_name && user.last_name) {
    return (user.first_name[0] + user.last_name[0]).toUpperCase();
  }
  return user.username.slice(0, 2).toUpperCase();
}

export default function UserAvatar({ user, size = 'md' }: UserAvatarProps) {
  const sizeClass = SIZES[size];
  const color = PALETTE[hashUsername(user.username)];

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.username}
        className={cn('rounded-full object-cover shrink-0', sizeClass)}
      />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0 select-none',
        sizeClass,
        color,
      )}
      aria-label={user.username}
    >
      {getInitials(user)}
    </span>
  );
}
