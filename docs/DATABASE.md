# Database Schema Documentation

## Overview

The Track & Field application uses Supabase (PostgreSQL) as its database. The schema is designed to support athletes, coaches, workouts, competitions, and gamification features.

## Core Tables

### Users & Authentication

#### `profiles`
- `id` (UUID, Primary Key) - References auth.users
- `email` (Text, Unique)
- `role` (Text) - 'athlete' | 'coach' | 'admin'
- `first_name` (Text)
- `last_name` (Text)
- `avatar_url` (Text, Optional)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### `athletes`
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → profiles.id)
- `coach_id` (UUID, Foreign Key → coaches.id, Optional)
- `date_of_birth` (Date)
- `gender` (Text)
- `height` (Integer, cm)
- `weight` (Decimal, kg)
- `primary_events` (Text Array)
- `school_team` (Text, Optional)
- `graduation_year` (Integer, Optional)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### `coaches`
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → profiles.id)
- `certification_level` (Text, Optional)
- `specialization` (Text Array, Optional)
- `years_experience` (Integer, Optional)
- `bio` (Text, Optional)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### Training & Workouts

#### `workouts`
- `id` (UUID, Primary Key)
- `coach_id` (UUID, Foreign Key → coaches.id)
- `title` (Text)
- `description` (Text, Optional)
- `workout_type` (Text) - 'speed', 'endurance', 'strength', 'technique'
- `difficulty_level` (Text) - 'beginner', 'intermediate', 'advanced'
- `estimated_duration` (Integer, minutes)
- `exercises` (JSONB) - Array of exercise objects
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### `athlete_workouts`
- `id` (UUID, Primary Key)
- `athlete_id` (UUID, Foreign Key → athletes.id)
- `workout_id` (UUID, Foreign Key → workouts.id)
- `assigned_date` (Date)
- `completed_date` (Date, Optional)
- `status` (Text) - 'assigned', 'in_progress', 'completed', 'skipped'
- `notes` (Text, Optional)
- `performance_data` (JSONB, Optional)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### Competitions & Events

#### `track_meets`
- `id` (UUID, Primary Key)
- `name` (Text)
- `date` (Date)
- `location` (Text)
- `meet_type` (Text) - 'indoor', 'outdoor', 'cross_country'
- `level` (Text) - 'high_school', 'college', 'club', 'professional'
- `description` (Text, Optional)
- `created_at` (Timestamp)

#### `meet_events`
- `id` (UUID, Primary Key)
- `meet_id` (UUID, Foreign Key → track_meets.id)
- `event_name` (Text) - '100m', '200m', 'Long Jump', etc.
- `event_type` (Text) - 'track', 'field', 'distance'
- `gender` (Text) - 'male', 'female', 'mixed'
- `start_time` (Timestamp, Optional)
- `created_at` (Timestamp)

#### `athlete_results`
- `id` (UUID, Primary Key)
- `athlete_id` (UUID, Foreign Key → athletes.id)
- `meet_event_id` (UUID, Foreign Key → meet_events.id)
- `result_value` (Decimal) - Time in seconds or distance in meters
- `result_type` (Text) - 'time', 'distance', 'height'
- `placement` (Integer, Optional)
- `is_personal_best` (Boolean, Default: false)
- `is_season_best` (Boolean, Default: false)
- `wind_speed` (Decimal, Optional) - For wind-legal events
- `notes` (Text, Optional)
- `created_at` (Timestamp)

### Progress Tracking

#### `athlete_progress`
- `id` (UUID, Primary Key)
- `athlete_id` (UUID, Foreign Key → athletes.id)
- `event_name` (Text)
- `result_value` (Decimal)
- `result_type` (Text) - 'time', 'distance', 'height'
- `recorded_date` (Date)
- `context` (Text) - 'practice', 'time_trial', 'competition'
- `notes` (Text, Optional)
- `created_at` (Timestamp)

### Gamification

#### `athlete_points`
- `id` (UUID, Primary Key)
- `athlete_id` (UUID, Foreign Key → athletes.id)
- `points` (Integer)
- `reason` (Text) - 'workout_completed', 'personal_best', 'consistency'
- `date_earned` (Date)
- `created_at` (Timestamp)

#### `badges`
- `id` (UUID, Primary Key)
- `name` (Text, Unique)
- `description` (Text)
- `icon_url` (Text, Optional)
- `criteria` (JSONB) - Badge earning criteria
- `created_at` (Timestamp)

#### `athlete_badges`
- `id` (UUID, Primary Key)
- `athlete_id` (UUID, Foreign Key → athletes.id)
- `badge_id` (UUID, Foreign Key → badges.id)
- `date_earned` (Date)
- `created_at` (Timestamp)

#### `activity_streaks`
- `id` (UUID, Primary Key)
- `athlete_id` (UUID, Foreign Key → athletes.id)
- `streak_type` (Text) - 'workout', 'login', 'goal_completion'
- `current_streak` (Integer)
- `longest_streak` (Integer)
- `last_activity_date` (Date)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

## Indexes

Key indexes for performance:
- `profiles.email` (Unique)
- `athletes.user_id` (Unique)
- `coaches.user_id` (Unique)
- `athlete_workouts.athlete_id`
- `athlete_workouts.workout_id`
- `athlete_results.athlete_id`
- `athlete_results.meet_event_id`
- `athlete_progress.athlete_id`
- `athlete_progress.event_name`

## Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Athletes can only access their own data
- Coaches can access their assigned athletes' data
- Admins have full access
- Public read access for meet information

## Migrations

Database migrations are located in the `migrations/` directory and can be run using:

```bash
npm run migrate:track-meets
```

## Backup & Recovery

- Automated daily backups via Supabase
- Point-in-time recovery available
- Export scripts available in `scripts/` directory 