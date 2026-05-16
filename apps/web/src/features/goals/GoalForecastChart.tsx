'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface GoalForecastChartProps {
  currentAmount: number;
  targetAmount: number;
  monthlySavings: number;
  goalName: string;
}

export default function GoalForecastChart({ 
  currentAmount, 
  targetAmount, 
  monthlySavings,
  goalName 
}: GoalForecastChartProps) {
  
  const monthsToTarget = monthlySavings > 0 
    ? Math.ceil((targetAmount - currentAmount) / monthlySavings) 
    : 12; // Default 12 if no savings
    
  const displayMonths = Math.min(Math.max(monthsToTarget + 2, 6), 24); // Show 6-24 months
  
  const labels = Array.from({ length: displayMonths }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    return d.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' });
  });

  const projectionData = Array.from({ length: displayMonths }, (_, i) => {
    return Math.min(currentAmount + (monthlySavings * i), targetAmount * 1.1);
  });

  const targetLine = Array(displayMonths).fill(targetAmount);

  const data = {
    labels,
    datasets: [
      {
        label: 'Projected Balance',
        data: projectionData,
        borderColor: '#50C878',
        backgroundColor: 'rgba(80, 200, 120, 0.1)',
        borderWidth: 3,
        pointRadius: 0,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Target',
        data: targetLine,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      }
    ],
  };

  const options: ChartOptions<'line'> = {
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: {
          color: '#708090',
          font: { size: 10 },
          callback: (value) => `฿${(Number(value) / 1000).toFixed(0)}k`,
        },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: '#708090',
          font: { size: 9 },
          maxRotation: 0,
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 11, 24, 0.9)',
        padding: 12,
        cornerRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        callbacks: {
          label: (context) => `฿${(context.parsed.y || 0).toLocaleString()}`
        }
      },
    },
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold text-white uppercase tracking-widest">{goalName} Forecast</span>
        <span className="text-[9px] text-slate-400">Projection based on current savings</span>
      </div>
      <div className="flex-1 min-h-0">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
