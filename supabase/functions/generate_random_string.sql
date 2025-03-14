-- Function to generate a random string of specified length
CREATE OR REPLACE FUNCTION generate_random_string(length INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
  chars_length INTEGER := length(chars);
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * chars_length)::integer + 1, 1);
  END LOOP;
  RETURN result;
END;
$$; 