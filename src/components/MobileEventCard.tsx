import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Icon,
  IconButton,
  Button,
  Badge,
  useColorModeValue,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Divider,
} from '@chakra-ui/react';
import { FaTimes, FaEdit, FaTrash, FaCalendarAlt, FaShare, FaMapMarkerAlt } from 'react-icons/fa';
import { BsThreeDots } from 'react-icons/bs';
import { useAuth } from '../contexts/AuthContext';

interface MobileEventCardProps {
  onEventClick?: () => void;
}

interface UpcomingEvent {
  id: string;
  date: string;
  title: string;
  location?: string;
}

export const MobileEventCard: React.FC<MobileEventCardProps> = ({ onEventClick }) => {
  const [upcomingEvent, setUpcomingEvent] = useState<UpcomingEvent | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user } = useAuth();

  // Dark theme colors to match screenshot
  const cardBg = 'gray.800';
  const textColor = 'white';
  const iconColor = 'white';
  const badgeBg = 'gray.600';
  
  // Drawer colors
  const drawerBg = useColorModeValue('white', 'gray.800');
  const drawerBorder = useColorModeValue('gray.200', 'gray.600');
  const drawerText = useColorModeValue('gray.700', 'gray.200');
  const buttonHoverBg = useColorModeValue('gray.100', 'gray.700');

  useEffect(() => {
    // For now, using mock data. In production, this would fetch from your meets/events API
    const mockEvent: UpcomingEvent = {
      id: '1',
      date: 'Jul, 28 2025',
      title: '2025 AAU Junior Olympics',
      location: 'Eugene, OR'
    };

    setUpcomingEvent(mockEvent);
  }, [user]);

  // Function to format date if needed
  const formatEventDate = (dateStr: string): string => {
    // If the date is already in the desired format, return as is
    if (dateStr.includes(',')) return dateStr;
    
    // Otherwise, try to format it
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  if (!upcomingEvent) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={6}
        boxShadow="lg"
        h="160px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color={textColor} fontSize="sm">
          No upcoming events
        </Text>
      </Box>
    );
  }

  return (
    <>
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={6}
        boxShadow="lg"
        h="160px"
        cursor="pointer"
        onClick={onEventClick}
        _hover={{ transform: 'translateY(-2px)' }}
        transition="all 0.2s"
        position="relative"
      >
        <VStack spacing={4} align="stretch" height="100%" justify="space-between">
          {/* Top Row: Next Meet badge and Date */}
          <HStack justify="space-between" align="flex-start">
            <Badge
              bg={badgeBg}
              color={textColor}
              fontSize="sm"
              px={3}
              py={1}
              borderRadius="lg"
              fontWeight="normal"
            >
              Next Meet
            </Badge>
            <Text 
              fontSize="sm" 
              fontWeight="normal" 
              color={textColor}
              textAlign="right"
              lineHeight="1.2"
            >
              {formatEventDate(upcomingEvent.date)}
            </Text>
          </HStack>

          {/* Center: Event Title */}
          <Flex flex="1" align="center" justify="center">
            <VStack spacing={1} textAlign="center">
              <Text 
                fontSize="xl" 
                fontWeight="bold" 
                color={textColor}
                lineHeight="1.3"
                textAlign="center"
              >
                2025 AAU
              </Text>
              <Text 
                fontSize="xl" 
                fontWeight="bold" 
                color={textColor}
                lineHeight="1.3"
                textAlign="center"
              >
                Junior Olympics
              </Text>
            </VStack>
          </Flex>

          {/* Bottom Row: Three dots menu */}
          <Box position="absolute" bottom={4} right={4}>
            <IconButton
              aria-label="Menu"
              icon={<Icon as={BsThreeDots} />}
              size="sm"
              variant="ghost"
              color={textColor}
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click when clicking menu
                setIsDrawerOpen(true);
              }}
              _hover={{ bg: 'gray.700' }}
            />
          </Box>
        </VStack>
      </Box>
      
      {/* Bottom Drawer Menu */}
      <Modal 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        motionPreset="slideInBottom"
        closeOnOverlayClick={true}
      >
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent 
          position="fixed"
          bottom="0"
          left="0"
          right="0"
          top="auto"
          height="50vh"
          maxHeight="50vh"
          minHeight="300px"
          borderRadius="16px 16px 0 0"
          bg={drawerBg}
          border={`1px solid ${drawerBorder}`}
          boxShadow="2xl"
          margin="0"
          maxWidth="100vw"
          width="100vw"
          display="flex"
          flexDirection="column"
        >
          <ModalBody p={0} h="100%" display="flex" flexDirection="column">
            {/* Header */}
            <Flex 
              justify="space-between" 
              align="center" 
              p={6} 
              borderBottom={`1px solid ${drawerBorder}`}
              flexShrink={0}
            >
              <Text fontSize="xl" fontWeight="bold" color={drawerText}>
                Event Options
              </Text>
              
              {/* Close Button */}
              <IconButton
                aria-label="Close menu"
                icon={<FaTimes />}
                size="lg"
                variant="ghost"
                borderRadius="full"
                onClick={() => setIsDrawerOpen(false)}
                color={drawerText}
                _hover={{ bg: buttonHoverBg }}
                fontSize="18px"
              />
            </Flex>

            {/* Menu Content */}
            <VStack spacing={0} flex="1" align="stretch" p={4}>
              {/* View Event Details */}
              <Button
                leftIcon={<FaCalendarAlt />}
                variant="ghost"
                size="lg"
                justifyContent="flex-start"
                h="60px"
                color={drawerText}
                _hover={{ bg: buttonHoverBg }}
                onClick={() => {
                  setIsDrawerOpen(false);
                  onEventClick?.();
                }}
              >
                View Event Details
              </Button>
              
              <Divider />
              
              {/* Show Location */}
              <Button
                leftIcon={<FaMapMarkerAlt />}
                variant="ghost"
                size="lg"
                justifyContent="flex-start"
                h="60px"
                color={drawerText}
                _hover={{ bg: buttonHoverBg }}
                onClick={() => {
                  setIsDrawerOpen(false);
                  // Add map/location functionality here
                }}
              >
                Show Location
              </Button>
              
              <Divider />
              
              {/* Edit Event */}
              <Button
                leftIcon={<FaEdit />}
                variant="ghost"
                size="lg"
                justifyContent="flex-start"
                h="60px"
                color={drawerText}
                _hover={{ bg: buttonHoverBg }}
                onClick={() => {
                  setIsDrawerOpen(false);
                  // Add edit functionality here
                }}
              >
                Edit Event
              </Button>
              
              <Divider />
              
              {/* Share Event */}
              <Button
                leftIcon={<FaShare />}
                variant="ghost"
                size="lg"
                justifyContent="flex-start"
                h="60px"
                color={drawerText}
                _hover={{ bg: buttonHoverBg }}
                onClick={() => {
                  setIsDrawerOpen(false);
                  // Add share functionality here
                }}
              >
                Share Event
              </Button>
              
              <Divider />
              
              {/* Remove Event */}
              <Button
                leftIcon={<FaTrash />}
                variant="ghost"
                size="lg"
                justifyContent="flex-start"
                h="60px"
                color="red.500"
                _hover={{ bg: buttonHoverBg }}
                onClick={() => {
                  setIsDrawerOpen(false);
                  // Add remove functionality here
                }}
              >
                Remove Event
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}; 