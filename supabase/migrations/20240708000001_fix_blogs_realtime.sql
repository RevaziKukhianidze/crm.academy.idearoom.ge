-- Fix the blogs table columns without trying to add to realtime publication
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS image_file_path TEXT;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS image_file_name TEXT;