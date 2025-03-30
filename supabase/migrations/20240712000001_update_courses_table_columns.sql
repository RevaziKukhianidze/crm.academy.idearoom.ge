-- Add new columns to courses table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'course_details') THEN
        ALTER TABLE courses ADD COLUMN course_details text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'start_course') THEN
        ALTER TABLE courses ADD COLUMN start_course text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'quantity_lessons') THEN
        ALTER TABLE courses ADD COLUMN quantity_lessons int4;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'quantity_of_students') THEN
        ALTER TABLE courses ADD COLUMN quantity_of_students text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'lesson_time') THEN
        ALTER TABLE courses ADD COLUMN lesson_time int4;
    END IF;

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

alter publication supabase_realtime add table courses;