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
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
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
import { FaEdit, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import EnhancedNutritionAnalysis from '../../components/EnhancedNutritionAnalysis';
import { handleNutritionLog } from '../../services/integrationService';

interface EatingRecord {
  id: string;
  record_date: string;
  meal_type: string;
  calories: number;
  notes: string;
  created_at: string;
}

export function Nutrition() {
  const { user } = useAuth();
  const toast = useToast();
  const [records, setRecords] = useState<EatingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    record_date: new Date().toISOString().split('T')[0],
    meal_type: 'breakfast',
    calories: 0,
    notes: '',
  });

  const bgColor = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardShadow = useColorModeValue('none', 'sm');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('eating_records')
        .select('*')
        .order('record_date', { ascending: false });

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
      const { error } = await supabase
        .from('eating_records')
        .insert([{ ...formData, athlete_id: user?.id }]);

      if (error) throw error;

      // Integrate with gamification system
      if (user?.id) {
        try {
          await handleNutritionLog(user.id);
          console.log('[Gamification] Nutrition log recorded for points and badges');
        } catch (gamificationError) {
          console.error('[Gamification] Error processing nutrition log:', gamificationError);
          // Don't show error to user, just log it - the nutrition record was still saved
        }
      }

      toast({
        title: 'Record added',
        description: 'Your eating record has been saved',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      setFormData({
        record_date: new Date().toISOString().split('T')[0],
        meal_type: 'breakfast',
        calories: 0,
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
        .from('eating_records')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Record deleted',
        description: 'Your eating record has been removed',
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

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.lg">
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Nutrition Tracking</Heading>
            <Text color="gray.600">Track your daily meals and nutrition intake</Text>
          </Box>

          {/* Enhanced Nutrition Analysis */}
          {user?.id && <EnhancedNutritionAnalysis athleteId={user.id} />}

          {/* Add Record Form */}
          <Box
            p={6}
            borderWidth={1}
            borderRadius="lg"
            borderColor={borderColor}
            bg={cardBg}
            shadow={cardShadow}
          >
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.record_date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, record_date: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Meal Type</FormLabel>
                  <Select
                    value={formData.meal_type}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, meal_type: e.target.value })}
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Calories</FormLabel>
                  <NumberInput
                    min={0}
                    value={formData.calories}
                    onChange={(_, value: number) => setFormData({ ...formData, calories: value })}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Textarea
                    value={formData.notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add any additional notes about your meal..."
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
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Meal Type</Th>
                  <Th>Calories</Th>
                  <Th>Notes</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {records.map((record) => (
                  <Tr key={record.id}>
                    <Td>{new Date(record.record_date).toLocaleDateString()}</Td>
                    <Td>{record.meal_type.charAt(0).toUpperCase() + record.meal_type.slice(1)}</Td>
                    <Td>{record.calories}</Td>
                    <Td>{record.notes}</Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Delete record"
                          icon={<FaTrash />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleDelete(record.id)}
                        />
                      </HStack>
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