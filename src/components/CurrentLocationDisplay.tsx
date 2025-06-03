import React, { useState, useEffect } from 'react';
import { Text, Spinner } from '@chakra-ui/react';

export const CurrentLocationDisplay: React.FC = () => {
  const [homeLocation, setHomeLocation] = useState<any>(null);
  const [locationText, setLocationText] = useState<string>('');
  const [loading, setLoading] = useState(false);

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
    if (!homeLocation) {
      setLocationText('');
      return;
    }

    // If we have display text from when the location was saved, use that
    if (homeLocation.displayText) {
      setLocationText(homeLocation.displayText);
      return;
    }

    // Otherwise fall back to reverse geocoding
    const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
      try {
        // Try the fallback Photon API first since Nominatim has been unreliable
        const response = await fetch(
          `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&limit=1`,
          {
            headers: {
              'User-Agent': 'TrackMeetApp/1.0'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.features && data.features.length > 0) {
            const properties = data.features[0].properties;
            const city = properties.city || properties.locality || properties.name;
            const state = properties.state;
            
            if (city && state) {
              return `${city}, ${state}`;
            }
          }
        }
        
        // Fallback to Nominatim if Photon fails
        const nominatimResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'TrackMeetApp/1.0'
            }
          }
        );
        
        if (nominatimResponse.ok) {
          const data = await nominatimResponse.json();
          if (data && data.address) {
            const { city, town, village, county, state } = data.address;
            const place = city || town || village || county;
            return place && state ? `${place}, ${state}` : null;
          }
        }
        
        return null;
      } catch (error) {
        return null;
      }
    };

    const updateLocationText = async () => {
      setLoading(true);
      
      const readableLocation = await reverseGeocode(homeLocation.lat, homeLocation.lng);
      
      if (readableLocation) {
        setLocationText(readableLocation);
      } else {
        // Final fallback to coordinates
        setLocationText(`${homeLocation.lat.toFixed(4)}, ${homeLocation.lng.toFixed(4)}`);
      }
      
      setLoading(false);
    };

    updateLocationText();
  }, [homeLocation]);

  if (!homeLocation) {
    return null;
  }

  if (loading) {
    return <Spinner size="xs" color="white" />;
  }

  if (!locationText) {
    return null;
  }

  return (
    <Text color="white" fontSize="sm" fontWeight="medium" noOfLines={1}>
      {locationText}
    </Text>
  );
}; 