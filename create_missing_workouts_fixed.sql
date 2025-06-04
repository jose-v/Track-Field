-- Create the missing workouts that the frontend is trying to fetch
-- Fixed version without updated_at column

-- Insert the missing workouts with the exact IDs the frontend is looking for
INSERT INTO workouts (id, name, user_id, description, type, exercises, created_at)
VALUES 
(
    '0b243ff8-48d0-4805-92b5-3ec1e626eb89',
    'Placeholder Workout 1',
    (SELECT id FROM profiles WHERE role = 'coach' LIMIT 1),
    'Auto-generated workout to fix API errors',
    'Strength',
    '[]'::jsonb,
    NOW()
),
(
    'fbae1e39-8094-4c53-b7fd-e9401dec927f',
    'Placeholder Workout 2', 
    (SELECT id FROM profiles WHERE role = 'coach' LIMIT 1),
    'Auto-generated workout to fix API errors',
    'Cardio',
    '[]'::jsonb,
    NOW()
),
(
    'e04f9f34-8f12-4a88-a665-f02cd1839b73',
    'Placeholder Workout 3',
    (SELECT id FROM profiles WHERE role = 'coach' LIMIT 1),
    'Auto-generated workout to fix API errors',
    'Mixed',
    '[]'::jsonb,
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verify the workouts were created
SELECT id, name, type, user_id FROM workouts 
WHERE id IN (
    '0b243ff8-48d0-4805-92b5-3ec1e626eb89',
    'fbae1e39-8094-4c53-b7fd-e9401dec927f',
    'e04f9f34-8f12-4a88-a665-f02cd1839b73'
);

-- Also show the actual structure of the workouts table for reference
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'workouts' 
ORDER BY ordinal_position; 