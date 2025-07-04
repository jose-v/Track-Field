import { Box, useColorModeValue } from '@chakra-ui/react'

export type RunningSpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface RunningSpinnerProps {
  size?: RunningSpinnerSize
  speed?: string
  color?: 'dark' | 'light' | 'auto'
}

const getSizeConfig = (size: RunningSpinnerSize) => {
  switch (size) {
    case 'xs':
      return { width: '32px', height: '32px', spriteWidth: '192px' } // 6 frames * 32px
    case 'sm':
      return { width: '48px', height: '48px', spriteWidth: '288px' } // 6 frames * 48px
    case 'md':
      return { width: '64px', height: '64px', spriteWidth: '384px' } // 6 frames * 64px
    case 'lg':
      return { width: '96px', height: '96px', spriteWidth: '576px' } // 6 frames * 96px
    case 'xl':
      return { width: '128px', height: '128px', spriteWidth: '768px' } // 6 frames * 128px
    default:
      return { width: '64px', height: '64px', spriteWidth: '384px' }
  }
}

export function RunningSpinner({ 
  size = 'md', 
  speed = '0.8s',
  color = 'auto'
}: RunningSpinnerProps) {
  const { width, height, spriteWidth } = getSizeConfig(size)
  
  // Auto-detect color based on theme, or use specified color
  const shouldUseLightSprite = useColorModeValue(
    color === 'auto' ? false : color === 'light',
    color === 'auto' ? true : color === 'light'
  )
  
  // Determine which sprite to use based on color preference
  const spriteImage = shouldUseLightSprite 
    ? '/images/running-man-sprite-light.png'
    : '/images/running-man-sprite.png'

  return (
    <Box
      width={width}
      height={height}
      backgroundImage={`url(${spriteImage})`}
      backgroundSize={`${spriteWidth} ${height}`}
      backgroundRepeat="no-repeat"
      backgroundPosition="0 0"
      sx={{
        animation: `runCycle ${speed} steps(6) infinite`,
        '@keyframes runCycle': {
          from: { backgroundPosition: '0 0' },
          to: { backgroundPosition: `-${spriteWidth} 0` }
        }
      }}
      // Accessibility
      role="status"
      aria-label="Loading"
    />
  )
}

// CSS-in-JS alternative for better performance
export function RunningSpinnerCSS({ 
  size = 'md', 
  speed = '0.8s',
  color = 'auto'
}: RunningSpinnerProps) {
  const { width, height, spriteWidth } = getSizeConfig(size)
  
  const shouldUseLightSprite = useColorModeValue(
    color === 'auto' ? false : color === 'light',
    color === 'auto' ? true : color === 'light'
  )
  
  const spriteImage = shouldUseLightSprite 
    ? '/images/running-man-sprite-light.png'
    : '/images/running-man-sprite.png'

  return (
    <div
      style={{
        width,
        height,
        backgroundImage: `url(${spriteImage})`,
        backgroundSize: `${spriteWidth} ${height}`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: '0 0',
        animation: `runCycle ${speed} steps(6) infinite`,
      }}
      role="status"
      aria-label="Loading"
    />
  )
}

// CSS keyframes (inject into document head once)
if (typeof window !== 'undefined' && !document.getElementById('running-spinner-styles')) {
  const style = document.createElement('style')
  style.id = 'running-spinner-styles'
  style.textContent = `
    @keyframes runCycle {
      from { background-position: 0 0; }
      to { background-position: -100% 0; }
    }
  `
  document.head.appendChild(style)
} 