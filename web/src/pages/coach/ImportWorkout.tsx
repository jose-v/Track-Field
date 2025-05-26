import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  useToast,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Card,
  CardBody,
  Divider,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Icon,
  Badge,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps,
  List,
  ListItem,
  ListIcon
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { FaFile, FaRobot, FaEdit, FaSave, FaCheck, FaDumbbell, FaRunning, FaCalendarAlt, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { WorkoutFileUploader } from '../../components/WorkoutFileUploader';
import { fileProcessingService } from '../../services/fileProcessingService';
import type { WorkoutExtraction, ExtractedExercise } from '../../services/fileProcessingService';
import { parseStorageUrl } from '../../utils/storageHelper';

// Steps for import process
const steps = [
  { title: 'Upload', description: 'Upload workout file' },
  { title: 'Process', description: 'AI file processing' },
  { title: 'Review', description: 'Review and edit' },
  { title: 'Save', description: 'Create workout' }
];

export function ImportWorkout() {
  // All hooks at the top level, called unconditionally
  const toast = useToast();
  const navigate = useNavigate();
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const cardBgColor = useColorModeValue('white', 'gray.700');
  
  // State hooks
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [workoutData, setWorkoutData] = useState<WorkoutExtraction | null>(null);
  
  // Get the icon for workout type - defined outside useCallback to avoid dependency issues
  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'strength':
        return FaDumbbell;
      case 'running':
        return FaRunning;
      default:
        return FaDumbbell;
    }
  };
  
  // Process file function with useCallback
  const processFile = useCallback(async (url: string, type: string, name: string) => {
    if (!url) {
      setError('No file URL provided');
      toast({
        title: 'Processing failed',
        description: 'No file URL provided',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Process the file using our service
      console.log('Starting file processing with:', { url, type, name });
      const extractedWorkout = await fileProcessingService.processWorkoutFile(url, type, name);
      
      // Set state with the processed data
      setWorkoutData(extractedWorkout);
      setActiveStep(2); // Move to review step
      
      toast({
        title: 'File processed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      console.error('Error processing file:', err);
      setError(err.message || 'Failed to process file');
      
      toast({
        title: 'Processing failed',
        description: err.message || 'Failed to process file',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast, setActiveStep]);
  
  // File uploaded handler with useCallback
  const handleFileProcessed = useCallback((url: string, type: string, name: string) => {
    console.log('File processed callback received:', { url, type, name });
    setFileUrl(url);
    setFileType(type);
    setFileName(name);
    setActiveStep(1); // Move to process step
    
    // Auto-start processing
    processFile(url, type, name);
  }, [setActiveStep, processFile]);
  
  // Continue to workout form with extracted data
  const handleContinue = useCallback(() => {
    if (!workoutData) {
      toast({
        title: 'No workout data',
        description: 'Unable to continue without processed workout data',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    
    // Navigate to the create workout page with the extracted data
    navigate('/coach/workouts/new', { 
      state: { 
        workoutData: workoutData 
      } 
    });
  }, [workoutData, navigate, toast]);
  
  // Debug: Log file URL changes
  useEffect(() => {
    if (fileUrl) {
      console.log('File URL updated:', fileUrl);
      // Parse the URL to make sure it's valid
      const parsedUrl = parseStorageUrl(fileUrl);
      if (parsedUrl) {
        console.log('Parsed URL:', parsedUrl);
      } else {
        console.warn('Could not parse storage URL');
      }
    }
  }, [fileUrl]);
  
  return (
    <Box py={8}>
      <Container maxW="container.md">
        {/* Breadcrumb navigation */}
        <Breadcrumb 
          spacing="8px" 
          separator={<ChevronRightIcon color="gray.500" />}
          mb={6}
        >
          <BreadcrumbItem>
            <BreadcrumbLink as={RouterLink} to="/coach/workouts">
              Workouts
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Import Workout</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        
        <Heading size="lg" mb={6}>Import Workout from File</Heading>
        
        {/* Stepper */}
        <Stepper index={activeStep} mb={8} size="sm">
          {steps.map((step, index) => (
            <Step key={index}>
              <StepIndicator>
                <StepStatus
                  complete={<StepIcon />}
                  incomplete={<StepNumber />}
                  active={<StepNumber />}
                />
              </StepIndicator>
              
              <Box flexShrink='0'>
                <StepTitle>{step.title}</StepTitle>
                <StepDescription>{step.description}</StepDescription>
              </Box>
              
              <StepSeparator />
            </Step>
          ))}
        </Stepper>
        
        <Card variant="outline" mb={6}>
          <CardBody>
            {/* Step 1: File Upload */}
            {activeStep === 0 && (
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading size="md" mb={2}>
                    <Icon as={FaFile} mr={2} />
                    Upload Workout File
                  </Heading>
                  <Text color="gray.600" mb={4}>
                    Upload a workout file to import. The system will attempt to extract workout details automatically.
                  </Text>
                </Box>
                
                <WorkoutFileUploader onFileProcessed={handleFileProcessed} />
              </VStack>
            )}
            
            {/* Step 2: Processing */}
            {activeStep === 1 && (
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading size="md" mb={2}>
                    <Icon as={FaRobot} mr={2} />
                    Processing File
                  </Heading>
                  <Text color="gray.600" mb={4}>
                    Our AI is analyzing your workout file and extracting key information.
                  </Text>
                </Box>
                
                {isProcessing ? (
                  <VStack spacing={4} py={8}>
                    <Spinner size="xl" color="blue.500" thickness="4px" />
                    <Text fontWeight="medium">Processing your file...</Text>
                    <Text fontSize="sm" color="gray.500">This may take a few moments</Text>
                  </VStack>
                ) : error ? (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Processing Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Box>
                  </Alert>
                ) : null}
                
                {/* File info */}
                {fileUrl && (
                  <Box
                    p={3}
                    borderWidth="1px"
                    borderRadius="md"
                    bg={bgColor}
                  >
                    <HStack>
                      <Icon as={FaFile} color="blue.500" />
                      <Text fontWeight="medium">{fileName}</Text>
                    </HStack>
                  </Box>
                )}
              </VStack>
            )}
            
            {/* Step 3: Review */}
            {activeStep === 2 && workoutData && (
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading size="md" mb={2}>
                    <Icon as={FaEdit} mr={2} />
                    Review Extracted Workout
                  </Heading>
                  <Text color="gray.600" mb={4}>
                    Review the information extracted from your file. You'll be able to edit the details in the next step.
                  </Text>
                </Box>
                
                {/* Workout Summary Card */}
                <Box
                  p={5}
                  borderWidth="1px"
                  borderRadius="md"
                  bg={cardBgColor}
                  boxShadow="sm"
                >
                  <VStack align="stretch" spacing={4}>
                    {/* Workout Name & Type */}
                    <HStack justify="space-between">
                      <Heading size="md">{workoutData.name}</Heading>
                      <Badge colorScheme={workoutData.type === 'Strength' ? 'purple' : workoutData.type === 'Running' ? 'blue' : 'green'} px={2} py={1} borderRadius="md">
                        <HStack spacing={1}>
                          <Icon as={getTypeIcon(workoutData.type)} />
                          <Text>{workoutData.type}</Text>
                        </HStack>
                      </Badge>
                    </HStack>
                    
                    <Divider />
                    
                    {/* Date, Time, Duration, Location */}
                    <HStack wrap="wrap" spacing={4}>
                      <HStack>
                        <Icon as={FaCalendarAlt} color="gray.500" />
                        <Text>{workoutData.date}</Text>
                      </HStack>
                      
                      {workoutData.time && (
                        <HStack>
                          <Icon as={FaClock} color="gray.500" />
                          <Text>{workoutData.time}</Text>
                        </HStack>
                      )}
                      
                      <HStack>
                        <Icon as={FaClock} color="gray.500" />
                        <Text>{workoutData.duration}</Text>
                      </HStack>
                      
                      {workoutData.location && (
                        <HStack>
                          <Icon as={FaMapMarkerAlt} color="gray.500" />
                          <Text>{workoutData.location}</Text>
                        </HStack>
                      )}
                    </HStack>
                    
                    <Divider />
                    
                    {/* Exercises */}
                    <Box>
                      <Heading size="sm" mb={2}>Exercises</Heading>
                      <List spacing={2}>
                        {workoutData.exercises.map((exercise, index) => (
                          <ListItem key={index} p={2} borderWidth="1px" borderRadius="md">
                            <HStack justify="space-between">
                              <HStack>
                                <ListIcon as={FaCheck} color="green.500" />
                                <Text fontWeight="medium">{exercise.name}</Text>
                              </HStack>
                              <HStack spacing={3}>
                                {exercise.sets && exercise.reps && (
                                  <Text fontSize="sm">{exercise.sets} sets × {exercise.reps} reps</Text>
                                )}
                                {exercise.weight && (
                                  <Text fontSize="sm">{exercise.weight} kg</Text>
                                )}
                                {exercise.distance && (
                                  <Text fontSize="sm">{exercise.distance} m</Text>
                                )}
                              </HStack>
                            </HStack>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                    
                    {/* Notes */}
                    {workoutData.notes && (
                      <>
                        <Divider />
                        <Box>
                          <Heading size="sm" mb={2}>Notes</Heading>
                          <Text>{workoutData.notes}</Text>
                        </Box>
                      </>
                    )}
                  </VStack>
                </Box>
                
                <HStack justify="flex-end" pt={4}>
                  <Button 
                    colorScheme="blue" 
                    onClick={handleContinue}
                    leftIcon={<FaSave />}
                  >
                    Continue to Workout Form
                  </Button>
                </HStack>
              </VStack>
            )}
          </CardBody>
        </Card>
        
        <HStack justify="space-between">
          <Button
            variant="outline"
            onClick={() => navigate('/coach/workouts')}
          >
            Cancel
          </Button>
          
          {activeStep > 0 && activeStep < 2 && (
            <Button
              onClick={() => setActiveStep(activeStep - 1)}
              isDisabled={isProcessing}
            >
              Back
            </Button>
          )}
        </HStack>
      </Container>
    </Box>
  );
}

export default ImportWorkout; 