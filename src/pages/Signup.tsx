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
      // Register the user with email and password
      await signUp(signupData.email, signupData.password);
      
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
    } catch (error) {
      // Show error message
      toast({
        title: 'Error',
        description: 'Failed to create account. Please try again.',
        status: 'error',
        duration: 5000,
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
    <Card 
      mx="auto" 
      mt={8}
      borderRadius="lg" 
      overflow="hidden" 
      boxShadow="md"
      maxW={{ base: "100%", md: "4xl" }}
    >
      {/* Hero Background */}
      <Box 
        h="120px" 
        bg="linear-gradient(135deg, #805AD5 0%, #B794F4 100%)" 
        position="relative"
      >
        <Flex 
          position="absolute" 
          top="50%" 
          left="50%" 
          transform="translate(-50%, -50%)"
          bg="white" 
          borderRadius="full" 
          w="70px" 
          h="70px" 
          justifyContent="center" 
          alignItems="center"
          boxShadow="md"
        >
          <Icon as={FaUserPlus} w={8} h={8} color="purple.500" />
        </Flex>
      </Box>
      
      <CardBody pt={12} px={6}>
        <Heading textAlign="center" mb={6} size="lg">Create Account</Heading>
        
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