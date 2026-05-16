'use client';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PortfolioDoughnutProps {
  data: {
    name: string;
    value: number;
    color?: string;
  }[];
}

export default function PortfolioDoughnut({ data }: PortfolioDoughnutProps) {
  // Define a professional color palette if colors aren't provided
  const palette = [
    '#50C878', // Emerald
    '#3b82f6', // Blue
    '#eab308', // Yellow
    '#ec4899', // Pink
    '#8b5cf6', // Purple
  ];

  const chartData = {
    labels: data.map(d => d.name),
    datasets: [
      {
        data: data.map(d => d.value),
        backgroundColor: data.map((d, i) => d.color || palette[i % palette.length]),
        borderColor: '#001F3F', // Match navy background for gap effect
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    maintainAspectRatio: false,
    cutout: '75%', // Modern thin ring
    plugins: {
      legend: {
        display: false, // We'll build a custom HTML legend for better styling
      },
      tooltip: {
        backgroundColor: 'rgba(0, 11, 24, 0.9)',
        titleFont: { family: "'Prompt', sans-serif" },
        bodyFont: { family: "'Prompt', sans-serif" },
        padding: 12,
        cornerRadius: 12,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(context.parsed);
            }
            return label;
          }
        }
      },
    },
  };

  return <Doughnut data={chartData} options={options} />;
}
