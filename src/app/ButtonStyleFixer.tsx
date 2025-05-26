import { useEffect } from 'react'

/**
 * ButtonStyleFixer Component
 * 
 * This component uses DOM manipulation to ensure all Chakra buttons with variant="primary"
 * have white text color, regardless of other styling that might be applied.
 * 
 * It uses three approaches:
 * 1. Injects a stylesheet directly into the document head
 * 2. Periodically scans for buttons and fixes them directly
 * 3. Sets up a MutationObserver to catch dynamically added buttons
 */
export function ButtonStyleFixer() {
  useEffect(() => {
    // 1. Create and inject a stylesheet directly
    const injectStylesheet = () => {
      try {
        // Check if our stylesheet already exists
        const existingStyle = document.getElementById('button-style-fix');
        if (existingStyle) return;
        
        // Create style element
        const style = document.createElement('style');
        style.id = 'button-style-fix';
        style.innerHTML = `
          /* Ultra-high specificity selectors to override ALL styling */
          body .chakra-button[data-variant="primary"],
          body .chakra-button[variant="primary"],
          html body .chakra-button[data-variant="primary"],
          html body .chakra-button[variant="primary"],
          button.chakra-button[data-variant="primary"],
          button.chakra-button[variant="primary"],
          a.chakra-button[data-variant="primary"],
          a.chakra-button[variant="primary"] {
            color: white !important;
          }
          
          /* Handle hover states */
          body .chakra-button[data-variant="primary"]:hover,
          body .chakra-button[variant="primary"]:hover,
          button.chakra-button[data-variant="primary"]:hover,
          button.chakra-button[variant="primary"]:hover,
          a.chakra-button[data-variant="primary"]:hover,
          a.chakra-button[variant="primary"]:hover {
            color: white !important;
          }
          
          /* All possible selectors for good measure */
          [data-variant="primary"].chakra-button,
          [variant="primary"].chakra-button,
          .chakra-button.primary,
          button[data-variant="primary"],
          a[data-variant="primary"] {
            color: white !important;
          }
        `;
        
        // Add to document head
        document.head.appendChild(style);
        console.log('Injected button style fix stylesheet');
      } catch (err) {
        console.error('Error injecting style fix:', err);
      }
    };
    
    // 2. Direct DOM manipulation function
    const fixButtonStyles = () => {
      try {
        // Target all primary variant buttons
        const primaryButtons = document.querySelectorAll('.chakra-button[data-variant="primary"], .chakra-button[variant="primary"]');
        
        // Apply white text color directly to each button
        primaryButtons.forEach(button => {
          (button as HTMLElement).style.setProperty('color', 'white', 'important');
        });
      } catch (err) {
        console.error('Error directly fixing button styles:', err);
      }
    };
    
    // 3. Set up MutationObserver to watch for DOM changes
    const setupObserver = () => {
      try {
        const observer = new MutationObserver((mutations) => {
          let shouldFix = false;
          
          // Check if any buttons might have been added
          mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
              shouldFix = true;
            }
          });
          
          if (shouldFix) {
            fixButtonStyles();
          }
        });
        
        // Start observing the document with the configured parameters
        observer.observe(document.body, { 
          childList: true, 
          subtree: true 
        });
        
        return observer;
      } catch (err) {
        console.error('Error setting up mutation observer:', err);
        return null;
      }
    };
    
    // Execute our fixes
    injectStylesheet();
    fixButtonStyles();
    const observer = setupObserver();
    
    // Also set a periodic check for good measure
    // const interval = setInterval(fixButtonStyles, 1000); // TEMPORARILY DISABLED - CAUSES MODAL FOOTER TO DISAPPEAR
    
    // Cleanup
    return () => {
      // clearInterval(interval); // DISABLED
      if (observer) observer.disconnect();
    };
  }, []);
  
  // This component doesn't render anything
  return null;
}

export default ButtonStyleFixer 