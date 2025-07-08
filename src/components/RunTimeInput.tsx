import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  HStack,
  Text,
  VStack,
  useColorModeValue,
  useBreakpointValue,
  Icon,
} from '@chakra-ui/react';
import { FaStopwatch } from 'react-icons/fa';

interface RunTimeInputProps {
  onTimeChange: (minutes: number, seconds: number, hundredths: number) => void;
  initialMinutes?: number;
  initialSeconds?: number;
  initialHundredths?: number;
  placeholder?: string;
}

interface ScrollPickerProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  label: string;
  formatValue?: (value: number) => string;
}

const ScrollPicker: React.FC<ScrollPickerProps> = ({
  value,
  onChange,
  min,
  max,
  label,
  formatValue = (val) => val.toString()
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);

  const modalTextColor = useColorModeValue('gray.500', 'gray.400');
  const modalHeadingColor = useColorModeValue('gray.800', 'white');

  // Generate array of numbers
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  const handleStart = (clientY: number) => {
    setIsDragging(true);
    setStartY(clientY);
    setStartValue(value);
  };

  const handleMove = (clientY: number) => {
    if (!isDragging) return;
    
    const deltaY = startY - clientY;
    const step = Math.round(deltaY / 30); // 30px per step
    const newValue = Math.max(min, Math.min(max, startValue + step));
    
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handleStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handleMove(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handleEnd();
  };

  // Attach global mouse events when dragging
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleMove(e.clientY);
      };
      
      const handleGlobalMouseUp = () => {
        handleEnd();
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, startY, startValue]);

  return (
    <VStack spacing={1}>
      <Text 
        color={modalTextColor} 
        fontSize="sm"
        fontWeight="medium"
        textTransform="uppercase"
        letterSpacing="wider"
      >
        {label}
      </Text>
      <Box
        ref={containerRef}
        width="90px"
        height="120px"
        position="relative"
        overflow="hidden"
        borderRadius="lg"
        bg={useColorModeValue('gray.100', 'gray.600')}
        cursor="ns-resize"
        userSelect="none"
        onMouseDown={handleMouseDown}
        onMouseMove={isDragging ? handleMouseMove : undefined}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      >
        {/* Numbers container */}
        <VStack
          spacing={0}
          position="absolute"
          left="50%"
          transform={`translateX(-50%) translateY(${-(value - min) * 40}px)`}
          transition={isDragging ? 'none' : 'transform 0.2s ease-out'}
          py="40px"
          zIndex="3"
        >
          {numbers.map((num) => (
            <Box
              key={num}
              height="40px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              width="80px"
              zIndex="3"
            >
              <Text
                fontSize="xl"
                fontWeight="bold"
                color={num === value ? modalHeadingColor : modalTextColor}
                opacity={num === value ? 1 : 0.4}
                transition="all 0.2s"
                zIndex="3"
              >
                {formatValue(num)}
              </Text>
            </Box>
          ))}
        </VStack>

        {/* Gradient overlays for fade effect */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          height="25px"
          bg={useColorModeValue(
            'linear-gradient(to bottom, rgba(247,250,252,1) 0%, rgba(247,250,252,0) 100%)',
            'linear-gradient(to bottom, rgba(75,85,99,1) 0%, rgba(75,85,99,0) 100%)'
          )}
          zIndex="3"
          pointerEvents="none"
        />
        <Box
          position="absolute"
          bottom="0"
          left="0"
          right="0"
          height="25px"
          bg={useColorModeValue(
            'linear-gradient(to top, rgba(247,250,252,1) 0%, rgba(247,250,252,0) 100%)',
            'linear-gradient(to top, rgba(75,85,99,1) 0%, rgba(75,85,99,0) 100%)'
          )}
          zIndex="3"
          pointerEvents="none"
        />
      </Box>
    </VStack>
  );
};

export const RunTimeInput: React.FC<RunTimeInputProps> = ({
  onTimeChange,
  initialMinutes = 0,
  initialSeconds = 0,
  initialHundredths = 0,
  placeholder = "Enter your time"
}) => {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(initialSeconds);
  const [hundredths, setHundredths] = useState(initialHundredths);

  // Theme colors matching the modal design
  const modalHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const modalHeaderBorderColor = useColorModeValue('gray.200', 'gray.600');
  const modalHeadingColor = useColorModeValue('gray.800', 'white');
  const modalTextColor = useColorModeValue('gray.500', 'gray.400');
  
  // Responsive instruction text
  const instructionText = useBreakpointValue({ 
    base: "Enter your run time", 
    md: "Scroll or drag to adjust time" 
  });

  // Sync internal state with prop changes (for form reset functionality)
  // Only reset when props are actually being reset to zero (not during normal user input)
  useEffect(() => {
    if (initialMinutes === 0 && initialSeconds === 0 && initialHundredths === 0) {
      // Only reset to zero if current values are not already zero (avoid unnecessary updates)
      if (minutes !== 0 || seconds !== 0 || hundredths !== 0) {
        setMinutes(0);
        setSeconds(0);
        setHundredths(0);
      }
    }
  }, [initialMinutes, initialSeconds, initialHundredths, minutes, seconds, hundredths]);

  // Call onTimeChange whenever any value changes
  useEffect(() => {
    onTimeChange(minutes, seconds, hundredths);
  }, [minutes, seconds, hundredths, onTimeChange]);

  return (
    <VStack spacing={1} w="100%">
      {/* Header outside the card - Desktop only */}
      <Text 
        fontSize="sm" 
        fontWeight="medium" 
        color={modalTextColor}
        textTransform="uppercase"
        letterSpacing="wider"
        display={{ base: "none", md: "block" }}
      >
        {placeholder}
      </Text>
      
      {/* Card content */}
      <Box
        bg={modalHeaderBg}
        borderRadius="xl"
        p={6}
        border="1px solid"
        borderColor={modalHeaderBorderColor}
        w="100%"
      >
        {/* Scroll pickers */}
        <HStack spacing={4} justify="center" align="center" position="relative">
          <ScrollPicker
            value={minutes}
            onChange={setMinutes}
            min={0}
            max={59}
            label="Min"
          />

          <Text fontSize="2xl" fontWeight="bold" color={modalHeadingColor} mt={5}>:</Text>

          <ScrollPicker
            value={seconds}
            onChange={setSeconds}
            min={0}
            max={59}
            label="Sec"
            formatValue={(val) => val.toString().padStart(2, '0')}
          />

          <Text fontSize="2xl" fontWeight="bold" color={modalHeadingColor} mt={5}>:</Text>

          <ScrollPicker
            value={hundredths}
            onChange={setHundredths}
            min={0}
            max={99}
            label="Hun"
            formatValue={(val) => val.toString().padStart(2, '0')}
          />
          
          {/* Selection box spanning all three pickers */}
          <Box
            position="absolute"
            left="-17px"
            right="-17px"
            top="50.2%"
            transform="translateY(-8px)"
            height="40px"
            border="2px solid"
            borderColor={useColorModeValue('gray.400', 'gray.400')}
            borderRadius="5px"
            pointerEvents="none"
            zIndex="1"
            opacity="0.5"
          />
        </HStack>

        {/* Instructions */}
        <Text 
          fontSize="xs" 
          color={modalTextColor} 
          textAlign="center" 
          fontStyle="italic"
          opacity={0.7}
          mt={4}
        >
          {instructionText}
        </Text>
      </Box>
    </VStack>
  );
}; 