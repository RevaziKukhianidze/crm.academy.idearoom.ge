-- Create courses table with syllabus column
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  image TEXT,
  syllabus JSONB NOT NULL DEFAULT '[]'::JSONB,
  tags TEXT[]
);

-- Enable row level security
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all courses
DROP POLICY IF EXISTS "Allow users to read all courses" ON courses;
CREATE POLICY "Allow users to read all courses"
ON courses FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow authenticated users to insert courses
DROP POLICY IF EXISTS "Allow authenticated users to insert courses" ON courses;
CREATE POLICY "Allow authenticated users to insert courses"
ON courses FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow authenticated users to update their own courses
DROP POLICY IF EXISTS "Allow users to update own courses" ON courses;
CREATE POLICY "Allow users to update own courses"
ON courses FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy to allow authenticated users to delete their own courses
DROP POLICY IF EXISTS "Allow users to delete own courses" ON courses;
CREATE POLICY "Allow users to delete own courses"
ON courses FOR DELETE
TO authenticated
USING (true);

-- Enable realtime for courses table
ALTER PUBLICATION supabase_realtime ADD TABLE courses;