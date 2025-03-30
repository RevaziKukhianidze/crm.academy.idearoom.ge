-- Create avatars storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy to allow authenticated users to upload avatars
DROP POLICY IF EXISTS "Avatar storage policy" ON storage.objects;
CREATE POLICY "Avatar storage policy"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'avatars');
