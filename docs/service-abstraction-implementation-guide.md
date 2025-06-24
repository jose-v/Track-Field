# Service Abstraction Implementation Guide

## Overview
This document provides detailed technical instructions for implementing service layer abstractions for all remaining domains in the Track & Field application. Based on the successful sleep service migration, this guide establishes patterns and procedures for systematic service layer implementation.

## Architecture Foundation

### Established Pattern
```
Component → ServiceMigration → [New Service OR Legacy Fallback] → BaseService → DbClient → Database
```

### Core Infrastructure (Already Implemented)
- ✅ `src/lib/dbClient.ts` - Database abstraction with retry logic
- ✅ `src/services/base/BaseService.ts` - Base service with common patterns
- ✅ `src/utils/migration/ServiceMigration.ts` - Migration utility framework
- ✅ `src/services/domain/SleepService.ts` - Reference implementation

## Service Implementation Priority

### Phase 1: Core Dashboard Services (Immediate)
1. **WellnessService** - Athlete wellness surveys and metrics
2. **WorkoutService** - Workout creation, management, and tracking
3. **RPEService** - Rate of Perceived Exertion logging

### Phase 2: Analytics and Reporting (Short-term)
4. **AnalyticsService** - Performance analytics and insights
5. **InjuryRiskService** - Injury risk assessment and monitoring
6. **ProgressService** - Athlete progress tracking

### Phase 3: Team and User Management (Medium-term)
7. **TeamService** - Team management and roster operations
8. **ProfileService** - User profile management
9. **AuthService** - Authentication and authorization

### Phase 4: Advanced Features (Long-term)
10. **MeetService** - Meet management and athlete assignments
11. **LoopService** - Social feed and community features
12. **NotificationService** - Push notifications and alerts

## Detailed Implementation Instructions

### Step 1: Domain Analysis and Interface Design

#### 1.1 Identify Database Tables
For each service, identify all related database tables:

```typescript
// Example for WellnessService
const WELLNESS_TABLES = [
  'athlete_wellness_surveys',
  'wellness_metrics',
  'wellness_trends'
];
```

#### 1.2 Define Core Interface
Create TypeScript interfaces matching database schema:

```typescript
// src/services/domain/WellnessService.ts
export interface WellnessRecord {
  id?: string;
  athlete_id: string;
  survey_date: string;
  fatigue_level: number;
  muscle_soreness: number;
  stress_level: number;
  motivation_level: number;
  overall_feeling: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WellnessStats {
  avgFatigue: number;
  avgSoreness: number;
  avgStress: number;
  avgMotivation: number;
  totalRecords: number;
  latestRecord?: WellnessRecord;
  trend: 'improving' | 'stable' | 'declining';
}
```

#### 1.3 Analyze Existing Components
Find all components using direct Supabase calls for the domain:

```bash
# Search for direct Supabase usage
grep -r "supabase.from('athlete_wellness_surveys')" src/
grep -r "from('workouts')" src/
```

### Step 2: Service Implementation

