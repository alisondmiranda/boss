-- 1. Add due_at and recurrence_id columns to tasks
ALTER TABLE tasks ADD COLUMN due_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN recurrence_id UUID;

-- 2. Create recurrences table
CREATE TABLE recurrences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  interval INTEGER DEFAULT 1,
  week_days INTEGER[], -- Array of days (0=Sun, 6=Sat) for weekly recurrence
  ends_on TIMESTAMP WITH TIME ZONE, -- Null means "Never ends"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Add foreign key to tasks
ALTER TABLE tasks 
  ADD CONSTRAINT fk_recurrence 
  FOREIGN KEY (recurrence_id) 
  REFERENCES recurrences(id);

-- 4. Policy (Optional, assuming RLS is on)
ALTER TABLE recurrences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can View their own recurrences" 
ON recurrences FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can Insert their own recurrences" 
ON recurrences FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can Update their own recurrences" 
ON recurrences FOR UPDATE 
USING (auth.uid() = user_id);
