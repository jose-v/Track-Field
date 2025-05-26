import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as jestDomMatchers from '@testing-library/jest-dom/matchers';
import * as React from 'react';

// Mock React 19's use client directive
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof React>('react');
  return {
    ...actual,
    useEffect: actual.useEffect,
    useState: actual.useState,
    createContext: actual.createContext,
    useContext: actual.useContext,
  };
});

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(jestDomMatchers as any);

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
}); 