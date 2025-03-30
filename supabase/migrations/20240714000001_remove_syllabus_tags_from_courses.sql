-- Remove syllabus and tags columns from courses table
ALTER TABLE courses
DROP COLUMN IF EXISTS syllabus,
DROP COLUMN IF EXISTS tags;
