-- First, check if coaches table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'coaches'
) AS coaches_table_exists;

-- Check if required columns exist in the coaches table
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND table_name = 'coaches' 
    AND column_name IN ('id', 'specialties', 'certifications', 'gender', 'birth_date', 'events');

-- Verify constraints to ensure gender is of valid values
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    cc.check_clause
FROM 
    information_schema.table_constraints tc
JOIN 
    information_schema.check_constraints cc
ON 
    tc.constraint_name = cc.constraint_name
WHERE 
    tc.table_name = 'coaches' 
    AND tc.constraint_schema = 'public'
    AND cc.check_clause LIKE '%gender%';

-- Check if there are any coach records in the database
SELECT count(*) AS coach_count FROM coaches;

-- Check if there are any coaches with gender, birth_date or events set
SELECT 
    count(*) AS coaches_with_fields,
    count(gender) AS coaches_with_gender,
    count(birth_date) AS coaches_with_birth_date,
    count(events) AS coaches_with_events
FROM 
    coaches; 