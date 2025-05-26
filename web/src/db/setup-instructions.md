# Database Setup Instructions

Follow these steps to set up your database in Supabase:

## Method 1: Using Supabase UI (Recommended for Development)

1. **Log in to your Supabase project dashboard**

2. **Navigate to the SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run the Migration Script**
   - Create a new query
   - Copy and paste the contents of `migrations.sql` into the editor
   - Click "Run" to execute the migrations
   - This will create all the necessary tables with proper relationships

4. **Run the Seed Data Script (Optional - for development/testing)**
   - Create another new query
   - Copy and paste the contents of `seed-data.sql` into the editor
   - Click "Run" to populate the tables with sample data
   - Note: In production, you would typically not run the seed script

## Method 2: Using Supabase CLI (Recommended for Production/CI)

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Link to your project**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. **Run migrations**
   ```bash
   supabase db push
   ```

## Checking Your Schema

After setup, you should see the following tables in your database:

- `profiles`: Core user data
- `athletes`: Athlete-specific data
- `coaches`: Coach-specific data
- `team_managers`: Team manager-specific data
- `teams`: Teams data
- `coach_athletes`: Coach-athlete relationships
- `workouts`: Workout definitions
- `workout_assignments`: Workout assignments
- `events`: Track & field events
- `personal_records`: Athlete performance records

## Troubleshooting

**Issue: Foreign Key Constraint Failures**
- Make sure to run the migrations in the correct order
- Check that the auth.users table exists (should be created by Supabase)

**Issue: Permission Denied**
- Ensure your Supabase project has the necessary permissions
- Verify that RLS policies are properly set up

**Issue: Demo Data Not Showing in Production**
- The seed script creates demonstration data without proper auth connections
- For production users, they should be created through the proper signup process

## Important Notes

1. **Authentication**: The demo seed script does not create actual authenticated users. In a real application, users would be created through proper signup with auth.users entries.

2. **Data Migration**: If you're migrating from a single-table approach, you'll need to migrate your existing data from the old structure to the new one.

3. **Schema Changes**: If you need to modify the schema later, create additional migration files rather than editing the existing ones.

4. **Security**: Review the RLS policies to ensure they meet your security requirements. 