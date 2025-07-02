-- Meet File Upload and Modification Notification Triggers
-- This file creates database triggers to automatically notify athletes when:
-- 1. A coach adds files to a meet they're assigned to
-- 2. A coach modifies details of a meet they're assigned to

-- Function to get all athletes assigned to a specific meet
CREATE OR REPLACE FUNCTION get_meet_assigned_athletes(target_meet_id UUID)
RETURNS TABLE(athlete_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ame.athlete_id
  FROM public.athlete_meet_events ame
  INNER JOIN public.meet_events me ON ame.meet_event_id = me.id
  WHERE me.meet_id = target_meet_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get meet name
CREATE OR REPLACE FUNCTION get_meet_name(meet_id UUID)
RETURNS TEXT AS $$
DECLARE
  meet_name TEXT;
BEGIN
  SELECT COALESCE(name, 'Meet') 
  INTO meet_name
  FROM public.track_meets 
  WHERE id = meet_id;
  
  RETURN COALESCE(meet_name, 'Meet');
END;
$$ LANGUAGE plpgsql;

-- Function to get coach name (reusing existing function if available)
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

-- Trigger function for meet file uploads
CREATE OR REPLACE FUNCTION notify_meet_file_upload()
RETURNS TRIGGER AS $$
DECLARE
  meet_name TEXT;
  coach_name TEXT;
  athlete_record RECORD;
BEGIN
  -- Only create notifications for file uploads (INSERT)
  IF TG_OP = 'INSERT' THEN
    -- Get meet name and coach name
    meet_name := get_meet_name(NEW.meet_id);
    coach_name := get_coach_name(auth.uid());
    
    -- Notify all assigned athletes
    FOR athlete_record IN 
      SELECT athlete_id FROM get_meet_assigned_athletes(NEW.meet_id)
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
        athlete_record.athlete_id,
        'New File Added to Meet',
        coach_name || ' added a new file "' || NEW.file_name || '" to ' || meet_name,
        'meet_file_added',
        jsonb_build_object(
          'meet_id', NEW.meet_id,
          'file_id', NEW.id,
          'file_name', NEW.file_name,
          'file_type', NEW.file_type,
          'coach_id', auth.uid(),
          'sender_id', auth.uid(),
          'action', 'file_added'
        ),
        NOW(),
        FALSE
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for meet modifications
CREATE OR REPLACE FUNCTION notify_meet_modification()
RETURNS TRIGGER AS $$
DECLARE
  meet_name TEXT;
  coach_name TEXT;
  athlete_record RECORD;
  change_description TEXT;
  significant_change BOOLEAN := FALSE;
BEGIN
  -- Only create notifications for meaningful updates
  IF TG_OP = 'UPDATE' THEN
    -- Check if any significant fields changed
    IF (
      OLD.name IS DISTINCT FROM NEW.name OR
      OLD.meet_date IS DISTINCT FROM NEW.meet_date OR
      OLD.end_date IS DISTINCT FROM NEW.end_date OR
      OLD.venue_name IS DISTINCT FROM NEW.venue_name OR
      OLD.address IS DISTINCT FROM NEW.address OR
      OLD.city IS DISTINCT FROM NEW.city OR
      OLD.state IS DISTINCT FROM NEW.state OR
      OLD.contact_name IS DISTINCT FROM NEW.contact_name OR
      OLD.contact_email IS DISTINCT FROM NEW.contact_email OR
      OLD.contact_phone IS DISTINCT FROM NEW.contact_phone OR
      OLD.registration_deadline IS DISTINCT FROM NEW.registration_deadline OR
      OLD.entry_fee IS DISTINCT FROM NEW.entry_fee OR
      OLD.transportation_info IS DISTINCT FROM NEW.transportation_info OR
      OLD.lodging_details IS DISTINCT FROM NEW.lodging_details OR
      OLD.lodging_email IS DISTINCT FROM NEW.lodging_email OR
      OLD.lodging_phone IS DISTINCT FROM NEW.lodging_phone OR
      OLD.status IS DISTINCT FROM NEW.status
    ) THEN
      significant_change := TRUE;
      
      -- Build change description
      change_description := '';
      
      IF OLD.name IS DISTINCT FROM NEW.name THEN
        change_description := change_description || 'Meet name updated. ';
      END IF;
      
      IF OLD.meet_date IS DISTINCT FROM NEW.meet_date THEN
        change_description := change_description || 'Meet date changed. ';
      END IF;
      
      IF OLD.venue_name IS DISTINCT FROM NEW.venue_name OR 
         OLD.address IS DISTINCT FROM NEW.address OR 
         OLD.city IS DISTINCT FROM NEW.city OR 
         OLD.state IS DISTINCT FROM NEW.state THEN
        change_description := change_description || 'Venue/location updated. ';
      END IF;
      
      IF OLD.contact_name IS DISTINCT FROM NEW.contact_name OR
         OLD.contact_email IS DISTINCT FROM NEW.contact_email OR
         OLD.contact_phone IS DISTINCT FROM NEW.contact_phone THEN
        change_description := change_description || 'Contact information updated. ';
      END IF;
      
      IF OLD.transportation_info IS DISTINCT FROM NEW.transportation_info THEN
        change_description := change_description || 'Transportation details updated. ';
      END IF;
      
      IF OLD.lodging_details IS DISTINCT FROM NEW.lodging_details OR
         OLD.lodging_email IS DISTINCT FROM NEW.lodging_email OR
         OLD.lodging_phone IS DISTINCT FROM NEW.lodging_phone THEN
        change_description := change_description || 'Lodging information updated. ';
      END IF;
      
      IF OLD.registration_deadline IS DISTINCT FROM NEW.registration_deadline THEN
        change_description := change_description || 'Registration deadline changed. ';
      END IF;
      
      IF OLD.entry_fee IS DISTINCT FROM NEW.entry_fee THEN
        change_description := change_description || 'Entry fee updated. ';
      END IF;
      
      IF OLD.status IS DISTINCT FROM NEW.status THEN
        change_description := change_description || 'Meet status changed to ' || NEW.status || '. ';
      END IF;
      
      -- Default message if no specific changes detected
      IF change_description = '' THEN
        change_description := 'Meet details have been updated. ';
      END IF;
    END IF;
    
    -- Only proceed if there were significant changes
    IF significant_change THEN
      -- Get meet name and coach name
      meet_name := COALESCE(NEW.name, 'Meet');
      coach_name := get_coach_name(auth.uid());
      
      -- Notify all assigned athletes
      FOR athlete_record IN 
        SELECT athlete_id FROM get_meet_assigned_athletes(NEW.id)
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
          athlete_record.athlete_id,
          'Meet Information Updated',
          coach_name || ' updated details for ' || meet_name || ': ' || change_description,
          'meet_updated',
          jsonb_build_object(
            'meet_id', NEW.id,
            'meet_name', meet_name,
            'coach_id', auth.uid(),
            'sender_id', auth.uid(),
            'action', 'meet_updated',
            'change_description', change_description
          ),
          NOW(),
          FALSE
        );
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_meet_file_upload_notification ON public.meet_files;
CREATE TRIGGER trigger_meet_file_upload_notification
  AFTER INSERT ON public.meet_files
  FOR EACH ROW
  EXECUTE FUNCTION notify_meet_file_upload();

DROP TRIGGER IF EXISTS trigger_meet_modification_notification ON public.track_meets;
CREATE TRIGGER trigger_meet_modification_notification
  AFTER UPDATE ON public.track_meets
  FOR EACH ROW
  EXECUTE FUNCTION notify_meet_modification();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION get_meet_assigned_athletes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_meet_name(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION notify_meet_file_upload() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_meet_modification() TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION get_meet_assigned_athletes(UUID) IS 'Returns all athletes assigned to any event within the specified meet';
COMMENT ON FUNCTION notify_meet_file_upload() IS 'Trigger function to notify athletes when files are added to their assigned meets';
COMMENT ON FUNCTION notify_meet_modification() IS 'Trigger function to notify athletes when meet details are modified';

-- Log successful creation
DO $$
BEGIN
  RAISE NOTICE 'Meet notification triggers created successfully';
  RAISE NOTICE '- Trigger: notify athletes when files are added to meets';
  RAISE NOTICE '- Trigger: notify athletes when meet details are updated';
  RAISE NOTICE '- Athletes are identified through athlete_meet_events assignments';
END
$$; 