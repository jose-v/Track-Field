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

      // Show header when scrolling up or at top of page
      const isHeaderVisible = direction === 'up' || scrollY < 50;

      setScrollState({
        scrollDirection: direction,
        scrollY,
        isHeaderVisible,
      });

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