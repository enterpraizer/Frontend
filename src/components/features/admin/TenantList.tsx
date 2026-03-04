import { useAdminTenants } from '../../../hooks/useAdmin';

const TenantList = () => {
  const { data, isLoading, isError } = useAdminTenants();
  const tenants = data?.items;

  if (isLoading) return <p>Loading tenants…</p>;
  if (isError) return <p>Failed to load tenants.</p>;

  return (
    <ul>
      {tenants?.map((t) => (
        <li key={t.id}>{t.name}</li>
      ))}
    </ul>
  );
};

export default TenantList;
