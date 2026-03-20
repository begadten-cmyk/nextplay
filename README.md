# NextPlay — Kanban Task Board

A premium Kanban task board built with React, TypeScript, Vite, and Supabase. Features drag-and-drop, real-time filtering, comments, activity logs, and custom labels.

## Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Supabase project URL and anon key:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Set up the database:**
   Run the SQL migration in your Supabase SQL Editor (see [Database Setup](#database-setup) below).

4. **Enable anonymous sign-in:**
   In your Supabase dashboard, go to **Authentication → Settings → Auth Providers** and enable **Anonymous Sign-Ins**.

5. **Start the dev server:**
   ```bash
   npm run dev
   ```

## Database Setup

Run the following SQL in your Supabase SQL Editor:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Tasks table
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'in_review', 'done')),
  priority text default 'normal' check (priority in ('low', 'normal', 'high')),
  due_date date,
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Comments table
create table comments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references auth.users(id),
  content text not null,
  created_at timestamptz default now()
);

-- Labels table
create table labels (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  color text not null,
  user_id uuid references auth.users(id)
);

-- Task labels junction
create table task_labels (
  task_id uuid references tasks(id) on delete cascade,
  label_id uuid references labels(id) on delete cascade,
  primary key (task_id, label_id)
);

-- Activity log table
create table activity_log (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references auth.users(id),
  action text not null,
  created_at timestamptz default now()
);

-- RLS
alter table tasks enable row level security;
alter table comments enable row level security;
alter table labels enable row level security;
alter table task_labels enable row level security;
alter table activity_log enable row level security;

create policy "Users manage own tasks" on tasks for all using (auth.uid() = user_id);
create policy "Users manage own comments" on comments for all using (auth.uid() = user_id);
create policy "Users manage own labels" on labels for all using (auth.uid() = user_id);
create policy "Users manage own task_labels" on task_labels for all using (
  auth.uid() = (select user_id from tasks where id = task_id)
);
create policy "Users manage own activity" on activity_log for all using (auth.uid() = user_id);
```

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** for build tooling
- **Supabase** for auth, database, and RLS
- **@dnd-kit** for drag-and-drop
- **date-fns** for date formatting
- **lucide-react** for icons
