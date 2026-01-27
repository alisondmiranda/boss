create table profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_type text,
  selected_icon text,
  custom_avatar_url text,
  sectors jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);