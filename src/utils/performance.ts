import React from 'react';

// Performance monitoring utility for development
export class PerformanceMonitor {
  private static marks: Map<string, number> = new Map();
  private static isDevMode = process.env.NODE_ENV === 'development';

  static start(label: string): void {
    if (this.isDevMode) {
      this.marks.set(label, performance.now());
      console.time(label);
    }
  }

  static end(label: string): number | void {
    if (this.isDevMode) {
      const startTime = this.marks.get(label);
      if (startTime) {
        const duration = performance.now() - startTime;
        console.timeEnd(label);
        console.log(`${label} took ${duration.toFixed(2)}ms`);
        this.marks.delete(label);
        return duration;
      }
    }
  }

  static measure<T>(label: string, fn: () => T): T {
    if (this.isDevMode) {
      this.start(label);
      const result = fn();
      this.end(label);
      return result;
    }
    return fn();
  }

  static logComponentRender(componentName: string): void {
    if (this.isDevMode) {
      console.log(`🔄 ${componentName} rendered at ${new Date().toLocaleTimeString()}`);
    }
  }

  static logMemoryUsage(label?: string): void {
    if (this.isDevMode && 'memory' in performance) {
      const memory = (performance as any).memory;
      const prefix = label ? `${label}: ` : '';
      console.log(`${prefix}Memory - Used: ${(memory.usedJSHeapSize / 1048576).toFixed(2)}MB, Total: ${(memory.totalJSHeapSize / 1048576).toFixed(2)}MB`);
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