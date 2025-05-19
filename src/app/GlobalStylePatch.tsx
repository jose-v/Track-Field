import { Global, css } from '@emotion/react'

/**
 * GlobalStylePatch - Component that applies global style overrides that can't be
 * handled through the theme or regular CSS files.
 * 
 * This is especially useful for fixing styling issues with Chakra UI components.
 */
export function GlobalStylePatch() {
  return (
    <Global
      styles={css`
        /* Ensure all primary buttons have white text */
        .chakra-button[data-variant='primary'],
        .chakra-button[variant='primary'] {
          color: white !important;
        }
        
        /* Ensure hover states maintain white text */
        .chakra-button[data-variant='primary']:hover,
        .chakra-button[variant='primary']:hover {
          color: white !important;
        }
        
        /* Legacy solid variant (treated as primary) */
        .chakra-button[data-variant='solid'],
        .chakra-button[variant='solid'] {
          color: white !important;
        }
        
        /* Handle specifically problematic components */
        .card .chakra-button[data-variant='primary'],
        .card .chakra-button[variant='primary'],
        .modal .chakra-button[data-variant='primary'],
        .modal .chakra-button[variant='primary'] {
          color: white !important;
        }
      `}
    />
  )
}

export default GlobalStylePatch 