-- Create blogs table
CREATE TABLE IF NOT EXISTS blogs (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  image TEXT,
  tags TEXT[]
);

-- Enable row level security
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all blogs
DROP POLICY IF EXISTS "Allow users to read all blogs" ON blogs;
CREATE POLICY "Allow users to read all blogs"
ON blogs FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow authenticated users to insert blogs
DROP POLICY IF EXISTS "Allow authenticated users to insert blogs" ON blogs;
CREATE POLICY "Allow authenticated users to insert blogs"
ON blogs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow authenticated users to update their own blogs
DROP POLICY IF EXISTS "Allow users to update own blogs" ON blogs;
CREATE POLICY "Allow users to update own blogs"
ON blogs FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy to allow authenticated users to delete their own blogs
DROP POLICY IF EXISTS "Allow users to delete own blogs" ON blogs;
CREATE POLICY "Allow users to delete own blogs"
ON blogs FOR DELETE
TO authenticated
USING (true);

-- Enable realtime for blogs table
ALTER PUBLICATION supabase_realtime ADD TABLE blogs;