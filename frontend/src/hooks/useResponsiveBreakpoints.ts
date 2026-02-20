/**
 * Responsive Breakpoints Hook - stub implementation
 * TODO: implement full breakpoint detection with resize observer
 */

import { useState, useEffect } from 'react';

export interface ResponsiveBreakpoints {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  width: number;
}

export const useResponsiveBreakpoints = (): ResponsiveBreakpoints => {
  // SSR-safe: use lazy initializer to avoid accessing window during module load
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024 && width < 1280,
    isLargeDesktop: width >= 1280,
    width,
  };
};
