-- Migration: Add details and subtasks support
-- Run this in Supabase SQL Editor

-- 1. Add details column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS details TEXT;

-- 2. Create subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  "order" INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create index for faster queries
CREATE INDEX IF NOT EXISTS subtasks_task_id_idx ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS subtasks_order_idx ON subtasks("order");

-- 4. Enable Row Level Security
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for subtasks
-- Policy: Users can view their own subtasks (via task ownership)
CREATE POLICY "Users can view their own subtasks"
  ON subtasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- Policy: Users can insert subtasks for their own tasks
CREATE POLICY "Users can insert subtasks for their own tasks"
  ON subtasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- Policy: Users can update their own subtasks
CREATE POLICY "Users can update their own subtasks"
  ON subtasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own subtasks
CREATE POLICY "Users can delete their own subtasks"
  ON subtasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );
