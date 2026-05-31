'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface VelocityChartProps {
  data: {
    month: string;
    income: number;
    expense: number;
    saving: number;
    invest: number;
    net: number;
  }[];
}

export default function VelocityChart({ data }: VelocityChartProps) {
  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Income',
        data: data.map(d => d.income),
        backgroundColor: '#50C878',
        borderRadius: 4,
        barPercentage: 0.6,
      },
      {
        type: 'bar' as const,
        label: 'Expense',
        data: data.map(d => d.expense),
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 4,
        barPercentage: 0.6,
      },
      {
        type: 'bar' as const,
        label: 'Saving',
        data: data.map(d => d.saving),
        backgroundColor: '#60A5FA', // blue-400
        borderRadius: 4,
        barPercentage: 0.6,
      },
      {
        type: 'bar' as const,
        label: 'Investment',
        data: data.map(d => d.invest),
        backgroundColor: '#A78BFA', // purple-400
        borderRadius: 4,
        barPercentage: 0.6,
      },
      {
        type: 'line' as const,
        label: 'Trend (Net)',
        data: data.map(d => d.net),
        borderColor: '#3b82f6',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
        tension: 0.4,
      } as any
    ],
  };

  const options: ChartOptions<'bar'> = {
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.03)',
        },
        ticks: {
          color: '#708090',
          font: {
            size: 10,
          },
          callback: (value) => `฿${Number(value).toLocaleString()}`,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#708090',
          font: {
            size: 10,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 11, 24, 0.9)',
        titleFont: { family: "'Prompt', sans-serif" },
        bodyFont: { family: "'Prompt', sans-serif" },
        padding: 12,
        cornerRadius: 12,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
  };

  return <Chart type="bar" data={chartData} options={options} />;
}
