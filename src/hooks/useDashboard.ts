import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard';

export const useResourceUsage = () =>
  useQuery({ queryKey: ['dashboard-usage'], queryFn: dashboardApi.usage });