#### 2.1 Create Domain Service File
```typescript
// src/services/domain/WellnessService.ts
import { BaseService } from '../base/BaseService';

export class WellnessService extends BaseService {
  
  /**
   * Get wellness records for a user within a date range
   */
  async getWellnessRecords(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<WellnessRecord[]> {
    try {
      const user = await this.getCurrentUser();
      
      // Validate user can access this data
      if (user.id !== userId) {
        const hasAccess = await this.validateUserAccess(user.id, 'athlete_wellness_surveys', userId);
        if (!hasAccess) {
          throw new Error('Access denied to wellness records');
        }
      }

      const { data: records, error } = await this.db.supabase
        .from('athlete_wellness_surveys')
        .select('*')
        .eq('athlete_id', userId)
        .gte('survey_date', startDate)
        .lte('survey_date', endDate)
        .order('survey_date', { ascending: false });

      if (error) {
        throw new Error(`Error fetching wellness records: ${error.message}`);
      }

      return records || [];
    } catch (error) {
      this.handleError(error, 'getWellnessRecords');
      throw error;
    }
  }

  /**
   * Create or update wellness record (upsert pattern)
   */
  async upsertWellnessRecord(wellnessData: Omit<WellnessRecord, 'id' | 'created_at' | 'updated_at'>): Promise<WellnessRecord> {
    try {
      const user = await this.getCurrentUser();
      
      // Validate user can create/update this record
      if (user.id !== wellnessData.athlete_id) {
        throw new Error('Cannot create wellness record for another user');
      }

      // Validate required fields
      this.validateRequiredFields(wellnessData, ['athlete_id', 'survey_date', 'fatigue_level', 'muscle_soreness', 'stress_level', 'motivation_level']);

      // Validate data ranges
      const validateRange = (value: number, min: number, max: number, field: string) => {
        if (value < min || value > max) {
          throw new Error(`${field} must be between ${min} and ${max}`);
        }
      };

      validateRange(wellnessData.fatigue_level, 1, 10, 'Fatigue level');
      validateRange(wellnessData.muscle_soreness, 1, 10, 'Muscle soreness');
      validateRange(wellnessData.stress_level, 1, 10, 'Stress level');
      validateRange(wellnessData.motivation_level, 1, 10, 'Motivation level');

      // Check for existing record
      const existingRecord = await this.getWellnessRecordByDate(user.id, wellnessData.survey_date);
      
      const sanitizedData = this.sanitizeData(wellnessData);
      
      if (existingRecord) {
        // Update existing record
        const results = await this.db.update<WellnessRecord>(
          'athlete_wellness_surveys',
          sanitizedData,
          { id: existingRecord.id }
        );
        
        if (results.length === 0) {
          throw new Error('Failed to update wellness record');
        }
        
        return results[0];
      } else {
        // Create new record
        const results = await this.db.insert<WellnessRecord>('athlete_wellness_surveys', sanitizedData);
        
        if (results.length === 0) {
          throw new Error('Failed to create wellness record');
        }
        
        return results[0];
      }
    } catch (error) {
      this.handleError(error, 'upsertWellnessRecord');
      throw error;
    }
  }

  /**
   * Get wellness statistics for a user
   */
  async getWellnessStats(userId: string, days: number = 7): Promise<WellnessStats> {
    try {
      const endDate = this.formatDate(new Date());
      const startDate = this.formatDate(new Date(Date.now() - (days * 24 * 60 * 60 * 1000)));
      
      const records = await this.getWellnessRecords(userId, startDate, endDate);
      
      if (records.length === 0) {
        return {
          avgFatigue: 0,
          avgSoreness: 0,
          avgStress: 0,
          avgMotivation: 0,
          totalRecords: 0,
          trend: 'stable'
        };
      }

      const totals = records.reduce((acc, record) => ({
        fatigue: acc.fatigue + record.fatigue_level,
        soreness: acc.soreness + record.muscle_soreness,
        stress: acc.stress + record.stress_level,
        motivation: acc.motivation + record.motivation_level
      }), { fatigue: 0, soreness: 0, stress: 0, motivation: 0 });

      const count = records.length;
      
      // Calculate trend (compare first half vs second half of records)
      const midpoint = Math.floor(count / 2);
      const recentAvg = records.slice(0, midpoint).reduce((sum, r) => sum + r.overall_feeling, 0) / midpoint;
      const olderAvg = records.slice(midpoint).reduce((sum, r) => sum + r.overall_feeling, 0) / (count - midpoint);
      
      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (recentAvg > olderAvg + 0.5) trend = 'improving';
      else if (recentAvg < olderAvg - 0.5) trend = 'declining';

      return {
        avgFatigue: Math.round((totals.fatigue / count) * 10) / 10,
        avgSoreness: Math.round((totals.soreness / count) * 10) / 10,
        avgStress: Math.round((totals.stress / count) * 10) / 10,
        avgMotivation: Math.round((totals.motivation / count) * 10) / 10,
        totalRecords: count,
        latestRecord: records[0],
        trend
      };
    } catch (error) {
      this.handleError(error, 'getWellnessStats');
      throw error;
    }
  }

  /**
   * Get wellness record by date
   */
  async getWellnessRecordByDate(userId: string, date: string): Promise<WellnessRecord | null> {
    try {
      const records = await this.db.select<WellnessRecord>(
        'athlete_wellness_surveys',
        '*',
        { athlete_id: userId, survey_date: date }
      );

      return records.length > 0 ? records[0] : null;
    } catch (error) {
      this.handleError(error, 'getWellnessRecordByDate');
      throw error;
    }
  }

  /**
   * Delete wellness record
   */
  async deleteWellnessRecord(recordId: string): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      
      // Check if record exists and user owns it
      const existingRecords = await this.db.select<WellnessRecord>(
        'athlete_wellness_surveys',
        '*',
        { id: recordId }
      );

      if (existingRecords.length === 0) {
        throw new Error('Wellness record not found');
      }

      const existingRecord = existingRecords[0];
      if (existingRecord.athlete_id !== user.id) {
        throw new Error('Cannot delete another user\'s wellness record');
      }

      await this.db.delete('athlete_wellness_surveys', { id: recordId });
    } catch (error) {
      this.handleError(error, 'deleteWellnessRecord');
      throw error;
    }
  }
}

// Export singleton instance
export const wellnessService = new WellnessService();
```

