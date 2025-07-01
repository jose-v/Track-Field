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
import { FaHotel, FaChevronDown, FaChevronUp, FaUserTie, FaCalendarAlt, FaInfoCircle, FaDollarSign } from 'react-icons/fa';

export interface TrackMeetFormData {
  name: string;
  meet_date: string;
  end_date?: string;
  // Multi Events date range
  multi_events_start_date?: string;
  multi_events_end_date?: string;
  // Track & Field date range
  track_field_start_date?: string;
  track_field_end_date?: string;
  venue_type?: 'Indoor' | 'Outdoor';
  venue_name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  join_link?: string;
  status?: string;
  description?: string;
  coach_id?: string;
  // Meet type for different date frames
  meet_type?: 'track_field' | 'multi_events';
  // Registration & Event Details
  registration_fee?: string;
  processing_fee?: string;
  packet_pickup_date?: string;
  packet_pickup_location?: string;
  packet_pickup_address?: string;
  packet_pickup_city?: string;
  packet_pickup_state?: string;
  packet_pickup_country?: string;
  packet_pickup_zip?: string;
  entry_deadline_date?: string;
  entry_deadline_time?: string;
  tickets_link?: string;
  visitor_guide_link?: string;
  // Lodging fields
  lodging_type?: string;
  lodging_place_name?: string;
  lodging_address?: string;
  lodging_city?: string;
  lodging_state?: string;
  lodging_country?: string;
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
  // Multi Events date range
  multi_events_start_date?: string;
  multi_events_end_date?: string;
  // Track & Field date range
  track_field_start_date?: string;
  track_field_end_date?: string;
  venue_type?: string;
  venue_name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  join_link?: string;
  status?: string;
  description?: string;
  coach_id?: string;
  athlete_id?: string;
  // Meet type for different date frames
  meet_type?: string;
  // Registration & Event Details
  registration_fee?: string;
  processing_fee?: string;
  packet_pickup_date?: string;
  packet_pickup_location?: string;
  packet_pickup_address?: string;
  packet_pickup_city?: string;
  packet_pickup_state?: string;
  packet_pickup_country?: string;
  packet_pickup_zip?: string;
  entry_deadline_date?: string;
  entry_deadline_time?: string;
  tickets_link?: string;
  visitor_guide_link?: string;
  // Lodging fields
  lodging_type?: string;
  lodging_place_name?: string;
  lodging_address?: string;
  lodging_city?: string;
  lodging_state?: string;
  lodging_country?: string;
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
  const [showMeetInfo, setShowMeetInfo] = useState(false);
  const [showRegistrationDetails, setShowRegistrationDetails] = useState(false);
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
      multi_events_start_date: currentMeet.multi_events_start_date || '',
      multi_events_end_date: currentMeet.multi_events_end_date || '',
      track_field_start_date: currentMeet.track_field_start_date || '',
      track_field_end_date: currentMeet.track_field_end_date || '',
      venue_type: (currentMeet.venue_type as 'Indoor' | 'Outdoor') || undefined,
      venue_name: currentMeet.venue_name || '',
      address: currentMeet.address || '',
      city: currentMeet.city || '',
      state: currentMeet.state || '',
      country: currentMeet.country || '',
      zip: currentMeet.zip || '',
      join_link: currentMeet.join_link || '',
      status: currentMeet.status || 'Planned',
      description: currentMeet.description || '',
      coach_id: currentMeet.coach_id || '',
      meet_type: (currentMeet.meet_type as 'track_field' | 'multi_events') || undefined,
      registration_fee: currentMeet.registration_fee || '',
      processing_fee: currentMeet.processing_fee || '',
      packet_pickup_date: currentMeet.packet_pickup_date || '',
      packet_pickup_location: currentMeet.packet_pickup_location || '',
      packet_pickup_address: currentMeet.packet_pickup_address || '',
      packet_pickup_city: currentMeet.packet_pickup_city || '',
      packet_pickup_state: currentMeet.packet_pickup_state || '',
      packet_pickup_country: currentMeet.packet_pickup_country || '',
      packet_pickup_zip: currentMeet.packet_pickup_zip || '',
      entry_deadline_date: currentMeet.entry_deadline_date || '',
      entry_deadline_time: currentMeet.entry_deadline_time || '',
      tickets_link: currentMeet.tickets_link || '',
      visitor_guide_link: currentMeet.visitor_guide_link || '',
      lodging_type: currentMeet.lodging_type || '',
      lodging_place_name: currentMeet.lodging_place_name || '',
      lodging_address: currentMeet.lodging_address || '',
      lodging_city: currentMeet.lodging_city || '',
      lodging_state: currentMeet.lodging_state || '',
      lodging_country: currentMeet.lodging_country || '',
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
  
