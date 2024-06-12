// src/components/PortfolioPieChart.tsx
import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import { PortfolioHolding } from "../interfaces";
import { colorPalette } from "../utils/colorPalette";

Chart.register(...registerables);

interface PortfolioPieChartProps {
  holdings: PortfolioHolding[];
  exchangeRates: { [key: string]: number };
  currency: string;
}

const PortfolioPieChart: React.FC<PortfolioPieChartProps> = ({
  holdings,
  exchangeRates,
  currency,
}) => {
  if (!holdings || holdings.length === 0 || !exchangeRates) {
    return <div>No data available</div>;
  }

  const sortedHoldings = [...holdings].sort((a, b) => {
    const valueA = a.amount * (exchangeRates[`${a.asset}-${currency}`] || 0);
    const valueB = b.amount * (exchangeRates[`${b.asset}-${currency}`] || 0);
    return valueB - valueA;
  });

  const labels = sortedHoldings.map((holding) => holding.asset);
  const data = sortedHoldings.map(
    (holding) =>
      holding.amount * (exchangeRates[`${holding.asset}-${currency}`] || 0)
  );

  const totalValue = data.reduce((acc, value) => acc + value, 0);

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colorPalette,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "Portfolio Chart",
      },
      tooltip: {
        callbacks: {
          /* eslint-disable  @typescript-eslint/no-explicit-any */
          label: function (context: any) {
            const value = context.raw;
            const percentage = ((value / totalValue) * 100).toFixed(2);
            return `$${value.toFixed(2)} (${percentage}%)`;
          },
        },
      },
    },
  };

  return <Pie data={chartData} options={options} />;
};

export default PortfolioPieChart;
