SELECT COUNT(*) as total_exercises FROM public.exercise_library;
SELECT category, COUNT(*) as count FROM public.exercise_library GROUP BY category ORDER BY count DESC;