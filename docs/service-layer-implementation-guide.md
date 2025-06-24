# Service Layer Implementation Guide

## Overview

This guide outlines the step-by-step implementation of an abstract database client layer to replace direct Supabase calls throughout the codebase. The implementation follows a gradual migration strategy to ensure zero downtime and maintain existing functionality.

## Architecture

```
┌─────────────────────────────────────────┐
│               UI Components             │
├─────────────────────────────────────────┤
│              React Hooks               │
├─────────────────────────────────────────┤
│           Migration Layer              │
│        (Gradual Transition)            │
├─────────────────────────────────────────┤
│            Domain Services             │
│      (Sleep, Workout, Analytics)       │
├─────────────────────────────────────────┤
│             Base Service               │
│    (Common Auth, Validation, etc.)     │
├─────────────────────────────────────────┤
│            DbClient                    │
│   (Abstract Database Operations)       │
├─────────────────────────────────────────┤
│             Supabase                   │
└─────────────────────────────────────────┘
```

## Phase 1: Foundation (Week 1) ✅ COMPLETED

### ✅ Step 1: DbClient Implementation
- **File**: `src/lib/dbClient.ts`
- **Features**: 
  - Centralized database operations
  - Retry logic with exponential backoff
  - Error handling and logging
  - Authentication management
  - Type-safe CRUD operations

### ✅ Step 2: Base Service Class
- **File**: `src/services/base/BaseService.ts`
- **Features**:
  - Common authentication patterns
  - Data validation utilities
  - Error handling
  - Access control helpers

### ✅ Step 3: Example Domain Service
- **File**: `src/services/domain/SleepService.ts`
- **Features**:
  - Complete CRUD operations for sleep records
  - Business logic validation
  - Permission checking
  - Upsert functionality

## Phase 2: Migration Strategy (Week 2-3)

### ✅ Step 4: Migration Utility
- **File**: `src/utils/migration/ServiceMigration.ts`
- **Features**:
  - Feature flag support
  - Fallback to legacy methods
  - Health checking
  - Debug utilities

### ✅ Step 5: Update Existing Hooks
- **File**: `src/hooks/useSleepRecords.ts` (Updated)
- **Changes**: Now uses migration layer for gradual transition

### Step 6: Service Registry
- **File**: `src/services/index.ts`
- **Features**: Centralized service management and exports

## Phase 3: Domain Service Implementation (Week 3-6)

### Priority 1: Core Analytics Services

#### Step 7: Wellness Service
```typescript
// src/services/domain/WellnessService.ts
export class WellnessService extends BaseService {
  async getWellnessRecords(userId: string, days: number): Promise<WellnessRecord[]>
  async createWellnessRecord(data: WellnessData): Promise<WellnessRecord>
  async getWellnessStats(userId: string): Promise<WellnessStats>
}
```

#### Step 8: Workout Service
```typescript
// src/services/domain/WorkoutService.ts
export class WorkoutService extends BaseService {
  async getWorkouts(userId: string, filters: WorkoutFilters): Promise<Workout[]>
  async createWorkout(data: WorkoutData): Promise<Workout>
  async updateWorkout(id: string, updates: Partial<WorkoutData>): Promise<Workout>
  async deleteWorkout(id: string): Promise<void>
  async assignWorkout(workoutId: string, athleteIds: string[]): Promise<void>
}
```

#### Step 9: Analytics Service
```typescript
// src/services/domain/AnalyticsService.ts
export class AnalyticsService extends BaseService {
  async getPerformanceMetrics(userId: string, period: string): Promise<PerformanceMetrics>
  async getInjuryRiskAnalysis(userId: string): Promise<InjuryRisk>
  async getTrainingLoadAnalysis(userId: string): Promise<TrainingLoad>
}
```

### Priority 2: User Management Services

#### Step 10: Profile Service
```typescript
// src/services/domain/ProfileService.ts
export class ProfileService extends BaseService {
  async getProfile(userId: string): Promise<Profile>
  async updateProfile(userId: string, updates: ProfileUpdates): Promise<Profile>
  async uploadAvatar(userId: string, file: File): Promise<string>
}
```

#### Step 11: Team Service
```typescript
// src/services/domain/TeamService.ts
export class TeamService extends BaseService {
  async getTeams(userId: string): Promise<Team[]>
  async createTeam(data: TeamData): Promise<Team>
  async addTeamMember(teamId: string, userId: string, role: string): Promise<void>
  async removeTeamMember(teamId: string, userId: string): Promise<void>
}
```

### Priority 3: Content Services

#### Step 12: Meet Service
```typescript
// src/services/domain/MeetService.ts
export class MeetService extends BaseService {
  async getMeets(filters: MeetFilters): Promise<Meet[]>
  async createMeet(data: MeetData): Promise<Meet>
  async registerForMeet(meetId: string, athleteId: string): Promise<void>
}
```

#### Step 13: Loop Service (Social Features)
```typescript
// src/services/domain/LoopService.ts
export class LoopService extends BaseService {
  async getPosts(filters: PostFilters): Promise<Post[]>
  async createPost(data: PostData): Promise<Post>
  async likePost(postId: string): Promise<void>
  async commentOnPost(postId: string, comment: string): Promise<Comment>
}
```

## Phase 4: Migration Execution (Week 6-8)

### Step 14: Component-by-Component Migration

#### 14.1: Sleep Components
- [ ] Update `SleepQuickLogCard.tsx` to use `sleepService`
- [ ] Update `SleepStatsCard.tsx` to use `sleepService`
- [ ] Update `pages/athlete/Sleep.tsx` to use `sleepService`

#### 14.2: Wellness Components
- [ ] Update wellness cards to use `wellnessService`
- [ ] Update wellness pages to use `wellnessService`

