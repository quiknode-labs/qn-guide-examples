import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-frontend';

export function useAssetDistribution(
  timeRange: "24h" | "7d" | "30d" | "365d" = "30d"
) {
  return useQuery({
    queryKey: ["asset-distribution", timeRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_asset_distributions", {
        time_range: timeRange,
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });
}
