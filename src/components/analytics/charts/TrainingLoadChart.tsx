import React from 'react';
import { useColorModeValue } from '@chakra-ui/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TrainingLoadChartProps {
  timeframe?: '7d' | '30d' | '90d';
}

export const TrainingLoadChart: React.FC<TrainingLoadChartProps> = ({ timeframe = '7d' }) => {
  // Color mode values
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const gridColor = useColorModeValue('gray.200', 'gray.600');
  const tooltipBg = useColorModeValue('white', 'gray.800');
  const tooltipBorder = useColorModeValue('gray.200', 'gray.600');

  // Mock data based on timeframe
  const generateMockData = () => {
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const labels = [];
    const teamLoad = [];
    const acwrData = [];
    const riskZones = [];

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

      // Generate realistic training load data
      const baseLoad = 2500 + Math.random() * 1000;
      const dayOfWeek = date.getDay();
      
      // Lower load on weekends
      const weekendModifier = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.6 : 1;
      const finalLoad = Math.round(baseLoad * weekendModifier);
      
      teamLoad.push(finalLoad);
      
      // Generate ACWR data (should be between 0.8 and 1.5)
      const acwr = 0.8 + Math.random() * 0.7;
      acwrData.push(Number(acwr.toFixed(2)));
      
      // Risk zones for background coloring
      if (acwr < 0.8) riskZones.push('yellow');
      else if (acwr > 1.3) riskZones.push('red');
      else riskZones.push('green');
    }

    return { labels, teamLoad, acwrData, riskZones };
  };

  const { labels, teamLoad, acwrData } = generateMockData();

  const chartData = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Team Training Load',
        data: teamLoad,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Avg ACWR',
        data: acwrData,
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgba(239, 68, 68, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        yAxisID: 'y1',
        fill: false,
        order: 1,
        tension: 0.2,
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
            if (context.datasetIndex === 0) {
              return `Training Load: ${context.parsed.y.toLocaleString()}`;
            } else {
              const value = context.parsed.y;
              const risk = value < 0.8 ? '🟡 Low' : value > 1.3 ? '🔴 High' : '🟢 Optimal';
              return `ACWR: ${value} (${risk})`;
            }
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
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Training Load',
          color: textColor,
        },
        grid: {
          color: gridColor,
          drawBorder: false,
        },
        ticks: {
          color: textColor,
          callback: function(value: any) {
            return value.toLocaleString();
          }
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'ACWR',
          color: textColor,
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: textColor,
        },
        min: 0.5,
        max: 1.8,
      },
    },
    elements: {
      line: {
        tension: 0.3,
      },
    },
  };

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <Chart type="bar" data={chartData} options={options} />
    </div>
  );
};

export default TrainingLoadChart; 