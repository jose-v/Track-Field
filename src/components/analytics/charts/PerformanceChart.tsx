import React from 'react';
import { useColorModeValue } from '@chakra-ui/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PerformanceChartProps {
  timeframe?: '7d' | '30d' | '90d';
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ timeframe = '7d' }) => {
  // Color mode values
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const gridColor = useColorModeValue('gray.200', 'gray.600');
  const tooltipBg = useColorModeValue('white', 'gray.800');
  const tooltipBorder = useColorModeValue('gray.200', 'gray.600');

  // Mock data based on timeframe
  const generateMockData = () => {
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const labels = [];
    
    // Performance metrics for different event groups
    const sprintsPerformance = [];
    const distancePerformance = [];
    const jumpsPerformance = [];
    const throwsPerformance = [];
    const teamPRs = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      if (timeframe === '7d') {
        labels.push(date.toLocaleDateString('en', { weekday: 'short' }));
      } else if (timeframe === '30d') {
        labels.push(date.toLocaleDateString('en', { month: 'short', day: 'numeric' }));
      } else {
        labels.push(date.toLocaleDateString('en', { month: 'short', day: 'numeric' }));
      }

      // Generate performance improvement percentages (cumulative)
      const baseImprovement = (days - i) / days * 100;
      const variance = (Math.random() - 0.5) * 20; // ±10% variance
      
      sprintsPerformance.push(Number((baseImprovement * 1.2 + variance).toFixed(1)));
      distancePerformance.push(Number((baseImprovement * 0.8 + variance).toFixed(1)));
      jumpsPerformance.push(Number((baseImprovement * 1.1 + variance).toFixed(1)));
      throwsPerformance.push(Number((baseImprovement * 0.9 + variance).toFixed(1)));
      
      // PRs achieved (cumulative)
      const prCount = Math.max(0, Math.floor(Math.random() * 3));
      teamPRs.push(prCount);
    }

    return { labels, sprintsPerformance, distancePerformance, jumpsPerformance, throwsPerformance, teamPRs };
  };

  const { labels, sprintsPerformance, distancePerformance, jumpsPerformance, throwsPerformance } = generateMockData();

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Sprints',
        data: sprintsPerformance,
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        tension: 0.3,
      },
      {
        label: 'Distance',
        data: distancePerformance,
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        tension: 0.3,
      },
      {
        label: 'Jumps',
        data: jumpsPerformance,
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        tension: 0.3,
      },
      {
        label: 'Throws',
        data: throwsPerformance,
        borderColor: 'rgba(245, 158, 11, 1)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: textColor,
          usePointStyle: true,
          padding: 20,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: textColor,
        bodyColor: textColor,
        borderColor: tooltipBorder,
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const value = Number(context.parsed.y);
            const trend = value > 0 ? '📈' : value < 0 ? '📉' : '➡️';
            return `${context.dataset.label}: ${value > 0 ? '+' : ''}${value}% ${trend}`;
          },
          footer: function(tooltipItems: any[]) {
            const total = tooltipItems.reduce((sum, item) => sum + Number(item.parsed.y), 0);
            const avg = (total / tooltipItems.length).toFixed(1);
            const avgNum = Number(avg);
            return `Team Average: ${avgNum > 0 ? '+' : ''}${avg}%`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: gridColor,
          drawBorder: false,
        },
        ticks: {
          color: textColor,
        },
      },
      y: {
        title: {
          display: true,
          text: 'Performance Improvement (%)',
          color: textColor,
        },
        grid: {
          color: gridColor,
          drawBorder: false,
        },
        ticks: {
          color: textColor,
          callback: function(value: any) {
            return `${value > 0 ? '+' : ''}${value}%`;
          }
        },
        beginAtZero: true,
      },
    },
    elements: {
      point: {
        hoverBackgroundColor: '#ffffff',
        hoverBorderWidth: 2,
      },
    },
  };

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default PerformanceChart; 