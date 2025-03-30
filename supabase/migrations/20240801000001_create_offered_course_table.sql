-- Create offered_course table with all required fields
CREATE TABLE IF NOT EXISTS offered_course (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  image TEXT,
  lecturers TEXT[],
  lecturers_details TEXT[],
  course_details TEXT[],
  quantity_of_lessons TEXT[],
  quantity_of_students TEXT,
  price NUMERIC,
  old_price NUMERIC,
  syllabus_title TEXT[],
  syllabus_content JSONB DEFAULT '{}'::JSONB,
  courseIcon TEXT,
  text TEXT,
  course_category TEXT[],
  discount_percentage TEXT,
  lesson_time TEXT,
  start_course TEXT
);

-- Enable row level security
ALTER TABLE offered_course ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all offered courses
DROP POLICY IF EXISTS "Allow users to read all offered courses" ON offered_course;
CREATE POLICY "Allow users to read all offered courses"
ON offered_course FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow authenticated users to insert offered courses
DROP POLICY IF EXISTS "Allow authenticated users to insert offered courses" ON offered_course;
CREATE POLICY "Allow authenticated users to insert offered courses"
ON offered_course FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow authenticated users to update offered courses
DROP POLICY IF EXISTS "Allow users to update offered courses" ON offered_course;
CREATE POLICY "Allow users to update offered courses"
ON offered_course FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy to allow authenticated users to delete offered courses
DROP POLICY IF EXISTS "Allow users to delete offered courses" ON offered_course;
CREATE POLICY "Allow users to delete offered courses"
ON offered_course FOR DELETE
TO authenticated
USING (true);

-- Enable realtime for offered_course table
ALTER PUBLICATION supabase_realtime ADD TABLE offered_course;

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

-- Allow authenticated users to perform all operations
CREATE POLICY "Allow authenticated operations"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'public'); 