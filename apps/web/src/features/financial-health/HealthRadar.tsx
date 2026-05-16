'use client';

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface HealthRadarProps {
  scores: {
    saving: number;
    emergency: number;
    debt: number;
    investment: number;
    goal?: number; // Potential 5th pillar
  };
}

export default function HealthRadar({ scores }: HealthRadarProps) {
  const data = {
    labels: ['สภาพคล่อง', 'หนี้สิน', 'การออม', 'ลงทุน', 'เป้าหมาย'],
    datasets: [
      {
        label: 'Financial Health Radar',
        data: [
          scores.emergency,   // สภาพคล่อง
          scores.debt,        // หนี้สิน
          scores.saving,      // การออม
          scores.investment,  // ลงทุน
          scores.goal || 70,  // เป้าหมาย (Mock if not present)
        ],
        backgroundColor: 'rgba(80, 200, 120, 0.2)',
        borderColor: '#50C878',
        borderWidth: 2,
        pointBackgroundColor: '#50C878',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#50C878',
      },
    ],
  };

  const options: ChartOptions<'radar'> = {
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        pointLabels: {
          color: '#708090',
          font: {
            family: "'Prompt', sans-serif",
            size: 10,
            weight: 'bold' as const,
          },
        },
        ticks: {
          display: false,
          stepSize: 20,
        },
        suggestedMin: 0,
        suggestedMax: 25, // Based on internal 25pt per pillar system
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return <Radar data={data} options={options} />;
}
