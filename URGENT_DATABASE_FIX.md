# 🚨 URGENT DATABASE FIX - Workout Creation Errors

## Problem
Athletes are getting `42501` (Row-Level Security policy violation) errors when trying to create workouts. This is because the `athlete_workouts` table is missing proper RLS policies.

## Solution
You need to run the database migration to add the missing RLS policies.

## Steps to Fix

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `src/db/fix_athlete_workouts_rls.sql`
4. Click **Run** to execute the migration

### Option 2: Via Terminal (if you have direct database access)
```bash
psql YOUR_DATABASE_URL -f src/db/fix_athlete_workouts_rls.sql
```

## What This Fix Does
1. ✅ Adds missing RLS policies for `athlete_workouts` table
2. ✅ Allows athletes to assign workouts to themselves
3. ✅ Allows coaches to assign workouts to their athletes
4. ✅ Adds missing `updated_at` column
5. ✅ Adds missing `completed_exercises` column
6. ✅ Creates proper indexes for performance

## Expected Results After Fix
- ✅ Athletes can successfully create and save workouts
- ✅ Workout assignment will work without `42501` errors
- ✅ RPE rating functionality will work properly
- ✅ Progress tracking will function correctly

## Test the Fix
After running the migration:
1. Try creating a new workout as an athlete
2. Assign it to yourself
3. Save the workout
4. Should complete without any `42501` errors

---
**Note**: This fixes a critical database schema issue that was preventing workout creation/assignment functionality. 