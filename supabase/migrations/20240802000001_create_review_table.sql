-- Create review table with all required fields
CREATE TABLE IF NOT EXISTS review (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  text TEXT NOT NULL,
  fullName TEXT NOT NULL,
  course TEXT NOT NULL,
  courseLink TEXT,
  student_picture TEXT
);

-- Enable row level security
ALTER TABLE review ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all reviews
DROP POLICY IF EXISTS "Allow users to read all reviews" ON review;
CREATE POLICY "Allow users to read all reviews"
ON review FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow authenticated users to insert reviews
DROP POLICY IF EXISTS "Allow authenticated users to insert reviews" ON review;
CREATE POLICY "Allow authenticated users to insert reviews"
ON review FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow authenticated users to update reviews
DROP POLICY IF EXISTS "Allow users to update reviews" ON review;
CREATE POLICY "Allow users to update reviews"
ON review FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy to allow authenticated users to delete reviews
DROP POLICY IF EXISTS "Allow users to delete reviews" ON review;
CREATE POLICY "Allow users to delete reviews"
ON review FOR DELETE
TO authenticated
USING (true);

-- Enable realtime for review table
ALTER PUBLICATION supabase_realtime ADD TABLE review;

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_review_updated_at
    BEFORE UPDATE ON review
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 