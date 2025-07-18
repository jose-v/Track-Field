/**
 * Database Schema Definitions
 * --------------------------
 * This file contains database schema types and SQL schema for reference
 */

/**
 * SQL Schema (For Reference)
 *
 * -- Profiles Table (Core User Data)
 * create table public.profiles (
 *   id uuid references auth.users on delete cascade primary key,
 *   created_at timestamp with time zone default now() not null,
 *   updated_at timestamp with time zone default now() not null,
 *   email text unique,
 *   first_name text,
 *   last_name text,
 *   phone text,
 *   role text check (role in ('athlete', 'coach', 'team_manager')),
 *   avatar_url text,
 *   bio text
 * );
 * 
 * -- Athletes Table (Athlete-specific Data)
 * create table public.athletes (
 *   id uuid references public.profiles(id) on delete cascade primary key,
 *   date_of_birth date,
 *   gender text check (gender in ('male', 'female', 'other')),
 *   events text[],
 *   team_id uuid references public.teams(id)
 * );
 * 
 * -- Coaches Table (Coach-specific Data)
 * create table public.coaches (
 *   id uuid references public.profiles(id) on delete cascade primary key,
 *   specialties text[],
 *   certifications text[]
 * );
 * 
 * -- Team Managers Table (Manager-specific Data)
 * create table public.team_managers (
 *   id uuid references public.profiles(id) on delete cascade primary key,
 *   organization text
 * );
 * 
 * -- Teams Table
 * create table public.teams (
 *   id uuid primary key default uuid_generate_v4(),
 *   name text not null,
 *   description text
 * );
 * 
 * -- Coach-Athlete Relationship Table
 * create table public.coach_athletes (
 *   id uuid primary key default uuid_generate_v4(),
 *   coach_id uuid references public.coaches(id) on delete cascade,
 *   athlete_id uuid references public.athletes(id) on delete cascade,
 *   unique(coach_id, athlete_id)
 * );
 */

// Core profile type
export interface Profile {
  id: string;
  created_at: string;
  updated_at: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'athlete' | 'coach' | 'team_manager';
  avatar_url?: string;
  bio?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  team?: string;
  school?: string;
  coach?: string;
}

// Athlete type
export interface Athlete {
  id: string; // References profile id
  first_name?: string; // Synced from profiles table
  last_name?: string;  // Synced from profiles table
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  events: string[];
  team_id?: string;
}

// Coach type
export interface Coach {
  id: string; // References profile id
  first_name?: string; // Synced from profiles table
  last_name?: string;  // Synced from profiles table
  specialties: string[];
  certifications: string[];
  gender?: 'male' | 'female' | 'other';
  date_of_birth?: string;
  events: string[];
}

// Team Manager type
export interface TeamManager {
  id: string; // References profile id
  organization?: string;
}

// Team type
export interface Team {
  id: string;
  name: string;
  description?: string;
}

// Coach-Athlete relationship
export interface CoachAthlete {
  id: string;
  coach_id: string;
  athlete_id: string;
}

// Combined types for UI convenience
export interface AthleteWithProfile extends Athlete {
  profile: Profile;
}

export interface CoachWithProfile extends Coach {
  profile: Profile;
}

export interface TeamManagerWithProfile extends TeamManager {
  profile: Profile;
}

// Training Plan types (renamed from Monthly Plan)
export interface TrainingPlan {
  id: string;
  name: string;
  description?: string;
  coach_id: string;
  start_date: string; // YYYY-MM-DD format
  end_date: string;   // YYYY-MM-DD format
  weeks: {
    week_number: number;
    workout_id: string;
    is_rest_week: boolean;
  }[];
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  deleted_by?: string;
}

export interface TrainingPlanAssignment {
  id: string;
  training_plan_id: string; // Updated column name
  athlete_id: string;
  assigned_at: string;
  start_date: string;
  status: 'assigned' | 'in_progress' | 'completed';
  assigned_by: string;
}

// Legacy type aliases for backward compatibility during migration
export type MonthlyPlan = TrainingPlan;
export type MonthlyPlanAssignment = TrainingPlanAssignment; 