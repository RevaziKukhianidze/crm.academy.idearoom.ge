-- Add section_image column to offered_course table
ALTER TABLE offered_course ADD COLUMN IF NOT EXISTS section_image TEXT;

-- Add a comment for clarity
COMMENT ON COLUMN offered_course.section_image IS 'Image URL for displaying course sections/offers on the website (recommended size: 190x190)'; 