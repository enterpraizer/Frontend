import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboard';
import { queryKeys } from '@/api/queryKeys';

export const useResourceUsage = () =>
  useQuery({
    queryKey: queryKeys.dashboard.usage,
    queryFn: dashboardApi.usage,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

export const useVMSummary = () =>
  useQuery({
    queryKey: queryKeys.dashboard.vmSummary,
    queryFn: dashboardApi.vmSummary,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

export const useActivityLog = () =>
  useQuery({
    queryKey: queryKeys.dashboard.activity,
    queryFn: dashboardApi.activity,
    staleTime: 60_000,
  });