#### 2.2 Add to Service Registry
```typescript
// src/services/index.ts
import { wellnessService } from './domain/WellnessService';

export const services = {
  sleep: sleepService,
  wellness: wellnessService, // Add new service
  // ... other services
};

export { wellnessService };
```

### Step 3: Migration Layer Implementation

#### 3.1 Add Migration Methods
```typescript
// src/utils/migration/ServiceMigration.ts
import { wellnessService } from '../../services/domain/WellnessService';

export class ServiceMigration {
  // ... existing methods

  /**
   * Wellness-specific migration helpers
   */
  static wellness = {
    async getRecords(userId: string, days: number = 7) {
      return ServiceMigration.withFallback(
        () => {
          const endDate = new Date().toISOString().split('T')[0];
          const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000))
            .toISOString().split('T')[0];
          return wellnessService.getWellnessRecords(userId, startDate, endDate);
        },
        async () => {
          // Legacy implementation
          const endDate = new Date().toISOString().split('T')[0];
          const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000))
            .toISOString().split('T')[0];
          
          const { data, error } = await dbClient.supabase
            .from('athlete_wellness_surveys')
            .select('*')
            .eq('athlete_id', userId)
            .gte('survey_date', startDate)
            .lte('survey_date', endDate)
            .order('survey_date', { ascending: false });

          if (error) throw error;
          return data || [];
        }
      );
    },

    async getStats(userId: string, days: number = 7) {
      return ServiceMigration.withFallback(
        () => wellnessService.getWellnessStats(userId, days),
        async () => {
          // Legacy stats calculation
          const records = await ServiceMigration.wellness.getRecords(userId, days);
          
          if (records.length === 0) {
            return { avgFatigue: 0, avgSoreness: 0, avgStress: 0, avgMotivation: 0, totalRecords: 0, trend: 'stable' };
          }

          const totals = records.reduce((acc: any, record: any) => ({
            fatigue: acc.fatigue + record.fatigue_level,
            soreness: acc.soreness + record.muscle_soreness,
            stress: acc.stress + record.stress_level,
            motivation: acc.motivation + record.motivation_level
          }), { fatigue: 0, soreness: 0, stress: 0, motivation: 0 });

          const count = records.length;

          return {
            avgFatigue: Math.round((totals.fatigue / count) * 10) / 10,
            avgSoreness: Math.round((totals.soreness / count) * 10) / 10,
            avgStress: Math.round((totals.stress / count) * 10) / 10,
            avgMotivation: Math.round((totals.motivation / count) * 10) / 10,
            totalRecords: count,
            latestRecord: records[0],
            trend: 'stable'
          };
        }
      );
    },

    async createRecord(wellnessData: any) {
      return ServiceMigration.withFallback(
        () => wellnessService.upsertWellnessRecord(wellnessData),
        async () => {
          // Legacy upsert implementation
          const { data: existing } = await dbClient.supabase
            .from('athlete_wellness_surveys')
            .select('id')
            .eq('athlete_id', wellnessData.athlete_id)
            .eq('survey_date', wellnessData.survey_date)
            .single();

          if (existing) {
            const { data, error } = await dbClient.supabase
              .from('athlete_wellness_surveys')
              .update(wellnessData)
              .eq('id', existing.id)
              .select()
              .single();
            
            if (error) throw error;
            return data;
          } else {
            const { data, error } = await dbClient.supabase
              .from('athlete_wellness_surveys')
              .insert(wellnessData)
              .select()
              .single();
            
            if (error) throw error;
            return data;
          }
        }
      );
    }
  };
}
```

