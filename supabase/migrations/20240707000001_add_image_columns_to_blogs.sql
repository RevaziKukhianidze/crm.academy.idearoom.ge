ALTER TABLE blogs ADD COLUMN IF NOT EXISTS image_file_path TEXT;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS image_file_name TEXT;
alter publication supabase_realtime add table blogs;