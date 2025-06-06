import {
  Box,
  Button,
  Card,
  CardBody,
  Text,
  VStack,
  useColorModeValue,
  Heading,
  Icon,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

export function EmailVerified() {
  const navigate = useNavigate();
  const { user, showEmailVerifiedToast } = useAuth();
  
  // Dark mode adaptive colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'gray.100');
  const iconBg = useColorModeValue('green.50', 'green.900');
  
  const handleContinue = () => {
    // Set flag to show welcome toast on dashboard
    showEmailVerifiedToast();
    
    // Redirect to appropriate dashboard based on user verification status
    if (user && user.email_confirmed_at) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };
  
  return (
    <Box
      bg={useColorModeValue('gray.50', 'gray.900')}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight={{ 
          base: "calc(100vh - 140px)", // Mobile: smaller header/footer
          md: "calc(100vh - 160px)",   // Tablet: medium spacing
          lg: "calc(100vh - 356px)"    // Desktop: larger footer space
        }}
        py={{ base: 4, md: 6, lg: 8 }}
        px={4}
      >
        <Card
          maxW="md"
          w="full"
          bg={cardBg}
          borderColor={borderColor}
          borderWidth={1}
        >
          <CardBody p={8}>
            <VStack spacing={6} align="stretch" textAlign="center">
              {/* Success Icon */}
              <VStack spacing={4}>
                <Box
                  p={4}
                  borderRadius="full"
                  bg={iconBg}
                >
                  <Icon as={FaCheckCircle} color="green.500" boxSize={12} />
                </Box>
                
                <VStack spacing={2}>
                  <Heading size="lg" color={headingColor}>
                    Email Verified Successfully!
                  </Heading>
                  <Text color={textColor}>
                    Your email has been confirmed. You can now access all features of your Track & Field account.
                  </Text>
                </VStack>
              </VStack>
              
              {/* Success Message */}
              <Box p={4} bg={useColorModeValue('green.50', 'green.900')} borderRadius="md">
                <Text fontSize="sm" color={useColorModeValue('green.700', 'green.300')}>
                  Welcome to Track & Field! Your account is now fully activated and ready to use.
                </Text>
              </Box>
              
              {/* Continue Button */}
              <Button
                onClick={handleContinue}
                colorScheme="green"
                size="lg"
                width="full"
              >
                Continue to Dashboard
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </Box>
    </Box>
  );
} 