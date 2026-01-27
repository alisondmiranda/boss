-- Migration: Kanban Support
-- Run this in Supabase SQL Editor

-- 1. Create kanban_columns table
CREATE TABLE IF NOT EXISTS kanban_columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  color TEXT DEFAULT 'slate', -- using our color palette names
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add column_id to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS column_id UUID REFERENCES kanban_columns(id) ON DELETE SET NULL;

-- 3. Enable RLS
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "Users can CRUD their own columns" 
ON kanban_columns 
FOR ALL 
USING (auth.uid() = user_id);

-- 5. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE kanban_columns;

-- 6. Indexes
CREATE INDEX IF NOT EXISTS kanban_columns_user_id_idx ON kanban_columns(user_id);
CREATE INDEX IF NOT EXISTS kanban_columns_order_idx ON kanban_columns("order");
CREATE INDEX IF NOT EXISTS tasks_column_id_idx ON tasks(column_id);
