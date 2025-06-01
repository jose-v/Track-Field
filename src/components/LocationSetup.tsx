import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Text,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
  Divider
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaLocationArrow } from 'react-icons/fa';
import { getUserLocation, geocodeLocation, geocodeLocationFallback, setUserHomeLocation } from '../services/travelTime';

interface LocationSetupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationSetup: React.FC<LocationSetupProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [manualLocation, setManualLocation] = useState({ city: '', state: '' });
  const toast = useToast();

  const handleCurrentLocation = async () => {
    setLoading(true);
    try {
      const location = await getUserLocation();
      if (location) {
        setUserHomeLocation(location);
        toast({
          title: 'Location saved',
          description: 'Using your current location for travel time calculations',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
      } else {
        toast({
          title: 'Location access denied',
          description: 'Please enable location access or enter your location manually',
          status: 'warning',
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error) {
      // Silently handle location errors
      toast({
        title: 'Location unavailable',
        description: 'Please enter your location manually',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualLocation = async () => {
    if (!manualLocation.city.trim()) {
      toast({
        title: 'City required',
        description: 'Please enter at least a city name',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      const query = [manualLocation.city, manualLocation.state].filter(Boolean).join(', ');
      console.log('Geocoding query:', query);
      
      let location = await geocodeLocation(query);
      
      // If first attempt fails and we have a state, try city only
      if (!location && manualLocation.state) {
        console.log('Trying city only:', manualLocation.city);
        location = await geocodeLocation(manualLocation.city);
      }
      
      // If still no result, try with "United States" appended
      if (!location) {
        const queryWithUS = `${query}, United States`;
        console.log('Trying with US:', queryWithUS);
        location = await geocodeLocation(queryWithUS);
      }
      
      // If still no result, try the fallback geocoding service
      if (!location) {
        console.log('Trying fallback geocoding service for:', query);
        location = await geocodeLocationFallback(query);
      }
      
      // If fallback also failed, try fallback with US
      if (!location && manualLocation.state) {
        console.log('Trying fallback with US:', `${query}, United States`);
        location = await geocodeLocationFallback(`${query}, United States`);
      }
      
      if (location) {
        console.log('Geocoding successful:', location);
        setUserHomeLocation(location, query);
        toast({
          title: 'Location saved',
          description: `Using ${query} for travel time calculations`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
      } else {
        console.log('Geocoding failed for:', query);
        toast({
          title: 'Location not found',
          description: 'Please check the spelling and try again. Try just the city name without state.',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error) {
      // Silently handle manual location errors
      console.error('Manual location error:', error);
      toast({
        title: 'Failed to set location',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setManualLocation({ city: '', state: '' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Set Your Location</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <AlertDescription fontSize="sm">
                Set your location to see estimated travel times to meet venues.
              </AlertDescription>
            </Alert>

            {/* Current Location Option */}
            <VStack spacing={3} align="stretch">
              <Text fontWeight="medium">Option 1: Use Current Location</Text>
              <Button
                leftIcon={<FaLocationArrow />}
                colorScheme="blue"
                onClick={handleCurrentLocation}
                isLoading={loading}
                loadingText="Getting location..."
                size="lg"
              >
                Use My Current Location
              </Button>
            </VStack>

            <Divider />

            {/* Manual Location Option */}
            <VStack spacing={3} align="stretch">
              <Text fontWeight="medium">Option 2: Enter Manually</Text>
              <FormControl isRequired>
                <FormLabel>City</FormLabel>
                <Input
                  placeholder="e.g., San Francisco"
                  value={manualLocation.city}
                  onChange={(e) => setManualLocation(prev => ({ ...prev, city: e.target.value }))}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>State</FormLabel>
                <Input
                  placeholder="e.g., CA or California"
                  value={manualLocation.state}
                  onChange={(e) => setManualLocation(prev => ({ ...prev, state: e.target.value }))}
                />
              </FormControl>
              
              <Button
                leftIcon={<FaMapMarkerAlt />}
                colorScheme="green"
                onClick={handleManualLocation}
                isLoading={loading}
                isDisabled={!manualLocation.city.trim()}
                size="lg"
              >
                Set Location
              </Button>
            </VStack>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={handleClose}>
            Skip for Now
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 