#### 14.3: Workout Components
- [ ] Update workout creator to use `workoutService`
- [ ] Update workout lists to use `workoutService`
- [ ] Update workout assignments to use `workoutService`

### Step 15: API Service Refactoring

#### 15.1: Break Down api.ts
The current `api.ts` file (~1800 lines) should be split into focused modules:

```
src/services/api/
├── auth.ts          # Authentication operations
├── profiles.ts      # Profile management
├── teams.ts         # Team operations
├── workouts.ts      # Workout CRUD
├── meets.ts         # Meet management
├── analytics.ts     # Analytics queries
└── index.ts         # Re-exports
```

#### 15.2: Update Imports
Replace direct `api.ts` imports with service imports:
```typescript
// Before
import { getAthleteWorkouts } from '../services/api';

// After
import { workoutService } from '../services';
```

## Phase 5: Testing & Optimization (Week 8-9)

### Step 16: Testing Strategy

#### 16.1: Unit Tests for Services
```typescript
// src/tests/services/SleepService.test.ts
describe('SleepService', () => {
  beforeEach(() => {
    ServiceRegistry.clear();
    // Setup mock dbClient
  });

  test('should create sleep record', async () => {
    // Test implementation
  });
});
```

#### 16.2: Integration Tests
```typescript
// src/tests/integration/sleep-flow.test.ts
describe('Sleep Flow Integration', () => {
  test('should handle complete sleep logging flow', async () => {
    // Test complete user flow
  });
});
```

### Step 17: Performance Optimization

#### 17.1: Caching Strategy
```typescript
// Add to DbClient
private cache = new Map<string, { data: any; expires: number }>();

async selectWithCache<T>(
  table: string, 
  columns: string, 
  filters: Record<string, any>,
  ttl: number = 300000 // 5 minutes
): Promise<T[]>
```

#### 17.2: Query Optimization
- Implement query batching
- Add connection pooling
- Optimize React Query configurations

## Phase 6: Cleanup & Documentation (Week 9-10)

### Step 18: Legacy Code Removal
- [ ] Remove direct Supabase imports from components
- [ ] Clean up unused utility functions
- [ ] Remove old API functions after migration

### Step 19: Documentation
- [ ] Update component documentation
- [ ] Create service API documentation
- [ ] Update README with new architecture

### Step 20: Monitoring & Metrics
- [ ] Add service performance monitoring
- [ ] Implement error tracking
- [ ] Add usage analytics

## Migration Checklist

### Pre-Migration
- [ ] All foundation services implemented
- [ ] Migration utility tested
- [ ] Feature flags configured
- [ ] Backup strategy in place

### During Migration
- [ ] Enable new services for testing: `ServiceMigration.enableNewServices()`
- [ ] Monitor error rates and performance
- [ ] Gradual rollout to user segments
- [ ] Fallback to legacy if issues arise

### Post-Migration
- [ ] Remove feature flags
- [ ] Clean up legacy code
- [ ] Update documentation
- [ ] Performance optimization

## Environment Configuration

Add to `.env`:
```bash
# Enable new service layer (for testing)
VITE_USE_NEW_SERVICES=false

# Service configuration
VITE_DB_RETRY_ATTEMPTS=3
VITE_DB_RETRY_DELAY=1000
```

## Debugging Tools

### Development Console Commands
```javascript
// Check migration health
ServiceMigration.checkMigrationHealth()

// Enable new services
ServiceMigration.enableNewServices()

// Check current mode
ServiceMigration.getCurrentMode()

// Test service directly
services.sleep.getSleepStats('user-id', 7)
```

## Best Practices

### 1. Service Design
- Keep services focused on single domain
- Use composition over inheritance
- Implement proper error boundaries
- Add comprehensive logging

### 2. Migration Safety
- Always provide fallback mechanisms
- Test thoroughly before rollout
- Monitor performance metrics
- Have rollback plan ready

### 3. Type Safety
- Use TypeScript interfaces for all data
- Implement runtime validation
- Add proper error types
- Use generic types appropriately

### 4. Performance
- Implement proper caching
- Use React Query optimally
- Batch database operations
- Monitor query performance

## Success Metrics

### Technical Metrics
- [ ] 100% test coverage for services
- [ ] <100ms average response time
- [ ] <1% error rate
- [ ] Zero breaking changes during migration

### Code Quality Metrics
- [ ] Reduced cyclomatic complexity
- [ ] Improved maintainability index
- [ ] Fewer direct Supabase dependencies
- [ ] Better separation of concerns

### User Experience Metrics
- [ ] No degradation in page load times
- [ ] Maintained or improved error handling
- [ ] Consistent data freshness
- [ ] Smooth transition with no downtime

## Risk Mitigation

### High Risk Areas
1. **Authentication flows** - Critical path, test extensively
2. **Real-time features** - Ensure subscriptions work correctly
3. **File uploads** - Handle storage operations carefully
4. **Complex queries** - Maintain performance with abstractions

### Mitigation Strategies
1. **Gradual rollout** - Start with non-critical features
2. **Feature flags** - Quick rollback capability
3. **Monitoring** - Real-time error detection
4. **Testing** - Comprehensive test coverage

## Timeline Summary

| Week | Phase | Key Deliverables |
|------|-------|------------------|
| 1 | Foundation | DbClient, BaseService, SleepService |
| 2-3 | Migration Strategy | Migration utility, updated hooks |
| 3-6 | Domain Services | All major services implemented |
| 6-8 | Migration Execution | Components migrated, API refactored |
| 8-9 | Testing & Optimization | Tests written, performance tuned |
| 9-10 | Cleanup & Documentation | Legacy removed, docs updated |

This implementation provides a robust, maintainable, and scalable foundation for the Track & Field application's data layer. 