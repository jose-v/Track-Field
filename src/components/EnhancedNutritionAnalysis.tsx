import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  VStack,
  HStack,
  Text,
  Spinner,
  Divider,
  SimpleGrid,
  useColorModeValue,
  Icon,
  Badge,
  Progress,
  CircularProgress,
  CircularProgressLabel,
  Flex,
} from '@chakra-ui/react';
import { supabase } from '../lib/supabase';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  FaCoffee, 
  FaUtensils, 
  FaAppleAlt, 
  FaCookieBite, 
  FaChartPie, 
  FaFire,
  FaBullseye,
  FaCheckCircle
} from 'react-icons/fa';
import MacroProgressCard from './MacroProgressCard';
import type { MacroProgressCardProps } from './MacroProgressCard';

interface EnhancedNutritionAnalysisProps {
  athleteId: string;
}

interface EatingRecord {
  id: string;
  record_date: string;
  meal_type: string;
  calories: number;
}

interface Micronutrient {
  id: string;
  name: string;
  unit: string;
}

interface Supplement {
  id: string;
  name: string;
}

interface MicronutrientRecord {
  micronutrient_id: string;
  amount: number;
}

interface SupplementRecord {
  supplement_id: string;
  amount: string;
}

export const EnhancedNutritionAnalysis: React.FC<EnhancedNutritionAnalysisProps> = ({ athleteId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [eatingRecords, setEatingRecords] = useState<EatingRecord[]>([]);
  const [micronutrients, setMicronutrients] = useState<Micronutrient[]>([]);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [micronutrientRecords, setMicronutrientRecords] = useState<MicronutrientRecord[]>([]);
  const [supplementRecords, setSupplementRecords] = useState<SupplementRecord[]>([]);

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      // Fetch eating records
      const { data: records } = await supabase
        .from('eating_records')
        .select('id, record_date, meal_type, calories')
        .eq('athlete_id', athleteId);
      setEatingRecords(records || []);

      // Fetch micronutrients
      const { data: mics } = await supabase
        .from('micronutrients')
        .select('id, name, unit');
      setMicronutrients(mics || []);

      // Fetch supplements
      const { data: sups } = await supabase
        .from('supplements')
        .select('id, name');
      setSupplements(sups || []);

      // Fetch micronutrient records
      const { data: micRecords } = await supabase
        .from('eating_record_micronutrients')
        .select('micronutrient_id, amount, eating_record_id')
        .in('eating_record_id', (records || []).map(r => r.id));
      setMicronutrientRecords(micRecords || []);

      // Fetch supplement records
      const { data: supRecords } = await supabase
        .from('eating_record_supplements')
        .select('supplement_id, amount, eating_record_id')
        .in('eating_record_id', (records || []).map(r => r.id));
      setSupplementRecords(supRecords || []);

      setIsLoading(false);
    }
    if (athleteId) fetchData();
  }, [athleteId]);

  // Aggregate stats
  const totalCalories = eatingRecords.reduce((sum, r) => sum + (r.calories || 0), 0);
  const mealTypeDist: Record<string, number> = {};
  eatingRecords.forEach(r => {
    mealTypeDist[r.meal_type] = (mealTypeDist[r.meal_type] || 0) + 1;
  });

  // Aggregate micronutrients
  const micronutrientTotals: Record<string, number> = {};
  micronutrientRecords.forEach(mr => {
    micronutrientTotals[mr.micronutrient_id] = (micronutrientTotals[mr.micronutrient_id] || 0) + (mr.amount || 0);
  });

  // Aggregate supplements
  const supplementTotals: Record<string, number> = {};
  supplementRecords.forEach(sr => {
    supplementTotals[sr.supplement_id] = (supplementTotals[sr.supplement_id] || 0) + 1;
  });

  // Example macro data and goals (replace with real aggregation later)
  const macroData: MacroProgressCardProps[] = [
    {
      label: 'Calories',
      value: totalCalories,
      goal: 2000,
      unit: 'kcal',
      color: '#3182CE',
      status: (totalCalories < 2000 ? 'under' : totalCalories > 2000 ? 'over' : 'on target'),
    },
    {
      label: 'Protein',
      value: 89,
      goal: 98,
      unit: 'g',
      color: '#805AD5',
      status: (89 < 98 ? 'under' : 89 > 98 ? 'over' : 'on target'),
    },
    {
      label: 'Carbs',
      value: 121,
      goal: 100,
      unit: 'g',
      color: '#38B2AC',
      status: (121 < 100 ? 'under' : 121 > 100 ? 'over' : 'on target'),
    },
    {
      label: 'Fat',
      value: 60,
      goal: 70,
      unit: 'g',
      color: '#DD6B20',
      status: (60 < 70 ? 'under' : 60 > 70 ? 'over' : 'on target'),
    },
    {
      label: 'Fiber',
      value: 21,
      goal: 25,
      unit: 'g',
      color: '#38A169',
      status: (21 < 25 ? 'under' : 21 > 25 ? 'over' : 'on target'),
    },
  ];

  // Prepare data for pie chart with updated colors
  const mealTypePieData = Object.entries(mealTypeDist).map(([type, count]) => ({ name: type, value: count }));
  const pieColors = ['#3182CE', '#805AD5', '#38A169', '#DD6B20'];
  const mealTypeIcons: Record<string, React.ReactNode> = {
    breakfast: <FaCoffee />,
    lunch: <FaUtensils />,
    dinner: <FaAppleAlt />,
    snack: <FaCookieBite />,
  };

  const totalMeals = mealTypePieData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      p={6}
      border="1px solid"
      borderColor={borderColor}
      boxShadow="lg"
    >
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Icon as={FaFire} boxSize={6} color="blue.500" />
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color={statNumberColor}>
                Nutrition Analysis
              </Text>
              <Text fontSize="sm" color={statLabelColor}>
                Track your daily nutrition intake
              </Text>
            </VStack>
          </HStack>
          <Badge 
            colorScheme="blue" 
            variant="solid" 
            fontSize="sm"
            px={3}
            py={1}
          >
            Enhanced Analytics
          </Badge>
        </HStack>

        {isLoading ? (
          <Flex justify="center" align="center" h="300px">
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" />
              <Text color={statLabelColor}>Loading nutrition data...</Text>
            </VStack>
          </Flex>
        ) : (
          <VStack align="stretch" spacing={6}>
            {/* Macro Nutrient Cards */}
            <Box>
              <Text fontSize="md" fontWeight="medium" color={statNumberColor} mb={4}>
                Daily Macronutrients
              </Text>
              <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={4}>
                {macroData.map((macro) => (
                  <MacroProgressCard key={macro.label} {...macro} />
                ))}
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Summary Stats */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <Stat textAlign="center">
                <StatLabel fontSize="sm" color={statLabelColor}>
                  Total Calories
                </StatLabel>
                <StatNumber fontSize="2xl" color={statNumberColor}>
                  {totalCalories}
                </StatNumber>
                <StatHelpText fontSize="xs">
                  All time tracked
                </StatHelpText>
              </Stat>
              
              <Stat textAlign="center">
                <StatLabel fontSize="sm" color={statLabelColor}>
                  Meals Logged
                </StatLabel>
                <StatNumber fontSize="2xl" color={statNumberColor}>
                  {eatingRecords.length}
                </StatNumber>
                <StatHelpText fontSize="xs">
                  Total meals
                </StatHelpText>
              </Stat>
              
              <Stat textAlign="center">
                <StatLabel fontSize="sm" color={statLabelColor}>
                  Avg per Meal
                </StatLabel>
                <StatNumber fontSize="2xl" color={statNumberColor}>
                  {eatingRecords.length > 0 ? Math.round(totalCalories / eatingRecords.length) : 0}
                </StatNumber>
                <StatHelpText fontSize="xs">
                  Calories per meal
                </StatHelpText>
              </Stat>
            </SimpleGrid>

            {/* Meal Distribution */}
            {mealTypePieData.length > 0 && (
              <Box>
                <HStack spacing={2} mb={4}>
                  <Icon as={FaChartPie} color="blue.500" />
                  <Text fontSize="md" fontWeight="medium" color={statNumberColor}>
                    Meal Type Distribution
                  </Text>
                </HStack>
                
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                  {/* Chart */}
                  <Box h="250px">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={mealTypePieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                        >
                          {mealTypePieData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value} meals`]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  
                  {/* Legend */}
                  <VStack align="stretch" spacing={3} justify="center">
                    {mealTypePieData.map((entry, idx) => (
                      <HStack key={entry.name} justify="space-between" p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                        <HStack spacing={3}>
                          <Box
                            w="12px"
                            h="12px"
                            borderRadius="full"
                            bg={pieColors[idx % pieColors.length]}
                          />
                          <Icon 
                            as={mealTypeIcons[entry.name] ? FaCoffee : FaUtensils} 
                            color={pieColors[idx % pieColors.length]}
                          />
                          <Text fontSize="sm" fontWeight="medium" color={statNumberColor}>
                            {entry.name.charAt(0).toUpperCase() + entry.name.slice(1)}
                          </Text>
                        </HStack>
                        <VStack align="end" spacing={0}>
                          <Text fontSize="sm" fontWeight="bold" color={statNumberColor}>
                            {entry.value}
                          </Text>
                          <Text fontSize="xs" color={statLabelColor}>
                            {Math.round((entry.value/totalMeals) * 100)}%
                          </Text>
                        </VStack>
                      </HStack>
                    ))}
                  </VStack>
                </SimpleGrid>
              </Box>
            )}

            <Divider />

            {/* Additional Nutrition Data */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <Box>
                <HStack spacing={2} mb={3}>
                  <Icon as={FaBullseye} color="green.500" fontSize="sm" />
                  <Text fontSize="sm" fontWeight="medium" color={statNumberColor}>
                    Micronutrients
                  </Text>
                </HStack>
                <Box bg={useColorModeValue('gray.50', 'gray.700')} p={4} borderRadius="md">
                  {Object.keys(micronutrientTotals).length > 0 ? (
                    <VStack align="stretch" spacing={2}>
                      {Object.entries(micronutrientTotals).slice(0, 5).map(([micId, total]) => {
                        const micronutrient = micronutrients.find(m => m.id === micId);
                        return (
                          <HStack key={micId} justify="space-between">
                            <Text fontSize="sm" color={statNumberColor}>
                              {micronutrient?.name || 'Unknown'}
                            </Text>
                            <Text fontSize="sm" fontWeight="medium" color={statNumberColor}>
                              {total} {micronutrient?.unit || ''}
                            </Text>
                          </HStack>
                        );
                      })}
                    </VStack>
                  ) : (
                    <Text color={statLabelColor} fontSize="sm">
                      No micronutrient data available
                    </Text>
                  )}
                </Box>
              </Box>

              <Box>
                <HStack spacing={2} mb={3}>
                  <Icon as={FaCheckCircle} color="purple.500" fontSize="sm" />
                  <Text fontSize="sm" fontWeight="medium" color={statNumberColor}>
                    Supplements
                  </Text>
                </HStack>
                <Box bg={useColorModeValue('gray.50', 'gray.700')} p={4} borderRadius="md">
                  {Object.keys(supplementTotals).length > 0 ? (
                    <VStack align="stretch" spacing={2}>
                      {Object.entries(supplementTotals).slice(0, 5).map(([supId, total]) => {
                        const supplement = supplements.find(s => s.id === supId);
                        return (
                          <HStack key={supId} justify="space-between">
                            <Text fontSize="sm" color={statNumberColor}>
                              {supplement?.name || 'Unknown'}
                            </Text>
                            <Text fontSize="sm" fontWeight="medium" color={statNumberColor}>
                              {total} times
                            </Text>
                          </HStack>
                        );
                      })}
                    </VStack>
                  ) : (
                    <Text color={statLabelColor} fontSize="sm">
                      No supplement data available
                    </Text>
                  )}
                </Box>
              </Box>
            </SimpleGrid>
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

export default EnhancedNutritionAnalysis; 