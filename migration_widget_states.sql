-- Widget state table for cross-device sync
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS widget_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  pomodoro_state JSONB DEFAULT '{}'::jsonb,
  timers_state JSONB DEFAULT '[]'::jsonb,
  stopwatch_state JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Row Level Security
ALTER TABLE widget_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own widget state" ON widget_states
  FOR ALL USING (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE widget_states;

-- Index for fast lookup
CREATE INDEX idx_widget_states_user_id ON widget_states(user_id);
