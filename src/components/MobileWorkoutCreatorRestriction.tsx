import React from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Icon,
  useColorModeValue,
  Button,
  Container,
  Flex,
} from '@chakra-ui/react';
import { Monitor, Smartphone, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const MobileWorkoutCreatorRestriction: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Theme colors
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');

  // Determine the correct navigation path based on user role
  const getBackPath = () => {
    // Get user profile from localStorage or context to determine role
    const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const role = profile.role || 'athlete';
    
    switch (role) {
      case 'coach':
        return '/coach/dashboard';
      case 'team_manager':
        return '/team-manager/dashboard';
      case 'athlete':
      default:
        return '/athlete/dashboard';
    }
  };

  return (
    <Box 
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg={bgColor} 
      zIndex={1000}
      display="flex" 
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Container maxW="sm" px={6}>
        <VStack spacing={6} textAlign="center" w="100%">
          {/* Icons */}
          <Flex align="center" justify="center" gap={3}>
            <Box
              p={3}
              bg={cardBg}
              borderRadius="full"
              border="2px solid"
              borderColor={borderColor}
              opacity={0.5}
            >
              <Icon as={Smartphone} boxSize="24px" color="orange.500" />
            </Box>
            
            <Text fontSize="2xl" color={subtitleColor}>→</Text>
            
            <Box
              p={3}
              bg={cardBg}
              borderRadius="full"
              border="2px solid"
              borderColor="blue.500"
              boxShadow="0 0 0 4px rgba(66, 153, 225, 0.1)"
            >
              <Icon as={Monitor} boxSize="24px" color="blue.500" />
            </Box>
          </Flex>

          {/* Main message */}
          <VStack spacing={3}>
            <Heading 
              size="md" 
              color={textColor}
              textAlign="center"
              lineHeight="short"
            >
              Looks like you're on mobile!
            </Heading>
            
            <Text 
              fontSize="md" 
              color={subtitleColor}
              textAlign="center"
              lineHeight="base"
              px={2}
            >
              The Workout Creator needs a bigger screen—try switching to desktop for the best experience.
            </Text>
          </VStack>

          {/* Why desktop section */}
          <Box
            p={4}
            bg={cardBg}
            borderRadius="lg"
            border="1px solid"
            borderColor={borderColor}
            w="100%"
          >
            <VStack spacing={2} textAlign="left" align="stretch">
              <Text fontWeight="semibold" color={textColor} textAlign="center" fontSize="sm">
                Why desktop works better:
              </Text>
              <VStack spacing={1} align="start" fontSize="xs" color={subtitleColor}>
                <Text>• Drag & drop block building</Text>
                <Text>• Multiple exercise libraries</Text>
                <Text>• Advanced configurations</Text>
                <Text>• Better workflow</Text>
              </VStack>
            </VStack>
          </Box>

          {/* Action buttons */}
          <VStack spacing={2} w="100%">
            <Button
              leftIcon={<ArrowLeft size={16} />}
              variant="solid"
              colorScheme="blue"
              size="md"
              w="100%"
              onClick={() => navigate(getBackPath())}
            >
              Back to Dashboard
            </Button>
            
            <Text fontSize="xs" color={subtitleColor} textAlign="center">
              You can still access other features from your dashboard
            </Text>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
}; 