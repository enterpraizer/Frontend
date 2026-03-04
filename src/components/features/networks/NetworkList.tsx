import { useNetworkList } from '../../../hooks/useNetworks';

const NetworkList = () => {
  const { data, isLoading, isError } = useNetworkList();
  const networks = data?.items;

  if (isLoading) return <p>Loading networks…</p>;
  if (isError) return <p>Failed to load networks.</p>;

  return (
    <ul>
      {networks?.map((n) => (
        <li key={n.id}>{n.name} — {n.cidr}</li>
      ))}
    </ul>
  );
};

export default NetworkList;
