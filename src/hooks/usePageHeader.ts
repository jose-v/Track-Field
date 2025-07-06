import React, { useEffect } from 'react';
import { IconType } from 'react-icons';

interface PageHeaderInfo {
  title: string;
  subtitle: string;
  icon?: IconType;
}

// Create a global event system for page header updates
const PAGE_HEADER_EVENT = 'pageHeaderUpdate';

export function usePageHeader(pageInfo: PageHeaderInfo) {
  useEffect(() => {
    // Dispatch page header info for mobile nav to pick up
    window.dispatchEvent(new CustomEvent(PAGE_HEADER_EVENT, { 
      detail: pageInfo 
    }));
    
    // Cleanup when component unmounts
    return () => {
      window.dispatchEvent(new CustomEvent(PAGE_HEADER_EVENT, { 
        detail: null 
      }));
    };
  }, [pageInfo.title, pageInfo.subtitle, pageInfo.icon]);
}

// Hook for SimplifiedNav to listen to page header updates
export function usePageHeaderListener() {
  const [pageHeaderInfo, setPageHeaderInfo] = React.useState<PageHeaderInfo | null>(null);
  
  React.useEffect(() => {
    const handlePageHeaderUpdate = (event: CustomEvent) => {
      setPageHeaderInfo(event.detail);
    };
    
    window.addEventListener(PAGE_HEADER_EVENT, handlePageHeaderUpdate as EventListener);
    
    return () => {
      window.removeEventListener(PAGE_HEADER_EVENT, handlePageHeaderUpdate as EventListener);
    };
  }, []);
  
  return pageHeaderInfo;
} 