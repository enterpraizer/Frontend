import { useVMList } from '../../../hooks/useVMs';

const VMList = () => {
  const { data, isLoading, isError } = useVMList();
  const vms = data?.items;

  if (isLoading) return <p>Loading VMs…</p>;
  if (isError) return <p>Failed to load VMs.</p>;

  return (
    <ul>
      {vms?.map((vm) => (
        <li key={vm.id}>{vm.name} — {vm.status}</li>
      ))}
    </ul>
  );
};

export default VMList;
