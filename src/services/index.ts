// Service Layer Index
// Centralized exports for all services

// Base infrastructure
export { dbClient } from '../lib/dbClient';
export { BaseService } from './base/BaseService';

// Domain services
export { sleepService, SleepService } from './domain/SleepService';
export type { SleepRecord, SleepStats } from './domain/SleepService';

// Import for internal use
import { sleepService } from './domain/SleepService';

// Migration utilities
export { ServiceMigration } from '../utils/migration/ServiceMigration';

// Service Registry for dependency injection and testing
export class ServiceRegistry {
  private static services = new Map<string, any>();

  /**
   * Register a service instance
   */
  static register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  /**
   * Get a service instance
   */
  static get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found in registry`);
    }
    return service;
  }

  /**
   * Check if service is registered
   */
  static has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Clear all services (useful for testing)
   */
  static clear(): void {
    this.services.clear();
  }

  /**
   * Initialize default services
   */
  static initializeDefaults(): void {
    this.register('sleepService', sleepService);
    // Add other services here as they're created
  }
}

// Initialize default services
ServiceRegistry.initializeDefaults();

// Export commonly used services for convenience
export const services = {
  sleep: sleepService,
  // Add other services here as they're created
} as const; 