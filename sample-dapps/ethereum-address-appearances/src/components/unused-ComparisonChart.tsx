import React from "react";
import { Chart } from "react-chartjs-2";

interface ComparisonChartProps {
  data: any; // Define a proper type based on your data
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ data }) => {
  const chartData = {
    labels: data.labels,
    datasets: data.datasets,
  };

  const options = {
    scales: {
      x: {
        type: "linear",
        position: "bottom",
      },
    },
  };

  return (
    <div className="mt-4">
      <Chart type="line" data={chartData} options={options} />
    </div>
  );
};

export default ComparisonChart;
