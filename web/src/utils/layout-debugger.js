/**
 * A utility to debug layout issues by highlighting elements with width constraints
 * or that might be causing layout problems.
 */

export function highlightLayoutConstraints() {
  // Store the original styles to restore later
  const originalStyles = new Map();
  
  // Elements to check
  const elementsToCheck = [
    'body',
    'div',
    '#root',
    'main',
    '.container',
    'section',
    'header',
    'footer',
    'nav',
    '[class*="container"]',
    '[class*="wrapper"]',
    '[class*="layout"]',
    '[class*="content"]',
  ];
  
  // Properties that might constrain width
  const constrainingProps = [
    'width',
    'max-width',
    'margin',
    'margin-left',
    'margin-right',
    'padding',
    'padding-left',
    'padding-right',
    'display',
    'flex',
    'grid',
  ];
  
  elementsToCheck.forEach(selector => {
    try {
      document.querySelectorAll(selector).forEach(element => {
        const styles = window.getComputedStyle(element);
        const elementInfo = {
          element,
          path: getElementPath(element),
          constraints: []
        };
        
        // Check if the element has width constraints
        constrainingProps.forEach(prop => {
          const value = styles.getPropertyValue(prop);
          
          // Check if the property might be constraining width
          if (
            (prop === 'width' && value !== 'auto' && value !== '100%') ||
            (prop === 'max-width' && value !== 'none') ||
            (prop === 'margin' && value !== '0px') ||
            (prop === 'margin-left' && value !== '0px') ||
            (prop === 'margin-right' && value !== '0px') ||
            (prop === 'display' && (value === 'flex' || value === 'inline-flex' || value === 'grid'))
          ) {
            elementInfo.constraints.push({ property: prop, value });
            
            // Store original style
            if (!originalStyles.has(element)) {
              originalStyles.set(element, { 
                outline: element.style.outline,
                backgroundColor: element.style.backgroundColor,
                position: element.style.position,
              });
            }
            
            // Highlight the element
            element.style.outline = '2px solid red';
            element.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
          }
        });
        
        // Log constraints if found
        if (elementInfo.constraints.length > 0) {
          console.log('Element with constraints:', elementInfo);
        }
      });
    } catch (e) {
      console.error(`Error checking selector ${selector}:`, e);
    }
  });
  
  console.log('Layout debugging complete. Elements with constraints are highlighted in red.');
  
  // Return a function to restore original styles
  return function restore() {
    originalStyles.forEach((styles, element) => {
      element.style.outline = styles.outline;
      element.style.backgroundColor = styles.backgroundColor;
      element.style.position = styles.position;
    });
    console.log('Original styles restored.');
  };
}

// Helper function to get the DOM path of an element
function getElementPath(element) {
  const path = [];
  let currentElem = element;
  
  while (currentElem) {
    let selector = currentElem.tagName.toLowerCase();
    
    if (currentElem.id) {
      selector += `#${currentElem.id}`;
    } else if (currentElem.className) {
      const classes = currentElem.className.split(/\s+/).filter(Boolean);
      if (classes.length) {
        selector += `.${classes.join('.')}`;
      }
    }
    
    path.unshift(selector);
    currentElem = currentElem.parentElement;
  }
  
  return path.join(' > ');
}

// Create a global access point for the browser console
if (typeof window !== 'undefined') {
  window.debugLayout = highlightLayoutConstraints;
} 