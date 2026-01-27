ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_sector_check;
ALTER TABLE tasks ALTER COLUMN sector TYPE text[] USING ARRAY[sector];