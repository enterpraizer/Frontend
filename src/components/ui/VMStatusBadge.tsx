import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type VMStatus = 'pending' | 'running' | 'stopped' | 'terminated';

interface VMStatusBadgeProps {
  status: VMStatus;
}

const config: Record<VMStatus, { label: string; className: string; dotClass: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    dotClass: 'bg-yellow-500 animate-pulse',
  },
  running: {
    label: 'Running',
    className: 'bg-green-100 text-green-800 border-green-200',
    dotClass: 'bg-green-500',
  },
  stopped: {
    label: 'Stopped',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
    dotClass: 'bg-slate-400',
  },
  terminated: {
    label: 'Terminated',
    className: 'bg-red-100 text-red-800 border-red-200',
    dotClass: 'bg-red-500',
  },
};

const VMStatusBadge = ({ status }: VMStatusBadgeProps) => {
  const { label, className, dotClass } = config[status];
  return (
    <Badge className={cn('gap-1.5 font-medium', className)}>
      <span className={cn('w-2 h-2 rounded-full', dotClass)} />
      {label}
    </Badge>
  );
};

export default VMStatusBadge;
