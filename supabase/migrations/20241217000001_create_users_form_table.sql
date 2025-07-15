-- Create users_form table with all required fields if it doesn't exist
CREATE TABLE IF NOT EXISTS users_form (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT,
  firstName TEXT,
  lastName TEXT,
  phoneNumber TEXT,
  socialId TEXT,
  birth_date DATE,
  choosedCourse TEXT,
  choosedMedia TEXT
);

-- Enable row level security
ALTER TABLE users_form ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all user forms
DROP POLICY IF EXISTS "Allow authenticated users to read all user forms" ON users_form;
CREATE POLICY "Allow authenticated users to read all user forms"
ON users_form FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow authenticated users to insert user forms
DROP POLICY IF EXISTS "Allow authenticated users to insert user forms" ON users_form;
CREATE POLICY "Allow authenticated users to insert user forms"
ON users_form FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow public to insert user forms (for registration)
DROP POLICY IF EXISTS "Allow public to insert user forms" ON users_form;
CREATE POLICY "Allow public to insert user forms"
ON users_form FOR INSERT
TO anon
WITH CHECK (true);

-- Create policy to allow authenticated users to update user forms
DROP POLICY IF EXISTS "Allow authenticated users to update user forms" ON users_form;
CREATE POLICY "Allow authenticated users to update user forms"
ON users_form FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy to allow authenticated users to delete user forms
DROP POLICY IF EXISTS "Allow authenticated users to delete user forms" ON users_form;
CREATE POLICY "Allow authenticated users to delete user forms"
ON users_form FOR DELETE
TO authenticated
USING (true);

-- Enable realtime for users_form table
ALTER PUBLICATION supabase_realtime ADD TABLE users_form;

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_form_updated_at ON users_form;
CREATE TRIGGER update_users_form_updated_at
    BEFORE UPDATE ON users_form
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 