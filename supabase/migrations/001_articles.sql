-- ─────────────────────────────────────────────────────────────
-- Industry Intelligence Dashboard — Supabase schema
-- Run this in your Supabase project's SQL editor
-- ─────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

create table if not exists public.articles (
  id                    uuid primary key default uuid_generate_v4(),
  title                 text not null,
  title_es              text,
  source                text not null,
  source_type           text not null check (source_type in ('Institutional', 'Press', 'Conglomerado', 'Market Advisor')),
  location              text not null check (location in ('Chile', 'Italy', 'Poland', 'Mexico', 'Spain', 'Global')),
  category              text not null check (category in ('Mining', 'Energy', 'Data Centers')),
  date                  date not null,
  url                   text not null unique,
  content               text,
  extended_description  text,
  extended_description_es text,
  short_summary         text[] default '{}',
  short_summary_es      text[] default '{}',
  processed             boolean default false,
  created_at            timestamptz default now()
);

-- Indexes for common filter queries
create index if not exists idx_articles_category   on public.articles (category);
create index if not exists idx_articles_location   on public.articles (location);
create index if not exists idx_articles_source     on public.articles (source);
create index if not exists idx_articles_source_type on public.articles (source_type);
create index if not exists idx_articles_date       on public.articles (date desc);
create index if not exists idx_articles_processed  on public.articles (processed);
create index if not exists idx_articles_url        on public.articles (url);

-- RLS: allow public read, restrict writes to service role
alter table public.articles enable row level security;

create policy "Public read" on public.articles
  for select using (true);

create policy "Service write" on public.articles
  for all using (auth.role() = 'service_role');
