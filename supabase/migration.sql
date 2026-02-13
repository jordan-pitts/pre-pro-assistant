-- Pre-Pro Assistant Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Projects table
create table projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  project_type text default 'indie_narrative',
  script_text text,
  look_words jsonb default '[]'::jsonb,
  constraints jsonb default '{}'::jsonb,
  style_profile jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Scenes table
create table scenes (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade not null,
  scene_number int not null,
  int_ext text,
  location text,
  time_of_day text,
  characters jsonb default '[]'::jsonb,
  beat_summary text,
  created_at timestamp with time zone default now()
);

-- Shots table
create table shots (
  id uuid primary key default uuid_generate_v4(),
  scene_id uuid references scenes(id) on delete cascade not null,
  shot_code text not null,
  position_index int not null default 0,
  shot_size text,
  angle text,
  movement text,
  lens_suggestion text,
  blocking_notes text,
  intent_text text,
  audio_notes text,
  time_cost_estimate text,
  reference_targets jsonb,
  search_prompts jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Shot references table
create table shot_references (
  id uuid primary key default uuid_generate_v4(),
  shot_id uuid references shots(id) on delete cascade not null,
  type text not null check (type in ('recommended_image', 'external_link')),
  provider text not null check (provider in ('pexels', 'unsplash', 'frameset')),
  url text not null,
  preview_url text,
  attribution_text text,
  attribution_url text,
  license_info text,
  why_this_works text,
  created_at timestamp with time zone default now()
);

-- Indexes
create index idx_projects_user_id on projects(user_id);
create index idx_scenes_project_id on scenes(project_id);
create index idx_shots_scene_id on shots(scene_id);
create index idx_shot_references_shot_id on shot_references(shot_id);

-- Row Level Security
alter table projects enable row level security;
alter table scenes enable row level security;
alter table shots enable row level security;
alter table shot_references enable row level security;

-- Policies: Users can only access their own data
create policy "Users can view own projects" on projects
  for select using (auth.uid() = user_id);

create policy "Users can create own projects" on projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update own projects" on projects
  for update using (auth.uid() = user_id);

create policy "Users can delete own projects" on projects
  for delete using (auth.uid() = user_id);

-- Scenes: accessible if user owns the project
create policy "Users can view own scenes" on scenes
  for select using (
    exists (select 1 from projects where projects.id = scenes.project_id and projects.user_id = auth.uid())
  );

create policy "Users can create own scenes" on scenes
  for insert with check (
    exists (select 1 from projects where projects.id = scenes.project_id and projects.user_id = auth.uid())
  );

create policy "Users can update own scenes" on scenes
  for update using (
    exists (select 1 from projects where projects.id = scenes.project_id and projects.user_id = auth.uid())
  );

create policy "Users can delete own scenes" on scenes
  for delete using (
    exists (select 1 from projects where projects.id = scenes.project_id and projects.user_id = auth.uid())
  );

-- Shots: accessible if user owns the project (via scene)
create policy "Users can view own shots" on shots
  for select using (
    exists (
      select 1 from scenes
      join projects on projects.id = scenes.project_id
      where scenes.id = shots.scene_id and projects.user_id = auth.uid()
    )
  );

create policy "Users can create own shots" on shots
  for insert with check (
    exists (
      select 1 from scenes
      join projects on projects.id = scenes.project_id
      where scenes.id = shots.scene_id and projects.user_id = auth.uid()
    )
  );

create policy "Users can update own shots" on shots
  for update using (
    exists (
      select 1 from scenes
      join projects on projects.id = scenes.project_id
      where scenes.id = shots.scene_id and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own shots" on shots
  for delete using (
    exists (
      select 1 from scenes
      join projects on projects.id = scenes.project_id
      where scenes.id = shots.scene_id and projects.user_id = auth.uid()
    )
  );

-- Shot references: accessible if user owns the project (via shot -> scene)
create policy "Users can view own shot_references" on shot_references
  for select using (
    exists (
      select 1 from shots
      join scenes on scenes.id = shots.scene_id
      join projects on projects.id = scenes.project_id
      where shots.id = shot_references.shot_id and projects.user_id = auth.uid()
    )
  );

create policy "Users can create own shot_references" on shot_references
  for insert with check (
    exists (
      select 1 from shots
      join scenes on scenes.id = shots.scene_id
      join projects on projects.id = scenes.project_id
      where shots.id = shot_references.shot_id and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own shot_references" on shot_references
  for delete using (
    exists (
      select 1 from shots
      join scenes on scenes.id = shots.scene_id
      join projects on projects.id = scenes.project_id
      where shots.id = shot_references.shot_id and projects.user_id = auth.uid()
    )
  );

-- Updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_projects_updated_at
  before update on projects
  for each row execute function update_updated_at_column();

create trigger update_shots_updated_at
  before update on shots
  for each row execute function update_updated_at_column();
