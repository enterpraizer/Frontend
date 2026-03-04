import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ResourceGaugeProps {
  label: string;
  used: number;
  max: number;
  unit?: string;
  icon?: ReactNode;
}

function getColor(pct: number): string {
  if (pct >= 85) return 'bg-red-500';
  if (pct >= 60) return 'bg-yellow-500';
  return 'bg-green-500';
}

const ResourceGauge = ({ label, used, max, unit = '', icon }: ResourceGaugeProps) => {
  const pct = max > 0 ? Math.min(Math.round((used / max) * 100), 100) : 0;
  const colorClass = getColor(pct);

  return (
    <div className="flex flex-col gap-2">
      {/* Label row */}
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          {icon}
          {label}
        </span>
        <span className="text-muted-foreground">
          {used}{unit} / {max}{unit}
        </span>
      </div>

      {/* Progress bar with dynamic color */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn('h-full transition-all', colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Percentage + quota warning */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{pct}%</span>
        {pct >= 100 && (
          <Badge variant="destructive" className="text-xs">
            Quota exceeded
          </Badge>
        )}
      </div>
    </div>
  );
};

export default ResourceGauge;
