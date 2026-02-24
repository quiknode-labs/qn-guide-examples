"use client";

import { Component, type ReactNode } from "react";
import type { QueryResult, VizType } from "@/lib/types";
import { ensureValidVizType } from "@/lib/auto-viz";
import ResultsTable from "./ResultsTable";
import LineChart from "./LineChart";
import BarChart from "./BarChart";
import AreaChart from "./AreaChart";
import PieChart from "./PieChart";
import NumberCard from "./NumberCard";

// Error boundary to catch Nivo rendering crashes
class ChartErrorBoundary extends Component<
  { children: ReactNode; vizType: string },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: ReactNode; vizType: string }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidUpdate(prevProps: { vizType: string }) {
    // Reset error when viz type changes so user can try another chart
    if (prevProps.vizType !== this.props.vizType) {
      this.setState({ hasError: false, error: "" });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full text-center p-4">
          <div>
            <div className="text-xs text-foreground-light font-mono mb-1">Chart render error</div>
            <div className="text-[10px] text-foreground-light/60 font-mono">{this.state.error}</div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface VisualizationRendererProps {
  result: QueryResult;
  vizType: VizType;
}

export default function VisualizationRenderer({ result, vizType }: VisualizationRendererProps) {
  // Map legacy "trend" to "number" (NumberCard handles both)
  const mapped = vizType === ("trend" as string) ? "number" : vizType;
  // Auto-correct if the viz type doesn't suit the data shape
  const effectiveType = ensureValidVizType(result, mapped);

  if (effectiveType === "table") {
    return <ResultsTable result={result} />;
  }

  const chartContent = (() => {
    switch (effectiveType) {
      case "line": return <LineChart result={result} />;
      case "bar": return <BarChart result={result} />;
      case "area": return <AreaChart result={result} />;
      case "pie": return <PieChart result={result} />;
      case "number": return <NumberCard result={result} />;
      default: return <ResultsTable result={result} />;
    }
  })();

  return (
    <div className="h-full w-full">
      <ChartErrorBoundary vizType={effectiveType}>
        {chartContent}
      </ChartErrorBoundary>
    </div>
  );
}
