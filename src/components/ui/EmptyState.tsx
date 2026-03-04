import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

const EmptyState = ({ title, description, action, icon, className }: EmptyStateProps) => (
  <div className={cn('flex flex-col items-center justify-center gap-4 py-16 text-center', className)}>
    {icon && (
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
    )}
    <div className="flex flex-col gap-1.5">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
    {action}
  </div>
);

export default EmptyState;
