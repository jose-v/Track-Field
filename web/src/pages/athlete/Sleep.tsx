import {
  Box,
  Container,
  Heading,
  Text,
  useColorModeValue,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  HStack,
  useToast,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FaTrash } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { handleSleepLog } from '../../services/integrationService';

interface SleepRecord {
  id: string;
  sleep_date: string;
  start_time: string;
  end_time: string;
  quality: number;
  notes: string;
  created_at: string;
}

// Quality mapping between display values and stored integer values
const qualityMapping = {
  1: 'poor',
  2: 'fair',
  3: 'good',
  4: 'excellent'
};

export function Sleep() {
  const { user } = useAuth();
  const toast = useToast();
  const [records, setRecords] = useState<SleepRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    sleep_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    quality: 3, // Default to 'good' which is value 3
    notes: '',
  });

  const bgColor = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('sleep_records')
        .select('*')
        .order('sleep_date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      toast({
        title: 'Error fetching records',
        description: 'Please try again later',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      fetchRecords();
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

      fetchRecords();
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

  // Calculate sleep duration
  const calculateDuration = (start: string, end: string): string => {
    if (!start || !end) return 'N/A';

    try {
      const startTime = new Date(`1970-01-01T${start}`);
      let endTime = new Date(`1970-01-01T${end}`);
      
      // If end time is earlier than start time, assume it's the next day
      if (endTime < startTime) {
        endTime = new Date(`1970-01-02T${end}`);
      }
      
      const diffMs = endTime.getTime() - startTime.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${diffHrs}h ${diffMins}m`;
    } catch (error) {
      return 'Invalid';
    }
  };

  // Get quality text from quality number
  const getQualityText = (qualityValue: number): string => {
    return qualityMapping[qualityValue as keyof typeof qualityMapping] || 'Unknown';
  };

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.lg">
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Sleep Tracking</Heading>
            <Text color="gray.600">Track your sleep patterns and quality</Text>
          </Box>

          {/* Add Record Form */}
          <Box
            p={6}
            borderWidth={1}
            borderRadius="lg"
            borderColor={borderColor}
            bg={cardBg}
            shadow="sm"
          >
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.sleep_date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, sleep_date: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Bedtime</FormLabel>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Wake Time</FormLabel>
                  <Input
                    type="time"
                    value={formData.end_time}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Sleep Quality</FormLabel>
                  <Select
                    value={formData.quality}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                      setFormData({ ...formData, quality: parseInt(e.target.value) })}
                  >
                    <option value={1}>Poor</option>
                    <option value={2}>Fair</option>
                    <option value={3}>Good</option>
                    <option value={4}>Excellent</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Textarea
                    value={formData.notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
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
            shadow="sm"
            overflowX="auto"
          >
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
                    <Td>{getQualityText(record.quality).charAt(0).toUpperCase() + getQualityText(record.quality).slice(1)}</Td>
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