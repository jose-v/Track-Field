import { Flex, Spinner, Box, Center } from '@chakra-ui/react'
import { RunningSpinner } from './RunningSpinner'

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type SpinnerVariant = 'page' | 'overlay' | 'inline' | 'button' | 'card' | 'minimal'
export type SpinnerType = 'circle' | 'running'

interface LoadingSpinnerProps {
  size?: SpinnerSize
  variant?: SpinnerVariant
  type?: SpinnerType
  color?: string
  thickness?: string
  speed?: string
  label?: string
  fullHeight?: boolean
}

export function LoadingSpinner({ 
  size = 'xl',
  variant = 'page',
  type = 'circle',
  color = 'blue.500',
  thickness = '4px',
  speed = '0.65s',
  label,
  fullHeight = true
}: LoadingSpinnerProps = {}) {
  
  // Base spinner component - choose between circle and running man
  const SpinnerComponent = type === 'running' ? (
    <RunningSpinner 
      size={size} 
      speed={speed}
      color={color === 'blue.500' ? 'auto' : 'dark'}
    />
  ) : (
    <Spinner
      thickness={thickness}
      speed={speed}
      emptyColor="gray.200"
      color={color}
      size={size}
      label={label}
    />
  )

  // Render based on variant
  switch (variant) {
    case 'page':
      // Full-screen loading (current behavior)
      return (
        <Flex
          height={fullHeight ? "100vh" : "400px"}
          width="100%"
          alignItems="center"
          justifyContent="center"
        >
          {SpinnerComponent}
        </Flex>
      )

    case 'overlay':
      // Fixed overlay spinner (like the old RootProviders one)
      return (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0, 0, 0, 0.5)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={9999}
        >
          {SpinnerComponent}
        </Box>
      )

    case 'card':
      // Centered in a card/container
      return (
        <Center py={8} px={4}>
          {SpinnerComponent}
        </Center>
      )

    case 'button':
      // Small spinner for buttons
      return SpinnerComponent

    case 'inline':
      // Inline spinner with margin
      return (
        <Box display="inline-block" ml={2}>
          {SpinnerComponent}
        </Box>
      )

    case 'minimal':
      // Just the spinner, no wrapper
      return SpinnerComponent

    default:
      return SpinnerComponent
  }
}

// Convenience components for common patterns
export const PageSpinner = (props: Omit<LoadingSpinnerProps, 'variant'>) => (
  <LoadingSpinner {...props} variant="page" />
)

export const CardSpinner = (props: Omit<LoadingSpinnerProps, 'variant'>) => (
  <LoadingSpinner {...props} variant="card" size={props.size || 'lg'} />
)

export const ButtonSpinner = (props: Omit<LoadingSpinnerProps, 'variant'>) => (
  <LoadingSpinner {...props} variant="button" size={props.size || 'sm'} />
)

export const InlineSpinner = (props: Omit<LoadingSpinnerProps, 'variant'>) => (
  <LoadingSpinner {...props} variant="inline" size={props.size || 'sm'} />
)

// Running man variants for track & field theme
export const RunningPageSpinner = (props: Omit<LoadingSpinnerProps, 'variant' | 'type'>) => (
  <LoadingSpinner {...props} variant="page" type="running" />
)

export const RunningCardSpinner = (props: Omit<LoadingSpinnerProps, 'variant' | 'type'>) => (
  <LoadingSpinner {...props} variant="card" type="running" size={props.size || 'lg'} />
)

export const RunningInlineSpinner = (props: Omit<LoadingSpinnerProps, 'variant' | 'type'>) => (
  <LoadingSpinner {...props} variant="inline" type="running" size={props.size || 'sm'} />
) 