-- Triggers for Automatic Notification Creation
-- This file creates database triggers to automatically notify athletes when:
-- 1. A workout is assigned to them
-- 2. A meet event is assigned to them  
-- 3. An existing assignment is modified

-- First, create a function to get coach name
CREATE OR REPLACE FUNCTION get_coach_name(coach_id UUID)
RETURNS TEXT AS $$
DECLARE
  coach_name TEXT;
BEGIN
  SELECT COALESCE(first_name || ' ' || last_name, 'Your Coach') 
  INTO coach_name
  FROM public.profiles 
  WHERE id = coach_id;
  
  RETURN COALESCE(coach_name, 'Your Coach');
END;
$$ LANGUAGE plpgsql;

-- Function to get workout name
CREATE OR REPLACE FUNCTION get_workout_name(workout_id UUID)
RETURNS TEXT AS $$
DECLARE
  workout_name TEXT;
BEGIN
  SELECT COALESCE(name, 'Workout') 
  INTO workout_name
  FROM public.workouts 
  WHERE id = workout_id;
  
  RETURN COALESCE(workout_name, 'Workout');
END;
$$ LANGUAGE plpgsql;

-- Function to get meet event details
CREATE OR REPLACE FUNCTION get_meet_event_details(meet_event_id UUID, OUT event_name TEXT, OUT meet_name TEXT)
AS $$
BEGIN
  SELECT 
    COALESCE(me.event_name, 'Event'),
    COALESCE(tm.name, 'Meet')
  INTO event_name, meet_name
  FROM public.meet_events me
  INNER JOIN public.track_meets tm ON me.meet_id = tm.id
  WHERE me.id = meet_event_id;
  
  -- Set defaults if nothing found
  event_name := COALESCE(event_name, 'Event');
  meet_name := COALESCE(meet_name, 'Meet');
END;
$$ LANGUAGE plpgsql;

-- Trigger function for workout assignments
CREATE OR REPLACE FUNCTION notify_workout_assignment()
RETURNS TRIGGER AS $$
DECLARE
  coach_name TEXT;
  workout_name TEXT;
BEGIN
  -- Only create notifications for new assignments (INSERT)
  IF TG_OP = 'INSERT' THEN
    -- Get coach name and workout name
    coach_name := get_coach_name(auth.uid());
    workout_name := get_workout_name(NEW.workout_id);
    
    -- Insert notification
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      metadata,
      created_at,
      is_read
    ) VALUES (
      NEW.athlete_id,
      'New Workout Assigned',
      coach_name || ' assigned you a new workout: "' || workout_name || '"',
      'workout_assigned',
      jsonb_build_object(
        'workout_id', NEW.workout_id,
        'coach_id', auth.uid(),
        'sender_id', auth.uid(),
        'action', 'assigned'
      ),
      NOW(),
      FALSE
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger function for meet event assignments
CREATE OR REPLACE FUNCTION notify_meet_assignment()
RETURNS TRIGGER AS $$
DECLARE
  coach_name TEXT;
  event_name TEXT;
  meet_name TEXT;
  event_details RECORD;
BEGIN
  -- Only create notifications for new assignments (INSERT)
  IF TG_OP = 'INSERT' AND NEW.assigned_by IS NOT NULL THEN
    -- Get coach name and meet event details
    coach_name := get_coach_name(NEW.assigned_by);
    SELECT * FROM get_meet_event_details(NEW.meet_event_id) INTO event_details;
    event_name := event_details.event_name;
    meet_name := event_details.meet_name;
    
    -- Insert notification
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      metadata,
      created_at,
      is_read
    ) VALUES (
      NEW.athlete_id,
      'New Meet Event Assigned',
      coach_name || ' assigned you to compete in "' || event_name || '" at ' || meet_name,
      'meet_assigned',
      jsonb_build_object(
        'meet_event_id', NEW.meet_event_id,
        'event_name', event_name,
        'meet_name', meet_name,
        'coach_id', NEW.assigned_by,
        'sender_id', NEW.assigned_by,
        'action', 'assigned'
      ),
      NOW(),
      FALSE
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_workout_assignment_notification ON public.athlete_workouts;
CREATE TRIGGER trigger_workout_assignment_notification
  AFTER INSERT ON public.athlete_workouts
  FOR EACH ROW
  EXECUTE FUNCTION notify_workout_assignment();

DROP TRIGGER IF EXISTS trigger_meet_assignment_notification ON public.athlete_meet_events;
CREATE TRIGGER trigger_meet_assignment_notification
  AFTER INSERT ON public.athlete_meet_events
  FOR EACH ROW
  EXECUTE FUNCTION notify_meet_assignment();

-- Optional: Triggers for updates (when workout or meet details change)
-- This would require more complex logic to detect what changed

-- Trigger function for workout updates
CREATE OR REPLACE FUNCTION notify_workout_update()
RETURNS TRIGGER AS $$
DECLARE
  coach_name TEXT;
  workout_name TEXT;
  assignment_record RECORD;
BEGIN
  -- Only create notifications for meaningful updates
  IF TG_OP = 'UPDATE' AND (
    OLD.name IS DISTINCT FROM NEW.name OR
    OLD.description IS DISTINCT FROM NEW.description OR
    OLD.exercises IS DISTINCT FROM NEW.exercises OR
    OLD.date IS DISTINCT FROM NEW.date OR
    OLD.time IS DISTINCT FROM NEW.time
  ) THEN
    -- Get coach name and workout name
    coach_name := get_coach_name(auth.uid());
    workout_name := COALESCE(NEW.name, 'Workout');
    
    -- Notify all assigned athletes
    FOR assignment_record IN 
      SELECT athlete_id FROM public.athlete_workouts WHERE workout_id = NEW.id
    LOOP
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        metadata,
        created_at,
        is_read
      ) VALUES (
        assignment_record.athlete_id,
        'Workout Updated',
        coach_name || ' updated your workout: "' || workout_name || '"',
        'workout_updated',
        jsonb_build_object(
          'workout_id', NEW.id,
          'coach_id', auth.uid(),
          'sender_id', auth.uid(),
          'action', 'updated',
          'change_description', 'Workout details have been modified'
        ),
        NOW(),
        FALSE
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create workout update trigger
DROP TRIGGER IF EXISTS trigger_workout_update_notification ON public.workouts;
CREATE TRIGGER trigger_workout_update_notification
  AFTER UPDATE ON public.workouts
  FOR EACH ROW
  EXECUTE FUNCTION notify_workout_update();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION get_coach_name(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_workout_name(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_meet_event_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION notify_workout_assignment() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_meet_assignment() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_workout_update() TO authenticated; 