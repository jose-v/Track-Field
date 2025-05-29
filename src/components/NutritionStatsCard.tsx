import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Badge,
} from '@chakra-ui/react'
import { FaUtensils, FaArrowRight } from 'react-icons/fa'
import React from 'react'
import { Link as RouterLink } from 'react-router-dom'
import type { EatingRecord } from '../hooks/useNutritionRecords'
import { useColorModeValue } from '@chakra-ui/react'

interface NutritionStatsCardProps {
  nutritionStats: {
    totalCalories: number;
    averageCaloriesPerDay: number;
    mealTypeDistribution: {
      breakfast: number;
      lunch: number;
      dinner: number;
      snack: number;
    };
    recentRecord: EatingRecord | null;
  };
  isLoading: boolean;
}

export const NutritionStatsCard: React.FC<NutritionStatsCardProps> = ({ 
  nutritionStats,
  isLoading 
}) => {
  // Color mode values matching quick-log cards
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const statLabelColor = useColorModeValue('gray.600', 'gray.300')
  const statNumberColor = useColorModeValue('gray.900', 'gray.100')
  const cardShadow = useColorModeValue('none', 'lg')

  // Function to get the most common meal type
  const getMostCommonMeal = () => {
    if (!nutritionStats.recentRecord) return 'None';
    
    // Get entries and sort by count (descending)
    const entries = Object.entries(nutritionStats.mealTypeDistribution);
    if (!entries.length) return 'None';
    
    entries.sort((a, b) => b[1] - a[1]);
    
    // Format the meal type (capitalize first letter)
    const mealType = entries[0][0];
    return mealType.charAt(0).toUpperCase() + mealType.slice(1);
  };

  const getTotalMeals = () => {
    return Object.values(nutritionStats.mealTypeDistribution).reduce((sum, count) => sum + count, 0);
  };

  if (isLoading) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={6}
        border="1px solid"
        borderColor={borderColor}
        boxShadow={cardShadow}
        minH="320px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color={statLabelColor}>Loading nutrition data...</Text>
      </Box>
    );
  }

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      p={6}
      border="1px solid"
      borderColor={borderColor}
      boxShadow={cardShadow}
      minH="320px"
      display="flex"
      flexDirection="column"
    >
      <VStack spacing={5} align="stretch" flex="1">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Icon as={FaUtensils} boxSize={6} color="orange.500" />
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color={statNumberColor}>
                Nutrition Stats
              </Text>
              <Text fontSize="sm" color={statLabelColor}>
                {nutritionStats.recentRecord 
                  ? `${getTotalMeals()} meals tracked`
                  : 'Track your nutrition'
                }
              </Text>
            </VStack>
          </HStack>
          <Badge 
            colorScheme="orange" 
            variant="solid" 
            fontSize="xs"
            px={2}
            py={1}
          >
            Last 7 Days
          </Badge>
        </HStack>

        {nutritionStats.recentRecord ? (
          <>
            {/* Main Stats */}
            <HStack spacing={6} justify="space-between">
              <Stat flex="1">
                <StatLabel fontSize="sm" color={statLabelColor}>Average Daily Calories</StatLabel>
                <StatNumber fontSize="2xl" color={statNumberColor} fontWeight="bold">
                  {nutritionStats.averageCaloriesPerDay ? 
                    Math.round(nutritionStats.averageCaloriesPerDay) : 
                    'N/A'}
                </StatNumber>
                <StatHelpText fontSize="xs" color={statLabelColor}>
                  Last 7 days
                </StatHelpText>
              </Stat>
            </HStack>

            {/* Secondary Stats */}
            <HStack spacing={6} justify="space-between">
              <Stat flex="1">
                <StatLabel fontSize="sm" color={statLabelColor}>Most Common Meal</StatLabel>
                <StatNumber fontSize="xl" color={statNumberColor} fontWeight="bold">
                  {getMostCommonMeal()}
                </StatNumber>
              </Stat>
              <Stat flex="1" textAlign="right">
                <StatLabel fontSize="sm" color={statLabelColor}>Last Recorded</StatLabel>
                <StatNumber fontSize="xl" color={statNumberColor} fontWeight="bold">
                  {new Date(nutritionStats.recentRecord.record_date).toLocaleDateString('en-US', {
                    month: 'numeric',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </StatNumber>
              </Stat>
            </HStack>

            {/* Meal Distribution */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" color={statNumberColor} mb={3}>
                Meal Distribution
              </Text>
              <VStack spacing={2}>
                {Object.entries(nutritionStats.mealTypeDistribution).map(([meal, count]) => (
                  <HStack key={meal} justify="space-between" w="100%">
                    <HStack spacing={2}>
                      <Box
                        w={3}
                        h={3}
                        borderRadius="full"
                        bg={
                          meal === 'breakfast' ? 'yellow.400' :
                          meal === 'lunch' ? 'green.400' :
                          meal === 'dinner' ? 'blue.400' : 'purple.400'
                        }
                      />
                      <Text fontSize="sm" color={statLabelColor} textTransform="capitalize">
                        {meal}
                      </Text>
                    </HStack>
                    <Badge
                      colorScheme={
                        meal === 'breakfast' ? 'yellow' :
                        meal === 'lunch' ? 'green' :
                        meal === 'dinner' ? 'blue' : 'purple'
                      }
                      variant="subtle"
                      fontSize="xs"
                    >
                      {count}
                    </Badge>
                  </HStack>
                ))}
              </VStack>
            </Box>
          </>
        ) : (
          <Box
            bg={useColorModeValue('gray.50', 'gray.700')}
            p={6}
            borderRadius="lg"
            textAlign="center"
            flex="1"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <VStack spacing={3}>
              <Icon as={FaUtensils} boxSize={8} color={statLabelColor} />
              <Text fontSize="lg" fontWeight="medium" color={statNumberColor}>
                No nutrition records
              </Text>
              <Text fontSize="sm" color={statLabelColor}>
                Start tracking your meals and nutrition
              </Text>
            </VStack>
          </Box>
        )}

        {/* Action Button */}
        <Button
          as={RouterLink}
          to="/athlete/nutrition"
          colorScheme="orange"
          variant="outline"
          size="sm"
          leftIcon={<Icon as={FaUtensils} />}
          rightIcon={<Icon as={FaArrowRight} />}
          mt="auto"
        >
          {nutritionStats.recentRecord ? 'View Nutrition Records' : 'Add Nutrition Record'}
        </Button>
      </VStack>
    </Box>
  )
}

export default NutritionStatsCard 