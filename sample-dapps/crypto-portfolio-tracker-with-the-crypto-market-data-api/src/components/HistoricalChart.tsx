import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart,
  ChartOptions,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "chartjs-adapter-date-fns";

import { colorPalette } from "../utils/colorPalette";

import { HistoricalDataEntry } from "../interfaces";

Chart.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface HistoricalChartProps {
  data: HistoricalDataEntry[];
  currency: string;
}

const HistoricalChart: React.FC<HistoricalChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div>No historical data</div>;
  }

  const labels = data.map((entry) => entry.date);
  // const assets = Object.keys(data[0]).filter((key) => key !== "date");

  // Extract the last entry in the data array
  const lastEntry = data[data.length - 1];
  const assets = Object.keys(lastEntry).filter((key) => key !== "date");

  // Sort the assets based on their value in the last entry
  const sortedAssets = assets.sort(
    (a, b) => (lastEntry[b] as number) - (lastEntry[a] as number)
  );

  const datasets = sortedAssets.map((asset, index) => ({
    label: asset,
    data: data.map((entry) => entry[asset] as number),
    fill: true,
    backgroundColor: `${colorPalette[index % colorPalette.length]}80`,
    borderColor: colorPalette[index % colorPalette.length],
  }));

  const chartData = {
    labels,
    datasets,
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    scales: {
      x: {
        type: "time",
        time: {
          unit: "day",
        },
      },
      y: {
        stacked: true,
      },
    },
    plugins: {
      title: {
        display: true,
        text: "Historical Portfolio Value",
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default HistoricalChart;
