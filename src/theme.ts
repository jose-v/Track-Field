import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'light',
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
      500: '#3E213A', // primary base
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
      400: '#FFD204', // accent base
      500: '#e6bd00',
      600: '#b39500',
      700: '#806d00',
      800: '#4d4400',
      900: '#1a1c00',
    },
    background: '#F5F4FA',
    surface: '#FFFFFF',
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
        fontWeight: 'semibold',
        borderRadius: '6px',
      },
      variants: {
        solid: {
          bg: 'primary.500',
          color: 'white',
          _hover: {
            bg: 'primary.600',
            color: 'white',
          },
        },
        accent: {
          bg: 'accent.400',
          color: 'primary.500',
          _hover: {
            bg: 'accent.300',
            color: 'white',
          },
        },
      },
    },
    Text: {
      baseStyle: {
        fontSize: 'md',
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: 'bold',
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'white',
        color: 'gray.800',
      },
    },
  },
})

export { theme } 