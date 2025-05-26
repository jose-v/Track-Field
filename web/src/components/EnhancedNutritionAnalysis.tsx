import React, { useEffect, useState } from 'react';
import {
  Box, Heading, Stat, StatLabel, StatNumber, StatHelpText, VStack, HStack, Tag, Text, Spinner, Divider, SimpleGrid, Card, CardBody, Flex
} from '@chakra-ui/react';
import { supabase } from '../lib/supabase';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { FaCoffee, FaUtensils, FaAppleAlt, FaCookieBite, FaChartPie } from 'react-icons/fa';
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

  // Fallback examples if no data
  const hasMicronutrientData = micronutrients.length > 0 && micronutrientRecords.length > 0;
  const hasSupplementData = supplements.length > 0 && supplementRecords.length > 0;

  // Prepare data for pie chart
  const mealTypePieData = Object.entries(mealTypeDist).map(([type, count]) => ({ name: type, value: count }));
  const pieColors = ['#FFB347', '#FF6961', '#77DD77', '#AEC6CF'];
  const mealTypeIcons: Record<string, React.ReactNode> = {
    breakfast: <FaCoffee color="#FFB347" />,
    lunch: <FaUtensils color="#FF6961" />,
    dinner: <FaAppleAlt color="#77DD77" />,
    snack: <FaCookieBite color="#AEC6CF" />,
  };

  // Calculate total for percentage
  const totalMeals = mealTypePieData.reduce((sum, d) => sum + d.value, 0);

  // Example macro data and goals (replace with real aggregation later)
  const macroData: MacroProgressCardProps[] = [
    {
      label: 'Calories',
      value: totalCalories,
      goal: 2000,
      unit: 'kcal',
      color: '#FFB347',
      status: (totalCalories < 2000 ? 'under' : totalCalories > 2000 ? 'over' : 'on target'),
    },
    {
      label: 'Protein',
      value: 89, // Example value
      goal: 98,
      unit: 'g',
      color: '#7C3AED',
      status: (89 < 98 ? 'under' : 89 > 98 ? 'over' : 'on target'),
    },
    {
      label: 'Net Carbs',
      value: 121, // Example value
      goal: 100,
      unit: 'g',
      color: '#38BDF8',
      status: (121 < 100 ? 'under' : 121 > 100 ? 'over' : 'on target'),
    },
    {
      label: 'Fat',
      value: 60, // Example value
      goal: 70,
      unit: 'g',
      color: '#F59E42',
      status: (60 < 70 ? 'under' : 60 > 70 ? 'over' : 'on target'),
    },
    {
      label: 'Fiber',
      value: 21, // Example value
      goal: 25,
      unit: 'g',
      color: '#10B981',
      status: (21 < 25 ? 'under' : 21 > 25 ? 'over' : 'on target'),
    },
  ];

  return (
    <Card
      borderRadius="lg"
      overflow="hidden"
      boxShadow="md"
      w="100%"
      p="0"
    >
      {/* Card header with gradient background */}
      <Box 
        bg="linear-gradient(135deg, #2B6CB0 0%, #4299E1 100%)" 
        py={4} 
        px={5}
        margin="0"
        width="100%"
        borderTopLeftRadius="inherit"
        borderTopRightRadius="inherit"
      >
        <Heading size="md" color="white">Enhanced Nutrition Analysis</Heading>
      </Box>

      <CardBody px={5} py={5}>
        {isLoading ? (
          <Flex justify="center" align="center" h="200px">
            <Spinner size="xl" />
          </Flex>
        ) : (
          <VStack align="stretch" spacing={8}>
            {/* Top Section: Macro Nutrient Cards */}
            <Box>
              <SimpleGrid columns={[1, 2, 5]} spacing={4}>
                {macroData.map((macro) => (
                  <MacroProgressCard key={macro.label} {...macro} />
                ))}
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Middle Section: Key Stats */}
            <SimpleGrid columns={[1, 3]} spacing={8}>
              <Stat>
                <StatLabel fontSize="md" fontWeight="medium" color="gray.600">Total Calories</StatLabel>
                <StatNumber fontSize="3xl" fontWeight="bold">{totalCalories}</StatNumber>
                <StatHelpText fontSize="sm">All time</StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel fontSize="md" fontWeight="medium" color="gray.600">Meal Count</StatLabel>
                <StatNumber fontSize="3xl" fontWeight="bold">{eatingRecords.length}</StatNumber>
                <StatHelpText fontSize="sm">Total meals tracked</StatHelpText>
              </Stat>
              
              <Box>
                <Text fontSize="md" fontWeight="medium" color="gray.600" mb={2}>Meal Distribution</Text>
                <HStack flexWrap="wrap" spacing={2}>
                  {Object.entries(mealTypeDist).map(([type, count]) => (
                    <Tag key={type} colorScheme="blue" mr={1} fontSize="sm" borderRadius="full" px={3} py={1}>
                      {mealTypeIcons[type] || null} {type.charAt(0).toUpperCase() + type.slice(1)}: {count}
                    </Tag>
                  ))}
                </HStack>
              </Box>
            </SimpleGrid>

            {/* Distribution Chart Section */}
            <Box>
              <Flex align="center" mb={3}>
                <FaChartPie color="#4299E1" />
                <Text ml={2} fontSize="md" fontWeight="medium" color="gray.700">Meal Type Distribution</Text>
              </Flex>
              
              <Flex direction={["column", "row"]} justify="space-between" align="center">
                {/* Donut Chart */}
                <Box w={["100%", "50%"]} h="250px">
                  {mealTypePieData.length > 0 ? (
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
                          label={({ name, percent }) => `${Math.round(percent * 100)}%`}
                          isAnimationActive
                        >
                          {mealTypePieData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value} meals (${Math.round((value/totalMeals) * 100)}%)`]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Flex h="100%" justify="center" align="center">
                      <Text color="gray.500">No meal data to display</Text>
                    </Flex>
                  )}
                </Box>
                
                {/* Legend */}
                <VStack align="start" spacing={4} ml={[0, 8]} mt={[4, 0]} w={["100%", "50%"]}>
                  {mealTypePieData.map((entry, idx) => (
                    <Flex key={entry.name} align="center" width="100%" minH="48px">
                      {/* Colored Dot */}
                      <Box
                        boxSize="28px"
                        borderRadius="full"
                        bg={pieColors[idx % pieColors.length]}
                        mr={3}
                        flexShrink={0}
                      />
                      {/* Meal Icon */}
                      <Box fontSize="2xl" color={pieColors[idx % pieColors.length]} mr={3} aria-label={entry.name + ' icon'}>
                        {mealTypeIcons[entry.name]}
                      </Box>
                      {/* Meal Name */}
                      <Text fontWeight="bold" fontSize="lg" flex="1" minW="120px">
                        {entry.name.charAt(0).toUpperCase() + entry.name.slice(1)}
                      </Text>
                      {/* Meal Count */}
                      <Text fontWeight="extrabold" fontSize="lg" color="gray.800" minW="70px" textAlign="right">
                        {entry.value} meals
                      </Text>
                      {/* Percentage */}
                      <Text color="gray.400" fontSize="lg" minW="60px" textAlign="right">
                        ({Math.round((entry.value/totalMeals) * 100)}%)
                      </Text>
                    </Flex>
                  ))}
                </VStack>
              </Flex>
            </Box>

            <Divider />

            {/* Bottom Section: Additional Nutrition Data */}
            <SimpleGrid columns={[1, 2]} spacing={8}>
              <Box>
                <Heading size="sm" mb={3} color="gray.700">Micronutrients Consumed</Heading>
                {hasMicronutrientData ? (
                  <VStack align="start" spacing={2}>
                    {Object.entries(micronutrientTotals).map(([micId, total]) => {
                      const micronutrient = micronutrients.find(m => m.id === micId);
                      return (
                        <HStack key={micId} justify="space-between" w="100%">
                          <Text fontWeight="medium">{micronutrient?.name || 'Unknown'}</Text>
                          <Text>{total} {micronutrient?.unit || ''}</Text>
                        </HStack>
                      );
                    })}
                  </VStack>
                ) : (
                  <Text color="gray.500" fontSize="sm">No micronutrient data. Example: Iron: 12mg, Calcium: 800mg</Text>
                )}
              </Box>

              <Box>
                <Heading size="sm" mb={3} color="gray.700">Supplements Taken</Heading>
                {hasSupplementData ? (
                  <VStack align="start" spacing={2}>
                    {Object.entries(supplementTotals).map(([supId, total]) => {
                      const supplement = supplements.find(s => s.id === supId);
                      return (
                        <HStack key={supId} justify="space-between" w="100%">
                          <Text fontWeight="medium">{supplement?.name || 'Unknown'}</Text>
                          <Text>{total} times</Text>
                        </HStack>
                      );
                    })}
                  </VStack>
                ) : (
                  <Text color="gray.500" fontSize="sm">No supplement data. Example: Protein Shake: 3 times, Electrolytes: 2 times</Text>
                )}
              </Box>
            </SimpleGrid>
          </VStack>
        )}
      </CardBody>
    </Card>
  );
};

export default EnhancedNutritionAnalysis; 