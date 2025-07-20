import React from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  DrawerCloseButton,
  VStack,
  HStack,
  Text,
  Icon,
  Flex,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FaEdit,
  FaTrash,
  FaUsers,
  FaRunning,
  FaDownload,
  FaShare,
  FaPlus,
} from 'react-icons/fa';
import type { TrackMeet } from '../types/trackMeets';

interface MobileMeetOptionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  meet: TrackMeet | null;
  isCoach: boolean;
  onEdit?: (meet: TrackMeet) => void;
  onDelete?: (meet: TrackMeet) => void;
  onAssignAthletes?: (meet: TrackMeet) => void;
  onManageEvents?: (meet: TrackMeet) => void;
  onAddEvents?: (meet: TrackMeet) => void;
  onDownloadPDF?: () => void;
  onShareViaEmail?: () => void;
}

export const MobileMeetOptionsDrawer: React.FC<MobileMeetOptionsDrawerProps> = ({
  isOpen,
  onClose,
  meet,
  isCoach,
  onEdit,
  onDelete,
  onAssignAthletes,
  onManageEvents,
  onAddEvents,
  onDownloadPDF,
  onShareViaEmail,
}) => {
  // Color mode values
  const drawerBg = useColorModeValue('white', 'gray.800');
  const drawerText = useColorModeValue('gray.800', 'gray.200');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  if (!meet) return null;

  const handleAction = (action: () => void | undefined) => {
    if (action) {
      action();
    }
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} placement="bottom" onClose={onClose} size="full">
      <DrawerOverlay />
      <DrawerContent bg={drawerBg} maxH="75vh" h="auto" borderTopRadius="xl">
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px" borderColor={borderColor}>
          <VStack align="start" spacing={1}>
            <Text fontSize="lg" fontWeight="bold" color={drawerText}>
              {meet.name}
            </Text>
            <Text fontSize="sm" color={textColor}>
              {meet.venue_name || 'Venue TBD'} • {meet.city}, {meet.state}
            </Text>
          </VStack>
        </DrawerHeader>
        
        <DrawerBody overflowY="auto">
          <VStack spacing={0} align="stretch">
            {/* Coach Actions */}
            {isCoach && (
              <>
                {/* Add Events */}
                {onAddEvents && (
                  <>
                    <Flex
                      justify="space-between"
                      align="center"
                      p={4}
                      cursor="pointer"
                      _hover={{ bg: hoverBg }}
                      onClick={() => handleAction(() => onAddEvents?.(meet))}
                    >
                      <Text color={drawerText}>Add Events</Text>
                      <Icon as={FaPlus} color={textColor} />
                    </Flex>
                    <Divider />
                  </>
                )}

                {/* Manage Athletes */}
                {onAssignAthletes && (
                  <>
                    <Flex
                      justify="space-between"
                      align="center"
                      p={4}
                      cursor="pointer"
                      _hover={{ bg: hoverBg }}
                      onClick={() => handleAction(() => onAssignAthletes?.(meet))}
                    >
                      <Text color={drawerText}>Manage Athletes</Text>
                      <Icon as={FaUsers} color={textColor} />
                    </Flex>
                    <Divider />
                  </>
                )}

                {/* Manage Events */}
                {onManageEvents && (
                  <>
                    <Flex
                      justify="space-between"
                      align="center"
                      p={4}
                      cursor="pointer"
                      _hover={{ bg: hoverBg }}
                      onClick={() => handleAction(() => onManageEvents?.(meet))}
                    >
                      <Text color={drawerText}>Manage Events</Text>
                      <Icon as={FaRunning} color={textColor} />
                    </Flex>
                    <Divider />
                  </>
                )}
              </>
            )}

            {/* Athlete Actions */}
            {!isCoach && onManageEvents && (
              <>
                <Flex
                  justify="space-between"
                  align="center"
                  p={4}
                  cursor="pointer"
                  _hover={{ bg: hoverBg }}
                  onClick={() => handleAction(() => onManageEvents?.(meet))}
                >
                  <Text color={drawerText}>View Events</Text>
                  <Icon as={FaRunning} color={textColor} />
                </Flex>
                <Divider />
              </>
            )}

            {/* Download PDF */}
            {onDownloadPDF && (
              <>
                <Flex
                  justify="space-between"
                  align="center"
                  p={4}
                  cursor="pointer"
                  _hover={{ bg: hoverBg }}
                  onClick={() => handleAction(onDownloadPDF)}
                >
                  <Text color={drawerText}>Download Meet Info</Text>
                  <Icon as={FaDownload} color={textColor} />
                </Flex>
                <Divider />
              </>
            )}

            {/* Share via Email */}
            {onShareViaEmail && (
              <>
                <Flex
                  justify="space-between"
                  align="center"
                  p={4}
                  cursor="pointer"
                  _hover={{ bg: hoverBg }}
                  onClick={() => handleAction(onShareViaEmail)}
                >
                  <Text color={drawerText}>Share via Email</Text>
                  <Icon as={FaShare} color={textColor} />
                </Flex>
                <Divider />
              </>
            )}

            {/* Edit Meet */}
            {onEdit && (
              <>
                <Flex
                  justify="space-between"
                  align="center"
                  p={4}
                  cursor="pointer"
                  _hover={{ bg: hoverBg }}
                  onClick={() => handleAction(() => onEdit?.(meet))}
                >
                  <Text color={drawerText}>Edit Meet</Text>
                  <Icon as={FaEdit} color={textColor} />
                </Flex>
                <Divider />
              </>
            )}

            {/* Delete Meet */}
            {onDelete && (
              <Flex
                justify="space-between"
                align="center"
                p={4}
                cursor="pointer"
                _hover={{ bg: 'red.50' }}
                onClick={() => handleAction(() => onDelete?.(meet))}
              >
                <Text color="red.500">Delete Meet</Text>
                <Icon as={FaTrash} color="red.500" />
              </Flex>
            )}
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}; 