# API Refactoring Plan - Track & Field Application

## 📋 **Current State Analysis**

### **Problem Statement**
Our `api.ts` file has grown to **2,847 lines** and has become a monolithic beast that's difficult to maintain, test, and navigate. It contains:

- All API service methods for the entire application
- Type definitions mixed with implementation
- Workout management, profile management, athlete/coach operations
- Training plans, assignments, exercise results
- Team management and notifications
- Authentication and authorization logic

### **Current Issues**
- **Monolithic structure:** Single massive file containing all API logic
- **Mixed concerns:** Types, services, utilities, and business logic all in one place
- **Maintenance nightmare:** Finding specific functionality requires scrolling through thousands of lines
- **Testing difficulties:** Hard to unit test individual service modules in isolation
- **Import bloat:** Components import the entire API object when only specific services are needed
- **Code review challenges:** Large diffs make it hard to review changes
- **Developer experience:** Slow IDE performance, poor IntelliSense

## 🏗️ **Proposed Refactoring Architecture**

### **Phase 1: Create Service-Specific Structure**

#### **1.1 Core Types & Interfaces Directory**
```
src/services/types/
├── index.ts                    # Re-export all types for easy importing
├── workout.types.ts           # Exercise, Workout, EnhancedWorkoutData interfaces
├── profile.types.ts           # Profile, Coach, Athlete, TeamManager interfaces  
├── team.types.ts              # Team, TeamPost interfaces
├── training.types.ts          # TrainingPlan, TrainingPlanAssignment interfaces
├── records.types.ts           # Personal records and exercise results interfaces
└── common.types.ts            # Shared/utility types used across services
```

#### **1.2 Individual Service Files**
```
src/services/api/
├── index.ts                   # Main API aggregator and barrel exports
├── base.service.ts            # Abstract base class with shared utilities
├── auth.service.ts            # Authentication and authorization utilities
├── workout.service.ts         # Workout CRUD, templates, drafts, creation
├── profile.service.ts         # Profile management and role-specific updates  
├── athlete.service.ts         # Athlete-specific operations and queries
├── coach.service.ts           # Coach-specific operations and athlete management
├── team.service.ts            # Team management and team posts
├── event.service.ts           # Track & field events and personal records
├── training-plan.service.ts   # Training plans, creation, management
├── training-assignment.service.ts # Plan assignments and athlete progress
├── athlete-workout.service.ts # Workout assignments, completion tracking
├── exercise-result.service.ts # Exercise results, timing, performance data
└── security.service.ts        # Centralized security and approval checking
```

### **Phase 2: Service Architecture Design**

#### **2.1 Base Service Class**
```typescript
// src/services/api/base.service.ts
import { supabase } from '../../lib/supabase';

export abstract class BaseService {
  protected supabase = supabase;
  
  /**
   * Get the current authenticated user
   * @throws Error if user is not authenticated
   */
  protected async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    return user;
  }
  
  /**
   * Check if a coach has approved relationship with an athlete
   */
  protected async checkCoachAthleteApproval(coachId: string, athleteId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('coach_athletes')
      .select('id')
      .eq('coach_id', coachId)
      .eq('athlete_id', athleteId)
      .eq('approval_status', 'approved')
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }
  
  /**
   * Centralized error handling with consistent logging
   */
  protected handleError(error: any, operation: string) {
    console.error(`${this.constructor.name} - ${operation}:`, error);
    throw error;
  }
  
  /**
   * Retry logic for database operations with exponential backoff
   */
  protected async withRetry<T>(
    operation: () => Promise<T>, 
    maxRetries: number = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        if (attempt === maxRetries) throw error;
        
        const waitTime = Math.pow(2, attempt) * 500;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    throw new Error('Max retries exceeded');
  }
}
```

