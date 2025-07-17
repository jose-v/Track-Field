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

    const getScrollY = () => {
      if (scrollContainerRef && scrollContainerRef.current) {
        return scrollContainerRef.current.scrollTop;
      }
      const windowScrollY = window.pageYOffset || window.scrollY;
      const documentScrollY = document.documentElement.scrollTop || document.body.scrollTop;
      return Math.max(windowScrollY, documentScrollY);
    };

    const updateScrollDirection = () => {
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
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    const scrollTarget = scrollContainerRef && scrollContainerRef.current ? scrollContainerRef.current : window;
    scrollTarget.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      scrollTarget.removeEventListener('scroll', onScroll);
    };
  }, [threshold, scrollContainerRef]);

  return scrollState;
}; 