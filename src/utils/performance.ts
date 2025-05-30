import React from 'react';

// Performance monitoring utility for development
export class PerformanceMonitor {
  private static marks: Map<string, number> = new Map();

  static start(label: string): void {
    if (process.env.NODE_ENV === 'development') {
      this.marks.set(label, performance.now());
      console.time(label);
    }
  }

  static end(label: string): void {
    if (process.env.NODE_ENV === 'development') {
      const startTime = this.marks.get(label);
      if (startTime) {
        const duration = performance.now() - startTime;
        console.timeEnd(label);
        console.log(`${label} took ${duration.toFixed(2)}ms`);
        this.marks.delete(label);
      }
    }
  }

  static measure(label: string, fn: () => any): any {
    if (process.env.NODE_ENV === 'development') {
      this.start(label);
      const result = fn();
      this.end(label);
      return result;
    }
    return fn();
  }

  static logComponentRender(componentName: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 ${componentName} rendered at ${new Date().toLocaleTimeString()}`);
    }
  }
}

// Hook for monitoring component performance
export const usePerformanceMonitor = (componentName: string) => {
  React.useEffect(() => {
    PerformanceMonitor.logComponentRender(componentName);
  });

  return {
    startTimer: (label: string) => PerformanceMonitor.start(`${componentName}:${label}`),
    endTimer: (label: string) => PerformanceMonitor.end(`${componentName}:${label}`),
    measure: (label: string, fn: () => any) => PerformanceMonitor.measure(`${componentName}:${label}`, fn)
  };
}; 