#### **2.2 Example Service Implementation**
```typescript
// src/services/api/workout.service.ts
import { BaseService } from './base.service';
import { Workout, Exercise, EnhancedWorkoutData } from '../types/workout.types';

export class WorkoutService extends BaseService {
  async getAll(): Promise<Workout[]> {
    try {
      const { data, error } = await this.supabase
        .from('workouts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return this.handleError(error, 'getAll');
    }
  }

  async getByCreator(userId: string): Promise<Workout[]> {
    if (!userId) return [];
    
    try {
      const { data, error } = await this.supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      return this.handleError(error, 'getByCreator');
    }
  }

  async create(workout: Omit<Workout, 'id' | 'created_at'>): Promise<Workout> {
    const user = await this.getCurrentUser();
    
    try {
      const workoutData = {
        name: workout.name,
        description: workout.notes || workout.description || '',
        user_id: user.id,
        created_by: user.id,
        exercises: workout.exercises || [],
        ...this.extractOptionalFields(workout)
      };
      
      const { data, error } = await this.supabase
        .from('workouts')
        .insert([workoutData])
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        notes: data.description || '',
        exercises: data.exercises || []
      };
    } catch (error) {
      return this.handleError(error, 'create');
    }
  }

  private extractOptionalFields(workout: any) {
    const optionalFields: any = {};
    
    if (workout.type) optionalFields.type = workout.type;
    if (workout.date) optionalFields.date = workout.date;
    if (workout.duration) optionalFields.duration = workout.duration;
    if (workout.time) optionalFields.time = workout.time;
    if (workout.location) optionalFields.location = workout.location;
    if (workout.template_type) optionalFields.template_type = workout.template_type;
    
    return optionalFields;
  }

  // ... additional methods (update, delete, getAssignedToAthlete, etc.)
}

export const workoutService = new WorkoutService();
```

### **Phase 3: Security & Authorization Layer**

#### **3.1 Security Service**
```typescript
// src/services/api/security.service.ts
export class SecurityService extends BaseService {
  /**
   * Check if user can view athlete's data
   */
  async canViewAthleteData(userId: string, athleteId: string): Promise<boolean> {
    // Athletes can always view their own data
    if (userId === athleteId) return true;
    
    // Check if user is an approved coach for this athlete
    return await this.checkCoachAthleteApproval(userId, athleteId);
  }

  /**
   * Check if coach can assign workouts to athlete
   */
  async canAssignWorkout(coachId: string, athleteId: string): Promise<boolean> {
    return await this.checkCoachAthleteApproval(coachId, athleteId);
  }

  /**
   * Get list of approved athletes for a coach
   */
  async getApprovedAthleteIds(coachId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('coach_athletes')
      .select('athlete_id')
      .eq('coach_id', coachId)
      .eq('approval_status', 'approved');
      
    if (error) throw error;
    return data?.map(row => row.athlete_id) || [];
  }

  /**
   * Filter assignments to only include approved relationships
   */
  async filterApprovedAssignments<T extends { athlete_id: string }>(
    coachId: string, 
    assignments: T[]
  ): Promise<T[]> {
    const approvedIds = await this.getApprovedAthleteIds(coachId);
    const approvedSet = new Set(approvedIds);
    return assignments.filter(assignment => approvedSet.has(assignment.athlete_id));
  }
}

export const securityService = new SecurityService();
```

#### **3.2 Security Decorators**
```typescript
// src/services/api/decorators/security.decorators.ts
export function RequireAuthentication(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function (...args: any[]) {
    const user = await (this as BaseService).getCurrentUser();
    return originalMethod.apply(this, args);
  };
  
  return descriptor;
}

export function RequireCoachApproval(athleteIdIndex: number = 0) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const user = await (this as BaseService).getCurrentUser();
      const athleteId = args[athleteIdIndex];
      
      if (user.id !== athleteId) {
        const hasApproval = await (this as BaseService).checkCoachAthleteApproval(user.id, athleteId);
        if (!hasApproval) {
          throw new Error('Unauthorized: No approved coach-athlete relationship');
        }
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}
```

### **Phase 4: Configuration & Utilities**

#### **4.1 Configuration Files**
```typescript
// src/services/config/database.config.ts
export const DatabaseConfig = {
  tables: {
    profiles: 'profiles',
    athletes: 'athletes',
    coaches: 'coaches',
    workouts: 'workouts',
    coachAthletes: 'coach_athletes',
    trainingPlans: 'training_plans',
    trainingPlanAssignments: 'training_plan_assignments',
    athleteWorkouts: 'athlete_workouts',
    exerciseResults: 'exercise_results'
  },
  
  queryLimits: {
    defaultPageSize: 50,
    maxPageSize: 100,
    searchLimit: 10
  },
  
  timeouts: {
    defaultQuery: 15000,  // 15 seconds
    complexQuery: 30000,  // 30 seconds
    retryDelay: 500       // 0.5 seconds
  }
} as const;
```

