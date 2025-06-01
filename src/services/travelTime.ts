import React from 'react';

// Travel time calculation service
interface Location {
  lat: number;
  lng: number;
}

// Enhanced location interface to include display text
interface LocationWithText extends Location {
  displayText?: string; // The original text like "Greensboro, NC"
}

interface TravelTime {
  driving: string;
  flying: string;
  distance: number; // in miles
}

// Average speeds for travel time estimation
const AVERAGE_DRIVING_SPEED = 65; // mph (highway speed)
const AVERAGE_FLIGHT_SPEED = 500; // mph (commercial flight speed)
const FLIGHT_OVERHEAD_TIME = 3; // hours (check-in, security, boarding, taxi, etc.)

// Convert degrees to radians
const toRadians = (degrees: number): number => degrees * (Math.PI / 180);

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (from: Location, to: Location): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(to.lat - from.lat);
  const dLon = toRadians(to.lng - from.lng);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

// Calculate travel times based on distance
const calculateTravelTimes = (from: Location, to: Location): TravelTime => {
  const distance = calculateDistance(from, to);
  
  // Calculate driving time
  const drivingHours = distance / AVERAGE_DRIVING_SPEED;
  const drivingTime = formatTime(drivingHours);
  
  // Calculate flying time (including overhead)
  const flightHours = (distance / AVERAGE_FLIGHT_SPEED) + FLIGHT_OVERHEAD_TIME;
  const flyingTime = formatTime(flightHours);
  
  return {
    driving: drivingTime,
    flying: flyingTime,
    distance: Math.round(distance)
  };
};

// Format time in hours to readable format
const formatTime = (hours: number): string => {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  } else if (hours < 24) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days}d ${remainingHours}h`;
  }
};

// Geocode location using Nominatim API with error handling
const geocodeLocation = async (query: string): Promise<Location | null> => {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1`;
    
    console.log('Geocoding API URL:', url);
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'TrackMeetApp/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    console.log('Geocoding API response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.log('Geocoding API error response:', response);
      return null;
    }
    
    const data = await response.json();
    console.log('Geocoding API response data:', data);
    
    if (data && data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
      console.log('Geocoding successful, parsed result:', result);
      return result;
    }
    
    console.log('Geocoding API returned empty results for query:', query);
    return null;
  } catch (error) {
    console.log('Geocoding API error for query:', query, 'Error:', error);
    return null;
  }
};

// Backup geocoding using a different service
const geocodeLocationFallback = async (query: string): Promise<Location | null> => {
  try {
    // Try using Photon API (Komoot's geocoding service)
    const encodedQuery = encodeURIComponent(query);
    const url = `https://photon.komoot.io/api/?q=${encodedQuery}&limit=1`;
    
    console.log('Fallback geocoding API URL:', url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'TrackMeetApp/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    console.log('Fallback geocoding response status:', response.status);
    
    if (!response.ok) {
      console.log('Fallback geocoding failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    console.log('Fallback geocoding response:', data);
    
    if (data && data.features && data.features.length > 0) {
      const coords = data.features[0].geometry.coordinates;
      const result = {
        lat: coords[1], // GeoJSON format: [lng, lat]
        lng: coords[0]
      };
      console.log('Fallback geocoding successful:', result);
      return result;
    }
    
    console.log('Fallback geocoding returned no results');
    return null;
  } catch (error) {
    console.log('Fallback geocoding error:', error);
    return null;
  }
};

// Get user's current location
const getUserLocation = (): Promise<Location | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    
    const options = {
      timeout: 15000, // Increased timeout to 15 seconds
      maximumAge: 600000, // 10 minutes
      enableHighAccuracy: false
    };
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        // Silently handle geolocation errors to reduce console noise
        resolve(null);
      },
      options
    );
  });
};

// Store and retrieve user's home location in localStorage
const setUserHomeLocation = (location: Location, displayText?: string): void => {
  try {
    const locationWithText: LocationWithText = {
      ...location,
      displayText
    };
    localStorage.setItem('userHomeLocation', JSON.stringify(locationWithText));
    
    // Dispatch custom event to notify all components using the hook
    const event = new CustomEvent('userHomeLocationChanged', { 
      detail: locationWithText 
    });
    window.dispatchEvent(event);
  } catch (error) {
    console.warn('Failed to save home location:', error);
  }
};

const getUserHomeLocation = (): LocationWithText | null => {
  try {
    const stored = localStorage.getItem('userHomeLocation');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to get home location:', error);
    return null;
  }
};

// React hook for home location
const useUserHomeLocation = () => {
  const [homeLocation, setHomeLocation] = React.useState<LocationWithText | null>(null);
  
  React.useEffect(() => {
    // Load initial location
    const stored = getUserHomeLocation();
    if (stored) {
      setHomeLocation(stored);
    }
    
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
  
  return homeLocation;
};

export {
  calculateTravelTimes,
  getUserLocation,
  geocodeLocation,
  geocodeLocationFallback,
  setUserHomeLocation,
  getUserHomeLocation,
  useUserHomeLocation
};

export type { Location, LocationWithText, TravelTime }; 