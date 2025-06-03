import React, { useState, useEffect } from 'react';
import {
  HStack,
  Text,
  Spinner,
  Tooltip,
  useColorModeValue,
  Box
} from '@chakra-ui/react';
import { FaCar, FaPlane } from 'react-icons/fa';
import { calculateTravelTimes, getUserLocation, geocodeLocation, geocodeLocationFallback, setUserHomeLocation } from '../services/travelTime';

// Check if we're in development mode - more browser compatible
const isDev = import.meta.env.DEV;

interface TravelTimeDisplayProps {
  city?: string;
  state?: string;
  venueName?: string;
  size?: 'sm' | 'md';
}

interface TravelTimeData {
  driving: string;
  flying: string;
  distance: number;
}

export const TravelTimeDisplay: React.FC<TravelTimeDisplayProps> = ({
  city,
  state,
  venueName,
  size = 'sm'
}) => {
  const [travelTimes, setTravelTimes] = useState<TravelTimeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [homeLocation, setHomeLocation] = useState<any>(null);
  
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const iconSize = size === 'sm' ? '12px' : '16px';
  const fontSize = size === 'sm' ? 'xs' : 'sm';

  // Get home location directly from localStorage instead of using the hook
  useEffect(() => {
    const getHomeLocation = () => {
      try {
        const stored = localStorage.getItem('userHomeLocation');
        return stored ? JSON.parse(stored) : null;
      } catch (error) {
        console.warn('Failed to get home location:', error);
        return null;
      }
    };

    // Initial load
    setHomeLocation(getHomeLocation());

    // Listen for storage changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userHomeLocation') {
        const newLocation = e.newValue ? JSON.parse(e.newValue) : null;
        setHomeLocation(newLocation);
      }
    };

    // Custom event listener for same-tab updates
    const handleLocationUpdate = (e: CustomEvent) => {
      setHomeLocation(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userHomeLocationChanged', handleLocationUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userHomeLocationChanged', handleLocationUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    const calculateTimes = async () => {
      // Reset state
      setTravelTimes(null);
      setError(null);
      
      // Check if we have the necessary data
      if (!city && !state && !venueName) {
        return;
      }
      
      // Try to get user's home location
      let userLocation = homeLocation;
      
      if (!userLocation) {
        setLoading(true);
        try {
          const currentLocation = await getUserLocation();
          if (currentLocation) {
            userLocation = currentLocation;
            // Save it for future use - this will now trigger the hook to update
            setUserHomeLocation(currentLocation); // GPS location doesn't need display text
            // Don't return here, continue with the calculation
          } else {
            setLoading(false);
            // Don't show error for geolocation failure - it's expected behavior
            return;
          }
        } catch (err) {
          setLoading(false);
          // Silently handle geolocation errors
          return;
        }
        setLoading(false);
      }
      
      if (!userLocation) {
        // No error message - just don't show travel times if no location
        return;
      }
      
      // Build destination query
      const destParts = [venueName, city, state].filter(Boolean);
      if (destParts.length === 0) {
        return;
      }
      
      setLoading(true);
      
      try {
        const destinationQuery = destParts.join(', ');
        let destinationLocation = await geocodeLocation(destinationQuery);
        
        // Try fallback geocoding service if primary fails
        if (!destinationLocation) {
          if (isDev) {
            console.log('Primary geocoding failed, trying fallback for:', destinationQuery);
          }
          destinationLocation = await geocodeLocationFallback(destinationQuery);
        }
        
        if (!destinationLocation) {
          setError('Location not found');
          return;
        }
        
        const times = calculateTravelTimes(userLocation, destinationLocation);
        setTravelTimes(times);
        
      } catch (err) {
        // Only log errors in development
        if (isDev) {
          console.error('Travel time calculation error:', err);
        }
        setError('Unable to calculate');
      } finally {
        setLoading(false);
      }
    };
    
    calculateTimes();
  }, [city, state, venueName, homeLocation]);

  if (loading) {
    return (
      <HStack spacing={1} fontSize={fontSize} color={textColor}>
        <Spinner size="xs" />
        <Text>Calculating...</Text>
      </HStack>
    );
  }

  if (error) {
    return (
      <Text fontSize={fontSize} color="gray.400" fontStyle="italic">
        {error}
      </Text>
    );
  }

  if (!travelTimes) {
    return null;
  }

  const showFlight = travelTimes.distance > 100;

  return (
    <HStack spacing={3} fontSize={fontSize} color={textColor}>
      {/* Driving Time */}
      <Tooltip 
        label={`Estimated driving time: ${travelTimes.driving}`}
        placement="top"
        openDelay={500}
      >
        <HStack spacing={1} cursor="pointer">
          <Box w={iconSize} h={iconSize} color="blue.500">
            <FaCar size={iconSize} />
          </Box>
          <Text fontWeight="medium">{travelTimes.driving}</Text>
        </HStack>
      </Tooltip>
      
      {/* Flying Time (only if >100 miles) */}
      {showFlight && (
        <Tooltip 
          label={`Estimated flight time: ${travelTimes.flying}`}
          placement="top"
          openDelay={500}
        >
          <HStack spacing={1} cursor="pointer">
            <Box w={iconSize} h={iconSize} color="green.500">
              <FaPlane size={iconSize} />
            </Box>
            <Text fontWeight="medium">{travelTimes.flying}</Text>
          </HStack>
        </Tooltip>
      )}
    </HStack>
  );
}; 