import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/api/analytics';
import { QUERY_KEYS } from '@/lib/constants';

export const useAnalytics = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.ANALYTICS],
    queryFn: analyticsAPI.getAnalytics,
  });
};