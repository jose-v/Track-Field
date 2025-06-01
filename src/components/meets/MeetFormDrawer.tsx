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
  Divider
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { FaHotel, FaChevronDown, FaChevronUp } from 'react-icons/fa';

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
  lodging_address?: string;
  lodging_phone?: string;
  lodging_website?: string;
  lodging_checkin_date?: string;
  lodging_checkout_date?: string;
  lodging_checkin_time?: string;
  lodging_checkout_time?: string;
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
  lodging_address?: string;
  lodging_phone?: string;
  lodging_website?: string;
  lodging_checkin_date?: string;
  lodging_checkout_date?: string;
  lodging_checkin_time?: string;
  lodging_checkout_time?: string;
}

interface Coach {
  id: string;
  name: string;
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

  // State for toggling lodging section
  const [showLodging, setShowLodging] = useState(false);

  const {
    handleSubmit,
    register,
    reset,
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
      lodging_address: currentMeet.lodging_address || '',
      lodging_phone: currentMeet.lodging_phone || '',
      lodging_website: currentMeet.lodging_website || '',
      lodging_checkin_date: currentMeet.lodging_checkin_date || '',
      lodging_checkout_date: currentMeet.lodging_checkout_date || '',
      lodging_checkin_time: currentMeet.lodging_checkin_time || '',
      lodging_checkout_time: currentMeet.lodging_checkout_time || ''
    } : {
      name: '',
      meet_date: '',
      status: 'Planned'
    }
  });

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
        lodging_address: currentMeet.lodging_address || '',
        lodging_phone: currentMeet.lodging_phone || '',
        lodging_website: currentMeet.lodging_website || '',
        lodging_checkin_date: currentMeet.lodging_checkin_date || '',
        lodging_checkout_date: currentMeet.lodging_checkout_date || '',
        lodging_checkin_time: currentMeet.lodging_checkin_time || '',
        lodging_checkout_time: currentMeet.lodging_checkout_time || ''
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
        lodging_address: '',
        lodging_phone: '',
        lodging_website: '',
        lodging_checkin_date: '',
        lodging_checkout_date: '',
        lodging_checkin_time: '',
        lodging_checkout_time: ''
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
      lodging_address: data.lodging_address || undefined,
      lodging_phone: data.lodging_phone || undefined,
      lodging_website: data.lodging_website || undefined,
      lodging_checkin_date: data.lodging_checkin_date || undefined,
      lodging_checkout_date: data.lodging_checkout_date || undefined,
      lodging_checkin_time: data.lodging_checkin_time || undefined,
      lodging_checkout_time: data.lodging_checkout_time || undefined
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
                  <FormControl isInvalid={!!errors.lodging_type}>
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
                      placeholder="123 Main St, City, State"
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