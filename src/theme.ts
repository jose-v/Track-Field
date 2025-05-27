import { extendTheme, type ThemeConfig } from '@chakra-ui/react'
import { mode } from '@chakra-ui/theme-tools'

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
      600: '#1a202c', // darker shade for hover
      700: '#171923', // even darker for active
      800: '#1f111b',
      900: '#140b10',
    },
    accent: {
      50: '#fff6cc',
      100: '#ffec99',
      200: '#ffe366',
      300: '#ffd933', // lighter shade for hover
      400: '#ecc94b', // accent base - from guidelines
      500: '#e6bd00', // darker shade for active
      600: '#b39500',
      700: '#806d00',
      800: '#4d4400',
      900: '#1a1c00',
    },
    background: '#F5F4FA', // from guidelines
    surface: '#FFFFFF', // from guidelines
    text: {
      primary: '#5a5a5a', // from guidelines
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
        transition: 'all 0.2s',
      },
      variants: {
        // Override Chakra's solid variant to use our primary colors
        solid: (props: any) => ({
          bg: mode('#2d3748', '#664c81')(props), // primary.500 in light, primary.400 in dark
          color: 'white',
          _hover: {
            bg: mode('#1a202c', '#88729b')(props), // primary.600 in light, primary.300 in dark
            _disabled: {
              bg: mode('#2d3748', '#664c81')(props),
            },
          },
          _active: {
            bg: mode('#171923', '#2d3748')(props), // primary.700 in light, primary.500 in dark
          },
        }),
        // Custom accent variant
        accent: (props: any) => ({
          bg: '#ecc94b', // accent.400
          color: '#2d3748', // primary.500 for good contrast
          _hover: {
            bg: '#ffd933', // accent.300
            _disabled: {
              bg: '#ecc94b',
            },
          },
          _active: {
            bg: '#e6bd00', // accent.500
          },
        }),
        // Custom primary variant (alias for solid)
        primary: (props: any) => ({
          bg: mode('#2d3748', '#664c81')(props), // primary.500 in light, primary.400 in dark
          color: 'white',
          _hover: {
            bg: mode('#1a202c', '#88729b')(props), // primary.600 in light, primary.300 in dark
            _disabled: {
              bg: mode('#2d3748', '#664c81')(props),
            },
          },
          _active: {
            bg: mode('#171923', '#2d3748')(props), // primary.700 in light, primary.500 in dark
          },
        }),
      },
      defaultProps: {
        variant: 'solid',
        colorScheme: 'primary',
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