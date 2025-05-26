/**
 * Styles for navigation icons
 * These styles are used for icons in the navigation bar to ensure consistent appearance
 */

// Lighter gray color for all navigation icons
export const navIconStyle = {
  color: '#898989', // Updated to lighter gray
  bg: 'transparent',
  border: 'none',
  outline: 'none',
  _hover: {
    color: 'primary.500', // On hover, use primary color from theme
    bg: 'transparent',
    border: 'none',
  },
  _focus: {
    outline: 'none',
    boxShadow: 'none',
    border: 'none',
    bg: 'transparent',
  },
  _active: {
    outline: 'none',
    boxShadow: 'none',
    border: 'none',
    bg: 'transparent',
  },
  transition: 'all 0.2s ease-in',
};

// Notification bell icon with badge
export const bellIconStyle = {
  ...navIconStyle,
  position: 'relative',
};

// Home icon style
export const homeIconStyle = {
  ...navIconStyle,
};

// Dashboard icon style
export const dashboardIconStyle = {
  ...navIconStyle,
};

// Feedback icon style
export const feedbackIconStyle = {
  ...navIconStyle,
};

// Share icon style
export const shareIconStyle = {
  ...navIconStyle,
};

// Notification badge style
export const navNotificationBadgeStyle = {
  position: 'absolute' as const,
  top: '-5px',
  right: '-5px',
  colorScheme: 'red',
  borderRadius: 'full',
  fontSize: '0.8em',
  minW: '1.6em',
  textAlign: 'center' as const,
}; 