import React from 'react';
import { Box } from '@chakra-ui/react';
import WorkoutCreatorWireframe from '../components/WorkoutCreator/legacy/WorkoutCreatorWireframe';

const WorkoutCreatorDemo: React.FC = () => {
  return (
    <Box 
      w="calc(100% + 48px)"  // Add 48px (6 * 8px = 48px for mx="-6") to counteract the negative margins
      bg="gray.50"
      mx="-6"  // Negative margin to counteract parent's px="6" (24px padding)
      mt="-20px"  // Negative top margin to counteract parent's pt="80px" and start from the nav
      mb="-8"  // Negative bottom margin to counteract parent's pb="8"
      minH="100vh"
      position="relative"
    >
      <WorkoutCreatorWireframe />
    </Box>
  );
};

export default WorkoutCreatorDemo; 