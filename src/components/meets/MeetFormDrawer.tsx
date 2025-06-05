import React, { useState } from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  DrawerFooter,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Text,
  useColorModeValue,
  FormErrorMessage,
  Box,
  Collapse,
  Divider,
  Switch,
  Badge
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { FaHotel, FaChevronDown, FaChevronUp, FaUserTie } from 'react-icons/fa';

export interface TrackMeetFormData {
  name: string;
  meet_date: string;
  end_date?: string;
  venue_type?: 'Indoor' | 'Outdoor';
  venue_name?: string;
  join_link?: string;
  city?: string;
  state?: string;
  status?: string;
  description?: string;
  coach_id?: string;
  // Lodging fields
  lodging_type?: string;
  lodging_place_name?: string;
  lodging_address?: string;
  lodging_city?: string;
  lodging_state?: string;
  lodging_zip?: string;
  lodging_phone?: string;
  lodging_website?: string;
  lodging_checkin_date?: string;
  lodging_checkout_date?: string;
  lodging_checkin_time?: string;
  lodging_checkout_time?: string;
  // Assistant coaches
  assistant_coach_1_name?: string;
  assistant_coach_1_phone?: string;
  assistant_coach_1_email?: string;
  assistant_coach_2_name?: string;
  assistant_coach_2_phone?: string;
  assistant_coach_2_email?: string;
  assistant_coach_3_name?: string;
  assistant_coach_3_phone?: string;
  assistant_coach_3_email?: string;
  // Assistant coach IDs for existing coaches
  assistant_coach_1_id?: string;
  assistant_coach_2_id?: string;
  assistant_coach_3_id?: string;
}

export interface TrackMeetData {
  id: string;
  name: string;
  meet_date: string;
  end_date?: string;
  venue_type?: string;
  venue_name?: string;
  join_link?: string;
  city?: string;
  state?: string;
  status?: string;
  description?: string;
  coach_id?: string;
  athlete_id?: string;
  // Lodging fields
  lodging_type?: string;
  lodging_place_name?: string;
  lodging_address?: string;
  lodging_city?: string;
  lodging_state?: string;
  lodging_zip?: string;
  lodging_phone?: string;
  lodging_website?: string;
  lodging_checkin_date?: string;
  lodging_checkout_date?: string;
  lodging_checkin_time?: string;
  lodging_checkout_time?: string;
  // Assistant coaches
  assistant_coach_1_name?: string;
  assistant_coach_1_phone?: string;
  assistant_coach_1_email?: string;
  assistant_coach_2_name?: string;
  assistant_coach_2_phone?: string;
  assistant_coach_2_email?: string;
  assistant_coach_3_name?: string;
  assistant_coach_3_phone?: string;
  assistant_coach_3_email?: string;
  // Assistant coach IDs for existing coaches
  assistant_coach_1_id?: string;
  assistant_coach_2_id?: string;
  assistant_coach_3_id?: string;
}

interface Coach {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface MeetFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TrackMeetFormData) => Promise<void>;
  currentMeet?: TrackMeetData | null;
  isEditing: boolean;
  isSubmitting?: boolean;
  showCoachSelection?: boolean; // Only show for athletes
  coaches?: Coach[];
  title?: string;
}

