import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Text,
  Code,
  Box,
  useColorModeValue,
  Divider,
} from '@chakra-ui/react';
import { PWADebugger } from '../utils/pwaDebug';

interface PWADebugConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWADebugConsole = ({ isOpen, onClose }: PWADebugConsoleProps) => {
  const [debugLog, setDebugLog] = useState<any[]>([]);
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const loadDebugLog = () => {
    const log = PWADebugger.getDebugLog();
    setDebugLog(log);
  };

  const clearLog = () => {
    PWADebugger.clearDebugLog();
    setDebugLog([]);
  };

  const analyzeCurrentState = () => {
    const analysis = PWADebugger.analyzeStartup();
    PWADebugger.log('Manual PWA Analysis Triggered', analysis);
    loadDebugLog();
  };

  // Load debug log when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDebugLog();
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxH="80vh">
        <ModalHeader>PWA Debug Console</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <Box>
              <Button onClick={loadDebugLog} mr={2} size="sm">
                Refresh Log
              </Button>
              <Button onClick={clearLog} mr={2} size="sm" colorScheme="red" variant="outline">
                Clear Log
              </Button>
              <Button onClick={analyzeCurrentState} size="sm" colorScheme="blue">
                Analyze Current State
              </Button>
            </Box>

            <Divider />

            <Box>
              <Text fontWeight="bold" mb={2}>Debug Log ({debugLog.length} entries):</Text>
              <Box
                maxH="400px"
                overflowY="auto"
                bg={bgColor}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="md"
                p={3}
              >
                {debugLog.length === 0 ? (
                  <Text color="gray.500" fontStyle="italic">No debug entries found</Text>
                ) : (
                  <VStack spacing={2} align="stretch">
                    {debugLog.map((entry, index) => (
                      <Box
                        key={index}
                        p={2}
                        bg={useColorModeValue('white', 'gray.800')}
                        borderRadius="sm"
                        fontSize="sm"
                      >
                        <Text fontWeight="bold" color="blue.600">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </Text>
                        <Text>{entry.message}</Text>
                        <Text fontSize="xs" color="gray.500">
                          URL: {entry.url}
                        </Text>
                        {entry.data && (
                          <Code
                            display="block"
                            p={2}
                            mt={1}
                            fontSize="xs"
                            maxH="100px"
                            overflowY="auto"
                          >
                            {JSON.stringify(entry.data, null, 2)}
                          </Code>
                        )}
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}; 