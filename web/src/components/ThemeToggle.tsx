import { 
  IconButton, 
  useColorMode, 
  useColorModeValue,
  Tooltip 
} from '@chakra-ui/react';
import { FaSun, FaMoon } from 'react-icons/fa';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'solid';
}

export const ThemeToggle = ({ size = 'md', variant = 'ghost' }: ThemeToggleProps) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const iconColor = '#898989';
  
  return (
    <Tooltip 
      label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} 
      hasArrow
    >
      <IconButton
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        icon={isDark ? <FaSun /> : <FaMoon />}
        onClick={toggleColorMode}
        variant={variant}
        size={size}
        color={iconColor}
        _hover={{ bg: hoverBg }}
        transition="all 0.2s"
      />
    </Tooltip>
  );
}; 