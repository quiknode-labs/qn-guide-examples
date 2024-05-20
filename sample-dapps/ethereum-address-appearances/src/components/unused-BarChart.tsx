import React from "react";
import { Chart } from "react-chartjs-2";
import { ChartOptions, ChartData } from "chart.js";
import "../helpers/chartSetup";

interface BarChartProps {
  data: {
    blockRange: string;
    count: number;
  }[];
}


const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const labels = data.map((d) => d.blockRange);
  const values = data.map((d) => d.count);

  const chartData: ChartData<"bar"> = {
    labels: labels,
    datasets: [
      {
        label: "Transactions",
        data: values,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    scales: {
      x: {
        title: {
          display: true,
          text: "Block Range",
        },
      },
      y: {
        title: {
          display: true,
          text: "Transaction Count",
        },
      },
    },
  };

  return (
    <div className="mt-4">
      <Chart type="bar" data={chartData} options={options} />
    </div>
  );
};

export default BarChart;