import { Badge } from '@/components/ui/badge';

interface NetworkStatusBadgeProps {
  status: string;
}

const NetworkStatusBadge = ({ status }: NetworkStatusBadgeProps) => {
  const isActive = status === 'active';
  return (
    <Badge
      className={
        isActive
          ? 'bg-green-100 text-green-800 border-green-200'
          : 'bg-slate-100 text-slate-600 border-slate-200'
      }
    >
      <span
        className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
          isActive ? 'bg-green-500' : 'bg-slate-400'
        }`}
      />
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
};

export default NetworkStatusBadge;
