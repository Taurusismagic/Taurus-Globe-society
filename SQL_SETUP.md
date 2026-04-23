# Supabase Database Setup

To support the new reporting and admin features, please run the following SQL in your Supabase SQL Editor:

```sql
/**
* 1. Create the Reports Table
*/
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  reported_id uuid references public.profiles(id) on delete cascade not null,
  content_type text not null check (content_type in ('message', 'profile')),
  content_id uuid, -- Optional, for reporting specific messages
  reason text not null,
  description text,
  status text default 'pending' check (status in ('pending', 'reviewed', 'resolved'))
);

-- Enable RLS
alter table public.reports enable row level security;

-- Policies
create policy "Users can insert their own reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "Admins can view all reports"
  on public.reports for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() 
      and email = 'allabouttaurus@gmail.com' -- Simple admin check
    )
  );

create policy "Admins can update reports"
  on public.reports for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() 
      and email = 'allabouttaurus@gmail.com'
    )
  );
```
