import React from 'react';
import { Box, Container, Heading, Text, VStack } from '@chakra-ui/react';
import { NewWorkoutCreator } from '../components/WorkoutCreator';

const WorkoutCreatorTest: React.FC = () => {
  return (
    <Container maxW="full" p={0}>
      <Box minH="100vh" bg="gray.50">
        <VStack spacing={6} p={6}>
          <Heading size="lg">New Workout Creator Test</Heading>
          <Text>Testing the new block-first workout creation flow</Text>
          <Box w="full">
            <NewWorkoutCreator />
          </Box>
        </VStack>
      </Box>
    </Container>
  );
};

export default WorkoutCreatorTest; 