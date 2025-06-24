import React from 'react';
import {
  Box,
  Container,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { SleepServiceTest } from '../components/debug/SleepServiceTest';

export function Debug() {
  // Only show in development
  if (import.meta.env.PROD) {
    return (
      <Container maxW="container.md" py={8}>
        <Alert status="warning">
          <AlertIcon />
          Debug tools are not available in production
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={6}>
        <Text fontSize="3xl" fontWeight="bold" mb={2}>
          Debug Tools
        </Text>
        <Text color="gray.600">
          Development tools for testing services and components
        </Text>
      </Box>

      <Tabs>
        <TabList>
          <Tab>Sleep Service</Tab>
          <Tab>Other Services</Tab>
          <Tab>Performance</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            <SleepServiceTest />
          </TabPanel>
          
          <TabPanel px={0}>
            <Alert status="info">
              <AlertIcon />
              Other service tests will be added here as services are implemented
            </Alert>
          </TabPanel>
          
          <TabPanel px={0}>
            <Alert status="info">
              <AlertIcon />
              Performance monitoring tools will be added here
            </Alert>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
} 