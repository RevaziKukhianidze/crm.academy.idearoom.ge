-- Create a storage bucket for course images
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-images', 'course-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up access policies for the course-images bucket
DROP POLICY IF EXISTS "Allow public access to course-images" ON storage.objects;
CREATE POLICY "Allow public access to course-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-images');

DROP POLICY IF EXISTS "Allow authenticated users to upload course images" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload course images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course-images');

DROP POLICY IF EXISTS "Allow authenticated users to update course images" ON storage.objects;
CREATE POLICY "Allow authenticated users to update course images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'course-images');

DROP POLICY IF EXISTS "Allow authenticated users to delete course images" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete course images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'course-images');