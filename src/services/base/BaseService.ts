import { dbClient } from '../../lib/dbClient';
import type { User } from '@supabase/supabase-js';

/**
 * Base Service Class
 * Provides common functionality for all domain services
 */
export abstract class BaseService {
  protected db = dbClient;

  /**
   * Get the current authenticated user
   * @throws Error if user is not authenticated
   */
  protected async getCurrentUser(): Promise<User> {
    const user = await this.db.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user;
  }

  /**
   * Validate user access to a resource
   */
  protected async validateUserAccess(
    userId: string, 
    resource: string, 
    resourceId: string
  ): Promise<boolean> {
    return await this.db.checkAccess(userId, resource, resourceId);
  }

  /**
   * Check if a coach has approved relationship with an athlete
   */
  protected async checkCoachAthleteApproval(
    coachId: string, 
    athleteId: string
  ): Promise<boolean> {
    try {
      const relationships = await this.db.select(
        'coach_athletes',
        'id',
        {
          coach_id: coachId,
          athlete_id: athleteId,
          approval_status: 'approved'
        }
      );
      return relationships.length > 0;
    } catch (error) {
      console.error('Error checking coach-athlete approval:', error);
      return false;
    }
  }

  /**
   * Get user profile with role data
   */
  protected async getUserProfile(userId: string): Promise<any> {
    try {
      const profiles = await this.db.select(
        'profiles',
        'id, first_name, last_name, email, role, avatar_url',
        { id: userId }
      );

      if (profiles.length === 0) {
        throw new Error('Profile not found');
      }

      const profile = profiles[0];

      // Get role-specific data
      let roleData = null;
      if (profile.role === 'athlete') {
        const athletes = await this.db.select(
          'athletes',
          'date_of_birth, gender, events, team_id',
          { id: userId }
        );
        roleData = athletes[0] || null;
      } else if (profile.role === 'coach') {
        const coaches = await this.db.select(
          'coaches',
          'specialties, certifications',
          { id: userId }
        );
        roleData = coaches[0] || null;
      }

      return { ...profile, ...roleData };
    } catch (error) {
      this.handleError(error, 'getUserProfile');
      throw error;
    }
  }

  /**
   * Centralized error handling with consistent logging
   */
  protected handleError(error: any, operation: string): void {
    const serviceName = this.constructor.name;
    console.error(`${serviceName} - ${operation}:`, {
      message: error.message,
      code: error.code,
      details: error.details,
      stack: error.stack
    });
  }

  /**
   * Validate required fields in data object
   */
  protected validateRequiredFields(
    data: Record<string, any>, 
    requiredFields: string[]
  ): void {
    const missingFields = requiredFields.filter(field => 
      data[field] === undefined || data[field] === null || data[field] === ''
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Sanitize data by removing undefined/null values
   */
  protected sanitizeData(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }

  /**
   * Format date to YYYY-MM-DD
   */
  protected formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  /**
   * Check if user has specific role
   */
  protected async checkUserRole(userId: string, expectedRole: string): Promise<boolean> {
    try {
      const profiles = await this.db.select(
        'profiles',
        'role',
        { id: userId }
      );
      
      return profiles.length > 0 && profiles[0].role === expectedRole;
    } catch (error) {
      console.error('Error checking user role:', error);
      return false;
    }
  }
} 