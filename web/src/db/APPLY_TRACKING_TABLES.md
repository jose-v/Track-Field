# Applying Tracking Tables Migration

This guide will help you apply the SQL migrations needed for the sleep and nutrition tracking features.

## Method 1: Using the Supabase SQL Editor (Easiest)

1. Log in to your Supabase dashboard
2. Navigate to the "SQL Editor" section
3. Create a new query
4. Copy the entire contents of `tracking_tables.sql` and paste it into the SQL editor
5. Click "Run" to execute the SQL commands

## Method 2: Using the Supabase CLI

If you have the Supabase CLI installed, you can run:

```bash
# Navigate to your project directory
cd /path/to/your/project

# Apply the migration
supabase db push --db-url <your-db-url> --file web/src/db/tracking_tables.sql
```

## Method 3: Running the Migration with Node.js

You can also run the migration using the provided script in `web/src/db/run-migrations.js`. Here's how:

1. Make sure you have the required environment variables set in your `.env` file
2. Run the script with the migration path:

```bash
node web/src/db/run-migrations.js web/src/db/tracking_tables.sql
```

## Verification

After running the migration, verify that the tables were created successfully by:

1. Going to the Supabase dashboard
2. Navigating to the "Table Editor" section
3. Checking that `sleep_records` and `eating_records` tables exist
4. Verifying that the Row Level Security (RLS) policies are applied in the "Authentication" -> "Policies" section

## Troubleshooting

If you encounter errors:

1. Check that the `coach_athletes` table exists, as it's referenced in the RLS policies
2. Make sure the `uuid-ossp` extension is enabled in your Supabase project
3. If you see errors about duplicate tables, you can remove the `IF NOT EXISTS` clauses and replace them with `DROP TABLE IF EXISTS table_name;` statements at the beginning of the script 