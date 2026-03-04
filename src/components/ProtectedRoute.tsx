import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface Props {
  requireTenant?: boolean;
}

const ProtectedRoute = ({ requireTenant = true }: Props) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireTenant && !user?.tenant_id) return <Navigate to="/onboarding" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
