# Database Setup for Track & Field Application

This directory contains the database schema and setup instructions for the Track & Field application.

## Database Structure

The application uses a normalized multi-table approach with separate tables for different user roles:

1. **profiles**: Core user data (shared by all roles)
2. **athletes**: Athlete-specific data
3. **coaches**: Coach-specific data
4. **team_managers**: Team manager-specific data
5. **teams**: Teams data
6. **coach_athletes**: Many-to-many relationship between coaches and athletes
7. **workouts**: Workout definitions
8. **workout_assignments**: Assignments of workouts to athletes
9. **events**: Track & Field event definitions
10. **personal_records**: Athlete performance records

## Setting Up in Supabase

1. Log in to your Supabase project
2. Go to SQL Editor
3. Create a new query and paste the contents of `migrations.sql`
4. Run the query to create all tables and set up Row Level Security

## Data Model Overview

### User Roles and Relationships

- Each user has a **profile** with a role (athlete, coach, or team manager)
- Based on the role, they have a corresponding entry in the role-specific table
- Coaches can be assigned to multiple athletes (many-to-many relationship)
- Athletes can belong to a team

### Data Flow

1. When a user signs up, a row is created in the `profiles` table
2. Based on their selected role, a row is also created in the appropriate role-specific table
3. The application uses joins to fetch complete user data

## Development Notes

- When retrieving athlete data, join the `profiles` and `athletes` tables
- When creating new users, insert into both the core profile table and the role-specific table
- The database schema includes Row Level Security to ensure proper data access control

## Querying Examples

### Get All Athletes with Profile Data

```sql
SELECT 
  p.id, 
  p.first_name, 
  p.last_name,
  p.email,
  p.avatar_url, 
  a.birth_date,
  a.gender,
  a.events
FROM profiles p
JOIN athletes a ON p.id = a.id
WHERE p.role = 'athlete';
```

### Get Coach with Assigned Athletes

```sql
SELECT
  p.id,
  p.first_name,
  p.last_name,
  ARRAY_AGG(ap.first_name || ' ' || ap.last_name) as athletes
FROM profiles p
JOIN coaches c ON p.id = c.id
JOIN coach_athletes ca ON c.id = ca.coach_id
JOIN athletes a ON ca.athlete_id = a.id
JOIN profiles ap ON a.id = ap.id
WHERE p.id = 'coach_id_here'
GROUP BY p.id, p.first_name, p.last_name;
``` 