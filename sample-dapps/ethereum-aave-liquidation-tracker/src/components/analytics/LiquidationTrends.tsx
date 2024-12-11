import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useLiquidationTrends } from "@/hooks/useLiquidationTrends";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

export function LiquidationTrends() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "365d">(
    "365d"
  );
  const { data: { liquidationsOverTime } = {} } =
    useLiquidationTrends(timeRange);

  const formatTimestamp = (timestamp: string) => {
    switch (timeRange) {
      case "24h":
        return format(new Date(timestamp), "HH:mm");
      case "7d":
        return format(new Date(timestamp), "MMM dd");
      case "30d":
        return format(new Date(timestamp), "MMM dd");
      case "365d":
        return format(new Date(timestamp), "MMM yyyy");
      default:
        return timestamp;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liquidation Value Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          value={timeRange}
          onValueChange={(v) => setTimeRange(v)}
          className="mb-4"
        >
          <TabsList>
            <TabsTrigger value="24h">24h</TabsTrigger>
            <TabsTrigger value="7d">7d</TabsTrigger>
            <TabsTrigger value="30d">30d</TabsTrigger>
            <TabsTrigger value="365d">1y</TabsTrigger>
          </TabsList>
          <TabsContent value={timeRange}>
            <div className="rounded-lg border bg-card p-6">
              {liquidationsOverTime && liquidationsOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart
                    data={liquidationsOverTime}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      opacity={0.2}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatTimestamp}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickMargin={10}
                    />
                    <YAxis
                      yAxisId="value"
                      tickFormatter={formatCurrency}
                      stroke="hsl(215, 70%, 50%)"
                      fontSize={12}
                      width={80}
                      tickCount={6}
                      label={{
                        value: "Total Value (USD)",
                        angle: -90,
                        position: "insideLeft",
                        offset: 10,
                        style: {
                          fill: "hsl(215, 70%, 50%)",
                          fontSize: 12,
                        },
                      }}
                    />
                    <YAxis
                      yAxisId="profit"
                      orientation="right"
                      tickFormatter={formatCurrency}
                      stroke="hsl(142, 76%, 36%)"
                      fontSize={12}
                      width={80}
                      tickCount={6}
                      label={{
                        value: "Total Profit (USD)",
                        angle: 90,
                        position: "insideRight",
                        offset: 10,
                        style: {
                          fill: "hsl(142, 76%, 36%)",
                          fontSize: 12,
                        },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        fontSize: "12px",
                      }}
                      labelFormatter={(label) =>
                        formatTimestamp(label as string)
                      }
                      formatter={(value: number, name: string) => {
                        const label =
                          name === "totalvalueusd"
                            ? "Total Value"
                            : "Total Profit";
                        return [formatCurrency(value), label];
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(value) =>
                        value === "totalvalueusd"
                          ? "Total Value"
                          : "Total Profit"
                      }
                    />
                    <Line
                      yAxisId="value"
                      type="monotone"
                      name="totalvalueusd"
                      dataKey="totalvalueusd"
                      stroke="hsl(215, 70%, 50%)"
                      strokeWidth={2}
                      dot={{
                        r: 4,
                        fill: "hsl(215, 70%, 50%)",
                        strokeWidth: 2,
                        stroke: "hsl(var(--background))",
                      }}
                      activeDot={{
                        r: 6,
                        stroke: "hsl(var(--background))",
                        strokeWidth: 2,
                      }}
                    />
                    <Line
                      yAxisId="profit"
                      type="monotone"
                      name="totalprofitusd"
                      dataKey="totalprofitusd"
                      stroke="hsl(142, 76%, 36%)"
                      strokeWidth={2}
                      dot={{
                        r: 4,
                        fill: "hsl(142, 76%, 36%)",
                        strokeWidth: 2,
                        stroke: "hsl(var(--background))",
                      }}
                      activeDot={{
                        r: 6,
                        stroke: "hsl(var(--background))",
                        strokeWidth: 2,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default LiquidationTrends;