### Step 4: Component Migration

#### 4.1 Identify Components to Migrate
```bash
# Find components using wellness tables
grep -r "athlete_wellness_surveys" src/components/
grep -r "wellness" src/hooks/
```

#### 4.2 Update Component Implementation
```typescript
// Before: src/components/WellnessQuickLogCard.tsx
import { supabase } from '../lib/supabase';

const handleQuickLog = async () => {
  // Complex database logic with multiple conditional calls
  if (existingLogs.hasTodayLogs) {
    const result = await supabase
      .from('athlete_wellness_surveys')
      .update(wellnessData)
      .eq('athlete_id', user.id)
      .eq('survey_date', today);
  } else {
    const result = await supabase
      .from('athlete_wellness_surveys')
      .insert(wellnessData);
  }
};

// After: Migrated version
import { ServiceMigration } from '../utils/migration/ServiceMigration';

const handleQuickLog = async () => {
  // Simple service call
  const wellnessData = {
    athlete_id: user.id,
    survey_date: today,
    fatigue_level: fatigue,
    muscle_soreness: soreness,
    stress_level: stress,
    motivation_level: motivation,
    overall_feeling: Math.round(((10 - fatigue) + (10 - soreness) + (10 - stress) + motivation) / 4),
    notes: existingLogs.hasTodayLogs ? 'Updated from dashboard' : 'Quick check-in from dashboard'
  };

  await ServiceMigration.wellness.createRecord(wellnessData);
};
```

#### 4.3 Update React Query Hooks
```typescript
// src/hooks/useWellnessRecords.ts
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { ServiceMigration } from '../utils/migration/ServiceMigration';

export interface WellnessRecord {
  id: string;
  athlete_id: string;
  survey_date: string;
  fatigue_level: number;
  muscle_soreness: number;
  stress_level: number;
  motivation_level: number;
  overall_feeling: number;
  notes?: string;
  created_at: string;
}

export function useWellnessRecords(limit?: number) {
  const { user } = useAuth();

  return useQuery<WellnessRecord[], Error>({
    queryKey: ['wellnessRecords', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('No user ID available');
      }

      const records = await ServiceMigration.wellness.getRecords(user.id, limit || 30);
      return records as WellnessRecord[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 30,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 1000 * 60,
  });
}

export function useWellnessStats() {
  const { data: records, isLoading, error, refetch } = useWellnessRecords(7);
  
  // Transform data for component consumption
  // Implementation similar to useSleepStats pattern
}
```

### Step 5: Testing Implementation

#### 5.1 Create Unit Tests
```typescript
// src/tests/services/WellnessService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WellnessService } from '../../services/domain/WellnessService';

describe('WellnessService', () => {
  let wellnessService: WellnessService;

  beforeEach(() => {
    wellnessService = new WellnessService();
    // Mock setup
  });

  describe('getWellnessRecords', () => {
    it('should fetch wellness records for authenticated user', async () => {
      // Test implementation
    });

    it('should validate user access for cross-user requests', async () => {
      // Test implementation
    });

    it('should handle database errors gracefully', async () => {
      // Test implementation
    });
  });

  describe('upsertWellnessRecord', () => {
    it('should create new wellness record', async () => {
      // Test implementation
    });

    it('should update existing wellness record', async () => {
      // Test implementation
    });

    it('should validate required fields', async () => {
      // Test implementation
    });

    it('should validate data ranges', async () => {
      // Test implementation
    });
  });

  describe('getWellnessStats', () => {
    it('should calculate wellness statistics', async () => {
      // Test implementation
    });

    it('should determine trend correctly', async () => {
      // Test implementation
    });
  });
});
```

#### 5.2 Add Debug Component
```typescript
// src/components/debug/WellnessServiceTest.tsx
import React, { useState } from 'react';
import { ServiceMigration } from '../../utils/migration/ServiceMigration';
import WellnessQuickLogCard from '../WellnessQuickLogCard';

export const WellnessServiceTest: React.FC = () => {
  // Similar structure to SleepServiceTest
  // Include tests for wellness-specific functionality
};
```

#### 5.3 Update Debug Dashboard
```typescript
// src/pages/Debug.tsx
import { WellnessServiceTest } from '../components/debug/WellnessServiceTest';

// Add wellness service testing section
```

### Step 6: Service-Specific Considerations

