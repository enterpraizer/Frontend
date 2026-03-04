import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const ProtectedRoute = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.tenant_id) return <Navigate to="/onboarding" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
