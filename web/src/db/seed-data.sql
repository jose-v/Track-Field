-- Seed data for Track & Field application
-- Run this after migrations.sql to populate tables with initial data

-- Insert common track and field events
INSERT INTO public.events (id, name, category)
VALUES
  (uuid_generate_v4(), '100m Sprint', 'sprint'),
  (uuid_generate_v4(), '200m Sprint', 'sprint'),
  (uuid_generate_v4(), '400m Sprint', 'sprint'),
  (uuid_generate_v4(), '800m', 'middle_distance'),
  (uuid_generate_v4(), '1500m', 'middle_distance'),
  (uuid_generate_v4(), 'Mile Run', 'middle_distance'),
  (uuid_generate_v4(), '3000m', 'long_distance'),
  (uuid_generate_v4(), '5000m', 'long_distance'),
  (uuid_generate_v4(), '10000m', 'long_distance'),
  (uuid_generate_v4(), 'Marathon', 'long_distance'),
  (uuid_generate_v4(), '100m Hurdles (Women)', 'hurdles'),
  (uuid_generate_v4(), '110m Hurdles (Men)', 'hurdles'),
  (uuid_generate_v4(), '400m Hurdles', 'hurdles'),
  (uuid_generate_v4(), '4x100m Relay', 'relay'),
  (uuid_generate_v4(), '4x400m Relay', 'relay'),
  (uuid_generate_v4(), 'High Jump', 'jump'),
  (uuid_generate_v4(), 'Long Jump', 'jump'),
  (uuid_generate_v4(), 'Triple Jump', 'jump'),
  (uuid_generate_v4(), 'Pole Vault', 'jump'),
  (uuid_generate_v4(), 'Shot Put', 'throw'),
  (uuid_generate_v4(), 'Discus Throw', 'throw'),
  (uuid_generate_v4(), 'Javelin Throw', 'throw'),
  (uuid_generate_v4(), 'Hammer Throw', 'throw'),
  (uuid_generate_v4(), 'Decathlon (Men)', 'combined'),
  (uuid_generate_v4(), 'Heptathlon (Women)', 'combined');

-- Create demo teams
INSERT INTO public.teams (id, name, description, created_at, updated_at)
VALUES
  (uuid_generate_v4(), 'Track Stars', 'Elite competitive track team', NOW(), NOW()),
  (uuid_generate_v4(), 'Sprint Squad', 'Specializing in sprint events', NOW(), NOW()),
  (uuid_generate_v4(), 'Distance Demons', 'Long distance running specialists', NOW(), NOW()),
  (uuid_generate_v4(), 'Jumping Giants', 'High performers in jumping events', NOW(), NOW()),
  (uuid_generate_v4(), 'Throwing Thunder', 'Power athletes focusing on throwing events', NOW(), NOW());

-- Store team IDs for later use with athletes
DO $$
DECLARE
  track_stars_id UUID;
  sprint_squad_id UUID;
  distance_demons_id UUID;
  jumping_giants_id UUID;
  throwing_thunder_id UUID;
