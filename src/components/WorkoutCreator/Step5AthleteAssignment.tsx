import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Tag,
  TagLabel,
  TagCloseButton,
  Avatar,
  SimpleGrid,
  Card,
  CardBody,
  Badge,
  useColorModeValue,
  useToast,
  Flex,
  Icon,
  Divider,
  Checkbox,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { Search, Users, UserCheck, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useCoachAthletes } from '../../hooks/useCoachAthletes';
import { useAuth } from '../../contexts/AuthContext';

interface Step5AthleteAssignmentProps {
  templateType: 'single' | 'weekly' | 'monthly';
  selectedAthletes: string[];
  onAthleteSelection: (athleteIds: string[]) => void;
  workoutName: string;
}

interface AthleteWithSelection {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  avatar_url?: string;
  events?: string[];
  completion_rate?: number;
  isSelected: boolean;
}

const Step5AthleteAssignment: React.FC<Step5AthleteAssignmentProps> = ({
  templateType,
  selectedAthletes,
  onAthleteSelection,
  workoutName
}) => {
  const { user } = useAuth();
  const toast = useToast();
  
  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const headingColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const searchIconColor = useColorModeValue('gray.400', 'gray.500');
  const selectedCardBg = useColorModeValue('blue.50', 'blue.900');
  const selectedCardBorderColor = useColorModeValue('blue.300', 'blue.600');
  const athleteCardBg = useColorModeValue('white', 'gray.600');
  const athleteCardBorderColor = useColorModeValue('gray.200', 'gray.500');
  const athleteCardHoverBg = useColorModeValue('gray.50', 'gray.500');

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAthletes, setFilteredAthletes] = useState<AthleteWithSelection[]>([]);

  // Load athletes
  const { data: coachAthletes, isLoading: athletesLoading, error: athletesError } = useCoachAthletes();

  // Process athletes with selection state
  const athletesWithSelection = useMemo((): AthleteWithSelection[] => {
    if (!coachAthletes?.length) return [];
    
    return coachAthletes.map(athlete => ({
      id: athlete.id,
      first_name: athlete.first_name,
      last_name: athlete.last_name,
      email: athlete.email,
      avatar_url: athlete.avatar_url,
      events: athlete.events,
      completion_rate: athlete.completion_rate,
      isSelected: selectedAthletes.includes(athlete.id)
    }));
  }, [coachAthletes, selectedAthletes]);

  // Filter athletes based on search term
  useEffect(() => {
    if (!athletesWithSelection.length) {
      setFilteredAthletes([]);
      return;
    }

    let filtered = athletesWithSelection;

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = athletesWithSelection.filter(athlete => {
        const fullName = `${athlete.first_name} ${athlete.last_name}`.toLowerCase();
        const email = athlete.email?.toLowerCase() || '';
        const events = athlete.events?.join(' ').toLowerCase() || '';
        
        return fullName.includes(search) || 
               email.includes(search) || 
               events.includes(search);
      });
    }

    setFilteredAthletes(filtered);
  }, [athletesWithSelection, searchTerm]);

  // Handle individual athlete selection
  const handleAthleteToggle = (athleteId: string) => {
    const isCurrentlySelected = selectedAthletes.includes(athleteId);
    let newSelection: string[];
    
    if (isCurrentlySelected) {
      newSelection = selectedAthletes.filter(id => id !== athleteId);
    } else {
      newSelection = [...selectedAthletes, athleteId];
    }
    
    onAthleteSelection(newSelection);
  };

  // Handle select all/none
  const handleSelectAll = () => {
    if (selectedAthletes.length === filteredAthletes.length) {
      // Deselect all
      onAthleteSelection([]);
    } else {
      // Select all visible athletes
      const allIds = filteredAthletes.map(athlete => athlete.id);
      onAthleteSelection(allIds);
    }
  };

  // Handle removing selected athlete
  const handleRemoveAthlete = (athleteId: string) => {
    const newSelection = selectedAthletes.filter(id => id !== athleteId);
    onAthleteSelection(newSelection);
  };

  // Get selected athletes for display
  const getSelectedAthletes = () => {
    return athletesWithSelection.filter(athlete => athlete.isSelected);
  };

  // Get assignment type label
  const getAssignmentTypeLabel = () => {
    switch (templateType) {
      case 'single':
        return 'Single Workout';
      case 'weekly':
        return 'Weekly Plan';
      case 'monthly':
        return 'Monthly Plan';
      default:
        return 'Workout';
    }
  };

  // Loading state
  if (athletesLoading) {
    return (
      <VStack spacing={6} align="center" py={12}>
        <Spinner size="lg" color="blue.500" />
        <Text color={textColor}>Loading athletes...</Text>
      </VStack>
    );
  }

  // Error state
  if (athletesError) {
    return (
      <Alert status="error">
        <AlertIcon />
        <Box>
          <AlertTitle>Unable to load athletes</AlertTitle>
          <AlertDescription>
            There was an error loading your athletes. Please try refreshing the page.
          </AlertDescription>
        </Box>
      </Alert>
    );
  }

  // No athletes state
  if (!coachAthletes?.length) {
    return (
      <VStack spacing={6} align="center" py={12}>
        <Icon as={Users} boxSize={12} color="gray.400" />
        <VStack spacing={2} textAlign="center">
          <Heading size="md" color={headingColor}>No Athletes Found</Heading>
          <Text color={subtitleColor}>
            You don't have any athletes assigned to you yet. Athletes will appear here once they're assigned to your coaching.
          </Text>
        </VStack>
      </VStack>
    );
  }

  const selectedCount = selectedAthletes.length;
  const totalCount = filteredAthletes.length;

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Box>
        <Heading size="xl" color={headingColor} mb={2}>
          Assign {getAssignmentTypeLabel()}
        </Heading>
        <Text fontSize="lg" color={subtitleColor}>
          Select which athletes should receive "{workoutName}". You can search by name, email, or events.
        </Text>
      </Box>



      {/* Search and Controls */}
      <Card bg="transparent" borderColor={borderColor} variant="outline">
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack spacing={4} align="end">
              <Box flex="1">
                <Text fontWeight="medium" color={textColor} mb={2}>
                  Search Athletes
                </Text>
                <InputGroup>
                  <InputLeftElement>
                    <Icon as={Search} color={searchIconColor} />
                  </InputLeftElement>
                  <Input
                    placeholder="Search by name, email, or events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    bg={cardBg}
                  />
                </InputGroup>
              </Box>
              
              <VStack spacing={2}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSelectAll}
                  leftIcon={<UserCheck size={16} />}
                >
                  {selectedCount === totalCount ? 'Deselect All' : 'Select All'}
                </Button>
                <Text fontSize="xs" color={subtitleColor} textAlign="center">
                  {totalCount} athlete{totalCount !== 1 ? 's' : ''} shown
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Athletes Grid */}
      <Box>
        <Text fontWeight="semibold" color={textColor} mb={4}>
          Available Athletes ({totalCount})
        </Text>
        
        {filteredAthletes.length === 0 ? (
          <Card bg="transparent" borderColor={borderColor} variant="outline">
            <CardBody textAlign="center" py={12}>
              <VStack spacing={4}>
                <Icon as={AlertCircle} boxSize={12} color="gray.400" />
                <VStack spacing={2}>
                  <Text fontWeight="medium" color={textColor}>
                    No athletes found
                  </Text>
                  <Text color={subtitleColor}>
                    {searchTerm ? 'Try adjusting your search terms.' : 'No athletes match the current filters.'}
                  </Text>
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {filteredAthletes.map((athlete) => {
              const isSelected = athlete.isSelected;
              
              return (
                <Card
                  key={athlete.id}
                  variant="outline"
                  cursor="pointer"
                  onClick={() => handleAthleteToggle(athlete.id)}
                  bg={isSelected ? selectedCardBg : athleteCardBg}
                  borderColor={isSelected ? selectedCardBorderColor : athleteCardBorderColor}
                  borderWidth="2px"
                  _hover={{ 
                    borderColor: isSelected ? "blue.400" : "blue.300",
                    bg: isSelected ? selectedCardBg : athleteCardHoverBg
                  }}
                  transition="all 0.2s"
                  position="relative"
                >
                  <CardBody p={4}>
                    <HStack spacing={3} align="start">
                      <Checkbox 
                        isChecked={isSelected}
                        onChange={() => handleAthleteToggle(athlete.id)}
                        colorScheme="blue"
                        size="lg"
                        mt={1}
                      />
                      
                      <Avatar 
                        src={athlete.avatar_url} 
                        name={`${athlete.first_name} ${athlete.last_name}`} 
                        size="md"
                        flexShrink={0}
                      />
                      
                      <VStack spacing={1} align="start" flex="1" minW="0">
                        <Text 
                          fontWeight="bold" 
                          fontSize="md" 
                          color={isSelected ? "blue.700" : textColor}
                          noOfLines={1}
                        >
                          {athlete.first_name} {athlete.last_name}
                        </Text>
                        
                        {athlete.email && (
                          <Text 
                            fontSize="sm" 
                            color={isSelected ? "blue.600" : subtitleColor}
                            noOfLines={1}
                          >
                            {athlete.email}
                          </Text>
                        )}
                        
                        {athlete.events && athlete.events.length > 0 && (
                          <Wrap spacing={1} mt={1}>
                            {athlete.events.slice(0, 2).map((event, index) => (
                              <WrapItem key={index}>
                                <Badge 
                                  size="sm" 
                                  colorScheme={isSelected ? "blue" : "gray"}
                                  variant="subtle"
                                >
                                  {event}
                                </Badge>
                              </WrapItem>
                            ))}
                            {athlete.events.length > 2 && (
                              <WrapItem>
                                <Badge size="sm" colorScheme="gray" variant="outline">
                                  +{athlete.events.length - 2}
                                </Badge>
                              </WrapItem>
                            )}
                          </Wrap>
                        )}
                        
                        {athlete.completion_rate !== undefined && (
                          <HStack spacing={1} mt={2}>
                            <Text fontSize="xs" color={subtitleColor}>
                              Completion:
                            </Text>
                            <Badge 
                              colorScheme={athlete.completion_rate >= 80 ? "green" : athlete.completion_rate >= 60 ? "yellow" : "red"}
                              size="sm"
                            >
                              {athlete.completion_rate}%
                            </Badge>
                          </HStack>
                        )}
                      </VStack>
                    </HStack>
                  </CardBody>
                </Card>
              );
            })}
          </SimpleGrid>
        )}
      </Box>

      {/* Assignment Summary */}
      {selectedCount > 0 && (
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <HStack justify="space-between" align="center">
              <HStack spacing={3}>
                <Icon as={CheckCircle} color="green.500" />
                <VStack spacing={0} align="start">
                  <Text fontWeight="semibold" color={textColor}>
                    Ready to Assign
                  </Text>
                  <Text fontSize="sm" color={subtitleColor}>
                    {selectedCount} athlete{selectedCount !== 1 ? 's' : ''} will receive this {getAssignmentTypeLabel().toLowerCase()}
                  </Text>
                </VStack>
              </HStack>
              
              <Badge colorScheme="green" fontSize="md" px={3} py={1}>
                {selectedCount} Selected
              </Badge>
            </HStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
};

export default Step5AthleteAssignment; 