#### **4.2 Query Builders**
```typescript
// src/services/api/query-builders/athlete.queries.ts
export class AthleteQueries {
  static approvedByCoach(coachId: string) {
    return supabase
      .from('coach_athletes')
      .select(`
        athlete_id,
        athletes!inner (
          id, date_of_birth, gender, events, team_id
        ),
        profiles!inner (
          id, first_name, last_name, email, phone, avatar_url
        )
      `)
      .eq('coach_id', coachId)
      .eq('approval_status', 'approved');
  }

  static withAssignments(athleteId: string) {
    return supabase
      .from('training_plan_assignments')
      .select(`
        id, training_plan_id, assigned_at, status, start_date,
        training_plans!inner (
          id, name, description, start_date, end_date, weekly_workout_ids
        )
      `)
      .eq('athlete_id', athleteId)
      .order('assigned_at', { ascending: false });
  }
}
```

### **Phase 5: Main API Aggregator**

#### **5.1 Updated Main API Export**
```typescript
// src/services/api/index.ts
import { workoutService } from './workout.service';
import { profileService } from './profile.service';
import { athleteService } from './athlete.service';
import { coachService } from './coach.service';
import { teamService } from './team.service';
import { eventService } from './event.service';
import { trainingPlanService } from './training-plan.service';
import { trainingAssignmentService } from './training-assignment.service';
import { athleteWorkoutService } from './athlete-workout.service';
import { exerciseResultService } from './exercise-result.service';
import { securityService } from './security.service';

// Main API object - maintains backward compatibility
export const api = {
  workouts: workoutService,
  profile: profileService,
  athletes: athleteService,
  coaches: coachService,
  teams: teamService,
  events: eventService,
  trainingPlans: trainingPlanService,
  trainingPlanAssignments: trainingAssignmentService,
  athleteWorkouts: athleteWorkoutService,
  exerciseResults: exerciseResultService,
  security: securityService,
  
  // Legacy aliases for backward compatibility
  get monthlyPlans() { 
    return this.trainingPlans; 
  },
  get monthlyPlanAssignments() { 
    return this.trainingPlanAssignments; 
  }
};

// Named exports for direct service access
export {
  workoutService,
  profileService,
  athleteService,
  coachService,
  teamService,
  eventService,
  trainingPlanService,
  trainingAssignmentService,
  athleteWorkoutService,
  exerciseResultService,
  securityService
};

// Re-export types for convenience
export * from '../types';

// Default export for existing import patterns
export default api;
```

## 🔧 **Implementation Strategy**

### **Phase 1: Preparation (1-2 days)**
1. **Create directory structure** - Set up new folder hierarchy
2. **Extract types** - Move all interfaces to dedicated type files
3. **Create base service** - Implement shared functionality and utilities
4. **Set up configuration** - Create config files and constants

### **Phase 2: Service Extraction (3-5 days)**
1. **Start with smallest services** - Begin with `events`, `records`, `team` (fewer dependencies)
2. **Extract medium services** - Move `athletes`, `coaches`, `teams` 
3. **Tackle large services** - Split `workouts`, `profile`, `trainingPlans`
4. **Handle complex services** - Extract `athleteWorkouts`, `exerciseResults`

### **Phase 3: Security Integration (2-3 days)**
1. **Implement security service** - Centralize authorization logic
2. **Add security decorators** - Apply consistent authorization patterns
3. **Update security filtering** - Ensure all queries use approval checks
4. **Add comprehensive security tests** - Verify all security measures

### **Phase 4: Testing & Integration (2-3 days)**
1. **Unit test individual services** - Test each service in isolation
2. **Integration testing** - Ensure API aggregator works correctly
3. **Regression testing** - Verify no breaking changes in existing functionality
4. **Performance testing** - Ensure refactoring doesn't impact performance

### **Phase 5: Documentation & Cleanup (1-2 days)**
1. **Update documentation** - Document new service architecture
2. **Create migration guide** - Help developers adapt to new structure
3. **Remove legacy code** - Archive the old monolithic api.ts file
4. **Update imports** - Gradually migrate existing code to use new structure

## 📊 **Expected Benefits**

