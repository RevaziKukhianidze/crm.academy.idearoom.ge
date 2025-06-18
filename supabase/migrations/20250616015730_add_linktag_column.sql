-- Add linkTag column as JSON to blogs table to store array of {name, url} objects
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS linkTag JSON;

-- Create index for better performance on linkTag searches
CREATE INDEX IF NOT EXISTS idx_blogs_linktag ON blogs USING GIN (linkTag);

-- Update existing blogs to have empty linkTag array if null
UPDATE blogs SET linkTag = '[]' WHERE linkTag IS NULL;
