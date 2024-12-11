import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiquidationsTable } from "./liquidations/LiquidationsTable";
import { MetricsPanel } from "./analytics/MetricsPanel";
import { LiquidationTrends } from "./analytics/LiquidationTrends";
import { AssetDistribution } from "./analytics/AssetDistribution";
import QuickNodeBanner from "./QuickNodeBanner";

export function Dashboard() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Aave V3 Liquidation Tracker</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and analyze liquidation events on the Aave V3 protocol
        </p>
        <QuickNodeBanner />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="liquidations">Liquidations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <MetricsPanel />
          <div className="grid gap-8">
            <LiquidationTrends />
            <AssetDistribution />
          </div>
        </TabsContent>

        <TabsContent value="liquidations">
          <LiquidationsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
