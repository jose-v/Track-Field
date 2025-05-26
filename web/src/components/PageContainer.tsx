import { Box } from '@chakra-ui/react';
import type { BoxProps } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface PageContainerProps extends BoxProps {
  children: ReactNode;
  fullWidth?: boolean;
}

/**
 * A consistent container for all pages in the application.
 * This ensures that all pages have the same width constraints and spacing.
 */
export function PageContainer({ children, fullWidth = false, ...props }: PageContainerProps) {
  return (
    <Box 
      width="100%" 
      maxW={fullWidth ? "100%" : { base: "100%", lg: "1200px" }}
      mx="auto"
      {...(!fullWidth && { px: { base: 4, md: 6 } })}
      {...props}
    >
      {children}
    </Box>
  );
} 