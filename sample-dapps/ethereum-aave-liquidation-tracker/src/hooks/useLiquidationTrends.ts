import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useLiquidationTrends(
  timeRange: "24h" | "7d" | "30d" | "365d" = "30d"
) {
  return useQuery({
    queryKey: ["liquidation-trends", timeRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_liquidation_trends", {
        time_range: timeRange,
      });
      if (error) throw error;
      return { liquidationsOverTime: data };
    },
    refetchInterval: 60000,
  });
}