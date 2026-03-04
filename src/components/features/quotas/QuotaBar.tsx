import { useQuota } from '../../../hooks/useQuotas';

const QuotaBar = () => {
  const { data: quota, isLoading } = useQuota();

  if (isLoading) return <p>Loading quotas…</p>;

  if (!quota) return null;

  const items = [
    { resource: 'vCPU', value: quota.max_vcpu },
    { resource: 'RAM (MB)', value: quota.max_ram_mb },
    { resource: 'Disk (GB)', value: quota.max_disk_gb },
    { resource: 'VMs', value: quota.max_vms },
  ];

  return (
    <ul>
      {items.map((item) => (
        <li key={item.resource}>
          {item.resource}: max {item.value}
        </li>
      ))}
    </ul>
  );
};

export default QuotaBar;
