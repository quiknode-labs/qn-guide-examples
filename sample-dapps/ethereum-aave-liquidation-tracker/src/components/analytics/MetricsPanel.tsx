import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  formatCurrency,
  formatAddress,
} from "@/lib/utils";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, CircleDollarSign, Clock } from "lucide-react";

export function MetricsPanel() {
  const { data, isLoading } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <Skeleton className="h-4 w-[150px]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[100px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const renderParticipantsTable = (
    title: string,
    participants: Array<{
      address: string;
      count: number;
      totalvalueusd: number;
      avgliquidationusd: number;
      totalprofitusd?: number;
      avgprofitusd?: number;
      totallossusd?: number;
      avglossusd?: number;
    }>
  ) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Address</TableHead>
              <TableHead className="text-right"># / Size</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
              <TableHead className="text-right">PNL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants?.map((p) => (
              <TableRow key={p.address}>
                <TableCell className="font-mono">
                  <a
                    href={`https://etherscan.io/address/${p.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {formatAddress(p.address)}
                  </a>
                </TableCell>
                <TableCell className="text-right">
                  {p.count} / {formatCurrency(p.avgliquidationusd)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(p.totalvalueusd)}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={
                      p.totalprofitusd ? "text-green-500" : "text-red-500"
                    }
                  >
                    {formatCurrency(p.totalprofitusd || p.totallossusd || 0)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderLargestLiquidationsTable = (
    title: string,
    liquidations: Array<{
      txhash: string;
      timestamp: Date;
      valueusd: number;
      profitusd: number;
      collateralasset: string;
      debtasset: string;
    }>
  ) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction</TableHead>
              <TableHead>Assets</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">PNL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {liquidations?.map((l) => (
              <TableRow key={l.txhash}>
                <TableCell className="font-mono">
                  <a
                    href={`https://etherscan.io/tx/${l.txhash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {formatAddress(l.txhash)}
                  </a>
                </TableCell>
                <TableCell>
                  {l.collateralasset} → {l.debtasset}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(l.valueusd)}
                </TableCell>
                <TableCell className="text-right text-green-500">
                  {formatCurrency(l.profitusd)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const timeMetrics = [
    {
      title: "24h Activity",
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
      value: data.total24h.valueUSD,
      count: data.total24h.count,
      profit: data.total24h.profitUSD,
    },
    {
      title: "7d Activity",
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
      value: data.total7d.valueUSD,
      count: data.total7d.count,
      profit: data.total7d.profitUSD,
    },
    {
      title: "30d Activity",
      icon: <CircleDollarSign className="h-4 w-4 text-muted-foreground" />,
      value: data.total30d.valueUSD,
      count: data.total30d.count,
      profit: data.total30d.profitUSD,
    },
    {
      title: "365d Activity",
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
      value: data.total365d.valueUSD,
      count: data.total365d.count,
      profit: data.total365d.profitUSD,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {timeMetrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {metric.icon}
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metric.value)}
              </div>
              <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                <span>{metric.count} liquidations</span>
                <span className="text-green-500">
                  {formatCurrency(metric.profit)} PNL
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {renderParticipantsTable("Top Liquidators", data?.topLiquidators)}
        {renderParticipantsTable(
          "Most Liquidated Users",
          data?.topLiquidatedUsers
        )}
        {renderLargestLiquidationsTable(
          "Largest Liquidations",
          data?.largestLiquidations
        )}
      </div>
    </div>
  );
}