export function MeetFormDrawer({
  isOpen,
  onClose,
  onSubmit,
  currentMeet,
  isEditing,
  isSubmitting = false,
  showCoachSelection = false,
  coaches = [],
  title
}: MeetFormDrawerProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const subtextColor = useColorModeValue('gray.700', 'gray.300');
  const hoverBorderColor = useColorModeValue('blue.300', 'blue.500');
  const whiteGrayBg = useColorModeValue('white', 'gray.700');
  const modalHeaderBg = useColorModeValue('blue.50', 'blue.900');
  const modalHeaderColor = useColorModeValue('blue.800', 'blue.100');
  const footerBg = useColorModeValue('gray.50', 'gray.800');

  // Enhanced visibility colors
  const inputBg = useColorModeValue('white', 'gray.600');
  const inputBorderColor = useColorModeValue('gray.300', 'gray.500');
  const inputHoverBorderColor = useColorModeValue('blue.400', 'blue.400');
  const inputFocusBorderColor = useColorModeValue('blue.500', 'blue.400');
  const inputTextColor = useColorModeValue('gray.900', 'white');
  const placeholderColor = useColorModeValue('gray.500', 'gray.300');
  const labelColor = useColorModeValue('gray.800', 'gray.100');

  // State for toggling sections
  const [showLodging, setShowLodging] = useState(false);
  const [showAssistantCoaches, setShowAssistantCoaches] = useState(false);
  
  // State for assistant coach mode toggles (existing vs new)
  const [assistantCoach1UseExisting, setAssistantCoach1UseExisting] = useState(false);
  const [assistantCoach2UseExisting, setAssistantCoach2UseExisting] = useState(false);
  const [assistantCoach3UseExisting, setAssistantCoach3UseExisting] = useState(false);

  const {
    handleSubmit,
    register,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<TrackMeetFormData>({
    defaultValues: currentMeet ? {
      name: currentMeet.name,
      meet_date: currentMeet.meet_date,
      end_date: currentMeet.end_date || '',
      venue_type: (currentMeet.venue_type as 'Indoor' | 'Outdoor') || undefined,
      venue_name: currentMeet.venue_name || '',
      join_link: currentMeet.join_link || '',
      city: currentMeet.city || '',
      state: currentMeet.state || '',
      status: currentMeet.status || 'Planned',
      description: currentMeet.description || '',
      coach_id: currentMeet.coach_id || '',
      lodging_type: currentMeet.lodging_type || '',
      lodging_place_name: currentMeet.lodging_place_name || '',
      lodging_address: currentMeet.lodging_address || '',
      lodging_city: currentMeet.lodging_city || '',
      lodging_state: currentMeet.lodging_state || '',
      lodging_zip: currentMeet.lodging_zip || '',
      lodging_phone: currentMeet.lodging_phone || '',
      lodging_website: currentMeet.lodging_website || '',
      lodging_checkin_date: currentMeet.lodging_checkin_date || '',
      lodging_checkout_date: currentMeet.lodging_checkout_date || '',
      lodging_checkin_time: currentMeet.lodging_checkin_time || '',
      lodging_checkout_time: currentMeet.lodging_checkout_time || '',
      assistant_coach_1_name: currentMeet.assistant_coach_1_name || '',
      assistant_coach_1_phone: currentMeet.assistant_coach_1_phone || '',
      assistant_coach_1_email: currentMeet.assistant_coach_1_email || '',
      assistant_coach_2_name: currentMeet.assistant_coach_2_name || '',
      assistant_coach_2_phone: currentMeet.assistant_coach_2_phone || '',
      assistant_coach_2_email: currentMeet.assistant_coach_2_email || '',
      assistant_coach_3_name: currentMeet.assistant_coach_3_name || '',
      assistant_coach_3_phone: currentMeet.assistant_coach_3_phone || '',
      assistant_coach_3_email: currentMeet.assistant_coach_3_email || '',
      assistant_coach_1_id: currentMeet.assistant_coach_1_id || '',
      assistant_coach_2_id: currentMeet.assistant_coach_2_id || '',
      assistant_coach_3_id: currentMeet.assistant_coach_3_id || ''
    } : {
      name: '',
      meet_date: '',
      status: 'Planned'
    }
  });

  // Watch lodging type to conditionally show place name field
  const lodgingType = watch('lodging_type');
  const showPlaceName = lodgingType && ['Hotel', 'Hostel', 'Resort'].includes(lodgingType);
  
  // Watch assistant coach selections
  const assistantCoach1Id = watch('assistant_coach_1_id');
  const assistantCoach2Id = watch('assistant_coach_2_id');
  const assistantCoach3Id = watch('assistant_coach_3_id');
  
  // Helper function to get coach info by ID
  const getCoachById = (id: string) => coaches.find(coach => coach.id === id);
  
  // Handle existing coach selection
  const handleExistingCoachSelect = (coachNumber: 1 | 2 | 3, coachId: string) => {
    const coach = getCoachById(coachId);
    if (coach) {
      setValue(`assistant_coach_${coachNumber}_name`, coach.name);
      setValue(`assistant_coach_${coachNumber}_email`, coach.email || '');
      setValue(`assistant_coach_${coachNumber}_phone`, coach.phone || '');
      setValue(`assistant_coach_${coachNumber}_id`, coachId);
    }
  };
  
  // Clear assistant coach fields
  const clearAssistantCoach = (coachNumber: 1 | 2 | 3) => {
    setValue(`assistant_coach_${coachNumber}_name`, '');
    setValue(`assistant_coach_${coachNumber}_email`, '');
    setValue(`assistant_coach_${coachNumber}_phone`, '');
    setValue(`assistant_coach_${coachNumber}_id`, '');
  };

  // Reset form when currentMeet changes
  React.useEffect(() => {
    if (currentMeet) {
      reset({
        name: currentMeet.name,
        meet_date: currentMeet.meet_date,
        end_date: currentMeet.end_date || '',
        venue_type: (currentMeet.venue_type as 'Indoor' | 'Outdoor') || undefined,
        venue_name: currentMeet.venue_name || '',
        join_link: currentMeet.join_link || '',
        city: currentMeet.city || '',
        state: currentMeet.state || '',
        status: currentMeet.status || 'Planned',
        description: currentMeet.description || '',
        coach_id: currentMeet.coach_id || '',
        lodging_type: currentMeet.lodging_type || '',
        lodging_place_name: currentMeet.lodging_place_name || '',
        lodging_address: currentMeet.lodging_address || '',
        lodging_city: currentMeet.lodging_city || '',
        lodging_state: currentMeet.lodging_state || '',
        lodging_zip: currentMeet.lodging_zip || '',
        lodging_phone: currentMeet.lodging_phone || '',
        lodging_website: currentMeet.lodging_website || '',
        lodging_checkin_date: currentMeet.lodging_checkin_date || '',
        lodging_checkout_date: currentMeet.lodging_checkout_date || '',
        lodging_checkin_time: currentMeet.lodging_checkin_time || '',
        lodging_checkout_time: currentMeet.lodging_checkout_time || '',
        assistant_coach_1_name: currentMeet.assistant_coach_1_name || '',
        assistant_coach_1_phone: currentMeet.assistant_coach_1_phone || '',
        assistant_coach_1_email: currentMeet.assistant_coach_1_email || '',
        assistant_coach_2_name: currentMeet.assistant_coach_2_name || '',
        assistant_coach_2_phone: currentMeet.assistant_coach_2_phone || '',
        assistant_coach_2_email: currentMeet.assistant_coach_2_email || '',
        assistant_coach_3_name: currentMeet.assistant_coach_3_name || '',
        assistant_coach_3_phone: currentMeet.assistant_coach_3_phone || '',
        assistant_coach_3_email: currentMeet.assistant_coach_3_email || '',
        assistant_coach_1_id: currentMeet.assistant_coach_1_id || '',
        assistant_coach_2_id: currentMeet.assistant_coach_2_id || '',
        assistant_coach_3_id: currentMeet.assistant_coach_3_id || ''
      });
    } else {
      reset({
        name: '',
        meet_date: '',
        end_date: '',
        venue_type: undefined,
        venue_name: '',
        join_link: '',
        city: '',
        state: '',
        status: 'Planned',
        description: '',
        coach_id: '',
        lodging_type: '',
        lodging_place_name: '',
        lodging_address: '',
        lodging_city: '',
        lodging_state: '',
        lodging_zip: '',
        lodging_phone: '',
        lodging_website: '',
        lodging_checkin_date: '',
        lodging_checkout_date: '',
        lodging_checkin_time: '',
        lodging_checkout_time: '',
        assistant_coach_1_name: '',
        assistant_coach_1_phone: '',
        assistant_coach_1_email: '',
        assistant_coach_2_name: '',
        assistant_coach_2_phone: '',
        assistant_coach_2_email: '',
        assistant_coach_3_name: '',
        assistant_coach_3_phone: '',
        assistant_coach_3_email: '',
        assistant_coach_1_id: '',
        assistant_coach_2_id: '',
        assistant_coach_3_id: ''
      });
    }
  }, [currentMeet, reset]);

  const handleFormSubmit = async (data: TrackMeetFormData) => {
    // Clean up empty strings to undefined
    const cleanedData = {
      ...data,
      end_date: data.end_date || undefined,
      venue_type: data.venue_type || undefined,
      venue_name: data.venue_name || undefined,
      join_link: data.join_link || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      description: data.description || undefined,
      coach_id: data.coach_id || undefined,
      lodging_type: data.lodging_type || undefined,
      lodging_place_name: data.lodging_place_name || undefined,
      lodging_address: data.lodging_address || undefined,
      lodging_city: data.lodging_city || undefined,
      lodging_state: data.lodging_state || undefined,
      lodging_zip: data.lodging_zip || undefined,
      lodging_phone: data.lodging_phone || undefined,
      lodging_website: data.lodging_website || undefined,
      lodging_checkin_date: data.lodging_checkin_date || undefined,
      lodging_checkout_date: data.lodging_checkout_date || undefined,
      lodging_checkin_time: data.lodging_checkin_time || undefined,
      lodging_checkout_time: data.lodging_checkout_time || undefined,
      assistant_coach_1_name: data.assistant_coach_1_name || undefined,
      assistant_coach_1_phone: data.assistant_coach_1_phone || undefined,
      assistant_coach_1_email: data.assistant_coach_1_email || undefined,
      assistant_coach_2_name: data.assistant_coach_2_name || undefined,
      assistant_coach_2_phone: data.assistant_coach_2_phone || undefined,
      assistant_coach_2_email: data.assistant_coach_2_email || undefined,
      assistant_coach_3_name: data.assistant_coach_3_name || undefined,
      assistant_coach_3_phone: data.assistant_coach_3_phone || undefined,
      assistant_coach_3_email: data.assistant_coach_3_email || undefined,
      assistant_coach_1_id: data.assistant_coach_1_id || undefined,
      assistant_coach_2_id: data.assistant_coach_2_id || undefined,
      assistant_coach_3_id: data.assistant_coach_3_id || undefined
    };
    
    await onSubmit(cleanedData);
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xl">
      <DrawerOverlay bg="blackAlpha.600" />
      <DrawerContent bg={bgColor} borderLeft="3px solid" borderColor="blue.500">
        <DrawerHeader 
          borderBottomWidth="2px" 
          borderColor={borderColor}
          bg={modalHeaderBg}
          color={modalHeaderColor}
          fontSize="lg"
          fontWeight="bold"
        >
          {title || (isEditing ? 'Edit Track Meet' : 'Create New Track Meet')}
        </DrawerHeader>
        <DrawerCloseButton 
          color={modalHeaderColor}
          size="lg"
        />
        
        <DrawerBody py={6}>
          <VStack spacing={5}>
            <FormControl isInvalid={!!errors.name} isRequired>
              <FormLabel 
                fontSize="md" 
                fontWeight="semibold"
                color={labelColor}
              >
                Meet Name
              </FormLabel>
              <Input 
                {...register('name', { required: 'Name is required' })} 
                size="lg"
                borderWidth="2px"
                borderColor={inputBorderColor}
                _hover={{ borderColor: inputHoverBorderColor }}
                _focus={{ 
                  borderColor: inputFocusBorderColor, 
                  boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                  bg: inputBg
                }}
                bg={inputBg}
                color={inputTextColor}
                _placeholder={{ color: placeholderColor }}
                placeholder="e.g., State Championships"
                shadow="sm"
              />
              <FormErrorMessage color="red.500" fontWeight="medium">
                {errors.name?.message}
              </FormErrorMessage>
            </FormControl>
            
            <HStack spacing={4} w="full">
              <FormControl isInvalid={!!errors.meet_date} isRequired flex="1">
                <FormLabel 
                  fontSize="md" 
                  fontWeight="semibold"
                  color={labelColor}
                >
                  Start Date
                </FormLabel>
                <Input 
                  type="date" 
                  {...register('meet_date', { required: 'Start date is required' })} 
                  size="lg"
                  borderWidth="2px"
                  borderColor={inputBorderColor}
                  _hover={{ borderColor: inputHoverBorderColor }}
                  _focus={{ 
                    borderColor: inputFocusBorderColor, 
                    boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                    bg: inputBg
                  }}
                  bg={inputBg}
                  color={inputTextColor}
                  shadow="sm"
                />
                <FormErrorMessage color="red.500" fontWeight="medium">
                  {errors.meet_date?.message}
                </FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!errors.end_date} flex="1">
                <FormLabel 
                  fontSize="md" 
                  fontWeight="semibold"
                  color={labelColor}
                >
                  End Date (Multi-Day)
                </FormLabel>
                <Input 
                  type="date" 
                  {...register('end_date')} 
                  placeholder="Leave empty for single-day meet"
                  size="lg"
                  borderWidth="2px"
                  borderColor={inputBorderColor}
                  _hover={{ borderColor: inputHoverBorderColor }}
                  _focus={{ 
                    borderColor: inputFocusBorderColor, 
                    boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                    bg: inputBg
                  }}
                  bg={inputBg}
                  color={inputTextColor}
                  _placeholder={{ color: placeholderColor }}
                  shadow="sm"
                />
                <FormErrorMessage color="red.500" fontWeight="medium">
                  {errors.end_date?.message}
                </FormErrorMessage>
              </FormControl>
            </HStack>
            
            <HStack spacing={4} w="full">
              <FormControl isInvalid={!!errors.venue_type} flex="1">
                <FormLabel 
                  fontSize="md" 
                  fontWeight="semibold"
                  color={labelColor}
                >
                  Venue Type
                </FormLabel>
                <Select 
                  {...register('venue_type')} 
                  placeholder="Select venue type"
                  size="lg"
                  borderWidth="2px"
                  borderColor={inputBorderColor}
                  _hover={{ borderColor: inputHoverBorderColor }}
                  _focus={{ 
                    borderColor: inputFocusBorderColor, 
                    boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                    bg: inputBg
                  }}
                  bg={inputBg}
                  color={inputTextColor}
                  shadow="sm"
                >
                  <option value="Indoor">Indoor</option>
                  <option value="Outdoor">Outdoor</option>
                </Select>
                <FormErrorMessage color="red.500" fontWeight="medium">
                  {errors.venue_type?.message}
                </FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!errors.venue_name} flex="1">
                <FormLabel 
                  fontSize="md" 
                  fontWeight="semibold"
                  color={labelColor}
                >
                  Venue/Stadium Name
                </FormLabel>
                <Input 
                  {...register('venue_name')} 
                  placeholder="e.g. Lincoln High School Track"
                  size="lg"
                  borderWidth="2px"
                  borderColor={inputBorderColor}
                  _hover={{ borderColor: inputHoverBorderColor }}
                  _focus={{ 
                    borderColor: inputFocusBorderColor, 
                    boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                    bg: inputBg
                  }}
                  bg={inputBg}
                  color={inputTextColor}
                  _placeholder={{ color: placeholderColor }}
                  shadow="sm"
                />
                <FormErrorMessage color="red.500" fontWeight="medium">
                  {errors.venue_name?.message}
                </FormErrorMessage>
              </FormControl>
            </HStack>
            
            <HStack spacing={4} w="full">
              <FormControl isInvalid={!!errors.city} flex="1">
                <FormLabel 
                  fontSize="md" 
                  fontWeight="semibold"
                  color={labelColor}
                >
                  City
                </FormLabel>
                <Input 
                  {...register('city')} 
                  placeholder="e.g. Boston"
                  size="lg"
                  borderWidth="2px"
                  borderColor={inputBorderColor}
                  _hover={{ borderColor: inputHoverBorderColor }}
                  _focus={{ 
                    borderColor: inputFocusBorderColor, 
                    boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                    bg: inputBg
                  }}
                  bg={inputBg}
                  color={inputTextColor}
                  _placeholder={{ color: placeholderColor }}
                  shadow="sm"
                />
                <FormErrorMessage color="red.500" fontWeight="medium">
                  {errors.city?.message}
                </FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!errors.state} flex="1">
                <FormLabel 
                  fontSize="md" 
                  fontWeight="semibold"
                  color={labelColor}
                >
                  State
                </FormLabel>
                <Input 
                  {...register('state')} 
                  placeholder="e.g. MA"
                  size="lg"
                  borderWidth="2px"
                  borderColor={inputBorderColor}
                  _hover={{ borderColor: inputHoverBorderColor }}
                  _focus={{ 
                    borderColor: inputFocusBorderColor, 
                    boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                    bg: inputBg
                  }}
                  bg={inputBg}
                  color={inputTextColor}
                  _placeholder={{ color: placeholderColor }}
                  shadow="sm"
                />
                <FormErrorMessage color="red.500" fontWeight="medium">
                  {errors.state?.message}
                </FormErrorMessage>
              </FormControl>
            </HStack>
            
            <FormControl isInvalid={!!errors.join_link}>
              <FormLabel 
                fontSize="md" 
                fontWeight="semibold"
                color={labelColor}
              >
                Join Link (Optional)
              </FormLabel>
              <Input 
                {...register('join_link')} 
                placeholder="https://example.com/meet-registration"
                size="lg"
                borderWidth="2px"
                borderColor={inputBorderColor}
                _hover={{ borderColor: inputHoverBorderColor }}
                _focus={{ 
                  borderColor: inputFocusBorderColor, 
                  boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                  bg: inputBg
                }}
                bg={inputBg}
                color={inputTextColor}
                _placeholder={{ color: placeholderColor }}
                shadow="sm"
              />
              <FormErrorMessage color="red.500" fontWeight="medium">
                {errors.join_link?.message}
              </FormErrorMessage>
            </FormControl>
            
            <FormControl isInvalid={!!errors.status}>
              <FormLabel 
                fontSize="md" 
                fontWeight="semibold"
                color={labelColor}
              >
                Status
              </FormLabel>
              <Select 
                {...register('status')} 
                size="lg"
                borderWidth="2px"
                borderColor={inputBorderColor}
                _hover={{ borderColor: inputHoverBorderColor }}
                _focus={{ 
                  borderColor: inputFocusBorderColor, 
                  boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                  bg: inputBg
                }}
                bg={inputBg}
                color={inputTextColor}
                shadow="sm"
              >
                <option value="Planned">Planned</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </Select>
              <FormErrorMessage color="red.500" fontWeight="medium">
                {errors.status?.message}
              </FormErrorMessage>
            </FormControl>
            
            <FormControl isInvalid={!!errors.description}>
              <FormLabel 
                fontSize="md" 
                fontWeight="semibold"
                color={labelColor}
              >
                Description
              </FormLabel>
              <Textarea 
                {...register('description')} 
                placeholder="Add any details about this meet..."
                size="lg"
                borderWidth="2px"
                borderColor={inputBorderColor}
                _hover={{ borderColor: inputHoverBorderColor }}
                _focus={{ 
                  borderColor: inputFocusBorderColor, 
                  boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                  bg: inputBg
                }}
                bg={inputBg}
                color={inputTextColor}
                _placeholder={{ color: placeholderColor }}
                rows={3}
                shadow="sm"
              />
              <FormErrorMessage color="red.500" fontWeight="medium">
                {errors.description?.message}
              </FormErrorMessage>
            </FormControl>
            
            {showCoachSelection && !isEditing && (
              <FormControl isInvalid={!!errors.coach_id}>
                <FormLabel 
                  fontSize="md" 
                  fontWeight="semibold"
                  color={labelColor}
                >
                  Assign Coach (Optional)
                </FormLabel>
                <Select 
                  {...register('coach_id')} 
                  placeholder="Select a coach"
                  size="lg"
                  borderWidth="2px"
                  borderColor={inputBorderColor}
                  _hover={{ borderColor: inputHoverBorderColor }}
                  _focus={{ 
                    borderColor: inputFocusBorderColor, 
                    boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                    bg: inputBg
                  }}
                  bg={inputBg}
                  color={inputTextColor}
                  shadow="sm"
                >
                  {coaches.map(coach => (
                    <option key={coach.id} value={coach.id}>{coach.name}</option>
                  ))}
                </Select>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  If you select a coach, they will be able to manage this meet and assign events.
                </Text>
                <FormErrorMessage color="red.500" fontWeight="medium">
                  {errors.coach_id?.message}
                </FormErrorMessage>
              </FormControl>
            )}
            
            {/* Lodging Section */}
            <Box w="full">
              <Divider my={4} />
              
              <Button
                variant="outline"
                colorScheme="blue"
                leftIcon={showLodging ? <FaChevronUp /> : <FaChevronDown />}
                rightIcon={<FaHotel />}
                onClick={() => setShowLodging(!showLodging)}
                w="full"
                justifyContent="space-between"
                size="lg"
                borderWidth="2px"
                _hover={{ borderColor: inputHoverBorderColor }}
              >
                Add Lodging Information
              </Button>
              
              <Collapse in={showLodging} animateOpacity>
                <VStack spacing={5} mt={4} p={4} borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={whiteGrayBg}>
                  <HStack spacing={4} w="full">
                    <FormControl isInvalid={!!errors.lodging_type} flex="1">
                      <FormLabel 
                        fontSize="md" 
                        fontWeight="semibold"
                        color={labelColor}
                      >
                        Lodging Type
                      </FormLabel>
                      <Select 
                        {...register('lodging_type')} 
                        placeholder="Select lodging type"
                        size="lg"
                        borderWidth="2px"
                        borderColor={inputBorderColor}
                        _hover={{ borderColor: inputHoverBorderColor }}
                        _focus={{ 
                          borderColor: inputFocusBorderColor, 
                          boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                          bg: inputBg
                        }}
                        bg={inputBg}
                        color={inputTextColor}
                        shadow="sm"
                      >
                        <option value="Hotel">Hotel</option>
                        <option value="Motel">Motel</option>
                        <option value="Airbnb">Airbnb</option>
                        <option value="Hostel">Hostel</option>
                        <option value="Resort">Resort</option>
                        <option value="Vacation Rental">Vacation Rental</option>
                        <option value="Host Family">Host Family</option>
                        <option value="Other">Other</option>
                      </Select>
                      <FormErrorMessage color="red.500" fontWeight="medium">
                        {errors.lodging_type?.message}
                      </FormErrorMessage>
                    </FormControl>
                    
                    {showPlaceName && (
                      <FormControl isInvalid={!!errors.lodging_place_name} flex="1">
                        <FormLabel 
                          fontSize="md" 
                          fontWeight="semibold"
                          color={labelColor}
                        >
                          Place Name
                        </FormLabel>
                        <Input 
                          {...register('lodging_place_name')} 
                          placeholder="e.g. Hilton Downtown"
                          size="lg"
                          borderWidth="2px"
                          borderColor={inputBorderColor}
                          _hover={{ borderColor: inputHoverBorderColor }}
                          _focus={{ 
                            borderColor: inputFocusBorderColor, 
                            boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                            bg: inputBg
                          }}
                          bg={inputBg}
                          color={inputTextColor}
                          _placeholder={{ color: placeholderColor }}
                          shadow="sm"
                        />
                        <FormErrorMessage color="red.500" fontWeight="medium">
                          {errors.lodging_place_name?.message}
                        </FormErrorMessage>
                      </FormControl>
                    )}
                  </HStack>
                  
                  <FormControl isInvalid={!!errors.lodging_address}>
                    <FormLabel 
                      fontSize="md" 
                      fontWeight="semibold"
                      color={labelColor}
                    >
                      Lodging Address
                    </FormLabel>
                    <Input 
                      {...register('lodging_address')} 
                      placeholder="123 Main St"
                      size="lg"
                      borderWidth="2px"
                      borderColor={inputBorderColor}
                      _hover={{ borderColor: inputHoverBorderColor }}
                      _focus={{ 
                        borderColor: inputFocusBorderColor, 
                        boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                        bg: inputBg
                      }}
                      bg={inputBg}
                      color={inputTextColor}
                      _placeholder={{ color: placeholderColor }}
                      shadow="sm"
                    />
                    <FormErrorMessage color="red.500" fontWeight="medium">
                      {errors.lodging_address?.message}
                    </FormErrorMessage>
                  </FormControl>
                  
                  <HStack spacing={4} w="full">
                    <FormControl isInvalid={!!errors.lodging_city} flex="2">
                      <FormLabel 
                        fontSize="md" 
                        fontWeight="semibold"
                        color={labelColor}
                      >
                        City
                      </FormLabel>
                      <Input 
                        {...register('lodging_city')} 
                        placeholder="Boston"
                        size="lg"
                        borderWidth="2px"
                        borderColor={inputBorderColor}
                        _hover={{ borderColor: inputHoverBorderColor }}
                        _focus={{ 
                          borderColor: inputFocusBorderColor, 
                          boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                          bg: inputBg
                        }}
                        bg={inputBg}
                        color={inputTextColor}
                        _placeholder={{ color: placeholderColor }}
                        shadow="sm"
                      />
                      <FormErrorMessage color="red.500" fontWeight="medium">
                        {errors.lodging_city?.message}
                      </FormErrorMessage>
                    </FormControl>
                    
                    <FormControl isInvalid={!!errors.lodging_state} flex="1">
                      <FormLabel 
                        fontSize="md" 
                        fontWeight="semibold"
                        color={labelColor}
                      >
                        State
                      </FormLabel>
                      <Input 
                        {...register('lodging_state')} 
                        placeholder="MA"
                        size="lg"
                        borderWidth="2px"
                        borderColor={inputBorderColor}
                        _hover={{ borderColor: inputHoverBorderColor }}
                        _focus={{ 
                          borderColor: inputFocusBorderColor, 
                          boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                          bg: inputBg
                        }}
                        bg={inputBg}
                        color={inputTextColor}
                        _placeholder={{ color: placeholderColor }}
                        shadow="sm"
                      />
                      <FormErrorMessage color="red.500" fontWeight="medium">
                        {errors.lodging_state?.message}
                      </FormErrorMessage>
                    </FormControl>
                    
                    <FormControl isInvalid={!!errors.lodging_zip} flex="1">
                      <FormLabel 
                        fontSize="md" 
                        fontWeight="semibold"
                        color={labelColor}
                      >
                        Zip Code
                      </FormLabel>
                      <Input 
                        {...register('lodging_zip')} 
                        placeholder="02101"
                        size="lg"
                        borderWidth="2px"
                        borderColor={inputBorderColor}
                        _hover={{ borderColor: inputHoverBorderColor }}
                        _focus={{ 
                          borderColor: inputFocusBorderColor, 
                          boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                          bg: inputBg
                        }}
                        bg={inputBg}
                        color={inputTextColor}
                        _placeholder={{ color: placeholderColor }}
                        shadow="sm"
                      />
                      <FormErrorMessage color="red.500" fontWeight="medium">
                        {errors.lodging_zip?.message}
                      </FormErrorMessage>
                    </FormControl>
                  </HStack>
                  
                  <HStack spacing={4} w="full">
                    <FormControl isInvalid={!!errors.lodging_phone} flex="1">
                      <FormLabel 
                        fontSize="md" 
                        fontWeight="semibold"
                        color={labelColor}
                      >
                        Phone Number
                      </FormLabel>
                      <Input 
                        {...register('lodging_phone')} 
                        placeholder="(555) 123-4567"
                        size="lg"
                        borderWidth="2px"
                        borderColor={inputBorderColor}
                        _hover={{ borderColor: inputHoverBorderColor }}
                        _focus={{ 
                          borderColor: inputFocusBorderColor, 
                          boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                          bg: inputBg
                        }}
                        bg={inputBg}
                        color={inputTextColor}
                        _placeholder={{ color: placeholderColor }}
                        shadow="sm"
                      />
                      <FormErrorMessage color="red.500" fontWeight="medium">
                        {errors.lodging_phone?.message}
                      </FormErrorMessage>
                    </FormControl>
                    
                    <FormControl isInvalid={!!errors.lodging_website} flex="1">
                      <FormLabel 
                        fontSize="md" 
                        fontWeight="semibold"
                        color={labelColor}
                      >
                        Website
                      </FormLabel>
                      <Input 
                        {...register('lodging_website')} 
                        placeholder="https://hotel-website.com"
                        size="lg"
                        borderWidth="2px"
                        borderColor={inputBorderColor}
                        _hover={{ borderColor: inputHoverBorderColor }}
                        _focus={{ 
                          borderColor: inputFocusBorderColor, 
                          boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                          bg: inputBg
                        }}
                        bg={inputBg}
                        color={inputTextColor}
                        _placeholder={{ color: placeholderColor }}
                        shadow="sm"
                      />
                      <FormErrorMessage color="red.500" fontWeight="medium">
                        {errors.lodging_website?.message}
                      </FormErrorMessage>
                    </FormControl>
                  </HStack>
                  
                  <HStack spacing={4} w="full">
                    <FormControl isInvalid={!!errors.lodging_checkin_date} flex="1">
                      <FormLabel 
                        fontSize="md" 
                        fontWeight="semibold"
                        color={labelColor}
                      >
                        Check-in Date
                      </FormLabel>
                      <Input 
                        type="date"
                        {...register('lodging_checkin_date')} 
                        size="lg"
                        borderWidth="2px"
                        borderColor={inputBorderColor}
                        _hover={{ borderColor: inputHoverBorderColor }}
                        _focus={{ 
                          borderColor: inputFocusBorderColor, 
                          boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                          bg: inputBg
                        }}
                        bg={inputBg}
                        color={inputTextColor}
                        shadow="sm"
                      />
                      <FormErrorMessage color="red.500" fontWeight="medium">
                        {errors.lodging_checkin_date?.message}
                      </FormErrorMessage>
                    </FormControl>
                    
                    <FormControl isInvalid={!!errors.lodging_checkout_date} flex="1">
                      <FormLabel 
                        fontSize="md" 
                        fontWeight="semibold"
                        color={labelColor}
                      >
                        Check-out Date
                      </FormLabel>
                      <Input 
                        type="date"
                        {...register('lodging_checkout_date')} 
                        size="lg"
                        borderWidth="2px"
                        borderColor={inputBorderColor}
                        _hover={{ borderColor: inputHoverBorderColor }}
                        _focus={{ 
                          borderColor: inputFocusBorderColor, 
                          boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                          bg: inputBg
                        }}
                        bg={inputBg}
                        color={inputTextColor}
                        shadow="sm"
                      />
                      <FormErrorMessage color="red.500" fontWeight="medium">
                        {errors.lodging_checkout_date?.message}
                      </FormErrorMessage>
                    </FormControl>
                  </HStack>
                  
                  <HStack spacing={4} w="full">
                    <FormControl isInvalid={!!errors.lodging_checkin_time} flex="1">
                      <FormLabel 
                        fontSize="md" 
                        fontWeight="semibold"
                        color={labelColor}
                      >
                        Check-in Time
                      </FormLabel>
                      <Input 
                        type="time"
                        {...register('lodging_checkin_time')} 
                        size="lg"
                        borderWidth="2px"
                        borderColor={inputBorderColor}
                        _hover={{ borderColor: inputHoverBorderColor }}
                        _focus={{ 
                          borderColor: inputFocusBorderColor, 
                          boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                          bg: inputBg
                        }}
                        bg={inputBg}
                        color={inputTextColor}
                        shadow="sm"
                      />
                      <FormErrorMessage color="red.500" fontWeight="medium">
                        {errors.lodging_checkin_time?.message}
                      </FormErrorMessage>
                    </FormControl>
                    
                    <FormControl isInvalid={!!errors.lodging_checkout_time} flex="1">
                      <FormLabel 
                        fontSize="md" 
                        fontWeight="semibold"
                        color={labelColor}
                      >
                        Check-out Time
                      </FormLabel>
                      <Input 
                        type="time"
                        {...register('lodging_checkout_time')} 
                        size="lg"
                        borderWidth="2px"
                        borderColor={inputBorderColor}
                        _hover={{ borderColor: inputHoverBorderColor }}
                        _focus={{ 
                          borderColor: inputFocusBorderColor, 
                          boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                          bg: inputBg
                        }}
                        bg={inputBg}
                        color={inputTextColor}
                        shadow="sm"
                      />
                      <FormErrorMessage color="red.500" fontWeight="medium">
                        {errors.lodging_checkout_time?.message}
                      </FormErrorMessage>
                    </FormControl>
                  </HStack>
                </VStack>
              </Collapse>
            </Box>

            {/* Assistant Coaches Section */}
            <Box w="full">
              <Divider my={4} />
              
              <Button
                variant="outline"
                colorScheme="green"
                leftIcon={showAssistantCoaches ? <FaChevronUp /> : <FaChevronDown />}
                rightIcon={<FaUserTie />}
                onClick={() => setShowAssistantCoaches(!showAssistantCoaches)}
                w="full"
                justifyContent="space-between"
                size="lg"
                borderWidth="2px"
                _hover={{ borderColor: inputHoverBorderColor }}
              >
                Add Assistant Coaches
              </Button>
              
              <Collapse in={showAssistantCoaches} animateOpacity>
                <VStack spacing={6} mt={4} p={4} borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={whiteGrayBg}>
                  {/* Assistant Coach 1 */}
                  <Box w="full" p={4} borderWidth="1px" borderColor={borderColor} borderRadius="md">
                    <HStack justify="space-between" align="center" mb={4}>
                      <Text fontSize="lg" fontWeight="semibold" color={labelColor}>
                        Assistant Coach 1
                      </Text>
                      <HStack>
                        <Text fontSize="sm" color={subtextColor}>Use Existing Coach</Text>
                        <Switch
                          isChecked={assistantCoach1UseExisting}
                          onChange={(e) => {
                            setAssistantCoach1UseExisting(e.target.checked);
                            if (!e.target.checked) {
                              clearAssistantCoach(1);
                            }
                          }}
                          colorScheme="green"
                        />
                      </HStack>
                    </HStack>
                    
                    {assistantCoach1UseExisting ? (
                      <FormControl>
                        <FormLabel fontSize="md" fontWeight="semibold" color={labelColor}>
                          Select Existing Coach
                        </FormLabel>
                        <Select
                          value={assistantCoach1Id}
                          onChange={(e) => handleExistingCoachSelect(1, e.target.value)}
                          placeholder="Select a coach"
                          size="lg"
                          borderWidth="2px"
                          borderColor={inputBorderColor}
                          _hover={{ borderColor: inputHoverBorderColor }}
                          _focus={{ 
                            borderColor: inputFocusBorderColor, 
                            boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                            bg: inputBg
                          }}
                          bg={inputBg}
                          color={inputTextColor}
                          shadow="sm"
                        >
                          {coaches.map(coach => (
                            <option key={coach.id} value={coach.id}>
                              {coach.name} {coach.email && `(${coach.email})`}
                            </option>
                          ))}
                        </Select>
                        {assistantCoach1Id && (
                          <Box mt={2} p={3} bg={useColorModeValue('green.50', 'green.900')} borderRadius="md">
                            <Text fontSize="sm" color={useColorModeValue('green.700', 'green.200')}>
                              <Badge colorScheme="green" mr={2}>Selected:</Badge>
                              {getCoachById(assistantCoach1Id)?.name}
                              {getCoachById(assistantCoach1Id)?.email && ` | ${getCoachById(assistantCoach1Id)?.email}`}
                              {getCoachById(assistantCoach1Id)?.phone && ` | ${getCoachById(assistantCoach1Id)?.phone}`}
                            </Text>
                          </Box>
                        )}
                      </FormControl>
                    ) : (
                      <VStack spacing={4}>
                        <FormControl>
                          <FormLabel fontSize="md" fontWeight="semibold" color={labelColor}>
                            Name
                          </FormLabel>
                          <Input
                            {...register('assistant_coach_1_name')}
                            placeholder="Assistant Coach Name"
                            size="lg"
                            borderWidth="2px"
                            borderColor={inputBorderColor}
                            _hover={{ borderColor: inputHoverBorderColor }}
                            _focus={{ 
                              borderColor: inputFocusBorderColor, 
                              boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                              bg: inputBg
                            }}
                            bg={inputBg}
                            color={inputTextColor}
                            _placeholder={{ color: placeholderColor }}
                            shadow="sm"
                          />
                        </FormControl>
                        
                        <HStack spacing={4} w="full">
                          <FormControl flex="1">
                            <FormLabel fontSize="md" fontWeight="semibold" color={labelColor}>
                              Phone
                            </FormLabel>
                            <Input
                              {...register('assistant_coach_1_phone')}
                              placeholder="(555) 123-4567"
                              size="lg"
                              borderWidth="2px"
                              borderColor={inputBorderColor}
                              _hover={{ borderColor: inputHoverBorderColor }}
                              _focus={{ 
                                borderColor: inputFocusBorderColor, 
                                boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                                bg: inputBg
                              }}
                              bg={inputBg}
                              color={inputTextColor}
                              _placeholder={{ color: placeholderColor }}
                              shadow="sm"
                            />
                          </FormControl>
                          
                          <FormControl flex="1">
                            <FormLabel fontSize="md" fontWeight="semibold" color={labelColor}>
                              Email
                            </FormLabel>
                            <Input
                              {...register('assistant_coach_1_email')}
                              placeholder="coach@example.com"
                              type="email"
                              size="lg"
                              borderWidth="2px"
                              borderColor={inputBorderColor}
                              _hover={{ borderColor: inputHoverBorderColor }}
                              _focus={{ 
                                borderColor: inputFocusBorderColor, 
                                boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                                bg: inputBg
                              }}
                              bg={inputBg}
                              color={inputTextColor}
                              _placeholder={{ color: placeholderColor }}
                              shadow="sm"
                            />
                          </FormControl>
                        </HStack>
                      </VStack>
                    )}
                  </Box>
                  
                  {/* Assistant Coach 2 */}
                  <Box w="full" p={4} borderWidth="1px" borderColor={borderColor} borderRadius="md">
                    <HStack justify="space-between" align="center" mb={4}>
                      <Text fontSize="lg" fontWeight="semibold" color={labelColor}>
                        Assistant Coach 2
                      </Text>
                      <HStack>
                        <Text fontSize="sm" color={subtextColor}>Use Existing Coach</Text>
                        <Switch
                          isChecked={assistantCoach2UseExisting}
                          onChange={(e) => {
                            setAssistantCoach2UseExisting(e.target.checked);
                            if (!e.target.checked) {
                              clearAssistantCoach(2);
                            }
                          }}
                          colorScheme="green"
                        />
                      </HStack>
                    </HStack>
                    
                    {assistantCoach2UseExisting ? (
                      <FormControl>
                        <FormLabel fontSize="md" fontWeight="semibold" color={labelColor}>
                          Select Existing Coach
                        </FormLabel>
                        <Select
                          value={assistantCoach2Id}
                          onChange={(e) => handleExistingCoachSelect(2, e.target.value)}
                          placeholder="Select a coach"
                          size="lg"
                          borderWidth="2px"
                          borderColor={inputBorderColor}
                          _hover={{ borderColor: inputHoverBorderColor }}
                          _focus={{ 
                            borderColor: inputFocusBorderColor, 
                            boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                            bg: inputBg
                          }}
                          bg={inputBg}
                          color={inputTextColor}
                          shadow="sm"
                        >
                          {coaches.map(coach => (
                            <option key={coach.id} value={coach.id}>
                              {coach.name} {coach.email && `(${coach.email})`}
                            </option>
                          ))}
                        </Select>
                        {assistantCoach2Id && (
                          <Box mt={2} p={3} bg={useColorModeValue('green.50', 'green.900')} borderRadius="md">
                            <Text fontSize="sm" color={useColorModeValue('green.700', 'green.200')}>
                              <Badge colorScheme="green" mr={2}>Selected:</Badge>
                              {getCoachById(assistantCoach2Id)?.name}
                              {getCoachById(assistantCoach2Id)?.email && ` | ${getCoachById(assistantCoach2Id)?.email}`}
                              {getCoachById(assistantCoach2Id)?.phone && ` | ${getCoachById(assistantCoach2Id)?.phone}`}
                            </Text>
                          </Box>
                        )}
                      </FormControl>
                    ) : (
                      <VStack spacing={4}>
                        <FormControl>
                          <FormLabel fontSize="md" fontWeight="semibold" color={labelColor}>
                            Name
                          </FormLabel>
                          <Input
                            {...register('assistant_coach_2_name')}
                            placeholder="Assistant Coach Name"
                            size="lg"
                            borderWidth="2px"
                            borderColor={inputBorderColor}
                            _hover={{ borderColor: inputHoverBorderColor }}
                            _focus={{ 
                              borderColor: inputFocusBorderColor, 
                              boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                              bg: inputBg
                            }}
                            bg={inputBg}
                            color={inputTextColor}
                            _placeholder={{ color: placeholderColor }}
                            shadow="sm"
                          />
                        </FormControl>
                        
                        <HStack spacing={4} w="full">
                          <FormControl flex="1">
                            <FormLabel fontSize="md" fontWeight="semibold" color={labelColor}>
                              Phone
                            </FormLabel>
                            <Input
                              {...register('assistant_coach_2_phone')}
                              placeholder="(555) 123-4567"
                              size="lg"
                              borderWidth="2px"
                              borderColor={inputBorderColor}
                              _hover={{ borderColor: inputHoverBorderColor }}
                              _focus={{ 
                                borderColor: inputFocusBorderColor, 
                                boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                                bg: inputBg
                              }}
                              bg={inputBg}
                              color={inputTextColor}
                              _placeholder={{ color: placeholderColor }}
                              shadow="sm"
                            />
                          </FormControl>
                          
                          <FormControl flex="1">
                            <FormLabel fontSize="md" fontWeight="semibold" color={labelColor}>
                              Email
                            </FormLabel>
                            <Input
                              {...register('assistant_coach_2_email')}
                              placeholder="coach@example.com"
                              type="email"
                              size="lg"
                              borderWidth="2px"
                              borderColor={inputBorderColor}
                              _hover={{ borderColor: inputHoverBorderColor }}
                              _focus={{ 
                                borderColor: inputFocusBorderColor, 
                                boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                                bg: inputBg
                              }}
                              bg={inputBg}
                              color={inputTextColor}
                              _placeholder={{ color: placeholderColor }}
                              shadow="sm"
                            />
                          </FormControl>
                        </HStack>
                      </VStack>
                    )}
                  </Box>
                  
                  {/* Assistant Coach 3 */}
                  <Box w="full" p={4} borderWidth="1px" borderColor={borderColor} borderRadius="md">
                    <HStack justify="space-between" align="center" mb={4}>
                      <Text fontSize="lg" fontWeight="semibold" color={labelColor}>
                        Assistant Coach 3
                      </Text>
                      <HStack>
                        <Text fontSize="sm" color={subtextColor}>Use Existing Coach</Text>
                        <Switch
                          isChecked={assistantCoach3UseExisting}
                          onChange={(e) => {
                            setAssistantCoach3UseExisting(e.target.checked);
                            if (!e.target.checked) {
                              clearAssistantCoach(3);
                            }
                          }}
                          colorScheme="green"
                        />
                      </HStack>
                    </HStack>
                    
                    {assistantCoach3UseExisting ? (
                      <FormControl>
                        <FormLabel fontSize="md" fontWeight="semibold" color={labelColor}>
                          Select Existing Coach
                        </FormLabel>
                        <Select
                          value={assistantCoach3Id}
                          onChange={(e) => handleExistingCoachSelect(3, e.target.value)}
                          placeholder="Select a coach"
                          size="lg"
                          borderWidth="2px"
                          borderColor={inputBorderColor}
                          _hover={{ borderColor: inputHoverBorderColor }}
                          _focus={{ 
                            borderColor: inputFocusBorderColor, 
                            boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                            bg: inputBg
                          }}
                          bg={inputBg}
                          color={inputTextColor}
                          shadow="sm"
                        >
                          {coaches.map(coach => (
                            <option key={coach.id} value={coach.id}>
                              {coach.name} {coach.email && `(${coach.email})`}
                            </option>
                          ))}
                        </Select>
                        {assistantCoach3Id && (
                          <Box mt={2} p={3} bg={useColorModeValue('green.50', 'green.900')} borderRadius="md">
                            <Text fontSize="sm" color={useColorModeValue('green.700', 'green.200')}>
                              <Badge colorScheme="green" mr={2}>Selected:</Badge>
                              {getCoachById(assistantCoach3Id)?.name}
                              {getCoachById(assistantCoach3Id)?.email && ` | ${getCoachById(assistantCoach3Id)?.email}`}
                              {getCoachById(assistantCoach3Id)?.phone && ` | ${getCoachById(assistantCoach3Id)?.phone}`}
                            </Text>
                          </Box>
                        )}
                      </FormControl>
                    ) : (
                      <VStack spacing={4}>
                        <FormControl>
                          <FormLabel fontSize="md" fontWeight="semibold" color={labelColor}>
                            Name
                          </FormLabel>
                          <Input
                            {...register('assistant_coach_3_name')}
                            placeholder="Assistant Coach Name"
                            size="lg"
                            borderWidth="2px"
                            borderColor={inputBorderColor}
                            _hover={{ borderColor: inputHoverBorderColor }}
                            _focus={{ 
                              borderColor: inputFocusBorderColor, 
                              boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                              bg: inputBg
                            }}
                            bg={inputBg}
                            color={inputTextColor}
                            _placeholder={{ color: placeholderColor }}
                            shadow="sm"
                          />
                        </FormControl>
                        
                        <HStack spacing={4} w="full">
                          <FormControl flex="1">
                            <FormLabel fontSize="md" fontWeight="semibold" color={labelColor}>
                              Phone
                            </FormLabel>
                            <Input
                              {...register('assistant_coach_3_phone')}
                              placeholder="(555) 123-4567"
                              size="lg"
                              borderWidth="2px"
                              borderColor={inputBorderColor}
                              _hover={{ borderColor: inputHoverBorderColor }}
                              _focus={{ 
                                borderColor: inputFocusBorderColor, 
                                boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                                bg: inputBg
                              }}
                              bg={inputBg}
                              color={inputTextColor}
                              _placeholder={{ color: placeholderColor }}
                              shadow="sm"
                            />
                          </FormControl>
                          
                          <FormControl flex="1">
                            <FormLabel fontSize="md" fontWeight="semibold" color={labelColor}>
                              Email
                            </FormLabel>
                            <Input
                              {...register('assistant_coach_3_email')}
                              placeholder="coach@example.com"
                              type="email"
                              size="lg"
                              borderWidth="2px"
                              borderColor={inputBorderColor}
                              _hover={{ borderColor: inputHoverBorderColor }}
                              _focus={{ 
                                borderColor: inputFocusBorderColor, 
                                boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                                bg: inputBg
                              }}
                              bg={inputBg}
                              color={inputTextColor}
                              _placeholder={{ color: placeholderColor }}
                              shadow="sm"
                            />
                          </FormControl>
                        </HStack>
                      </VStack>
                    )}
                  </Box>
                </VStack>
              </Collapse>
            </Box>
          </VStack>
        </DrawerBody>
        
        <DrawerFooter 
          borderTopWidth="2px" 
          borderColor={borderColor}
          bg={footerBg}
        >
          <Button 
            variant="outline" 
            mr={3} 
            onClick={onClose}
            size="lg"
            borderWidth="2px"
          >
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            isLoading={isSubmitting}
            onClick={handleSubmit(handleFormSubmit)}
            size="lg"
            shadow="md"
          >
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
} 