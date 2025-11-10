-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to notify recruiter of new application
CREATE OR REPLACE FUNCTION notify_recruiter_new_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  function_url TEXT;
  anon_key TEXT;
BEGIN
  -- Set the edge function URL and anon key
  function_url := 'https://tssbfvquiwjlvhehvxpe.supabase.co/functions/v1/send-application-notification';
  anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzc2JmdnF1aXdqbHZoZWh2eHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MjE5MTAsImV4cCI6MjA3Nzk5NzkxMH0.Qj5JB--kjmeOw7qFPT3EEfI8U5nMBnEnGW4AIj33fw4';
  
  -- Call edge function asynchronously using pg_net
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
      'applicationId', NEW.id::text
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new applications
DROP TRIGGER IF EXISTS on_application_created ON applications;
CREATE TRIGGER on_application_created
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_recruiter_new_application();