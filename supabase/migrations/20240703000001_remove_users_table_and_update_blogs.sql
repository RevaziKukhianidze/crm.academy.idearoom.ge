-- Drop the users table since we'll use Supabase Auth directly
DROP TABLE IF EXISTS public.users;

-- Modify blogs table to support file uploads
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS image_file_name TEXT;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS image_file_path TEXT;

-- Enable storage for blog images
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true) ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload images
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-images');

-- Create policy to allow public to view images
DROP POLICY IF EXISTS "Allow public to view images" ON storage.objects;
CREATE POLICY "Allow public to view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog-images');

alter publication supabase_realtime add table blogs;