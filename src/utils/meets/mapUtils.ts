/**
 * Map utilities for track meets
 */

/**
 * Generates a maps link for the given location
 * @param venueName - Name of the venue/stadium
 * @param city - City name
 * @param state - State name
 * @returns Maps URL or null if no location data
 */
export const generateMapsLink = (venueName?: string, city?: string, state?: string): string | null => {
  if (!venueName && !city && !state) return null;
  
  const query = [venueName, city, state].filter(Boolean).join(', ');
  const encodedQuery = encodeURIComponent(query);
  
  // Detect if user is on iOS/macOS for Apple Maps, otherwise use Google Maps
  const isAppleDevice = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
  
  if (isAppleDevice) {
    return `maps://maps.apple.com/?q=${encodedQuery}`;
  } else {
    return `https://maps.google.com/?q=${encodedQuery}`;
  }
};

/**
 * Formats a location string from venue name, city, and state
 * @param venueName - Name of the venue/stadium
 * @param city - City name
 * @param state - State name
 * @returns Formatted location string
 */
export const formatLocationString = (venueName?: string, city?: string, state?: string): string => {
  const parts = [venueName, city, state].filter(Boolean);
  return parts.join(', ');
};

/**
 * Checks if location information is available
 * @param venueName - Name of the venue/stadium
 * @param city - City name
 * @param state - State name
 * @returns True if any location data exists
 */
export const hasLocationInfo = (venueName?: string, city?: string, state?: string): boolean => {
  return Boolean(venueName || city || state);
}; 