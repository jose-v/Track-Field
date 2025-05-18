import React, { useEffect, useState } from 'react';
import {
  Box, Heading, Stat, StatLabel, StatNumber, StatHelpText, VStack, HStack, Tag, Text, Spinner, Divider, SimpleGrid
} from '@chakra-ui/react';
import { supabase } from '../lib/supabase';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { FaCoffee, FaUtensils, FaAppleAlt, FaCookieBite } from 'react-icons/fa';
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
    <Box
      p={8}
      borderRadius="2xl"
      boxShadow="lg"
      bgGradient="linear(to-br, whiteAlpha.900, orange.50 80%)"
      w="100%"
    >
      <Heading size="md" mb={6} fontWeight="extrabold" letterSpacing="tight">Enhanced Nutrition Analysis</Heading>
      {isLoading ? (
        <Spinner />
      ) : (
        <VStack align="stretch" spacing={8}>
          {/* Macro Progress Cards Grid */}
          <SimpleGrid columns={[1, 2, 3, 5]} spacing={6} mb={4}>
            {macroData.map((macro) => (
              <MacroProgressCard key={macro.label} {...macro} />
            ))}
          </SimpleGrid>
          <SimpleGrid columns={[1, 2, 3]} spacing={6}>
            <Stat>
              <StatLabel fontSize="md" color="gray.500">Total Calories</StatLabel>
              <StatNumber fontSize="3xl" fontWeight="bold">{totalCalories}</StatNumber>
              <StatHelpText>All time</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel fontSize="md" color="gray.500">Meal Count</StatLabel>
              <StatNumber fontSize="3xl" fontWeight="bold">{eatingRecords.length}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel fontSize="md" color="gray.500">Meal Type Distribution</StatLabel>
              <StatNumber>
                {Object.entries(mealTypeDist).map(([type, count]) => (
                  <Tag key={type} colorScheme="orange" mr={1} fontSize="md" borderRadius="full" px={3} py={1}>
                    {mealTypeIcons[type] || null} {type.charAt(0).toUpperCase() + type.slice(1)}: {count}
                  </Tag>
                ))}
              </StatNumber>
            </Stat>
          </SimpleGrid>

          {/* Donut Chart for Meal Type Distribution */}
          <Box w="100%" h="300px" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
            {mealTypePieData.length > 0 ? (
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie
                    data={mealTypePieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    label={({ name, percent }) => `${name.charAt(0).toUpperCase() + name.slice(1)} (${Math.round(percent * 100)}%)`}
                    isAnimationActive
                  >
                    {mealTypePieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string, props: any) => [`${value} meals`, `${name.charAt(0).toUpperCase() + name.slice(1)}`]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Text color="gray.500">No meal type data to display.</Text>
            )}
            {/* Custom Legend */}
            <HStack mt={4} spacing={6} justify="center">
              {mealTypePieData.map((entry, idx) => (
                <HStack key={entry.name} spacing={2}>
                  <Box w={3} h={3} borderRadius="full" bg={pieColors[idx % pieColors.length]} />
                  <Text fontWeight="medium" fontSize="md">
                    {mealTypeIcons[entry.name] || null} {entry.name.charAt(0).toUpperCase() + entry.name.slice(1)}
                  </Text>
                </HStack>
              ))}
            </HStack>
          </Box>

          <Divider />

          <Box>
            <Heading size="sm" mb={2}>Micronutrients Consumed</Heading>
            {hasMicronutrientData ? (
              <VStack align="start">
                {Object.entries(micronutrientTotals).map(([micId, total]) => {
                  const micronutrient = micronutrients.find(m => m.id === micId);
                  return (
                    <Text key={micId}>
                      {micronutrient?.name || 'Unknown'}: {total} {micronutrient?.unit || ''}
                    </Text>
                  );
                })}
              </VStack>
            ) : (
              <Text color="gray.500">No micronutrient data. Example: Iron: 12mg, Calcium: 800mg</Text>
            )}
          </Box>

          <Divider />

          <Box>
            <Heading size="sm" mb={2}>Supplements Taken</Heading>
            {hasSupplementData ? (
              <VStack align="start">
                {Object.entries(supplementTotals).map(([supId, total]) => {
                  const supplement = supplements.find(s => s.id === supId);
                  return (
                    <Text key={supId}>
                      {supplement?.name || 'Unknown'}: {total} times
                    </Text>
                  );
                })}
              </VStack>
            ) : (
              <Text color="gray.500">No supplement data. Example: Protein Shake: 3 times, Electrolytes: 2 times</Text>
            )}
          </Box>
        </VStack>
      )}
    </Box>
  );
};

export default EnhancedNutritionAnalysis; 