BEGIN
  -- Get team IDs
  SELECT id INTO track_stars_id FROM public.teams WHERE name = 'Track Stars';
  SELECT id INTO sprint_squad_id FROM public.teams WHERE name = 'Sprint Squad';
  SELECT id INTO distance_demons_id FROM public.teams WHERE name = 'Distance Demons';
  SELECT id INTO jumping_giants_id FROM public.teams WHERE name = 'Jumping Giants';
  SELECT id INTO throwing_thunder_id FROM public.teams WHERE name = 'Throwing Thunder';

  -- Note: To create actual users with auth, you would need to use the Supabase API or UI
  -- For demo purposes, we'll create placeholders in the profiles table 
  -- In practice, you would first create users through auth.users
  
  -- Create demo profiles and role-specific entries (ONLY FOR DEMO/LOCAL DEVELOPMENT)
  -- Note: In production, users would be created through proper signup process
  
  -- For coaches
  INSERT INTO public.profiles (id, email, first_name, last_name, role, created_at, updated_at)
  VALUES
    (uuid_generate_v4(), 'coach.carter@example.com', 'Ken', 'Carter', 'coach', NOW(), NOW()),
    (uuid_generate_v4(), 'coach.johnson@example.com', 'Sarah', 'Johnson', 'coach', NOW(), NOW());
  
  -- For team managers
  INSERT INTO public.profiles (id, email, first_name, last_name, role, created_at, updated_at)
  VALUES
    (uuid_generate_v4(), 'manager.williams@example.com', 'Robert', 'Williams', 'team_manager', NOW(), NOW()),
    (uuid_generate_v4(), 'manager.brown@example.com', 'Emily', 'Brown', 'team_manager', NOW(), NOW());
  
  -- For athletes (Sprint Squad)
  INSERT INTO public.profiles (id, email, first_name, last_name, role, created_at, updated_at)
  VALUES
    (uuid_generate_v4(), 'john.smith@example.com', 'John', 'Smith', 'athlete', NOW(), NOW()),
    (uuid_generate_v4(), 'lisa.johnson@example.com', 'Lisa', 'Johnson', 'athlete', NOW(), NOW());
  
  -- For athletes (Distance Demons)
  INSERT INTO public.profiles (id, email, first_name, last_name, role, created_at, updated_at)
  VALUES
    (uuid_generate_v4(), 'james.wilson@example.com', 'James', 'Wilson', 'athlete', NOW(), NOW()),
    (uuid_generate_v4(), 'maria.garcia@example.com', 'Maria', 'Garcia', 'athlete', NOW(), NOW());
  
  -- For athletes (Jumping Giants)
  INSERT INTO public.profiles (id, email, first_name, last_name, role, created_at, updated_at)
  VALUES
    (uuid_generate_v4(), 'mike.taylor@example.com', 'Michael', 'Taylor', 'athlete', NOW(), NOW()),
    (uuid_generate_v4(), 'sophia.lee@example.com', 'Sophia', 'Lee', 'athlete', NOW(), NOW());
  
  -- For athletes (Throwing Thunder)
  INSERT INTO public.profiles (id, email, first_name, last_name, role, created_at, updated_at)
  VALUES
    (uuid_generate_v4(), 'david.miller@example.com', 'David', 'Miller', 'athlete', NOW(), NOW()),
    (uuid_generate_v4(), 'emma.davis@example.com', 'Emma', 'Davis', 'athlete', NOW(), NOW());

  -- Create coach entries
  INSERT INTO public.coaches (id, specialties, certifications)
  SELECT id, 
         ARRAY['Sprint', 'Hurdles']::TEXT[], 
         ARRAY['USATF Level 1', 'Sprint Specialist']::TEXT[]
  FROM public.profiles 
  WHERE email = 'coach.carter@example.com';
  
  INSERT INTO public.coaches (id, specialties, certifications)
  SELECT id, 
         ARRAY['Distance', 'Cross Country']::TEXT[], 
         ARRAY['USATF Level 2', 'Distance Coach']::TEXT[]
  FROM public.profiles 
  WHERE email = 'coach.johnson@example.com';
  
  -- Create team manager entries
  INSERT INTO public.team_managers (id, organization)
  SELECT id, 'City Athletics Association'
  FROM public.profiles 
  WHERE email = 'manager.williams@example.com';
  
  INSERT INTO public.team_managers (id, organization)
  SELECT id, 'University Track Club'
  FROM public.profiles 
  WHERE email = 'manager.brown@example.com';
  
  -- Create athlete entries for Sprint Squad members
  INSERT INTO public.athletes (id, birth_date, gender, events, team_id)
  SELECT id, '2000-05-15'::DATE, 'male', 
         ARRAY['100m Sprint', '200m Sprint']::TEXT[], 
         sprint_squad_id
  FROM public.profiles 
  WHERE email = 'john.smith@example.com';
  
  INSERT INTO public.athletes (id, birth_date, gender, events, team_id)
  SELECT id, '2002-08-22'::DATE, 'female', 
         ARRAY['100m Sprint', '400m Sprint']::TEXT[], 
         sprint_squad_id
  FROM public.profiles 
  WHERE email = 'lisa.johnson@example.com';
  
  -- Create athlete entries for Distance Demons members
  INSERT INTO public.athletes (id, birth_date, gender, events, team_id)
  SELECT id, '1998-11-03'::DATE, 'male', 
         ARRAY['5000m', '10000m']::TEXT[], 
         distance_demons_id
  FROM public.profiles 
  WHERE email = 'james.wilson@example.com';
  
  INSERT INTO public.athletes (id, birth_date, gender, events, team_id)
  SELECT id, '2001-04-17'::DATE, 'female', 
         ARRAY['1500m', 'Mile Run']::TEXT[], 
         distance_demons_id
  FROM public.profiles 
  WHERE email = 'maria.garcia@example.com';
  
  -- Create athlete entries for Jumping Giants members
  INSERT INTO public.athletes (id, birth_date, gender, events, team_id)
  SELECT id, '1999-07-12'::DATE, 'male', 
         ARRAY['Long Jump', 'Triple Jump']::TEXT[], 
         jumping_giants_id
  FROM public.profiles 
  WHERE email = 'mike.taylor@example.com';
  
  INSERT INTO public.athletes (id, birth_date, gender, events, team_id)
  SELECT id, '2003-02-28'::DATE, 'female', 
         ARRAY['High Jump', 'Long Jump']::TEXT[], 
         jumping_giants_id
  FROM public.profiles 
  WHERE email = 'sophia.lee@example.com';
  
  -- Create athlete entries for Throwing Thunder members
  INSERT INTO public.athletes (id, birth_date, gender, events, team_id)
  SELECT id, '1997-09-08'::DATE, 'male', 
         ARRAY['Shot Put', 'Discus Throw']::TEXT[], 
         throwing_thunder_id
  FROM public.profiles 
  WHERE email = 'david.miller@example.com';
  
  INSERT INTO public.athletes (id, birth_date, gender, events, team_id)
  SELECT id, '2000-12-10'::DATE, 'female', 
         ARRAY['Javelin Throw', 'Hammer Throw']::TEXT[], 
         throwing_thunder_id
  FROM public.profiles 
  WHERE email = 'emma.davis@example.com';

  -- Create coach-athlete relationships
  INSERT INTO public.coach_athletes (coach_id, athlete_id, created_at)
  SELECT 
    c.id, 
    a.id,
    NOW()
  FROM 
    public.profiles c,
    public.profiles a
  WHERE 
    c.email = 'coach.carter@example.com' AND
    a.email IN ('john.smith@example.com', 'lisa.johnson@example.com', 'mike.taylor@example.com');
    
  INSERT INTO public.coach_athletes (coach_id, athlete_id, created_at)
  SELECT 
    c.id, 
    a.id,
    NOW()
  FROM 
    public.profiles c,
    public.profiles a
  WHERE 
    c.email = 'coach.johnson@example.com' AND
    a.email IN ('james.wilson@example.com', 'maria.garcia@example.com', 'david.miller@example.com', 'emma.davis@example.com');
    
END $$; 