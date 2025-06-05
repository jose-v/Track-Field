import { Box, Button, Flex, Heading, useToast, Card, CardBody, Icon, useColorModeValue } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StepIndicator } from '../components/StepIndicator';
import { SignupProvider, useSignup } from '../contexts/SignupContext';
import { RoleSelection } from '../components/signup/RoleSelection';
import { AccountInfo } from '../components/signup/AccountInfo';
import { PersonalInfo } from '../components/signup/PersonalInfo';
import { AthleteSelection } from '../components/signup/AthleteSelection';
import { useAuth } from '../contexts/AuthContext';
import { FaUserPlus } from 'react-icons/fa';
import { signUp as signUpWithProfile } from '../services/authService';

// Step labels for the progress indicator
const getStepLabels = (totalSteps: number) => {
  const baseLabels = [
    'Choose Role',
    'Account Information',
    'Personal Information'
  ];
  
  // Add the athlete selection step if there are 4 steps
  return totalSteps === 4 
    ? [...baseLabels, 'Select Athletes'] 
    : baseLabels;
};

// Wrapper component to access context
function SignupContent() {
  const { currentStep, setCurrentStep, totalSteps, signupData, updateSignupData } = useSignup();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  // Dark mode adaptive colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('#ecc94b', 'blue.600');
  const headerTextColor = useColorModeValue('gray.800', 'white');
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  
  // Get step labels based on total steps
  const stepLabels = getStepLabels(totalSteps);
  
  // Update total steps when role changes
  useEffect(() => {
    // Adjust the current step if higher than total steps
    if (currentStep > totalSteps) {
      setCurrentStep(totalSteps);
    }
  }, [totalSteps, currentStep, setCurrentStep]);
  
  // Navigate to previous step
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Navigate to next step
  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  // Handle final submission
  const handleSubmit = async () => {
    try {
      // Register the user and create their profile
      const { user, error } = await signUpWithProfile(signupData);
      if (error) {
        console.error('Signup failed with error:', error);
        throw error;
      }
      
      // Show success message
      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account before logging in.',
        status: 'success',
        duration: 7000,
        isClosable: true,
      });
      
      // Navigate to login page
      navigate('/login');
    } catch (error: any) {
      // Show more specific error message
      console.error('Detailed signup error:', error);
      toast({
        title: 'Error Creating Account',
        description: error.message || 'Failed to create account. Please try again.',
        status: 'error',
        duration: 7000,
        isClosable: true,
      });
    }
  };
  
  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <RoleSelection />;
      case 2:
        return <AccountInfo />;
      case 3:
        return <PersonalInfo />;
      case 4:
        return <AthleteSelection />;
      default:
        return null;
    }
  };
  
  return (
    <Box
      bg={pageBg}
    >
      <Flex
        direction="column"
        align="center"
        justify="center"
        minHeight={{ 
          base: "calc(100vh - 140px)", // Mobile: smaller header/footer
          md: "calc(100vh - 160px)",   // Tablet: medium spacing
          lg: "calc(100vh - 356px)"    // Desktop: larger footer space
        }}
        py={{ base: 4, md: 6, lg: 8 }}
        px={4}
      >
        <Card 
          maxW="850px"
          w="100%"
          borderRadius="lg" 
          overflow="hidden" 
          p={0}
          bg={cardBg}
          borderColor={borderColor}
          borderWidth={1}
        >
          {/* Full-width Hero Header */}
          <Box 
            w="full"
            h="150px" 
            bg={headerBg}
            position="relative"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            p={0}
            m={0}
          >
            <Heading 
              size="md" 
              color={headerTextColor} 
              fontWeight="bold" 
              letterSpacing="wide" 
              textAlign="center" 
              textTransform="uppercase"
            >
              Sign Up
            </Heading>
          </Box>
          <CardBody pt={8} px={8}>
            {/* Step indicator */}
            <Box px={{ base: 2, md: 6 }}>
              <StepIndicator 
                currentStep={currentStep} 
                totalSteps={totalSteps} 
                stepLabels={stepLabels} 
              />
            </Box>
            
            {/* Step content */}
            <Box mb={8} mt={6}>
              {renderStep()}
            </Box>
            
            {/* Navigation buttons */}
            <Flex justify="space-between" mt={6}>
              <Button 
                onClick={handlePrevStep} 
                visibility={currentStep === 1 ? 'hidden' : 'visible'}
                size={{ base: "md", md: "lg" }}
                variant="outline"
              >
                Previous
              </Button>
              
              {currentStep < totalSteps ? (
                <Button 
                  colorScheme="purple" 
                  onClick={handleNextStep}
                  isDisabled={
                    (currentStep === 1 && !signupData.role) || 
                    (currentStep === 2 && (!signupData.email || !signupData.password))
                  }
                  size={{ base: "md", md: "lg" }}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  colorScheme="purple" 
                  onClick={handleSubmit}
                  size={{ base: "md", md: "lg" }}
                >
                  Complete Signup
                </Button>
              )}
            </Flex>
          </CardBody>
        </Card>
      </Flex>
    </Box>
  );
}

// Main component with provider
export function Signup() {
  return (
    <SignupProvider>
      <SignupContent />
    </SignupProvider>
  );
} 