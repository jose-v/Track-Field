import React from 'react';
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
  TagCloseButton,
  Avatar,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Badge,
  IconButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { Search, Users, UserCheck, Trash2 } from 'lucide-react';

interface Athlete {
  id: string;
  name: string;
  event: string;
  avatar: string;
}

interface Step3AthleteAssignmentProps {
  athletes: Athlete[];
  selectedAthletes: Record<string, Athlete>;
  onAthleteSelection: (athlete: Athlete) => void;
  onClearAllAthletes: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const Step3AthleteAssignment: React.FC<Step3AthleteAssignmentProps> = ({
  athletes,
  selectedAthletes,
  onAthleteSelection,
  onClearAllAthletes,
  searchTerm,
  setSearchTerm,
}) => {
  // Theme-aware colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const headingColor = useColorModeValue('gray.700', 'gray.100');
  const searchIconColor = useColorModeValue('gray.400', 'gray.500');
  const noAthletesIconColor = useColorModeValue('gray.400', 'gray.500');
  const noAthletesTextColor = useColorModeValue('gray.500', 'gray.300');
  const noAthletesSubtextColor = useColorModeValue('gray.400', 'gray.400');
  const athleteCardBg = useColorModeValue('white', 'gray.600');
  const athleteCardBorderColor = useColorModeValue('gray.200', 'gray.500');
  const athleteCardHoverBg = useColorModeValue('gray.50', 'gray.500');
  const selectedAthleteCardBg = useColorModeValue('green.50', 'green.900');
  const selectedAthleteCardBorderColor = useColorModeValue('green.300', 'green.600');
  const selectedAthleteCardHoverBg = useColorModeValue('green.100', 'green.800');
  const selectedAthleteNameColor = useColorModeValue('green.700', 'green.300');
  const selectedAthleteEventColor = useColorModeValue('green.600', 'green.400');
  const athleteNameColor = useColorModeValue('gray.800', 'gray.100');
  const athleteEventColor = useColorModeValue('gray.600', 'gray.300');
  const emptyStateBg = useColorModeValue('green.25', 'green.900');
  const emptyStateBorderColor = useColorModeValue('green.200', 'green.600');
  const removeButtonHoverBg = useColorModeValue('red.100', 'red.800');

  const selectedCount = Object.keys(selectedAthletes).length;
  
  const filteredAthletes = athletes.filter(athlete =>
    athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.event.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box w="100%" h="calc(100vh - 400px)" mb="20px" bg={cardBg}>
      <HStack spacing={4} align="start" w="100%" h="100%">
        {/* Left Panel: Available Athletes */}
        <Card flex="1" h="100%" variant="outline" shadow="none" maxW="50%" bg={cardBg} borderColor={borderColor}>
          <CardHeader pb={0} pt={1} minH="40px" display="flex" alignItems="center">
            <HStack spacing={2} align="center" w="100%">
              <Box display="flex" alignItems="center">
                <Users size={20} color="var(--chakra-colors-blue-500)" />
              </Box>
              <Heading size="lg" color={headingColor}>Available Athletes</Heading>
              
              {/* Search moved to same line */}
              <InputGroup size="sm" maxW="280px" ml="auto">
                <InputLeftElement pointerEvents="none">
                  <Search size={14} color={searchIconColor} />
                </InputLeftElement>
                <Input
                  placeholder="Search athletes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  borderWidth="1px"
                  _focus={{ borderColor: "blue.400" }}
                  bg={cardBg}
                  borderColor={borderColor}
                  color={textColor}
                  size="sm"
                />
              </InputGroup>
            </HStack>
          </CardHeader>
          
          <CardBody pt={0} flex="1" overflow="hidden" display="flex" flexDirection="column">
            <Box flex="1" overflow="auto" pr={2}>
              {filteredAthletes.length === 0 ? (
                <VStack spacing={4} py={8} textAlign="center">
                  <Box color={noAthletesIconColor}>
                    <Users size={48} />
                  </Box>
                  <Text color={noAthletesTextColor} fontSize="md" fontWeight="medium">
                    No athletes found
                  </Text>
                  <Text color={noAthletesSubtextColor} fontSize="sm">
                    Try adjusting your search term
                  </Text>
                </VStack>
              ) : (
                <SimpleGrid columns={2} spacing={3} w="100%">
                  {filteredAthletes.map((athlete) => {
                    const isSelected = !!selectedAthletes[athlete.id];
                    
                    return (
                      <Card
                        key={athlete.id}
                        variant="outline"
                        shadow="none"
                        cursor="pointer"
                        onClick={() => onAthleteSelection(athlete)}
                        bg={isSelected ? selectedAthleteCardBg : athleteCardBg}
                        borderColor={isSelected ? selectedAthleteCardBorderColor : athleteCardBorderColor}
                        borderWidth="2px"
                        _hover={{ 
                          borderColor: isSelected ? "green.400" : "green.300",
                          bg: isSelected ? selectedAthleteCardHoverBg : athleteCardHoverBg
                        }}
                        transition="all 0.2s"
                        h="100px"
                        position="relative"
                      >
                        <CardBody p={3} display="flex" alignItems="center">
                          <HStack spacing={3} w="100%">
                            <Avatar 
                              src={athlete.avatar} 
                              name={athlete.name} 
                              size="sm"
                              flexShrink={0}
                            />
                            <VStack spacing={0} align="start" flex="1" minW="0">
                              <Text 
                                fontWeight="bold" 
                                fontSize="sm" 
                                color={isSelected ? selectedAthleteNameColor : athleteNameColor}
                                noOfLines={1}
                                wordBreak="break-word"
                              >
                                {athlete.name}
                              </Text>
                              <Text 
                                fontSize="xs" 
                                color={isSelected ? selectedAthleteEventColor : athleteEventColor}
                                noOfLines={1}
                                wordBreak="break-word"
                              >
                                {athlete.event}
                              </Text>
                            </VStack>
                          </HStack>
                          {isSelected && (
                            <Box
                              position="absolute"
                              top={2}
                              right={2}
                              bg="green.500"
                              color="white"
                              borderRadius="full"
                              w={5}
                              h={5}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Text fontSize="xs" fontWeight="bold">✓</Text>
                            </Box>
                          )}
                        </CardBody>
                      </Card>
                    );
                  })}
                </SimpleGrid>
              )}
            </Box>
          </CardBody>
        </Card>

        {/* Right Panel: Selected Athletes */}
        <Card flex="1" h="100%" variant="outline" shadow="none" maxW="50%" bg={cardBg} borderColor={borderColor}>
          <CardHeader pb={0} pt={1} minH="40px" display="flex" alignItems="center">
            <HStack justify="space-between" align="center" w="100%">
              <HStack spacing={2} align="center">
                <Box display="flex" alignItems="center">
                  <UserCheck size={20} color="var(--chakra-colors-green-500)" />
                </Box>
                <Heading size="lg" color={headingColor}>Selected Athletes</Heading>
                <Badge colorScheme="green" variant="solid" fontSize="xs" px={2} py={1}>
                  {selectedCount} SELECTED
                </Badge>
              </HStack>
              {selectedCount > 0 && (
                <Button size="xs" variant="outline" colorScheme="red" onClick={onClearAllAthletes}>
                  Clear All
                </Button>
              )}
            </HStack>
          </CardHeader>
          
          <CardBody pt={0} flex="1" overflow="hidden" display="flex" flexDirection="column">
            <Box flex="1" overflow="auto" pr={2}>
              {selectedCount === 0 ? (
                <VStack 
                  flex="1"
                  justify="center"
                  spacing={4}
                  p={8}
                  textAlign="center"
                  borderWidth="2px" 
                  borderStyle="dashed" 
                  borderColor={emptyStateBorderColor}
                  borderRadius="lg"
                  bg={emptyStateBg}
                  height="100%"
                >
                  <Box color="green.400">
                    <UserCheck size={64} />
                  </Box>
                  <VStack spacing={2}>
                    <Text color="green.600" fontSize="lg" fontWeight="bold">
                      No athletes selected
                    </Text>
                    <Text color="green.500" fontSize="md">
                      Select athletes from the list to assign them to this workout
                    </Text>
                  </VStack>
                </VStack>
              ) : (
                <VStack spacing={3} align="stretch">
                  {Object.values(selectedAthletes).map((athlete) => (
                    <Card 
                      key={athlete.id} 
                      variant="outline"
                      shadow="none"
                      bg={selectedAthleteCardBg}
                      borderWidth="2px"
                      borderColor={selectedAthleteCardBorderColor}
                      _hover={{ borderColor: "green.400", bg: selectedAthleteCardHoverBg }}
                      transition="all 0.2s"
                      minH="80px"
                      w="100%"
                    >
                      <CardBody p={4}>
                        <HStack spacing={4} w="100%" justify="space-between" align="center" minH="48px">
                          <HStack spacing={3} align="center" flex="1" minW="0">
                            <Avatar 
                              src={athlete.avatar} 
                              name={athlete.name} 
                              size="md"
                              flexShrink={0}
                            />
                            <Box flex="1" minW="0">
                              <Text 
                                fontWeight="bold" 
                                fontSize="md" 
                                color={selectedAthleteNameColor}
                                lineHeight="1.2"
                                noOfLines={1}
                                wordBreak="break-word"
                              >
                                {athlete.name}
                              </Text>
                              <Text 
                                fontSize="sm" 
                                color={selectedAthleteEventColor}
                                lineHeight="1.2"
                                noOfLines={1}
                                wordBreak="break-word"
                              >
                                {athlete.event}
                              </Text>
                            </Box>
                          </HStack>
                          <IconButton
                            icon={<Trash2 size={16} />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            aria-label="Remove athlete"
                            onClick={() => onAthleteSelection(athlete)}
                            _hover={{ bg: removeButtonHoverBg }}
                            flexShrink={0}
                            ml={2}
                          />
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              )}
            </Box>
          </CardBody>
        </Card>
      </HStack>
    </Box>
  );
};

export default Step3AthleteAssignment; 