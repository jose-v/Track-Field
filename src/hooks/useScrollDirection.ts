import { useState, useEffect } from 'react';

interface ScrollState {
  scrollDirection: 'up' | 'down' | null;
  scrollY: number;
  isHeaderVisible: boolean;
}

export const useScrollDirection = (threshold: number = 10) => {
  const [scrollState, setScrollState] = useState<ScrollState>({
    scrollDirection: null,
    scrollY: 0,
    isHeaderVisible: true,
  });

  useEffect(() => {
    let lastScrollY = 0;
    let ticking = false;
    let hideHeaderScrollY = 0; // Track when we started hiding the header

    const updateScrollDirection = () => {
      // Try multiple ways to get scroll position
      const windowScrollY = window.pageYOffset || window.scrollY;
      const documentScrollY = document.documentElement.scrollTop || document.body.scrollTop;
      
      // Use whichever scroll value is greater (indicates active scrolling)
      let scrollY = Math.max(windowScrollY, documentScrollY);
      
      // Also check for any scrollable containers with class 'main' or similar
      const mainContainer = document.querySelector('main, [role="main"], .main-content');
      if (mainContainer && mainContainer.scrollTop > 0) {
        scrollY = Math.max(scrollY, mainContainer.scrollTop);
      }

      const direction = scrollY > lastScrollY ? 'down' : 'up';
      const scrollDifference = Math.abs(scrollY - lastScrollY);

      // Only update if scroll difference is greater than threshold
      if (scrollDifference < threshold) {
        ticking = false;
        return;
      }

      // Use hysteresis: different thresholds for showing vs hiding header
      let isHeaderVisible: boolean;
      
      if (scrollY < 30) {
        // Always show header at top of page
        isHeaderVisible = true;
        hideHeaderScrollY = 0;
      } else if (direction === 'down') {
        // Hide header when scrolling down, but only if we've scrolled enough
        if (scrollY > 80) {
          isHeaderVisible = false;
          hideHeaderScrollY = scrollY;
        } else {
          isHeaderVisible = scrollState.isHeaderVisible; // Keep current state
        }
      } else if (direction === 'up') {
        // Show header when scrolling up, with hysteresis
        // Only show if we've scrolled up by at least 20px from where we hid it
        // OR if we've scrolled up significantly (30px+ difference)
        const scrollUpFromHide = hideHeaderScrollY > 0 ? hideHeaderScrollY - scrollY : 0;
        if (scrollUpFromHide > 20 || scrollDifference > 30) {
          isHeaderVisible = true;
        } else {
          isHeaderVisible = scrollState.isHeaderVisible; // Keep current state
        }
      } else {
        isHeaderVisible = scrollState.isHeaderVisible; // Keep current state
      }

      // Only update state if something actually changed
      if (
        scrollState.scrollDirection !== direction ||
        scrollState.scrollY !== scrollY ||
        scrollState.isHeaderVisible !== isHeaderVisible
      ) {
        setScrollState({
          scrollDirection: direction,
          scrollY,
          isHeaderVisible,
        });
      }

      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    // Listen to multiple scroll sources
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('scroll', onScroll, { passive: true });
    
    // Also listen to the main content container if it exists
    const mainContainer = document.querySelector('main, [role="main"], .main-content');
    if (mainContainer) {
      mainContainer.addEventListener('scroll', onScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('scroll', onScroll);
      if (mainContainer) {
        mainContainer.removeEventListener('scroll', onScroll);
      }
    };
  }, [threshold]);

  return scrollState;
}; 