  // Watch meet type to conditionally show different date formats
  const meetType = watch('meet_type');
  
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
        multi_events_start_date: currentMeet.multi_events_start_date || '',
        multi_events_end_date: currentMeet.multi_events_end_date || '',
        track_field_start_date: currentMeet.track_field_start_date || '',
        track_field_end_date: currentMeet.track_field_end_date || '',
        venue_type: (currentMeet.venue_type as 'Indoor' | 'Outdoor') || undefined,
        venue_name: currentMeet.venue_name || '',
        address: currentMeet.address || '',
        city: currentMeet.city || '',
        state: currentMeet.state || '',
        country: currentMeet.country || '',
        zip: currentMeet.zip || '',
        join_link: currentMeet.join_link || '',
        status: currentMeet.status || 'Planned',
        description: currentMeet.description || '',
        coach_id: currentMeet.coach_id || '',
        meet_type: (currentMeet.meet_type as 'track_field' | 'multi_events') || undefined,
        registration_fee: currentMeet.registration_fee || '',
        processing_fee: currentMeet.processing_fee || '',
        packet_pickup_date: currentMeet.packet_pickup_date || '',
        packet_pickup_location: currentMeet.packet_pickup_location || '',
        packet_pickup_address: currentMeet.packet_pickup_address || '',
        packet_pickup_city: currentMeet.packet_pickup_city || '',
        packet_pickup_state: currentMeet.packet_pickup_state || '',
        packet_pickup_country: currentMeet.packet_pickup_country || '',
        packet_pickup_zip: currentMeet.packet_pickup_zip || '',
        entry_deadline_date: currentMeet.entry_deadline_date || '',
        entry_deadline_time: currentMeet.entry_deadline_time || '',
        tickets_link: currentMeet.tickets_link || '',
        visitor_guide_link: currentMeet.visitor_guide_link || '',
        lodging_type: currentMeet.lodging_type || '',
        lodging_place_name: currentMeet.lodging_place_name || '',
        lodging_address: currentMeet.lodging_address || '',
        lodging_city: currentMeet.lodging_city || '',
        lodging_state: currentMeet.lodging_state || '',
        lodging_country: currentMeet.lodging_country || '',
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
        multi_events_start_date: '',
        multi_events_end_date: '',
        track_field_start_date: '',
        track_field_end_date: '',
        venue_type: undefined,
        venue_name: '',
        address: '',
        city: '',
        state: '',
        country: '',
        zip: '',
        join_link: '',
        status: 'Planned',
        description: '',
        coach_id: '',
        meet_type: undefined,
        registration_fee: '',
        processing_fee: '',
        packet_pickup_date: '',
        packet_pickup_location: '',
        packet_pickup_address: '',
        packet_pickup_city: '',
        packet_pickup_state: '',
        packet_pickup_country: '',
        packet_pickup_zip: '',
        entry_deadline_date: '',
        entry_deadline_time: '',
        tickets_link: '',
        visitor_guide_link: '',
        lodging_type: '',
        lodging_place_name: '',
        lodging_address: '',
        lodging_city: '',
        lodging_state: '',
        lodging_country: '',
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
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      country: data.country || undefined,
      zip: data.zip || undefined,
      join_link: data.join_link || undefined,
      status: data.status || undefined,
      description: data.description || undefined,
      coach_id: data.coach_id || undefined,
      // Registration and Event Details
      registration_fee: data.registration_fee || undefined,
      processing_fee: data.processing_fee || undefined,
      packet_pickup_date: data.packet_pickup_date || undefined,
      packet_pickup_location: data.packet_pickup_location || undefined,
      packet_pickup_address: data.packet_pickup_address || undefined,
      entry_deadline_date: data.entry_deadline_date || undefined,
      entry_deadline_time: data.entry_deadline_time || undefined,
      tickets_link: data.tickets_link || undefined,
      visitor_guide_link: data.visitor_guide_link || undefined,
      lodging_type: data.lodging_type || undefined,
      lodging_place_name: data.lodging_place_name || undefined,
      lodging_address: data.lodging_address || undefined,
      lodging_city: data.lodging_city || undefined,
      lodging_state: data.lodging_state || undefined,
      lodging_country: data.lodging_country || undefined,
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
      assistant_coach_3_id: data.assistant_coach_3_id || undefined,
      packet_pickup_city: data.packet_pickup_city || undefined,
      packet_pickup_state: data.packet_pickup_state || undefined,
      packet_pickup_country: data.packet_pickup_country || undefined,
      packet_pickup_zip: data.packet_pickup_zip || undefined
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
            {/* Meet Information Section */}
            <Box w="full">
              <Button
                variant="outline"
                colorScheme="blue"
                leftIcon={showMeetInfo ? <FaChevronUp /> : <FaChevronDown />}
                rightIcon={<FaCalendarAlt />}
                onClick={() => setShowMeetInfo(!showMeetInfo)}
                w="full"
                justifyContent="space-between"
                size="lg"
                borderWidth="2px"
                _hover={{ borderColor: inputHoverBorderColor }}
              >
                Meet Information
              </Button>
              
