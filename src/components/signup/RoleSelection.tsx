import { 
  Box, 
  SimpleGrid, 
  Heading, 
  Text, 
  VStack,  
  useColorModeValue 
} from '@chakra-ui/react';
import { FaRunning, FaChalkboardTeacher, FaUsers } from 'react-icons/fa';
import { useSignup } from '../../contexts/SignupContext';
import type { UserRole } from '../../contexts/SignupContext';
import type { ReactNode } from 'react';

interface RoleCardProps {
  role: UserRole;
  title: string;
  description: string;
  iconElement: ReactNode;
  isSelected: boolean;
  onClick: () => void;
}

function RoleCard({ role, title, description, iconElement, isSelected, onClick }: RoleCardProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const selectedBorderColor = useColorModeValue('blue.500', 'blue.300');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  
  return (
    <Box
      p={4}
      borderWidth={2}
      borderRadius="lg"
      borderColor={isSelected ? selectedBorderColor : 'transparent'}
      boxShadow={isSelected ? 'md' : 'base'}
      bg={bgColor}
      cursor="pointer"
      onClick={onClick}
      transition="all 0.2s"
      _hover={{ transform: "translateY(-2px)", boxShadow: "md", bg: hoverBg }}
      height="100%"
      display="flex"
      flexDirection="column"
      justifyContent="center"
    >
      <VStack spacing={3} align="center">
        <Box fontSize={{ base: "2rem", md: "2.5rem" }} color={isSelected ? selectedBorderColor : 'gray.500'}>
          {iconElement}
        </Box>
        <Heading size="md">{title}</Heading>
        <Text textAlign="center" color="gray.500" fontSize={{ base: "sm", md: "md" }}>
          {description}
        </Text>
      </VStack>
    </Box>
  );
}

export function RoleSelection() {
  const { signupData, updateSignupData } = useSignup();
  
  const handleRoleSelection = (role: UserRole) => {
    updateSignupData({ role });
  };
  
  return (
    <Box width="100%">
      <Heading size="md" mb={6} textAlign="center">
        I am joining as a...
      </Heading>
      
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 6, md: 4 }} width="100%">
        <RoleCard
          role="athlete"
          title="Athlete"
          description="Track your workouts, view your progress, and connect with your coaches."
          iconElement={<FaRunning />}
          isSelected={signupData.role === 'athlete'}
          onClick={() => handleRoleSelection('athlete')}
        />
        
        <RoleCard
          role="coach"
          title="Coach"
          description="Create workouts, track athlete progress, and manage your team."
          iconElement={<FaChalkboardTeacher />}
          isSelected={signupData.role === 'coach'}
          onClick={() => handleRoleSelection('coach')}
        />
        
        <RoleCard
          role="team_manager"
          title="Team Manager"
          description="Oversee multiple coaches and athletes, manage events and team logistics."
          iconElement={<FaUsers />}
          isSelected={signupData.role === 'team_manager'}
          onClick={() => handleRoleSelection('team_manager')}
        />
      </SimpleGrid>
    </Box>
  );
} 