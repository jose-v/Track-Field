import {
  Box,
  Card,
  CardBody,
  Flex,
  Icon,
  Tag,
  Text,
  VStack,
  HStack,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/react'
import { FaUtensils } from 'react-icons/fa'
import React from 'react'
import { Link as RouterLink } from 'react-router-dom'
import type { EatingRecord } from '../hooks/useNutritionRecords'

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

  return (
    <Card 
      borderRadius="lg" 
      overflow="hidden" 
      boxShadow="md"
      height="100%"
    >
      {/* Nutrition Card Header */}
      <Box 
        h="80px" 
        bg="linear-gradient(135deg, #DD6B20 0%, #F6AD55 100%)" 
        position="relative"
        display="flex"
        alignItems="center"
        px={6}
      >
        <Flex 
          bg="white" 
          borderRadius="full" 
          w="50px" 
          h="50px" 
          justifyContent="center" 
          alignItems="center"
          boxShadow="none"
          mr={4}
        >
          <Icon as={FaUtensils} w={6} h={6} color="orange.500" />
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
          NUTRITION STATS
        </Tag>
      </Box>
      <CardBody>
        {nutritionStats.recentRecord ? (
          <VStack spacing={4} align="start">
            <Stat>
              <StatLabel>Average Daily Calories</StatLabel>
              <StatNumber>
                {nutritionStats.averageCaloriesPerDay ? 
                  `${Math.round(nutritionStats.averageCaloriesPerDay)}` : 
                  'No data'}
              </StatNumber>
              <StatHelpText>Last 7 days</StatHelpText>
            </Stat>
            
            <HStack width="100%" justifyContent="space-between">
              <Stat>
                <StatLabel>Most Common Meal</StatLabel>
                <StatNumber fontSize="xl">
                  {getMostCommonMeal()}
                </StatNumber>
              </Stat>
              <Stat textAlign="right">
                <StatLabel>Last Recorded</StatLabel>
                <StatNumber fontSize="xl">
                  {new Date(nutritionStats.recentRecord.record_date).toLocaleDateString()}
                </StatNumber>
              </Stat>
            </HStack>
            
            <Button 
              as={RouterLink}
              to="/athlete/nutrition"
              colorScheme="orange"
              size="sm"
              width="full"
              mt={2}
              leftIcon={<FaUtensils />}
            >
              View Nutrition Records
            </Button>
          </VStack>
        ) : (
          <VStack spacing={4} py={4}>
            <Text>No nutrition records found.</Text>
            <Button 
              as={RouterLink}
              to="/athlete/nutrition"
              colorScheme="orange"
              size="sm"
              leftIcon={<FaUtensils />}
            >
              Add Nutrition Record
            </Button>
          </VStack>
        )}
      </CardBody>
    </Card>
  )
}

export default NutritionStatsCard 