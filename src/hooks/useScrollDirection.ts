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
    let lastScrollY = window.pageYOffset;
    let ticking = false;

    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset;
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

    window.addEventListener('scroll', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [threshold]);

  return scrollState;
}; 