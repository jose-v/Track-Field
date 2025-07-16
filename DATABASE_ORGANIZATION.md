# Database File Organization

This document describes the organized structure of SQL files in the Track-Field project.

## Directory Structure

### `src/db/migrations/`
Main migration directory containing database schema changes and data migrations.

#### `src/db/migrations/schema-updates/`
Contains SQL files that modify existing database schema (adding columns, updating tables, etc.)

Files:
- `add_assistant_coaches.sql` - Add assistant coach functionality
- `add_coach_columns.sql` - Add gender, date_of_birth, and events columns to coaches table
- `add_completed_exercises_to_training_plan_assignments.sql` - Add completion tracking to training plan assignments
- `add_country_zip_fields.sql` - Add country and zip code fields to profiles
- `add_exercise_fields_migration.sql` - Add exercise-related fields to database
- `add_granular_progress_columns.sql` - Add detailed progress tracking columns
- `add_is_active_column.sql` - Add active status column
- `add_meet_details_fields_migration.sql` - Add meet detail fields
- `add_packet_pickup_location_field.sql` - Add packet pickup location field
- `add_venue_address_field.sql` - Add venue address field
- `add_weeks_structure_column.sql` - Add weeks structure column
- `add_workout_flow_columns.sql` - Add workout flow columns
- `comprehensive_meet_fields_migration.sql` - Comprehensive meet fields update

#### `src/db/migrations/table-creations/`
Contains SQL files that create new tables or major table restructuring.

Files:
- `create_missing_workouts_fixed.sql` - Create missing workouts table (fixed version)
- `create_missing_workouts.sql` - Create missing workouts table
- `create_training_load_entries_table.sql` - Create training load tracking table
- `create_wellness_table.sql` - Create athlete wellness surveys table

#### `src/db/migrations/data-migrations/`
Contains SQL files that perform data migrations or major data transformations.

Files:
- `database_migration_monthly_to_training_plans.sql` - Migrate from monthly_plans to training_plans structure
- `meet_files_migration_fixed.sql` - Meet files migration (fixed version)
- `team_coach_system_migration.sql` - Team coach system migration

### `src/db/triggers/`
Contains database trigger and function definitions.

Files:
- `create_assignment_notification_triggers.sql` - Triggers for workout and meet assignment notifications
- `create_meet_notification_triggers.sql` - Triggers for meet modification and file upload notifications

### `scripts/audit/`
Contains audit, debug, and administrative scripts.

Files:
- `audit_roles_and_mismatches.sql` - Audit user roles and identify mismatches
- `check_profile_data.sql` - Check profile data integrity
- `debug_current_user_profile.sql` - Debug current user profile
- `debug_loop_tables.sql` - Debug loop tables
- `debug_tables.sql` - Debug table structures
- `delete_user_josev.sql` - Delete specific user data
- `disable_rls_temporarily.sql` - Temporarily disable RLS
- `quick_role_fix.sql` - Quick role fixes
- `restore_teams_rls.sql` - Restore teams RLS policies
- `update_warmup_rest_times.sql` - Update warmup rest times

### `scripts/fixes/`
Contains SQL scripts that fix specific issues or problems.

Files:
- `fix_athlete_team_data.sql` - Fix athlete team data
- `fix_foreign_keys.sql` - Fix foreign key constraints
- `fix_loop_likes_foreign_keys.sql` - Fix loop likes foreign keys
- `fix_null_role_profiles_clean.sql` - Fix null role profiles (clean version)
- `fix_null_role_profiles.sql` - Fix null role profiles
- `fix_rls_policies.sql` - Fix RLS policies
- `fix_soft_delete.sql` - Fix soft delete functionality
- `fix_storage_policies.sql` - Fix storage policies
- `fix_team_coaches_rls.sql` - Fix team coaches RLS
- `fix_team_members_rls_policy.sql` - Fix team members RLS policy
- `fix_teams_rls_policies.sql` - Fix teams RLS policies
- `fix_teams_rls.sql` - Fix teams RLS
- `fix_training_plans_errors.sql` - Fix training plans errors
- `fix_user_id_mismatch.sql` - Fix user ID mismatch
- `fix_workout_api_errors.sql` - Fix workout API errors
- `fix_workout_schema.sql` - Fix workout schema

### `scripts/tests/`
Contains test scripts and test data.

Files:
- `simple_deleted_test.sql` - Simple deleted items test
- `test_deleted_items_final.sql` - Test deleted items (final version)
- `test_deleted_items_fixed.sql` - Test deleted items (fixed version)
- `test_deleted_items.sql` - Test deleted items

### `database/schema/`
Contains schema documentation and reference files.

Files:
- `current_schema.sql` - Current database schema documentation

## Usage Guidelines

### For New Migrations
1. **Schema Updates**: Place column additions, table modifications in `src/db/migrations/schema-updates/`
2. **New Tables**: Place table creation scripts in `src/db/migrations/table-creations/`
3. **Data Migrations**: Place data transformation scripts in `src/db/migrations/data-migrations/`
4. **Triggers**: Place trigger definitions in `src/db/triggers/`

### For Maintenance Scripts
1. **Audit Scripts**: Place in `scripts/audit/` - for checking data integrity, debugging
2. **Fix Scripts**: Place in `scripts/fixes/` - for fixing specific issues
3. **Test Scripts**: Place in `scripts/tests/` - for testing functionality

### Naming Conventions
- Use descriptive names with underscores
- Prefix with action type (`add_`, `create_`, `fix_`, `migrate_`, etc.)
- Include version suffixes for iterations (`_v2`, `_fixed`, `_final`)

## References Updated
The following documentation files have been updated to reflect the new organization:
- `MEET_NOTIFICATIONS_SYSTEM.md` - Updated trigger file paths
- `WORKOUT_MEET_NOTIFICATIONS.md` - Updated trigger file paths

## Migration Notes
All SQL files have been moved from the root directory to their appropriate locations based on their functionality. No data or functionality has been modified, only the file organization has been improved.