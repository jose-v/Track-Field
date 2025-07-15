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
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="md" centerContent>
        <VStack spacing={8} textAlign="center" pt={16}>
          {/* Icons */}
          <Flex align="center" justify="center" gap={4}>
            <Box
              p={4}
              bg={cardBg}
              borderRadius="full"
              border="2px solid"
              borderColor={borderColor}
              opacity={0.5}
            >
              <Icon as={Smartphone} size="32px" color="orange.500" />
            </Box>
            
            <Text fontSize="3xl" color={subtitleColor}>→</Text>
            
            <Box
              p={4}
              bg={cardBg}
              borderRadius="full"
              border="2px solid"
              borderColor="blue.500"
              boxShadow="0 0 0 4px rgba(66, 153, 225, 0.1)"
            >
              <Icon as={Monitor} size="32px" color="blue.500" />
            </Box>
          </Flex>

          {/* Main message */}
          <VStack spacing={4}>
            <Heading 
              size="lg" 
              color={textColor}
              textAlign="center"
              lineHeight="short"
            >
              Looks like you're on mobile!
            </Heading>
            
            <Text 
              fontSize="lg" 
              color={subtitleColor}
              textAlign="center"
              maxW="400px"
              lineHeight="tall"
            >
              The Workout Creator needs a bigger screen—try switching to desktop for the best experience.
            </Text>
          </VStack>

          {/* Why desktop section */}
          <Box
            p={6}
            bg={cardBg}
            borderRadius="lg"
            border="1px solid"
            borderColor={borderColor}
            w="100%"
            maxW="400px"
          >
            <VStack spacing={3} textAlign="left" align="stretch">
              <Text fontWeight="semibold" color={textColor} textAlign="center">
                Why desktop works better:
              </Text>
              <VStack spacing={2} align="start" fontSize="sm" color={subtitleColor}>
                <Text>• Drag & drop block building</Text>
                <Text>• Multiple exercise libraries side-by-side</Text>
                <Text>• Advanced template configurations</Text>
                <Text>• Better multi-step workflow</Text>
              </VStack>
            </VStack>
          </Box>

          {/* Action buttons */}
          <VStack spacing={3} w="100%" maxW="300px">
            <Button
              leftIcon={<ArrowLeft size={16} />}
              variant="solid"
              colorScheme="blue"
              size="lg"
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