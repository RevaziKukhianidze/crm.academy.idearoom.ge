-- Create the blog-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up public access policy for the blog-images bucket
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access" ON storage.objects 
FOR SELECT 
USING (bucket_id = 'blog-images');

DROP POLICY IF EXISTS "Authenticated Users Can Upload" ON storage.objects;
CREATE POLICY "Authenticated Users Can Upload" ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'blog-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Users Can Update Own Files" ON storage.objects;
CREATE POLICY "Authenticated Users Can Update Own Files" ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'blog-images' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'blog-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Users Can Delete Own Files" ON storage.objects;
CREATE POLICY "Authenticated Users Can Delete Own Files" ON storage.objects 
FOR DELETE 
USING (bucket_id = 'blog-images' AND auth.role() = 'authenticated');
