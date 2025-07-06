import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useToast,
  useColorModeValue,
  Heading,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Icon,
} from '@chakra-ui/react';
import { FaTrash, FaBed, FaPlus, FaEdit } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { handleSleepLog } from '../../services/gamificationIntegration';
import { 
  calculateSleepDuration, 
  formatSleepDuration,
  getSleepQualityText,
  SLEEP_QUALITY_MAPPING
} from '../../utils/analytics/performance';
import { useSleepRecords, SleepRecord } from '../../hooks/useSleepRecords';
import { MobileHeader } from '../../components';
import PageHeader from '../../components/PageHeader';
import { usePageHeader } from '../../hooks/usePageHeader';

export function Sleep() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  
  // Use page header hook
  usePageHeader({
    title: 'Sleep',
    subtitle: 'Track your sleep patterns and quality',
    icon: FaBed
  });
  
  // Use React Query hook instead of local state
  const { data: records = [], isLoading: recordsLoading, error: recordsError, refetch: refetchRecords } = useSleepRecords();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    sleep_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    quality: 3, // Default to 3 (good)
    notes: '',
  });

  const bgColor = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardShadow = useColorModeValue('none', 'sm');

  // Show error toast if there's an error fetching records
  useEffect(() => {
    if (recordsError) {
      toast({
        title: 'Error fetching records',
        description: 'Please refresh the page to try again',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [recordsError, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the record
    const errors: string[] = [];
    if (!formData.start_time) errors.push('Start time is required');
    if (!formData.end_time) errors.push('End time is required');
    if (!formData.sleep_date) errors.push('Date is required');
    
    if (formData.start_time && formData.end_time) {
      const duration = calculateSleepDuration(formData.start_time, formData.end_time);
      if (duration.total > 16) {
        errors.push('Sleep duration cannot exceed 16 hours');
      }
      if (duration.total < 0.5) {
        errors.push('Sleep duration must be at least 30 minutes');
      }
    }

    if (errors.length > 0) {
      toast({
        title: 'Validation Error',
        description: errors.join(', '),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Submitting sleep record with user ID:', user?.id);
      console.log('Form data:', formData);
      
      const { error } = await supabase
        .from('sleep_records')
        .insert([{ ...formData, athlete_id: user?.id }]);

      if (error) {
        console.error('Error saving sleep record:', error);
        throw error;
      }

      // Force refetch of all sleep-related queries
      queryClient.removeQueries({
        predicate: (query) => {
          return query.queryKey[0] === 'sleepRecords';
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      await refetchRecords();

      // Integrate with gamification system
      if (user?.id) {
        try {
          await handleSleepLog(user.id);
          console.log('[Gamification] Sleep log recorded for points and badges');
        } catch (gamificationError) {
          console.error('[Gamification] Error processing sleep log:', gamificationError);
          // Don't show error to user, just log it - the sleep record was still saved
        }
      }

      toast({
        title: 'Record added',
        description: 'Your sleep record has been saved',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      setFormData({
        sleep_date: new Date().toISOString().split('T')[0],
        start_time: '',
        end_time: '',
        quality: 3,
        notes: '',
      });
    } catch (error) {
      toast({
        title: 'Error saving record',
        description: 'Please try again later',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sleep_records')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Record deleted',
        description: 'Your sleep record has been removed',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Force refetch of all sleep-related queries
      queryClient.removeQueries({
        predicate: (query) => {
          return query.queryKey[0] === 'sleepRecords';
        }
      });
      await refetchRecords();
    } catch (error) {
      toast({
        title: 'Error deleting record',
        description: 'Please try again later',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Calculate sleep duration using centralized function
  const calculateDuration = (start: string, end: string): string => {
    if (!start || !end) return 'N/A';
    
    const duration = calculateSleepDuration(start, end);
    return formatSleepDuration(duration.total);
  };

  return (
    <Box minH="100vh" bg={bgColor}>
      {/* Desktop Header */}
      <PageHeader
        title="Sleep"
        subtitle="Track your sleep patterns and quality"
        icon={FaBed}
      />
      
      <Container maxW="6xl" py={8}>
        <VStack spacing={8} align="stretch" mt={{ base: "20px", lg: 0 }}>

          {/* Add Record Form */}
          <Box
            p={6}
            borderWidth={1}
            borderRadius="lg"
            borderColor={borderColor}
            bg={cardBg}
            shadow={cardShadow}
          >
            <Text fontSize="lg" fontWeight="semibold" mb={4}>
              Add Sleep Record
            </Text>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Sleep Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.sleep_date}
                    onChange={(e) => setFormData({ ...formData, sleep_date: e.target.value })}
                  />
                </FormControl>

                <HStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Bedtime</FormLabel>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Wake Time</FormLabel>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </FormControl>
                </HStack>

                <FormControl isRequired>
                  <FormLabel>Sleep Quality (1-4)</FormLabel>
                  <Select
                    value={formData.quality}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      quality: parseInt(e.target.value)
                    })}
                  >
                    <option value={1}>Poor (1)</option>
                    <option value={2}>Fair (2)</option>
                    <option value={3}>Good (3)</option>
                    <option value={4}>Excellent (4)</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any notes about your sleep (interruptions, dreams, etc.)..."
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  width="full"
                  isLoading={isLoading}
                  mt={4}
                >
                  Add Record
                </Button>
              </VStack>
            </form>
          </Box>

          {/* Records Table */}
          <Box
            p={6}
            borderWidth={1}
            borderRadius="lg"
            borderColor={borderColor}
            bg={cardBg}
            shadow={cardShadow}
            overflowX="auto"
          >
            <HStack justify="space-between" align="center" mb={4}>
              <Text fontSize="lg" fontWeight="semibold">
                Sleep Records ({records.length})
              </Text>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetchRecords()}
                isLoading={recordsLoading}
                leftIcon={<Icon as={FaBed} />}
              >
                Refresh
              </Button>
            </HStack>
            
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Bedtime</Th>
                  <Th>Wake Time</Th>
                  <Th>Duration</Th>
                  <Th>Quality</Th>
                  <Th>Notes</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {records.map((record) => (
                  <Tr key={record.id}>
                    <Td>{new Date(record.sleep_date).toLocaleDateString()}</Td>
                    <Td>{record.start_time}</Td>
                    <Td>{record.end_time}</Td>
                    <Td>{calculateDuration(record.start_time, record.end_time)}</Td>
                    <Td>{getSleepQualityText(record.quality)} ({record.quality})</Td>
                    <Td>{record.notes}</Td>
                    <Td>
                      <IconButton
                        aria-label="Delete record"
                        icon={<FaTrash />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleDelete(record.id)}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
} 