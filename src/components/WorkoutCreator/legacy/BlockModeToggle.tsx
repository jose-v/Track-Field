import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  useColorModeValue,
  Tooltip,
  Switch,
  FormControl,
  FormLabel,
  IconButton,
} from '@chakra-ui/react';
import { HelpCircle } from 'lucide-react';

interface BlockModeToggleProps {
  isBlockMode: boolean;
  onToggle: (isBlockMode: boolean) => void;
  exerciseCount: number;
  blockCount?: number;
  disabled?: boolean;
}

export const BlockModeToggle: React.FC<BlockModeToggleProps> = ({
  isBlockMode,
  onToggle,
  exerciseCount,
  blockCount = 0,
  disabled = false
}) => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const simpleBorderColor = 'blue.300';
  const blockBorderColor = 'green.300';
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  const featureTooltip = isBlockMode ? `
Block Mode Benefits:
• Auto-organize exercises by training phase
• Group warm-up → main set → cool-down
• Set different flow types (circuit, EMOM, AMRAP)
• Configure rest periods per block
• Use pre-built training templates
• Better workout structure for athletes
  `.trim() : `
Exercise Mode Benefits:
• Simple, familiar exercise list format
• Quick setup for basic workouts
• Compatible with existing templates
• Traditional workout creation
• No complex organization needed
  `.trim();

  return (
    <Box
      bg={bg}
      border="1px"
      borderColor={isBlockMode ? blockBorderColor : simpleBorderColor}
      borderRadius="lg"
      p={3}
      transition="all 0.2s"
    >
      <HStack justify="space-between" align="center" spacing={4}>
        {/* Left: Mode Info - Fixed Width */}
        <Box minW="180px">
          <HStack spacing={2} align="center">
            <Text fontWeight="bold" color={textColor} fontSize="md">
              {isBlockMode ? 'Block Mode' : 'Exercise Mode'}
            </Text>
            <Tooltip
              label={featureTooltip}
              placement="top"
              hasArrow
              bg="gray.700"
              color="white"
              fontSize="sm"
              maxW="300px"
              whiteSpace="pre-line"
              p={3}
              borderRadius="md"
            >
              <IconButton
                icon={<HelpCircle size={14} />}
                size="xs"
                variant="ghost"
                color={mutedColor}
                _hover={{ color: textColor }}
                aria-label="Show features"
              />
            </Tooltip>
          </HStack>
          <Text fontSize="xs" color={mutedColor}>
            {isBlockMode 
              ? 'Structured training blocks'
              : 'Traditional exercise list'
            }
          </Text>
        </Box>

        {/* Center: Stats - Fixed Width */}
        <Box minW="140px">
          <HStack spacing={4} justify="center">
            <Text fontSize="sm" color={mutedColor}>
              {exerciseCount} ex
            </Text>
            <Box minW="60px">
              {isBlockMode ? (
                <Text fontSize="sm" color="green.500">
                  {blockCount} blocks
                </Text>
              ) : (
                <Text fontSize="sm" color="transparent">
                  0 blocks
                </Text>
              )}
            </Box>
          </HStack>
        </Box>

        {/* Right: Badge + Toggle - Fixed Width */}
        <Box minW="160px">
          <HStack spacing={3} justify="flex-end" align="center">
            <Box
              bg={isBlockMode ? 'green.300' : 'blue.300'}
              color="gray.800"
              fontSize="xs"
              minW="70px"
              textAlign="center"
              borderRadius="md"
              px={2}
              py={1}
              fontWeight="medium"
            >
              {isBlockMode ? 'ADVANCED' : 'SIMPLE'}
            </Box>

            <FormControl display="flex" alignItems="center" width="auto">
              <Switch
                id="block-mode-toggle"
                isChecked={isBlockMode}
                onChange={(e) => onToggle(e.target.checked)}
                isDisabled={disabled}
                colorScheme={isBlockMode ? "green" : "blue"}
                size="md"
                sx={{
                  '& .chakra-switch__track': {
                    bg: isBlockMode ? 'green.300' : 'blue.300'
                  }
                }}
              />
            </FormControl>
          </HStack>
        </Box>
      </HStack>
    </Box>
  );
}; 