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
  const headerGradient = useColorModeValue(
    'linear-gradient(135deg, #DD6B20 0%, #F6AD55 100%)',
    'linear-gradient(135deg, #7B341E 0%, #DD6B20 100%)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');

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
      p="0"
      display="flex"
      flexDirection="column"
      bg={cardBg}
    >
      {/* Nutrition Card Header */}
      <Box 
        h="80px" 
        bg={headerGradient}
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
      <CardBody px={4} py={4} display="flex" flexDirection="column" flex="1">
        {nutritionStats.recentRecord ? (
          <VStack spacing={4} align="stretch" height="100%">
            <Box flex="1">
              <Stat>
                <StatLabel color={statLabelColor}>Average Daily Calories</StatLabel>
                <StatNumber color={statNumberColor}>
                  {nutritionStats.averageCaloriesPerDay ? 
                    `${Math.round(nutritionStats.averageCaloriesPerDay)}` : 
                    'No data'}
                </StatNumber>
                <StatHelpText color={statLabelColor}>Last 7 days</StatHelpText>
              </Stat>
              
              <HStack width="100%" justifyContent="space-between" mt={4}>
                <Stat>
                  <StatLabel color={statLabelColor}>Most Common Meal</StatLabel>
                  <StatNumber fontSize="xl" color={statNumberColor}>
                    {getMostCommonMeal()}
                  </StatNumber>
                </Stat>
                <Stat textAlign="right">
                  <StatLabel color={statLabelColor}>Last Recorded</StatLabel>
                  <StatNumber fontSize="xl" color={statNumberColor}>
                    {new Date(nutritionStats.recentRecord.record_date).toLocaleDateString()}
                  </StatNumber>
                </Stat>
              </HStack>
            </Box>
            
            <Box mt="auto" width="100%">
              <Button 
                as={RouterLink}
                to="/athlete/nutrition"
                variant="primary"
                size="md"
                width="full"
                leftIcon={<FaUtensils />}
              >
                View Nutrition Records
              </Button>
            </Box>
          </VStack>
        ) : (
          <VStack spacing={4} py={4} flex="1" justifyContent="center">
            <Text>No nutrition records found.</Text>
            <Box mt="auto" width="100%">
              <Button 
                as={RouterLink}
                to="/athlete/nutrition"
                variant="primary"
                size="md"
                width="full"
                leftIcon={<FaUtensils />}
              >
                Add Nutrition Record
              </Button>
            </Box>
          </VStack>
        )}
      </CardBody>
    </Card>
  )
}

export default NutritionStatsCard 