              <Collapse in={showMeetInfo} animateOpacity>
                <VStack spacing={5} mt={4} p={4} borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={whiteGrayBg}>
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
                  
                  {/* Multi Events Date Range */}
                  <Box w="full">
                    <Text fontSize="md" fontWeight="semibold" color={labelColor} mb={3}>
                      Multi Events
                    </Text>
                    <HStack spacing={4} w="full">
                      <FormControl isInvalid={!!errors.multi_events_start_date} flex="1">
                        <FormLabel 
                          fontSize="md" 
                          fontWeight="semibold"
                          color={labelColor}
                        >
                          Start Date
                        </FormLabel>
                        <Input 
                          type="date" 
                          {...register('multi_events_start_date')} 
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
                          {errors.multi_events_start_date?.message}
                        </FormErrorMessage>
                      </FormControl>
                      
                      <FormControl isInvalid={!!errors.multi_events_end_date} flex="1">
                        <FormLabel 
                          fontSize="md" 
                          fontWeight="semibold"
                          color={labelColor}
                        >
                          End Date
                        </FormLabel>
                        <Input 
                          type="date" 
                          {...register('multi_events_end_date')} 
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
                          {errors.multi_events_end_date?.message}
                        </FormErrorMessage>
                      </FormControl>
                    </HStack>
                  </Box>

                  {/* Track & Field Date Range */}
                  <Box w="full">
                    <Text fontSize="md" fontWeight="semibold" color={labelColor} mb={3}>
                      Track & Field
                    </Text>
                    <HStack spacing={4} w="full">
                      <FormControl isInvalid={!!errors.track_field_start_date} flex="1">
                        <FormLabel 
                          fontSize="md" 
                          fontWeight="semibold"
                          color={labelColor}
                        >
                          Start Date
                        </FormLabel>
                        <Input 
                          type="date" 
                          {...register('track_field_start_date')} 
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
                          {errors.track_field_start_date?.message}
                        </FormErrorMessage>
                      </FormControl>
                      
                      <FormControl isInvalid={!!errors.track_field_end_date} flex="1">
                        <FormLabel 
                          fontSize="md" 
                          fontWeight="semibold"
                          color={labelColor}
                        >
                          End Date
                        </FormLabel>
                        <Input 
                          type="date" 
                          {...register('track_field_end_date')} 
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
                          {errors.track_field_end_date?.message}
                        </FormErrorMessage>
                      </FormControl>
                    </HStack>
                  </Box>
                  
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
                  
                  <FormControl isInvalid={!!errors.address}>
                    <FormLabel 
                      fontSize="md" 
                      fontWeight="semibold"
                      color={labelColor}
                    >
                      Address
                    </FormLabel>
                    <Input 
                      {...register('address')} 
                      placeholder="e.g. 123 Main Street"
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
                      {errors.address?.message}
                    </FormErrorMessage>
                  </FormControl>
                  
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
                          {errors.state?.message}
                        </FormErrorMessage>
                      </FormControl>
                      
                      <FormControl isInvalid={!!errors.country} flex="1">
                        <FormLabel 
                          fontSize="md" 
                          fontWeight="semibold"
                          color={labelColor}
                        >
                          Country
                        </FormLabel>
                        <Input 
                          {...register('country')} 
                          placeholder="USA"
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
                          {errors.country?.message}
                        </FormErrorMessage>
                      </FormControl>
                      
