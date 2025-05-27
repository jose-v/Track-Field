import React from 'react';
import {
  Box, Card, CardBody, Flex, HStack, Icon, Tag, Text, VStack, useColorModeValue
} from '@chakra-ui/react';
import { FaUsers } from 'react-icons/fa';

interface TeamCardProps {
  team?: string;
  events?: string[];
  school?: string;
  coach?: string;
  isLoading?: boolean;
}

const TeamCard: React.FC<TeamCardProps> = ({
  team = '',
  events = [],
  school = '',
  coach = '',
  isLoading = false
}) => {
  const iconBg = useColorModeValue('white', 'gray.800');
  // Helper function to get header gradient based on color mode
  const headerGradient = useColorModeValue(
    'linear-gradient(135deg, #805AD5 0%, #B794F4 100%)',
    'linear-gradient(135deg, #322659 0%, #6B46C1 100%)'
  );
  // Helper function to format events array to string
  const getFormattedEvents = () => {
    if (!events || !Array.isArray(events) || events.length === 0) {
      return 'Not set';
    }
    return events.join(', ');
  };

  return (
    <Card 
      borderRadius="lg" 
      overflow="hidden" 
      boxShadow="md"
      bg={useColorModeValue('white', 'gray.800')}
      borderWidth="1px"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
    >
      {/* Header */}
      <Box 
        h="80px" 
        bg={headerGradient}
        position="relative"
        display="flex"
        alignItems="center"
        px={6}
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
          <Icon as={FaUsers} w={6} h={6} color="purple.500" />
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
          TEAM
        </Tag>
      </Box>
      <CardBody bg={useColorModeValue('white', 'gray.800')} borderRadius="inherit">
        <VStack spacing={2} align="start">
          <HStack w="100%">
            <Text fontWeight="medium" minW="80px" color={useColorModeValue('gray.700', 'gray.200')}>Team:</Text>
            <Text color={useColorModeValue('gray.800', 'gray.100')}>{team || 'Not set'}</Text>
          </HStack>
          <HStack w="100%" alignItems="flex-start">
            <Text fontWeight="medium" minW="80px" color={useColorModeValue('gray.700', 'gray.200')}>Events:</Text>
            <Text color={useColorModeValue('gray.800', 'gray.100')}>{getFormattedEvents()}</Text>
          </HStack>
          <HStack w="100%">
            <Text fontWeight="medium" minW="80px" color={useColorModeValue('gray.700', 'gray.200')}>School:</Text>
            <Text color={useColorModeValue('gray.800', 'gray.100')}>{school || 'Not set'}</Text>
          </HStack>
          <HStack w="100%">
            <Text fontWeight="medium" minW="80px" color={useColorModeValue('gray.700', 'gray.200')}>Coach:</Text>
            <Text color={useColorModeValue('gray.800', 'gray.100')}>{coach || 'Not assigned'}</Text>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default TeamCard; 