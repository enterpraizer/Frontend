import { Cpu, HardDrive, Server, MemoryStick } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ResourceGauge from '@/components/ui/ResourceGauge';
import { cn } from '@/lib/utils';
import type { ResourceUsage } from '@/types';

interface QuotaSummaryCardProps {
  usage: ResourceUsage;
  title?: string;
}

const QuotaSummaryCard = ({ usage, title = 'Resource Usage' }: QuotaSummaryCardProps) => {
  const critical = [usage.vcpu, usage.ram_mb, usage.disk_gb, usage.vms].some(
    (m) => m.pct > 90
  );

  return (
    <Card className={cn(critical && 'border-red-400 dark:border-red-500')}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ResourceGauge
            label="vCPU"
            used={usage.vcpu.used}
            max={usage.vcpu.max}
            unit=" cores"
            icon={<Cpu className="h-4 w-4" />}
          />
          <ResourceGauge
            label="RAM"
            used={Math.round(usage.ram_mb.used / 1024)}
            max={Math.round(usage.ram_mb.max / 1024)}
            unit=" GB"
            icon={<MemoryStick className="h-4 w-4" />}
          />
          <ResourceGauge
            label="Disk"
            used={usage.disk_gb.used}
            max={usage.disk_gb.max}
            unit=" GB"
            icon={<HardDrive className="h-4 w-4" />}
          />
          <ResourceGauge
            label="VMs"
            used={usage.vms.used}
            max={usage.vms.max}
            unit=""
            icon={<Server className="h-4 w-4" />}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default QuotaSummaryCard;
