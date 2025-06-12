-- Create review-images bucket for storing student pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for review-images bucket
CREATE POLICY "Public Access for review-images" ON storage.objects
FOR SELECT USING (bucket_id = 'review-images');

CREATE POLICY "Allow authenticated users to upload review images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'review-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to update review images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'review-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete review images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'review-images'
  AND auth.role() = 'authenticated'
); 