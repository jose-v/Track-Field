/**
 * Meets page with minimalist wireframe design
 * Supports both coach and athlete views with real data
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  useToast,
  Badge,
  Link,
  Tooltip,
  IconButton,
  useColorModeValue,
  Flex,
  Grid,
  useDisclosure,
  Spinner,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  SimpleGrid,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  DrawerFooter,
  CheckboxGroup,
  Checkbox,
  FormControl,
  FormLabel,
  Input,
  Select,
  FormErrorMessage,
  Icon
} from '@chakra-ui/react';
import { 
  FaArrowLeft, 
  FaCar, 
  FaPlane, 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaExternalLinkAlt,
  FaEdit,
  FaTrash,
  FaUsers,
  FaRunning,
  FaStickyNote,
  FaCog,
  FaEllipsisV,
  FaFileAlt,
  FaPlus,
  FaChalkboardTeacher,
  FaPhoneAlt,
  FaAt,
  FaBed,
  FaGlobe,
  FaUserTie,
  FaDownload,
  FaShare,
  FaUserFriends
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { MeetFormDrawer, type TrackMeetFormData, type TrackMeetData } from '../components/meets/MeetFormDrawer';
import type { TrackMeet } from '../types/trackMeets';
import { useForm } from 'react-hook-form';
import type { MeetEventFormData } from '../types/trackMeets';
import { calculateTravelTimes, getUserLocation, geocodeLocation, geocodeLocationFallback } from '../services/travelTime';
import { LocationSetup } from '../components/LocationSetup';
import { CurrentLocationDisplay } from '../components/CurrentLocationDisplay';
import { RunTimeModal } from '../components/meets/RunTimeModal';
import { useMeetPDFGenerator } from '../components/meets/MeetPDFGenerator';

// Info Badge Component - Shows database stats
const InfoBadge: React.FC<{ children: React.ReactNode; count?: number }> = ({ children, count }) => (
  <Text
    fontSize="xs"
    fontWeight="medium"
    color="white"
    bg="#1A202C"
    px={3}
    py={2}
    borderRadius="md"
  >
    {children} {count !== undefined && `(${count})`}
  </Text>
);

// Custom Travel Time Component for Dark Theme
const TravelTimeForMeetsCard: React.FC<{ 
  city?: string; 
  state?: string; 
  venueName?: string; 
}> = ({ city, state, venueName }) => {
  const [travelTimes, setTravelTimes] = useState<{driving: string; flying: string; distance: number} | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const calculateTimes = async () => {
      if (!city && !state && !venueName) return;
      
      setLoading(true);
      try {
        // Get user location directly from localStorage instead of using the hook
        let userLocation = null;
        try {
          const stored = localStorage.getItem('userHomeLocation');
          userLocation = stored ? JSON.parse(stored) : null;
        } catch (error) {
          console.warn('Failed to get home location:', error);
        }
        
        // If no stored location, try to get current location
        if (!userLocation) {
          try {
            userLocation = await getUserLocation();
            if (!userLocation) {
              setLoading(false);
              return;
            }
          } catch (err) {
            setLoading(false);
            return;
          }
        }
        
        const destParts = [venueName, city, state].filter(Boolean);
        const destinationQuery = destParts.join(', ');
        let destinationLocation = await geocodeLocation(destinationQuery);
        
        if (!destinationLocation) {
          destinationLocation = await geocodeLocationFallback(destinationQuery);
        }
        
        if (destinationLocation) {
          const times = calculateTravelTimes(userLocation, destinationLocation);
          setTravelTimes(times);
        }
      } catch (error) {
        console.error('Travel time calculation error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    calculateTimes();
  }, [city, state, venueName]);

  if (loading) {
    return (
      <VStack align="start" spacing={2} color="white">
        <HStack spacing={2}>
          <Spinner size="xs" color="white" />
          <Text fontSize="md" color="white">Calculating...</Text>
        </HStack>
      </VStack>
    );
  }

  if (!travelTimes) {
    return (
      <VStack align="start" spacing={2} color="white">
        <HStack spacing={2}>
          <FaCar size={20} color="currentColor" />
          <Text fontSize="md" color="white">Distance TBD</Text>
        </HStack>
        <HStack spacing={2}>
          <FaPlane size={20} color="currentColor" />
          <Text fontSize="md" color="white">Flight TBD</Text>
        </HStack>
      </VStack>
    );
  }

  return (
    <VStack align="start" spacing={2} color="white">
      <HStack spacing={2}>
        <FaCar size={20} color="currentColor" />
        <Text fontSize="md" color="white" fontWeight="medium">{travelTimes.driving}</Text>
      </HStack>
      {travelTimes.distance > 100 && (
        <HStack spacing={2}>
          <FaPlane size={20} color="currentColor" />
          <Text fontSize="md" color="white" fontWeight="medium">{travelTimes.flying}</Text>
        </HStack>
      )}
    </VStack>
  );
};

// Individual Meet Card Component - moved outside main component to prevent re-creation
interface MeetCardProps {
  meet: TrackMeet;
  isCoach: boolean;
  onEdit?: (meet: TrackMeet) => void;
  onDelete?: (meet: TrackMeet) => void;
  onAssignAthletes?: (meet: TrackMeet) => void;
  onManageEvents?: (meet: TrackMeet) => void;
  onOpenRunTimeModal?: (eventData: { eventId: string; eventName: string; currentTime?: string }) => void;
  athleteCount?: number;
  eventCount?: number;
  athleteNames?: string[];
  myAssignedEvents?: Array<{ id: string; name: string; time: string | null }>;
  assignedByCoach?: string | null;
  coachPhone?: string | null;
  coachEmail?: string | null;
  // Assistant coaches
  assistantCoach1Name?: string | null;
  assistantCoach1Phone?: string | null;
  assistantCoach1Email?: string | null;
  assistantCoach2Name?: string | null;
  assistantCoach2Phone?: string | null;
  assistantCoach2Email?: string | null;
  assistantCoach3Name?: string | null;
  assistantCoach3Phone?: string | null;
  assistantCoach3Email?: string | null;
  distance?: string;
}

