import { useState, useEffect, RefObject } from 'react';

interface ScrollState {
  scrollDirection: 'up' | 'down' | null;
  scrollY: number;
  isHeaderVisible: boolean;
}

export const useScrollDirection = (
  threshold: number = 10,
  scrollContainerRef?: RefObject<HTMLElement>
) => {
  const [scrollState, setScrollState] = useState<ScrollState>({
    scrollDirection: null,
    scrollY: 0,
    isHeaderVisible: true,
  });

  useEffect(() => {
    let lastScrollY = 0;
    let ticking = false;
    let hideHeaderScrollY = 0; // Track when we started hiding the header
    let isDestroyed = false;

    const getScrollY = () => {
      if (isDestroyed) return 0;
      
      if (scrollContainerRef && scrollContainerRef.current) {
        try {
          return scrollContainerRef.current.scrollTop || 0;
        } catch (error) {
          return 0;
        }
      }
      try {
        const windowScrollY = window.pageYOffset || window.scrollY;
        const documentScrollY = document.documentElement.scrollTop || document.body.scrollTop;
        return Math.max(windowScrollY, documentScrollY);
      } catch (error) {
        return 0;
      }
    };

    const updateScrollDirection = () => {
      if (isDestroyed) return;
      
      try {
        let scrollY = getScrollY();
        const direction = scrollY > lastScrollY ? 'down' : 'up';
        const scrollDifference = Math.abs(scrollY - lastScrollY);

        if (scrollDifference < threshold) {
          ticking = false;
          return;
        }

        let isHeaderVisible: boolean;
        if (scrollY < 1) {
          isHeaderVisible = true;
          hideHeaderScrollY = 0;
        } else if (direction === 'down') {
          isHeaderVisible = false;
          hideHeaderScrollY = scrollY;
        } else if (direction === 'up') {
          isHeaderVisible = true;
        } else {
          isHeaderVisible = scrollState.isHeaderVisible;
        }

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
      } catch (error) {
        ticking = false;
      }
    };

    const onScroll = () => {
      if (isDestroyed || ticking) return;
      
      try {
        requestAnimationFrame(updateScrollDirection);
        ticking = true;
      } catch (error) {
        ticking = false;
      }
    };

    const scrollTarget = scrollContainerRef && scrollContainerRef.current ? scrollContainerRef.current : window;
    
    // Add null check before adding event listener
    if (scrollTarget && typeof scrollTarget.addEventListener === 'function') {
      try {
        scrollTarget.addEventListener('scroll', onScroll, { passive: true });

        return () => {
          isDestroyed = true;
          try {
            if (scrollTarget && typeof scrollTarget.removeEventListener === 'function') {
              scrollTarget.removeEventListener('scroll', onScroll);
            }
          } catch (error) {
            // Ignore cleanup errors
          }
        };
      } catch (error) {
        // Ignore setup errors
      }
    }
  }, [threshold, scrollContainerRef]);

  return scrollState;
}; 