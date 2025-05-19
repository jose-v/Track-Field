import React from 'react';
import { Box, Text, VStack, Badge } from '@chakra-ui/react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export interface MacroProgressCardProps {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
  status: 'under' | 'over' | 'on target';
}

const statusColors = {
  under: 'green.400',
  over: 'red.400',
  'on target': 'blue.400',
};

export const MacroProgressCard: React.FC<MacroProgressCardProps> = ({ label, value, goal, unit, color, status }) => {
  const percent = Math.min((value / goal) * 100, 100);
  const chartData = [
    { name: 'progress', value: percent },
    { name: 'remaining', value: 100 - percent },
  ];

  return (
    <Box
      p={3}
      minW="140px"
      minH="170px"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <Box w="100px" h="100px" position="relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              innerRadius={35}
              outerRadius={48}
              isAnimationActive
              stroke="none"
            >
              <Cell key="progress" fill={color} />
              <Cell key="remaining" fill="#F3F4F6" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <VStack
          spacing={0}
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          w="100%"
        >
          <Text fontSize="xs" color="gray.500" fontWeight="semibold" letterSpacing="wide" mb={-1}>
            {label.toUpperCase()}
          </Text>
          <Text fontSize="xl" fontWeight="bold" color="gray.700" lineHeight={1}>{value}
            <Text as="span" fontSize="sm" color="gray.500" ml={1}>{unit}</Text>
          </Text>
        </VStack>
      </Box>
      <Badge colorScheme={status === 'under' ? 'green' : status === 'over' ? 'red' : 'blue'} fontSize="0.7em" mt={2} borderRadius="full" textAlign="center">
        {status.toUpperCase()}
      </Badge>
      <Text fontSize="sm" color="gray.500" mt={1}>{value} of {goal}{unit}</Text>
    </Box>
  );
};

export default MacroProgressCard; 