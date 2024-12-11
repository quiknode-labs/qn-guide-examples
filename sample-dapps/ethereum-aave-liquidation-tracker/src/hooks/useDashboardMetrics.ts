import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { DashboardMetrics } from "@/types/liquidation";

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_metrics_overview");
      if (error) throw error;

      return data as Pick<
        DashboardMetrics,
        | "total24h"
        | "total7d"
        | "total30d"
        | "total365d"
        | "topLiquidators"
        | "topLiquidatedUsers"
        | "largestLiquidations"
      >;
    },
    refetchInterval: 60000,
  });
}
