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

interface GaugeStatus {
  barColor: string;
  textColor: string;
  label: string;
  problem: string | null;
  action: string | null;
}

function getStatus(pct: number): GaugeStatus {
  if (pct >= 100) return {
    barColor: 'bg-red-500',
    textColor: 'text-red-600 dark:text-red-400',
    label: '🔴 Квота исчерпана',
    problem: 'Ресурс полностью занят — новые VM создать невозможно.',
    action: 'Обратитесь к администратору для увеличения квоты или освободите ресурсы.',
  };
  if (pct >= 85) return {
    barColor: 'bg-red-500',
    textColor: 'text-red-600 dark:text-red-400',
    label: `🔴 Критический уровень (${pct}%)`,
    problem: `Использовано ${pct}% квоты — осталось менее 15%.`,
    action: 'Рекомендуется остановить неиспользуемые VM или запросить увеличение квоты.',
  };
  if (pct >= 60) return {
    barColor: 'bg-yellow-500',
    textColor: 'text-yellow-600 dark:text-yellow-400',
    label: `🟡 Высокая нагрузка (${pct}%)`,
    problem: `Использовано ${pct}% квоты — стоит следить за потреблением.`,
    action: null,
  };
  return {
    barColor: 'bg-green-500',
    textColor: 'text-green-600 dark:text-green-400',
    label: `🟢 В норме (${pct}%)`,
    problem: null,
    action: null,
  };
}

const ResourceGauge = ({ label, used, max, unit = '', icon }: ResourceGaugeProps) => {
  const pct = max > 0 ? Math.min(Math.round((used / max) * 100), 100) : 0;
  const { barColor, textColor, label: statusLabel, problem, action } = getStatus(pct);

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

      {/* Progress bar */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn('h-full transition-all', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Status text */}
      <div className="space-y-0.5">
        <div className="flex items-center justify-between">
          <span className={cn('text-xs font-medium', textColor)}>{statusLabel}</span>
          {pct >= 100 && (
            <Badge variant="destructive" className="text-xs">Исчерпано</Badge>
          )}
        </div>
        {problem && <p className="text-xs text-muted-foreground">{problem}</p>}
        {action && <p className="text-xs text-muted-foreground italic">💡 {action}</p>}
      </div>
    </div>
  );
};

export default ResourceGauge;