### **Maintainability**
- **Smaller files** - Each service 100-300 lines instead of 2,847 lines
- **Single responsibility** - Each service handles one specific domain
- **Easier debugging** - Isolated concerns make issues easier to trace and fix
- **Better code organization** - Related functionality grouped logically

### **Developer Experience**
- **Faster IDE performance** - Smaller files load and parse much faster
- **Better IntelliSense** - More precise auto-completion and type hints
- **Easier code navigation** - Find functionality quickly without scrolling
- **Improved code reviews** - Smaller, focused changes are easier to review

### **Testing & Quality**
- **Unit testability** - Test individual services in complete isolation
- **Mock-friendly** - Easy to mock specific services for component testing
- **Better test coverage** - More granular testing of individual functions
- **Faster test execution** - Isolated tests run faster

### **Security & Compliance**
- **Centralized authorization** - Consistent security checks across all services
- **Audit trail** - Easier to track and verify security implementations
- **Reduced attack surface** - Clear separation of concerns reduces security risks
- **Compliance ready** - Better structure for security audits

### **Performance**
- **Tree shaking** - Import only needed services in production bundles
- **Lazy loading** - Load services on demand rather than entire API
- **Caching optimization** - Service-specific caching strategies
- **Memory efficiency** - Smaller memory footprint per service

## 🚀 **Migration Path**

### **Backward Compatibility Strategy**
```typescript
// Phase 1: Maintain existing API interface
const api = {
  workouts: workoutService,
  profile: profileService,
  // ... other services
};

// Old usage continues to work unchanged:
api.workouts.getAll();
api.profile.update(profileData);

// New usage becomes available:
import { workoutService } from '@/services/api';
workoutService.getAll();
```

### **Gradual Migration Timeline**
1. **Phase 1 (Week 1):** Extract services but keep old api.ts as aggregator
2. **Phase 2 (Week 2):** Update new features to use direct service imports
3. **Phase 3 (Week 3-4):** Gradually migrate existing components to new structure
4. **Phase 4 (Week 5):** Remove old api.ts file and complete migration

### **Risk Mitigation**
- **Feature flags** - Use flags to switch between old and new implementations
- **Comprehensive testing** - Extensive test suite to catch regressions
- **Rollback plan** - Ability to quickly revert to monolithic structure if needed
- **Gradual rollout** - Migrate one service at a time to minimize risk

## 🎯 **Success Metrics**

### **Code Quality Metrics**
- **File size reduction** - From 2,847 lines to ~200-300 lines per service
- **Cyclomatic complexity** - Reduced complexity per function/method
- **Test coverage** - Increased unit test coverage from service isolation
- **Code duplication** - Reduced duplication through shared base class

### **Developer Productivity Metrics**
- **IDE responsiveness** - Faster auto-completion and syntax checking
- **Build time** - Faster compilation due to smaller files
- **Code review time** - Faster reviews due to focused changes
- **Onboarding time** - New developers can understand individual services faster

### **Maintenance Metrics**
- **Bug resolution time** - Faster debugging due to isolated concerns
- **Feature development time** - Faster development with focused services
- **Security audit time** - Easier security reviews with centralized auth
- **Documentation coverage** - Better documented individual services

## 💡 **Recommendations for Review**

### **Questions for Gemini/Review**
1. **Architecture concerns:** Is the proposed service separation logical and complete?
2. **Security implications:** Are there any security considerations we've missed?
3. **Performance impact:** Could this refactoring negatively impact performance?
4. **Migration risks:** What are the biggest risks in this migration strategy?
5. **Alternative approaches:** Are there better architectural patterns we should consider?
6. **Testing strategy:** Is our testing approach comprehensive enough?
7. **Backwards compatibility:** Are we maintaining compatibility effectively?

### **Specific Technical Questions**
1. Should we use dependency injection instead of direct service instantiation?
2. Is the decorator pattern the best approach for security enforcement?
3. Should we implement service interfaces for better testability?
4. Would a factory pattern be better for service creation?
5. How should we handle service-to-service dependencies?
6. Should we implement caching at the service level or higher?

This refactoring plan represents a comprehensive approach to transforming our monolithic API into a maintainable, scalable, and secure service architecture. The goal is to preserve all existing functionality while dramatically improving code organization, maintainability, and developer experience. 