                      <FormControl isInvalid={!!errors.zip} flex="1">
                        <FormLabel 
                          fontSize="md" 
                          fontWeight="semibold"
                          color={labelColor}
                        >
                          Zip
                        </FormLabel>
                        <Input 
                          {...register('zip')} 
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
                          {errors.zip?.message}
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
                </VStack>
              </Collapse>
            </Box>
            
            {/* Meet Details Section */}
            <Box w="full">
              <Button
                variant="outline"
                colorScheme="blue"
                leftIcon={showRegistrationDetails ? <FaChevronUp /> : <FaChevronDown />}
                rightIcon={<FaInfoCircle />}
                onClick={() => setShowRegistrationDetails(!showRegistrationDetails)}
                w="full"
                justifyContent="space-between"
                size="lg"
                borderWidth="2px"
                _hover={{ borderColor: inputHoverBorderColor }}
              >
                Meet Details
              </Button>
              
              <Collapse in={showRegistrationDetails} animateOpacity>
                <VStack spacing={5} mt={4} p={4} borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={whiteGrayBg}>
                  {/* Meet Type Selection */}
                  <FormControl isInvalid={!!errors.meet_type}>
                    <FormLabel 
                      fontSize="md" 
                      fontWeight="semibold"
                      color={labelColor}
                    >
                      Meet Type
                    </FormLabel>
                    <Select 
                      {...register('meet_type')} 
                      placeholder="Select meet type"
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
                      <option value="track_field">Track & Field</option>
                      <option value="multi_events">Multi Events</option>
                    </Select>
                    <FormErrorMessage color="red.500" fontWeight="medium">
                      {errors.meet_type?.message}
                    </FormErrorMessage>
                  </FormControl>

                  {/* Registration Fees */}
                  <HStack spacing={4} w="full">
                    <FormControl isInvalid={!!errors.registration_fee} flex="1">
                      <FormLabel 
                        fontSize="md" 
                        fontWeight="semibold"
                        color={labelColor}
                      >
                        Registration Fee
                      </FormLabel>
                      <Input 
                        {...register('registration_fee')} 
                        placeholder="e.g. $45.00"
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
                        {errors.registration_fee?.message}
                      </FormErrorMessage>
                    </FormControl>
                    
                    <FormControl isInvalid={!!errors.processing_fee} flex="1">
                      <FormLabel 
                        fontSize="md" 
                        fontWeight="semibold"
                        color={labelColor}
                      >
                        Processing Fee
                      </FormLabel>
                      <Input 
                        {...register('processing_fee')} 
                        placeholder="e.g. $3.50"
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
                        {errors.processing_fee?.message}
                      </FormErrorMessage>
                    </FormControl>
                  </HStack>

                  {/* Entry Deadline */}
                  <HStack spacing={4} w="full">
                    <FormControl isInvalid={!!errors.entry_deadline_date} flex="1">
                      <FormLabel 
                        fontSize="md" 
                        fontWeight="semibold"
                        color={labelColor}
                      >
                        Entry Deadline Date
                      </FormLabel>
                      <Input 
                        type="date"
                        {...register('entry_deadline_date')} 
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
                        {errors.entry_deadline_date?.message}
                      </FormErrorMessage>
                    </FormControl>
                    
                    <FormControl isInvalid={!!errors.entry_deadline_time} flex="1">
                      <FormLabel 
                        fontSize="md" 
                        fontWeight="semibold"
                        color={labelColor}
                      >
                        Entry Deadline Time
                      </FormLabel>
                      <Input 
                        type="time"
                        {...register('entry_deadline_time')} 
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
                        {errors.entry_deadline_time?.message}
                      </FormErrorMessage>
                    </FormControl>
                  </HStack>

