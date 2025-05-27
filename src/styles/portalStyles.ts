/**
 * Global styles for portal layouts (Coach and Athlete interfaces)
 */

// Style for the navigation header
export const navHeaderStyle = {
  bg: "surface",
  borderBottom: "1px",
  borderStyle: "solid",
  borderColor: "border",
  position: "fixed",
  w: "100%",
  zIndex: 1,
};

// Style for active navigation items
export const activeNavItemStyle = {
  variant: "solid",
  bg: "primary.500",
  color: "white",
  _hover: {
    opacity: 0.85,
  },
};

// Style for inactive navigation items
export const inactiveNavItemStyle = {
  variant: "ghost",
  color: "text.secondary",
  _hover: {
    bg: "background",
  },
};

// Style for utility icons (home, notifications, etc.)
export const utilityIconStyle = {
  color: "gray.600",
  bg: "transparent",
  border: "none",
  outline: "none",
  _hover: {
    color: "primary.500",
    bg: "transparent",
    border: "none",
  },
  _focus: {
    outline: "none",
    boxShadow: "none",
    border: "none",
    bg: "transparent",
  },
  _focusVisible: {
    outline: "none",
    boxShadow: "none",
    border: "none",
    bg: "transparent",
  },
  _active: {
    outline: "none",
    boxShadow: "none",
    border: "none",
    bg: "transparent",
  },
  transition: "all 0.2s ease-in",
};

// Role badge styles
export const roleBadgeStyles = {
  coach: {
    colorScheme: "purple",
    fontSize: "0.8em",
  },
  athlete: {
    colorScheme: "green",
    fontSize: "0.8em",
  },
};

// Notification badge style - directly usable in Badge component
export const notificationBadgeProps = {
  position: "absolute" as const,
  top: "-5px",
  right: "-5px",
  colorScheme: "red",
  borderRadius: "full",
  fontSize: "0.8em",
  minW: "1.6em",
  textAlign: "center" as const,
}; 