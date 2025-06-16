-- Minimal test exercise library population
-- Just enough exercises to test the system functionality

INSERT INTO public.exercise_library (name, category, is_system_exercise, is_public, description, difficulty) VALUES

-- STRENGTH exercises (5 basic ones)
('Push Ups', 'strength', true, true, 'Basic upper body pushing exercise', 'Beginner'),
('Squats', 'strength', true, true, 'Basic lower body exercise', 'Beginner'),
('Pull Ups', 'strength', true, true, 'Upper body pulling exercise', 'Intermediate'),
('Lunges', 'strength', true, true, 'Single leg strengthening exercise', 'Beginner'),
('Plank', 'strength', true, true, 'Core stability exercise', 'Beginner'),

-- RUNNING exercises (4 basic ones)
('100m Sprint', 'running', true, true, 'Short distance sprint', 'Intermediate'),
('400m Run', 'running', true, true, 'Quarter mile run', 'Intermediate'),
('Jog', 'running', true, true, 'Easy pace running', 'Beginner'),
('Hill Sprints', 'running', true, true, 'Uphill sprint training', 'Advanced'),

-- PLYOMETRIC exercises (4 explosive ones)
('Box Jumps', 'plyometric', true, true, 'Jump onto elevated platform', 'Intermediate'),
('Burpees', 'plyometric', true, true, 'Full body explosive exercise', 'Intermediate'),
('Jump Squats', 'plyometric', true, true, 'Explosive squat jumps', 'Beginner'),
('Broad Jump', 'plyometric', true, true, 'Horizontal jumping exercise', 'Intermediate'),

-- FLEXIBILITY exercises (4 basic stretches)
('Hamstring Stretch', 'flexibility', true, true, 'Hamstring flexibility', 'Beginner'),
('Hip Flexor Stretch', 'flexibility', true, true, 'Hip flexor stretching', 'Beginner'),
('Calf Stretch', 'flexibility', true, true, 'Calf muscle stretching', 'Beginner'),
('Shoulder Stretch', 'flexibility', true, true, 'Shoulder flexibility', 'Beginner'),

-- WARM_UP exercises (3 basic warm-ups)
('Jumping Jacks', 'warm_up', true, true, 'Full body warm-up exercise', 'Beginner'),
('High Knees', 'warm_up', true, true, 'Running warm-up drill', 'Beginner'),
('Arm Circles', 'warm_up', true, true, 'Shoulder warm-up exercise', 'Beginner')

ON CONFLICT (name) DO NOTHING; 