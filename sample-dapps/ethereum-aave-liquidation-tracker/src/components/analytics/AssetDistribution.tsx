import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useAssetDistribution } from "@/hooks/useAssetDistribution";
import { formatNumber } from "@/lib/utils";

const COLORS = [
  "hsl(215, 70%, 50%)",
  "hsl(25, 70%, 50%)",
  "hsl(145, 70%, 50%)",
  "hsl(195, 70%, 50%)",
  "hsl(355, 70%, 50%)",
];

export function AssetDistribution() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "365d">(
    "365d"
  );
  const { data: { topCollateralAssets, topDebtAssets } = {} } =
    useAssetDistribution(timeRange);

  const formatData = (data: typeof topCollateralAssets) =>
    data?.map((item) => ({
      symbol: item.symbol,
      value: item.totalvalueusd,
      percentage: item.percentageoftotal,
    }));

  const renderDistributionChart = (
    title: string,
    data: typeof topCollateralAssets
  ) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={formatData(data)}
                dataKey="value"
                nameKey="symbol"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                label={({ symbol, percentage }) =>
                  `${symbol} (${percentage.toFixed(1)}%)`
                }
              >
                {data?.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `$${formatNumber(value, 2)}`}
                labelFormatter={(label) => `Asset: ${label}`}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No liquidations in this period
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div>
        <Tabs
          value={timeRange}
          onValueChange={(v) => setTimeRange(v as typeof timeRange)}
        >
          <TabsList>
            <TabsTrigger value="24h">24h</TabsTrigger>
            <TabsTrigger value="7d">7d</TabsTrigger>
            <TabsTrigger value="30d">30d</TabsTrigger>
            <TabsTrigger value="365d">1y</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {renderDistributionChart(
          "Collateral Asset Distribution",
          topCollateralAssets
        )}
        {renderDistributionChart("Debt Asset Distribution", topDebtAssets)}
      </div>
    </div>
  );
}
