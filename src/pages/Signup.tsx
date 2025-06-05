import { Box, Button, Flex, Heading, useToast, Card, CardBody, Icon, useColorModeValue } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StepIndicator } from '../components/StepIndicator';
import { SignupProvider, useSignup } from '../contexts/SignupContext';
import { SignupMethodSelection } from '../components/signup/SignupMethodSelection';
import { RoleSelection } from '../components/signup/RoleSelection';
import { AccountInfo } from '../components/signup/AccountInfo';
import { PersonalInfo } from '../components/signup/PersonalInfo';
import { useAuth } from '../contexts/AuthContext';
import { FaUserPlus } from 'react-icons/fa';
import { signUp as signUpWithProfile } from '../services/authService';

// Step labels for the new 4-step flow
const stepLabels = [
  'Signup Method',
  'Choose Role', 
  'Account Information',
  'Personal Information'
];

// Wrapper component to access context
function SignupContent() {
  const { currentStep, setCurrentStep, totalSteps, signupData, updateSignupData, resetSignupData } = useSignup();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  // Dark mode adaptive colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('#ecc94b', 'blue.600');
  const headerTextColor = useColorModeValue('gray.800', 'white');
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  
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
  
  // Handle final submission (only for email signup)
  const handleSubmit = async () => {
    // Google OAuth users are already authenticated, so redirect them
    if (signupData.signupMethod === 'google') {
      toast({
        title: 'Setup Complete!',
        description: 'Your profile has been configured. You can now access your dashboard.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      navigate('/dashboard');
      return;
    }

    // For email signup, create the account
    try {
      const { user, error } = await signUpWithProfile({
        role: signupData.role!,
        email: signupData.email,
        password: signupData.password,
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        phone: signupData.phone,
      });
      
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
      
      // Reset signup data and navigate to login page
      resetSignupData();
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
  
  // Check if current step is valid to proceed
  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return signupData.signupMethod !== null;
      case 2:
        return signupData.role !== null;
      case 3:
        // For Google OAuth, always allow proceeding (they don't need to fill account info)
        if (signupData.signupMethod === 'google') {
          return true;
        }
        // For email signup, require email and password
        return signupData.email && signupData.password;
      case 4:
        return signupData.firstName && signupData.lastName;
      default:
        return false;
    }
  };
  
  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <SignupMethodSelection />;
      case 2:
        return <RoleSelection />;
      case 3:
        return <AccountInfo />;
      case 4:
        return <PersonalInfo />;
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
                  isDisabled={!canProceedToNext()}
                  size={{ base: "md", md: "lg" }}
                  visibility={currentStep === 1 ? 'hidden' : 'visible'}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  colorScheme="purple" 
                  onClick={handleSubmit}
                  isDisabled={!canProceedToNext()}
                  size={{ base: "md", md: "lg" }}
                >
                  {signupData.signupMethod === 'google' ? 'Complete Setup' : 'Create Account'}
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