import React from 'react';
import {
  Box, Card, CardBody, Flex, Icon, Tag, useColorModeValue
} from '@chakra-ui/react';
import type { CardProps } from '@chakra-ui/react';
import { FaChartLine } from 'react-icons/fa';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

interface StatsCardProps extends CardProps {
  title?: string;
  chartData: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
    }[];
  };
  iconBgColor?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title = 'WEEKLY STATS',
  chartData,
  iconBgColor = 'blue.700',
  ...rest
}) => {
  const iconBg = useColorModeValue('white', 'gray.800');
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: function(context: any) {
            return context[0].label;
          },
          label: function(context: any) {
            return `${context.dataset.label}: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  const headerBgGradient = useColorModeValue(
    'linear-gradient(135deg, #2C5282 0%, #4299E1 100%)',
    'linear-gradient(135deg, #1A365D 0%, #2A4365 100%)'
  );

  return (
    <Card 
      borderRadius="lg" 
      overflow="hidden" 
      boxShadow="md"
      p="0"
      {...rest}
    >
      {/* Header */}
      <Box 
        h="80px" 
        bg={headerBgGradient}
        position="relative"
        display="flex"
        alignItems="center"
        px={6}
        margin="0"
        width="100%"
        borderTopLeftRadius="inherit"
        borderTopRightRadius="inherit"
      >
        <Flex 
          bg={iconBg} 
          borderRadius="full" 
          w="50px" 
          h="50px" 
          justifyContent="center" 
          alignItems="center"
          boxShadow="none"
          mr={4}
        >
          <Icon as={FaChartLine} w={6} h={6} color={iconBgColor} />
        </Flex>
        <Tag
          size="lg"
          variant="subtle"
          bg="whiteAlpha.300"
          color="white"
          fontWeight="bold"
          px={4}
          py={2}
          borderRadius="md"
        >
          {title}
        </Tag>
      </Box>
      <CardBody px={4} py={4}>
        <Box h="250px">
          <Bar data={chartData} options={chartOptions} />
        </Box>
      </CardBody>
    </Card>
  );
};

export default StatsCard; 