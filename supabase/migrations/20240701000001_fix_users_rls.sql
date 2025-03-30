-- Enable row level security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from authenticated users
DROP POLICY IF EXISTS "Allow inserts for authenticated users" ON users;
CREATE POLICY "Allow inserts for authenticated users"
ON users FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow users to read all profiles
DROP POLICY IF EXISTS "Allow users to read all profiles" ON users;
CREATE POLICY "Allow users to read all profiles"
ON users FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow users to update their own profiles
DROP POLICY IF EXISTS "Allow users to update own profile" ON users;
CREATE POLICY "Allow users to update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create policy to allow service role to manage all profiles
DROP POLICY IF EXISTS "Allow service role full access" ON users;
CREATE POLICY "Allow service role full access"
ON users
TO service_role
USING (true)
WITH CHECK (true);

-- Enable realtime for users table
ALTER PUBLICATION supabase_realtime ADD TABLE users;
