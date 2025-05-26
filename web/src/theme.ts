import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

/**
 * Theme configuration from brand-guidelines.html
 */
const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

const theme = extendTheme({
  config,
  colors: {
    primary: {
      50: '#ebe5ea',
      100: '#cabfd0',
      200: '#a998b5',
      300: '#88729b',
      400: '#664c81',
      500: '#2d3748', // primary base - from guidelines
      600: '#341c30',
      700: '#291625',
      800: '#1f111b',
      900: '#140b10',
    },
    accent: {
      50: '#fff6cc',
      100: '#ffec99',
      200: '#ffe366',
      300: '#ffd933',
      400: '#ecc94b', // accent base - from guidelines
      500: '#e6bd00',
      600: '#b39500',
      700: '#806d00',
      800: '#4d4400',
      900: '#1a1c00',
    },
    background: '#F5F4FA', // from guidelines
    surface: '#FFFFFF', // from guidelines
    text: {
      primary: '#2D3748', // from guidelines
      secondary: '#555555', // from guidelines
    },
    border: '#E0E0E0', // from guidelines
    success: '#22C55E', // from guidelines
    error: '#EF4444', // from guidelines
    info: '#c53030', // from guidelines (matches primary)
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
    '7xl': '4.5rem',
    '8xl': '6rem',
    '9xl': '8rem',
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: '6px', // from guidelines
        transition: 'opacity 0.2s',
      },
      variants: {
        // Primary button (purple with white text)
        primary: {
          bg: 'primary.500',
          color: 'white !important',
          borderColor: 'transparent',
          _hover: {
            opacity: 0.85, // from guidelines
            bg: 'primary.500', // keep the same color, just change opacity
            color: 'white !important',
            borderColor: 'transparent',
          },
          _focus: {
            color: 'white !important',
            borderColor: 'transparent',
          },
          _active: {
            color: 'white !important',
            borderColor: 'transparent',
          },
          // Use specificity by adding semantic styles
          _groupHover: {
            color: 'white !important',
          },
          _groupFocus: {
            color: 'white !important',
          },
        },
        // Accent button (yellow with purple text)
        accent: {
          bg: 'accent.400',
          color: 'primary.500 !important',
          _hover: {
            opacity: 0.85, // from guidelines
            bg: 'accent.400', // keep the same color, just change opacity
            color: 'primary.500 !important',
          },
        },
        // Keep the default solid style for backward compatibility
        solid: {
          bg: 'primary.500',
          color: 'white !important',
          _hover: {
            opacity: 0.85,
            color: 'white !important',
          },
        },
      },
      defaultProps: {
        variant: 'primary',
      },
    },
    Badge: {
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
          bg: 'accent.400',
          color: 'primary.500',
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'surface',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '24px',
        },
      },
    },
    Text: {
      baseStyle: {
        fontSize: 'md',
        color: 'text.primary',
      },
      variants: {
        secondary: {
          color: 'text.secondary',
        },
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: 'bold',
        color: 'text.primary',
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'background',
        color: 'text.primary',
        fontFamily: 'Inter, system-ui, sans-serif',
        lineHeight: 1.55,
      },
    },
  },
  shadows: {
    sm: '0 2px 8px rgba(0,0,0,0.1)', // from guidelines
    md: '0 4px 16px rgba(0,0,0,0.2)', // from guidelines
  },
  radii: {
    sm: '6px', // from guidelines
    md: '8px', // from guidelines
  },
})

export { theme } 