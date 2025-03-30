-- Add lecturer columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'lecturer') THEN
        ALTER TABLE courses ADD COLUMN lecturer text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'lecturer_details') THEN
        ALTER TABLE courses ADD COLUMN lecturer_details text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'oldprice') THEN
        ALTER TABLE courses ADD COLUMN oldprice numeric;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'price') THEN
        ALTER TABLE courses ADD COLUMN price numeric;
    END IF;
END $$;