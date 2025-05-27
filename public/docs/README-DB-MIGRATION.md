# Database Migration Guide
## Moving from Single Table to Multi-Table Structure

This document provides step-by-step instructions for migrating your Track & Field application from a single-table database structure to a normalized multi-table approach.

## Overview of Changes

We're transitioning from:
- Single `profiles` table with all user data

To a normalized structure with:
- `profiles` table (core user data)
- `athletes` table (athlete-specific data)
- `coaches` table (coach-specific data)
- `team_managers` table (team manager-specific data)
- Supporting tables for teams, coach-athlete relationships, events, etc.

## Prerequisites

1. Supabase project with admin access
2. Backup of your existing database (IMPORTANT!)
3. Node.js installed for running migration scripts

## Step 1: Backup Your Data

Before making any changes:

```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Or export from the Supabase dashboard
# Go to Database > Export data
```

## Step 2: Set Up the New Schema

1. Navigate to the SQL Editor in your Supabase dashboard
2. Run the migration script:
   - Copy the contents of `web/src/db/migrations.sql`
   - Paste into a new SQL query and run

## Step 3: Create Database Views

Views make it easier to query data across tables:

1. In the Supabase SQL Editor
2. Run the views script:
   - Copy the contents of `web/src/db/views.sql`
   - Paste into a new SQL query and run

## Step 4: Migrate Existing Data

If you have existing user data in the `profiles` table:

```sql
-- Run this in SQL Editor to migrate athletes
INSERT INTO public.athletes (id, events)
SELECT 
  id,
  events
FROM 
  public.profiles
WHERE 
  role = 'athlete';

-- Run this to migrate coaches
INSERT INTO public.coaches (id, specialties, certifications)
SELECT 
  id,
  ARRAY[]::TEXT[], -- Add default specialties if you have them
  ARRAY[]::TEXT[]  -- Add default certifications if you have them
FROM 
  public.profiles
WHERE 
  role = 'coach';

-- Run this to migrate team managers
INSERT INTO public.team_managers (id)
SELECT 
  id
FROM 
  public.profiles
WHERE 
  role = 'team_manager';
```

## Step 5: Update Your Application Code

1. Replace the existing `athleteService.ts` with the updated version
2. Update the AthleteSelection component to use the new service
3. Use the updated API service (`api.ts`) which supports the new structure

## Step 6: Testing

1. Test athlete selection and creation
2. Verify that existing users can still log in and access their data
3. Check that athletes, coaches, and team managers can access role-specific features

## Step 7: Optional Development Seed Data

For development environments, you can populate the database with sample data:

1. In the Supabase SQL Editor
2. Run the seed script:
   - Copy the contents of `web/src/db/seed-data.sql`
   - Paste into a new SQL query and run

> ⚠️ **Warning**: Only run seed data in development environments. It creates mock users without proper auth connections.

## Automated Migration

For programmatic migrations, use the provided helper script:

```bash
# Install dependencies
cd web
npm install

# Run migration script
node src/db/migration-helpers.js

# With options
node src/db/migration-helpers.js --test  # Test mode, doesn't execute SQL
node src/db/migration-helpers.js --seed  # Also run seed data
node src/db/migration-helpers.js --views # Also create views
```

## Troubleshooting

### Common Issues

1. **Foreign Key Constraints**: If you see foreign key constraint errors, make sure the referenced tables exist and have the expected data.

2. **Permission Denied**: Check that you have the necessary permissions in Supabase.

3. **Auth User Mapping**: The migration assumes your existing `profiles` table has IDs that match `auth.users`. Verify this mapping.

4. **RLS Policies**: If you can't see data after migration, check Row Level Security policies.

### Getting Help

For database structure questions, refer to:
- `web/src/db/README.md` - Overview of the database structure
- `web/src/db/migrations.sql` - Full SQL schema
- `web/src/services/dbSchema.ts` - TypeScript interfaces for the schema

## Rollback Plan

If you need to revert to the old structure:

1. Restore your backup:
   ```bash
   supabase db restore -f backup.sql
   ```

2. Revert to the old code:
   - Restore original `athleteService.ts`
   - Restore original `api.ts`
   - Restore AthleteSelection component

## Benefits of the New Structure

The new multi-table approach provides:

1. **Better organization** of role-specific data
2. **Improved performance** for complex queries
3. **Proper relationships** between coaches, athletes, and teams
4. **Future-proof schema** that can accommodate new features
5. **Cleaner code** with type safety 