import React from 'react';
import {
  Box, Card, CardBody, Flex, HStack, Icon, Tag, Text, VStack
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
    >
      {/* Header */}
      <Box 
        h="80px" 
        bg="linear-gradient(135deg, #805AD5 0%, #B794F4 100%)" 
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
      <CardBody>
        <VStack spacing={2} align="start">
          <HStack w="100%">
            <Text fontWeight="medium" minW="80px">Team:</Text>
            <Text>{team || 'Not set'}</Text>
          </HStack>
          <HStack w="100%" alignItems="flex-start">
            <Text fontWeight="medium" minW="80px">Events:</Text>
            <Text>{getFormattedEvents()}</Text>
          </HStack>
          <HStack w="100%">
            <Text fontWeight="medium" minW="80px">School:</Text>
            <Text>{school || 'Not set'}</Text>
          </HStack>
          <HStack w="100%">
            <Text fontWeight="medium" minW="80px">Coach:</Text>
            <Text>{coach || 'Not assigned'}</Text>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default TeamCard; 