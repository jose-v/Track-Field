# Database Migrations

This directory contains SQL migration scripts for database schema changes.

## How to Apply Migrations

### Method 1: Using Supabase SQL Editor

1. Log in to your Supabase dashboard
2. Go to the SQL Editor section
3. Create a new query
4. Copy the contents of the SQL migration file (e.g., `add_address_fields.sql`)
5. Paste the SQL into the editor
6. Click "Run" to execute the migration

### Method 2: Using the Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push --db-url=postgres://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
```

## Migration Files

- `add_address_fields.sql` - Adds address, city, state, country, zip_code fields to the profiles table 