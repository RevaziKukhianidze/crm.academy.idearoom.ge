-- Create the blog-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up public access policy for the blog-images bucket
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES 
('Public Read Access', 'blog-images', 'SELECT', 'true'),
('Authenticated Users Can Upload', 'blog-images', 'INSERT', '(auth.role() = ''authenticated'')'),
('Authenticated Users Can Update Own Files', 'blog-images', 'UPDATE', '(auth.role() = ''authenticated'')'),
('Authenticated Users Can Delete Own Files', 'blog-images', 'DELETE', '(auth.role() = ''authenticated'')')
ON CONFLICT (name, bucket_id, operation) DO NOTHING;
