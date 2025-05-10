-- Database Migration SQL for Track & Field Application
-- This file contains all SQL commands needed to set up the database schema

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Profiles Table (Core User Data)
CREATE TABLE IF NOT EXISTS public.profiles (
  -- For development/testing, remove the REFERENCES constraint temporarily
  -- id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  email TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('athlete', 'coach', 'team_manager')),
  avatar_url TEXT,
  bio TEXT
);

-- Comment indicating this is for development only
-- IMPORTANT: In production, restore the foreign key constraint:
-- ALTER TABLE public.profiles ALTER COLUMN id SET DATA TYPE UUID REFERENCES auth.users ON DELETE CASCADE;

-- Create Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create Athletes Table (Athlete-specific Data)
CREATE TABLE IF NOT EXISTS public.athletes (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  events TEXT[],
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL
);

-- Create Coaches Table (Coach-specific Data)
CREATE TABLE IF NOT EXISTS public.coaches (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  specialties TEXT[],
  certifications TEXT[]
);

-- Create Team Managers Table (Manager-specific Data)
CREATE TABLE IF NOT EXISTS public.team_managers (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  organization TEXT
);

-- Create Coach-Athlete Relationship Table
CREATE TABLE IF NOT EXISTS public.coach_athletes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID REFERENCES public.coaches(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(coach_id, athlete_id)
);

-- Create Workouts Table
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create Workout Assignments Table
CREATE TABLE IF NOT EXISTS public.workout_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  due_date DATE,
  status TEXT CHECK (status IN ('assigned', 'in_progress', 'completed', 'skipped')),
  UNIQUE(workout_id, athlete_id)
);

-- Create Events Table (Track & Field Events)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  category TEXT CHECK (category IN ('sprint', 'middle_distance', 'long_distance', 'hurdles', 'relay', 'jump', 'throw', 'combined'))
);

-- Create Personal Records Table
CREATE TABLE IF NOT EXISTS public.personal_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  record_value NUMERIC NOT NULL, -- Time in seconds or distance in meters
  record_date DATE NOT NULL,
  location TEXT,
  notes TEXT,
  UNIQUE(athlete_id, event_id, record_date)
);

-- Create athlete_workouts join table
CREATE TABLE IF NOT EXISTS public.athlete_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  workout_id uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  status text DEFAULT 'assigned',
  UNIQUE (athlete_id, workout_id)
);

-- Setup RLS (Row Level Security) Policies

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read all profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Allow users to update only their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Insert policy for profiles
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Athletes RLS
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;

-- Allow users to read all athletes
CREATE POLICY "Athletes are viewable by everyone"
  ON public.athletes FOR SELECT
  USING (true);

-- Allow users to update only their own athlete profile
CREATE POLICY "Users can update their own athlete profile"
  ON public.athletes FOR UPDATE
  USING (id IN (
    SELECT id FROM public.profiles 
    WHERE id = auth.uid() AND role = 'athlete'
  ));

-- Insert policy for athletes
CREATE POLICY "Users can insert their own athlete profile"
  ON public.athletes FOR INSERT
  WITH CHECK (id IN (
    SELECT id FROM public.profiles 
    WHERE id = auth.uid() AND role = 'athlete'
  ));

-- Coaches RLS
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

-- Allow users to read all coaches
CREATE POLICY "Coaches are viewable by everyone"
  ON public.coaches FOR SELECT
  USING (true);

-- Allow users to update only their own coach profile
CREATE POLICY "Users can update their own coach profile"
  ON public.coaches FOR UPDATE
  USING (id IN (
    SELECT id FROM public.profiles 
    WHERE id = auth.uid() AND role = 'coach'
  ));

-- Create function for triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 