#### 6.1 WorkoutService Specifics
```typescript
// Additional considerations for WorkoutService
export interface Workout {
  id?: string;
  athlete_id: string;
  coach_id: string;
  workout_date: string;
  workout_type: string;
  exercises: Exercise[];
  duration_minutes: number;
  intensity_level: number;
  notes?: string;
  status: 'draft' | 'assigned' | 'completed' | 'skipped';
  created_at?: string;
  updated_at?: string;
}

export interface Exercise {
  id?: string;
  workout_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight?: number;
  distance?: number;
  time?: string;
  rest_seconds?: number;
  notes?: string;
}

// Complex relationships require careful handling
// - Workouts have many exercises
// - Exercises belong to workouts
// - Cascade operations needed for deletions
// - Bulk operations for efficiency
```

#### 6.2 AnalyticsService Specifics
```typescript
// Analytics requires aggregation and complex queries
export class AnalyticsService extends BaseService {
  
  /**
   * Get performance trends across multiple data sources
   */
  async getPerformanceTrends(userId: string, timeframe: string): Promise<PerformanceTrends> {
    // Combine data from:
    // - sleep_records
    // - athlete_wellness_surveys  
    // - workouts
    // - rpe_logs
    // Complex aggregation and correlation analysis
  }

  /**
   * Calculate injury risk scores
   */
  async calculateInjuryRisk(userId: string): Promise<InjuryRiskAssessment> {
    // Machine learning or statistical analysis
    // Multiple data points correlation
    // Risk scoring algorithms
  }
}
```

#### 6.3 TeamService Specifics
```typescript
// Team management requires role-based access control
export class TeamService extends BaseService {
  
  /**
   * Complex authorization patterns
   */
  async validateTeamAccess(userId: string, teamId: string, action: string): Promise<boolean> {
    // Check user roles: coach, team_manager, athlete
    // Validate permissions for specific actions
    // Handle hierarchical access patterns
  }

  /**
   * Bulk operations for team management
   */
  async addMultipleAthletes(teamId: string, athleteIds: string[]): Promise<void> {
    // Bulk insert with transaction support
    // Rollback on partial failures
    // Notification triggers
  }
}
```

## Implementation Checklist Template

For each new service implementation, follow this checklist:

### Pre-Implementation
- [ ] Analyze database schema and relationships
- [ ] Identify all affected components
- [ ] Document current direct Supabase usage
- [ ] Design service interface and methods
- [ ] Plan migration strategy

### Implementation
- [ ] Create domain service class extending BaseService
- [ ] Implement all CRUD operations with proper validation
- [ ] Add business logic and data transformation methods
- [ ] Create migration layer methods in ServiceMigration
- [ ] Update service registry in src/services/index.ts

### Component Migration
- [ ] Update components to use ServiceMigration calls
- [ ] Remove direct Supabase imports and calls
- [ ] Simplify component logic by removing database concerns
- [ ] Update React Query hooks to use service layer
- [ ] Test both new and legacy modes

### Testing
- [ ] Create comprehensive unit tests for service
- [ ] Add integration tests for migration layer
- [ ] Create debug component for manual testing
- [ ] Update debug dashboard with new service tests
- [ ] Verify all existing functionality works

### Documentation
- [ ] Update API documentation
- [ ] Document service methods and interfaces
- [ ] Add migration notes and considerations
- [ ] Update component documentation

### Deployment
- [ ] Test in development environment
- [ ] Verify performance impact
- [ ] Plan gradual rollout strategy
- [ ] Monitor error rates and metrics
- [ ] Prepare rollback procedures

## Performance Considerations

### Database Query Optimization
```typescript
// Use proper indexing strategies
const optimizedQuery = await this.db.supabase
  .from('large_table')
  .select('id, name, created_at') // Select only needed fields
  .eq('user_id', userId) // Use indexed columns
  .gte('created_at', startDate) // Range queries on indexed dates
  .limit(100) // Reasonable limits
  .order('created_at', { ascending: false }); // Efficient ordering
```

