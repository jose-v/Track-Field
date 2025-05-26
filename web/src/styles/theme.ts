import { extendTheme } from '@chakra-ui/react';

/**
 * Brand colors from design guidelines
 */
const colors = {
  primary: {
    500: '#c53030', // Main primary color
  },
  accent: {
    500: '#ecc94b', // Main accent color
  },
  background: '#F5F4FA',
  surface: '#FFFFFF',
  text: {
    primary: '#2D3748',
    secondary: '#555555',
  },
  border: '#E0E0E0',
  success: '#22C55E',
  error: '#EF4444',
  info: '#c53030',
};

/**
 * Custom button styles
 */
const Button = {
  // Base styles applied to all buttons
  baseStyle: {
    fontWeight: '600',
    borderRadius: '6px',
    transition: 'opacity 0.2s',
    _hover: {
      opacity: 0.85,
    },
  },
  // Variations
  variants: {
    primary: {
      bg: 'primary.500',
      color: 'white',
    },
    accent: {
      bg: 'accent.500',
      color: 'primary.500',
    },
  },
  // Default values
  defaultProps: {
    variant: 'primary',
  },
};

/**
 * Custom badge styles
 */
const Badge = {
  baseStyle: {
    borderRadius: '6px',
    fontWeight: '600',
  },
  variants: {
    coach: {
      bg: 'primary.500',
      color: 'white',
    },
    athlete: {
      bg: 'accent.500',
      color: 'primary.500',
    },
  },
};

/**
 * Custom card styles
 */
const Card = {
  baseStyle: {
    container: {
      bg: 'surface',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      padding: '24px',
    },
  },
};

/**
 * Export theme
 */
const theme = extendTheme({
  colors,
  components: {
    Button,
    Badge,
    Card,
  },
  styles: {
    global: {
      body: {
        bg: 'background',
        color: 'text.primary',
        fontFamily: "'Inter', sans-serif",
        lineHeight: 1.55,
      },
    },
  },
  fonts: {
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
  radii: {
    sm: '6px',
    md: '8px',
  },
  shadows: {
    sm: '0 2px 8px rgba(0,0,0,0.1)',
    md: '0 4px 16px rgba(0,0,0,0.2)',
  },
});

export default theme; 