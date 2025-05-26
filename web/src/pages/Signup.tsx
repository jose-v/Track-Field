import { Box, Button, Flex, Heading, useToast, Card, CardBody, Icon } from '@chakra-ui/react';
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
    <Flex
      direction="column"
      align="center"
      justify="center"
      minHeight="80vh"
      marginTop="-80px"
      px={4}
    >
      <Card 
        maxW={{ base: "100%", md: "4xl" }}
        w="100%"
        borderRadius="lg" 
        overflow="hidden" 
        boxShadow="xl"
        p={0}
      >
        {/* Full-width Hero Header */}
        <Box 
          w="full"
          h="150px" 
          bg="linear-gradient(135deg, #805AD5 0%, #B794F4 100%)" 
          position="relative"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          p={0}
          m={0}
        >
          <Flex 
            bg="white" 
            borderRadius="full" 
            w="70px" 
            h="70px" 
            justify="center" 
            align="center"
            boxShadow="md"
            mb={2}
          >
            <Icon as={FaUserPlus} w={8} h={8} color="purple.500" />
          </Flex>
          <Heading size="md" color="white" fontWeight="bold" letterSpacing="wide" textAlign="center" mt={1} textTransform="uppercase">
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
  );
}

// Main export with context provider
export function Signup() {
  return (
    <SignupProvider>
      <SignupContent />
    </SignupProvider>
  );
} 