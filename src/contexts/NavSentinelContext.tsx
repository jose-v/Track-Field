import React, { createContext, useContext, RefObject } from 'react';

export const NavSentinelContext = createContext<RefObject<HTMLDivElement> | null>(null);

export const NavSentinelProvider = NavSentinelContext.Provider;

export function useNavSentinelRef() {
  return useContext(NavSentinelContext);
} 