### Caching Strategies
```typescript
// Implement service-level caching for expensive operations
export class AnalyticsService extends BaseService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  
  async getExpensiveAnalytics(userId: string): Promise<any> {
    const cacheKey = `analytics_${userId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 min cache
      return cached.data;
    }
    
    const data = await this.performExpensiveCalculation(userId);
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }
}
```

### Bulk Operations
```typescript
// Implement efficient bulk operations
async createMultipleRecords(records: any[]): Promise<any[]> {
  // Use batch inserts instead of individual calls
  const BATCH_SIZE = 100;
  const results = [];
  
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const batchResults = await this.db.insertBatch('table_name', batch);
    results.push(...batchResults);
  }
  
  return results;
}
```

## Error Handling Patterns

### Service-Level Error Handling
```typescript
export class DomainService extends BaseService {
  
  async riskyOperation(): Promise<any> {
    try {
      // Business logic
      return await this.performOperation();
    } catch (error) {
      // Log error with context
      this.handleError(error, 'riskyOperation', { 
        userId: this.getCurrentUserId(),
        timestamp: new Date().toISOString()
      });
      
      // Transform technical errors to user-friendly messages
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('This record already exists');
      }
      
      // Re-throw for upstream handling
      throw error;
    }
  }
}
```

### Migration Error Handling
```typescript
// Graceful degradation in migration layer
static async withFallback<T>(
  newServiceCall: () => Promise<T>,
  legacyCall: () => Promise<T>,
  featureFlag: string = 'use_new_services'
): Promise<T> {
  const useNewServices = this.shouldUseNewServices(featureFlag);
  
  if (useNewServices) {
    try {
      return await newServiceCall();
    } catch (error) {
      // Log the failure but don't break user experience
      console.warn(`New service failed, falling back to legacy:`, error);
      
      // Report to monitoring service
      this.reportServiceFailure('new_service', error);
      
      return await legacyCall();
    }
  } else {
    return await legacyCall();
  }
}
```

## Monitoring and Observability

### Service Metrics
```typescript
export class BaseService {
  
  protected async trackOperation<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      
      // Track success metrics
      this.recordMetric(`${operationName}_success`, Date.now() - startTime);
      
      return result;
    } catch (error) {
      // Track error metrics
      this.recordMetric(`${operationName}_error`, Date.now() - startTime);
      this.recordError(operationName, error);
      
      throw error;
    }
  }
  
  private recordMetric(name: string, duration: number): void {
    // Send to monitoring service (e.g., DataDog, New Relic)
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('Service Metric', {
        metric: name,
        duration,
        timestamp: Date.now()
      });
    }
  }
}
```

## Migration Timeline

### Week 1-2: WellnessService
- Implement WellnessService with full CRUD operations
- Create migration layer methods
- Migrate WellnessQuickLogCard component
- Add comprehensive testing

### Week 3-4: WorkoutService  
- Implement WorkoutService with complex relationships
- Handle exercise management and bulk operations
- Migrate workout creation and management components
- Add performance optimizations

### Week 5-6: RPEService
- Implement RPEService for exertion tracking
- Integrate with workout and wellness data
- Migrate RPE logging components
- Add analytics integration

### Week 7-8: AnalyticsService
- Implement analytics and reporting service
- Add data aggregation and trend analysis
- Migrate analytics dashboard components
- Optimize for performance

### Week 9-10: InjuryRiskService
- Implement injury risk assessment service
- Add machine learning integration
- Migrate injury risk components
- Add monitoring and alerting

### Week 11-12: Remaining Services
- Complete remaining service implementations
- Finalize all component migrations
- Comprehensive testing and optimization
- Documentation and deployment preparation

## Success Metrics

### Technical Metrics
- **Code Reduction**: Measure lines of code removed from components
- **Error Rate**: Monitor service layer error rates vs. legacy
- **Performance**: Track response times and database query efficiency
- **Test Coverage**: Maintain >90% test coverage for all services

### Business Metrics
- **Reliability**: Reduce user-reported errors by 50%
- **Maintainability**: Reduce time to implement new features by 30%
- **Developer Experience**: Improve developer onboarding time
- **Scalability**: Support 10x user growth without architectural changes

## Conclusion

This implementation guide provides a systematic approach to abstracting all remaining services in the Track & Field application. By following these detailed technical instructions, each service can be implemented consistently with proper error handling, testing, and migration support.

The established patterns from the successful sleep service migration serve as the foundation for all future implementations, ensuring architectural consistency and maintainability across the entire application.

Remember to always implement the migration layer first, maintain backward compatibility during transitions, and thoroughly test both new and legacy code paths before deployment. 