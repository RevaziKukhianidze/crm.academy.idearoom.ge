-- Migration to update tags from TEXT[] to JSON to support tag objects
-- This allows storing both tag name and URL

-- Add a temporary column for the new JSON structure
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS tags_json JSON;

-- Migrate existing tags data to new format
UPDATE blogs 
SET tags_json = (
  SELECT JSON_AGG(JSON_BUILD_OBJECT('name', tag_name, 'url', NULL))
  FROM UNNEST(tags) AS tag_name
)
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0;

-- Drop the old tags column
ALTER TABLE blogs DROP COLUMN IF EXISTS tags;

-- Rename the new column to tags
ALTER TABLE blogs RENAME COLUMN tags_json TO tags;

-- Enable realtime for updated blogs table
ALTER PUBLICATION supabase_realtime ADD TABLE blogs; 