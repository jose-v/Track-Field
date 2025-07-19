import React from 'react';
import { Box, Flex, Button, Text, useColorModeValue, BoxProps } from '@chakra-ui/react';

interface CalendarYearNavBarProps extends BoxProps {
  currentYear: number;
  setCurrentYear: (year: number) => void;
  topOffset?: number; // px, optional
}

const NAV_BAR_HEIGHT = 56; // px, should match SimplifiedNavBar height

export const CalendarYearNavBar: React.FC<CalendarYearNavBarProps> = ({ currentYear, setCurrentYear, topOffset = NAV_BAR_HEIGHT, ...boxProps }) => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box
      position="absolute"
      top={`${topOffset + 60}px`}
      zIndex={1100}
      transition="top 0.3s cubic-bezier(0.4,0,0.2,1)"
      bg={bg}
      boxShadow="sm"
      borderBottom="1px solid"
      borderColor={borderColor}
      width="100vw"
      ml={{ base: "-16px", md: "-24px" }}
      mr={{ base: "-16px", md: "-24px" }}
      {...boxProps}
    >
      <Flex align="center" justify="center" gap={4} py={3}>
        <Button size="sm" variant="ghost" onClick={() => setCurrentYear(currentYear - 1)}>
          &#x2039;
        </Button>
        <Text fontWeight="bold" fontSize="lg" minW="80px" textAlign="center">{currentYear}</Text>
        <Button size="sm" variant="ghost" onClick={() => setCurrentYear(currentYear + 1)}>
          &#x203A;
        </Button>
      </Flex>
    </Box>
  );
};
export default CalendarYearNavBar; 