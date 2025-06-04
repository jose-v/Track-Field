-- Create the missing workouts that the frontend is trying to fetch
-- This will eliminate PGRST116 errors by providing the expected data

-- First, get the current user ID (replace with your actual coach user ID)
-- You can find this by running: SELECT id, email FROM profiles WHERE role = 'coach';

-- Insert the missing workouts with the exact IDs the frontend is looking for
INSERT INTO workouts (id, name, user_id, description, type, exercises, created_at, updated_at)
VALUES 
(
    '0b243ff8-48d0-4805-92b5-3ec1e626eb89',
    'Placeholder Workout 1',
    (SELECT id FROM profiles WHERE role = 'coach' LIMIT 1),
    'Auto-generated workout to fix API errors',
    'Strength',
    '[]'::jsonb,
    NOW(),
    NOW()
),
(
    'fbae1e39-8094-4c53-b7fd-e9401dec927f',
    'Placeholder Workout 2', 
    (SELECT id FROM profiles WHERE role = 'coach' LIMIT 1),
    'Auto-generated workout to fix API errors',
    'Cardio',
    '[]'::jsonb,
    NOW(),
    NOW()
),
(
    'e04f9f34-8f12-4a88-a665-f02cd1839b73',
    'Placeholder Workout 3',
    (SELECT id FROM profiles WHERE role = 'coach' LIMIT 1),
    'Auto-generated workout to fix API errors',
    'Mixed',
    '[]'::jsonb,
    NOW(),
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