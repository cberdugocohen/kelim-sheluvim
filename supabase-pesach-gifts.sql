-- ============================================================
-- מתנות לפסח — Passover Gifts feature
-- Run this in the Supabase SQL editor
-- ============================================================

create table if not exists public.pesach_gifts (
  id               uuid primary key default gen_random_uuid(),
  created_date     timestamptz not null default now(),

  -- who is offering
  offered_by_id    text not null,
  offered_by_name  text not null,
  offered_by_image text,

  -- gift details
  title            text not null,
  description      text,
  image_url        text,

  -- 0 = unlimited, 1 = one recipient, N = multiple
  max_recipients   integer not null default 1,

  -- array of user IDs who claimed the gift
  claimed_by_ids   jsonb not null default '[]'::jsonb,

  status           text not null default 'available'
                   check (status in ('available', 'closed'))
);

-- Index for fast filtering by offerer
create index if not exists pesach_gifts_offered_by_id_idx
  on public.pesach_gifts (offered_by_id);

-- Index for chronological listing
create index if not exists pesach_gifts_created_date_idx
  on public.pesach_gifts (created_date desc);

-- ── Row Level Security ──────────────────────────────────────
alter table public.pesach_gifts enable row level security;

-- Anyone (including anonymous) can read gifts
create policy "pesach_gifts_read_all"
  on public.pesach_gifts for select
  using (true);

-- Authenticated users can offer gifts
create policy "pesach_gifts_insert_auth"
  on public.pesach_gifts for insert
  to authenticated
  with check (offered_by_id = (
    select id::text from public.users where auth_id = auth.uid()
  ));

-- Any authenticated user can update a gift
-- (to claim/unclaim or to close their own gift)
create policy "pesach_gifts_update_auth"
  on public.pesach_gifts for update
  to authenticated
  using (true);

-- Only the offerer (or admin) can delete
create policy "pesach_gifts_delete_owner"
  on public.pesach_gifts for delete
  to authenticated
  using (
    offered_by_id = (
      select id::text from public.users where auth_id = auth.uid()
    )
    or exists (
      select 1 from public.users
      where auth_id = auth.uid() and role = 'admin'
    )
  );
