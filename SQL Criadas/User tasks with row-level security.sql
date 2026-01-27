create table tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  sector text check (sector in ('work', 'health', 'personal')) not null,
  status text check (status in ('pending', 'done')) default 'pending',
  due_date timestamptz,
  is_recurring boolean default false,
  created_at timestamptz default now()
);
alter table tasks enable row level security;
create policy "Users can CRUD their own tasks" on tasks for all using (auth.uid() = user_id);