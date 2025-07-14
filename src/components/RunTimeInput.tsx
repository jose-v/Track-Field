import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  HStack,
  Text,
  VStack,
  useColorModeValue,
  useBreakpointValue,
} from '@chakra-ui/react';

interface RunTimeInputProps {
  onTimeChange: (minutes: number, seconds: number, hundredths: number) => void;
  initialMinutes?: number;
  initialSeconds?: number;
  initialHundredths?: number;
  placeholder?: string;
}

const debounce = (func: () => void, delay: number) => {
  let timeout: NodeJS.Timeout;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(func, delay);
  };
};

const ScrollColumn = ({
  label,
  min,
  max,
  value,
  onChange,
  formatValue = (v: number) => v.toString(),
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  const handleScroll = debounce(() => {
    const el = listRef.current;
    if (!el) return;
    const index = Math.round(el.scrollTop / 40);
    onChange(Math.min(max, Math.max(min, index)));
  }, 100);

  return (
    <VStack spacing={1} align="center">
      <Text fontSize="sm" fontWeight="medium" color={useColorModeValue('gray.500', 'gray.400')}>
        {label}
      </Text>
      <Box
        ref={listRef}
        onScroll={handleScroll}
        height="120px"
        width="90px"
        overflowY="auto"
        scrollSnapType="y mandatory"
        css={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
        sx={{
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <VStack spacing={0} py="40px">
          {numbers.map((num) => (
            <Box
              key={num}
              height="40px"
              scrollSnapAlign="center"
              display="flex"
              alignItems="center"
              justifyContent="center"
              width="100%"
            >
              <Text
                fontSize="xl"
                fontWeight={num === value ? 'bold' : 'normal'}
                color={num === value ? useColorModeValue('gray.800', 'white') : useColorModeValue('gray.500', 'gray.400')}
                opacity={num === value ? 1 : 0.5}
              >
                {formatValue(num)}
              </Text>
            </Box>
          ))}
        </VStack>
      </Box>
    </VStack>
  );
};

export const RunTimeInput: React.FC<RunTimeInputProps> = ({
  onTimeChange,
  initialMinutes = 0,
  initialSeconds = 0,
  initialHundredths = 0,
  placeholder = "Enter your time",
}) => {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(initialSeconds);
  const [hundredths, setHundredths] = useState(initialHundredths);

  const modalHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const modalHeaderBorderColor = useColorModeValue('gray.200', 'gray.600');
  const modalHeadingColor = useColorModeValue('gray.800', 'white');
  const modalTextColor = useColorModeValue('gray.500', 'gray.400');

  const instructionText = "ENTER YOUR RUN TIME";

  useEffect(() => {
    onTimeChange(minutes, seconds, hundredths);
  }, [minutes, seconds, hundredths, onTimeChange]);

  return (
    <VStack spacing={1} w="100%">
      <Box
        bg={modalHeaderBg}
        borderRadius="xl"
        p={6}
        border="1px solid"
        borderColor={modalHeaderBorderColor}
        w="100%"
      >
        <HStack spacing={4} justify="center" align="center" position="relative">
          <ScrollColumn label="Min" min={0} max={59} value={minutes} onChange={setMinutes} />
          <Text fontSize="2xl" fontWeight="bold" color={modalHeadingColor} mt={5}>:</Text>
          <ScrollColumn label="Sec" min={0} max={59} value={seconds} onChange={setSeconds} formatValue={(v) => v.toString().padStart(2, '0')} />
          <Text fontSize="2xl" fontWeight="bold" color={modalHeadingColor} mt={5}>:</Text>
          <ScrollColumn label="Hun" min={0} max={99} value={hundredths} onChange={setHundredths} formatValue={(v) => v.toString().padStart(2, '0')} />
        </HStack>

        <Text
          fontSize="sm"
          color={modalTextColor}
          textAlign="center"
          fontWeight="medium"
          textTransform="uppercase"
          mt={4}
        >
          {instructionText}
        </Text>
      </Box>
    </VStack>
  );
};