                  {/* Packet Pick Up */}
                  <Box w="full">
                    <Text fontSize="md" fontWeight="semibold" color={labelColor} mb={3}>
                      Packet Pick Up
                    </Text>
                    <VStack spacing={4}>
                      <FormControl isInvalid={!!errors.packet_pickup_date}>
                        <FormLabel 
                          fontSize="md" 
                          fontWeight="semibold"
                          color={labelColor}
                        >
                          Pick Up Date
                        </FormLabel>
                        <Input 
                          type="date"
                          {...register('packet_pickup_date')} 
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
                          {errors.packet_pickup_date?.message}
                        </FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!errors.packet_pickup_location}>
                        <FormLabel 
                          fontSize="md" 
                          fontWeight="semibold"
                          color={labelColor}
                        >
                          Pick Up Location
                        </FormLabel>
                        <Input 
                          {...register('packet_pickup_location')} 
                          placeholder="e.g. Lakeland Elementary School Cafeteria"
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
                          {errors.packet_pickup_location?.message}
                        </FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!errors.packet_pickup_address}>
                        <FormLabel 
                          fontSize="md" 
                          fontWeight="semibold"
                          color={labelColor}
                        >
                          Pick Up Address
                        </FormLabel>
                        <Input 
                          {...register('packet_pickup_address')} 
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
                          {errors.packet_pickup_address?.message}
                        </FormErrorMessage>
                      </FormControl>

                      <HStack spacing={4} w="full">
                        <FormControl isInvalid={!!errors.packet_pickup_city} flex="2">
                          <FormLabel 
                            fontSize="md" 
                            fontWeight="semibold"
                            color={labelColor}
                          >
                            City
                          </FormLabel>
                          <Input 
                            {...register('packet_pickup_city')} 
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
                            {errors.packet_pickup_city?.message}
                          </FormErrorMessage>
                        </FormControl>
                        
                        <FormControl isInvalid={!!errors.packet_pickup_state} flex="1">
                          <FormLabel 
                            fontSize="md" 
                            fontWeight="semibold"
                            color={labelColor}
                          >
                            State
                          </FormLabel>
                          <Input 
                            {...register('packet_pickup_state')} 
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
                            {errors.packet_pickup_state?.message}
                          </FormErrorMessage>
                        </FormControl>
                        
                        <FormControl isInvalid={!!errors.packet_pickup_country} flex="1">
                          <FormLabel 
                            fontSize="md" 
                            fontWeight="semibold"
                            color={labelColor}
                          >
                            Country
                          </FormLabel>
                          <Input 
                            {...register('packet_pickup_country')} 
                            placeholder="USA"
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
                            {errors.packet_pickup_country?.message}
                          </FormErrorMessage>
                        </FormControl>
                        
                        <FormControl isInvalid={!!errors.packet_pickup_zip} flex="1">
                          <FormLabel 
                            fontSize="md" 
                            fontWeight="semibold"
                            color={labelColor}
                          >
                            Zip
                          </FormLabel>
                          <Input 
                            {...register('packet_pickup_zip')} 
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
                            {errors.packet_pickup_zip?.message}
                          </FormErrorMessage>
                        </FormControl>
                      </HStack>
                    </VStack>
                  </Box>

                  {/* Links */}
                  <HStack spacing={4} w="full">
                    <FormControl isInvalid={!!errors.tickets_link} flex="1">
                      <FormLabel 
                        fontSize="md" 
                        fontWeight="semibold"
                        color={labelColor}
                      >
                        Tickets Link
                      </FormLabel>
                      <Input 
                        {...register('tickets_link')} 
                        placeholder="https://tickets.example.com"
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
                        {errors.tickets_link?.message}
                      </FormErrorMessage>
                    </FormControl>
                    
                    <FormControl isInvalid={!!errors.visitor_guide_link} flex="1">
                      <FormLabel 
                        fontSize="md" 
                        fontWeight="semibold"
                        color={labelColor}
                      >
                        Visitor Guide Link
                      </FormLabel>
                      <Input 
                        {...register('visitor_guide_link')} 
                        placeholder="https://visitor-guide.example.com"
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
                        {errors.visitor_guide_link?.message}
                      </FormErrorMessage>
                    </FormControl>
                  </HStack>
                </VStack>
              </Collapse>
            </Box>
            
            {/* Lodging Section */}
            <Box w="full">
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
                    
                    <FormControl isInvalid={!!errors.lodging_country} flex="1">
                      <FormLabel 
                        fontSize="md" 
                        fontWeight="semibold"
                        color={labelColor}
                      >
                        Country
                      </FormLabel>
                      <Input 
                        {...register('lodging_country')} 
                        placeholder="USA"
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
                        {errors.lodging_country?.message}
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
              <Button
                variant="outline"
                colorScheme="blue"
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