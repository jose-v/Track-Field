import React from 'react';
import { Box } from '@chakra-ui/react';
import { WorkoutCreatorWireframe } from '../components/WorkoutCreator';

const WorkoutCreatorDemo: React.FC = () => {
  return (
    <Box w="100%" bg="gray.50">
      <WorkoutCreatorWireframe />
    </Box>
  );
};

export default WorkoutCreatorDemo; 