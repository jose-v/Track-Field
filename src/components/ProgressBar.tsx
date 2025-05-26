import React from 'react';
import {
  Box, 
  Progress, 
  Text, 
  VStack,
  useColorModeValue,
  useTheme
} from '@chakra-ui/react';

interface ProgressBarProps {
  /**
   * Current completed count
   */
  completed: number;
  
  /**
   * Total items to complete
   */
  total: number;
  
  /**
   * Optional - Override the calculated percentage
   */
  percentage?: number;
  
  /**
   * Optional - Text to show when fully completed
   */
  completedText?: string;
  
  /**
   * Optional - Text to show with the progress, defaults to "{completed} of {total} {itemLabel} completed"
   */
  progressText?: string;
  
  /**
   * Optional - Color scheme for the progress bar, defaults to "primary" for in-progress and "green" for completed
   */
  colorScheme?: string;
  
  /**
   * Optional - Size of the progress bar, defaults to "sm"
   */
  size?: "xs" | "sm" | "md" | "lg";
  
  /**
   * Optional - Height of the progress bar
   */
  height?: string;
  
  /**
   * Optional - Round the corners of the progress bar
   */
  borderRadius?: string;
  
  /**
   * Optional - Label for the items being tracked, defaults to "items"
   */
  itemLabel?: string;
  
  /**
   * Optional - Show the text below the progress bar
   */
  showText?: boolean;
  
  /**
   * Optional - Text color
   */
  textColor?: string;
  
  /**
   * Optional - Font size for the text
   */
  fontSize?: string;
  
  /**
   * Optional - Background color of the progress bar
   */
  bg?: string;
}

/**
 * A consistent progress bar component that can be used throughout the app
 */
export function ProgressBar({
  completed,
  total,
  percentage,
  completedText = "Completed",
  progressText,
  colorScheme,
  size = "sm",
  height = "8px",
  borderRadius = "md",
  itemLabel = "items",
  showText = true,
  textColor,
  fontSize = "xs",
  bg = "gray.100"
}: ProgressBarProps) {
  const theme = useTheme();
  
  // Calculate percentage if not provided
  const calculatedPercentage = percentage !== undefined 
    ? percentage 
    : total > 0 
      ? (completed / total) * 100 
      : 0;
  
  // Determine if complete
  const isComplete = completed === total && total > 0;
  
  // We'll use our theme colors directly for styling
  const progressColor =
    isComplete || colorScheme === "green"
      ? theme.colors?.green?.[500] || "#38A169"
      : colorScheme === "blue"
        ? "#3182CE"
        : theme.colors?.primary?.[500] || "#3182CE";
  
  // Default text color if not specified
  const defaultTextColor = useColorModeValue("gray.600", "gray.400");
  const finalTextColor = textColor || defaultTextColor;
  
  // Generate text to display
  const displayText = isComplete 
    ? completedText 
    : progressText || `${completed} of ${total} ${itemLabel} completed`;

  return (
    <VStack spacing={1} width="100%" align="stretch">
      <Progress
        value={calculatedPercentage}
        size={size}
        height={height}
        sx={{
          '& > div': {
            background: progressColor
          }
        }}
        borderRadius={borderRadius}
        bg={bg}
      />
      
      {showText && (
        <Text 
          fontSize={fontSize} 
          color={finalTextColor} 
          textAlign="center"
        >
          {displayText}
        </Text>
      )}
    </VStack>
  );
} 