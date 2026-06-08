-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Categories enum
create type category_type as enum (
  'food', 'transport', 'shopping', 'entertainment',
  'health', 'utilities', 'housing', 'education', 'travel', 'other'
);

-- Receipts table
create table if not exists receipts (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  amount      numeric(12, 2) not null check (amount >= 0),
  currency    text not null default 'EUR',
  date        date not null,
  category    category_type not null default 'other',
  vendor      text,
  description text,
  image_url   text,
  raw_text    text,
  tags        text[] not null default '{}',
  is_synced   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Indexes
create index if not exists receipts_user_id_idx    on receipts (user_id);
create index if not exists receipts_date_idx       on receipts (user_id, date desc);
create index if not exists receipts_category_idx   on receipts (user_id, category);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger receipts_updated_at
  before update on receipts
  for each row execute procedure update_updated_at();

-- Row Level Security
alter table receipts enable row level security;

create policy "Users can view own receipts"
  on receipts for select using (auth.uid() = user_id);

create policy "Users can insert own receipts"
  on receipts for insert with check (auth.uid() = user_id);

create policy "Users can update own receipts"
  on receipts for update using (auth.uid() = user_id);

create policy "Users can delete own receipts"
  on receipts for delete using (auth.uid() = user_id);

-- Storage bucket for receipt images
insert into storage.buckets (id, name, public)
  values ('receipt-images', 'receipt-images', true)
  on conflict (id) do nothing;

create policy "Users upload own images"
  on storage.objects for insert
  with check (bucket_id = 'receipt-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'receipt-images');

create policy "Users delete own images"
  on storage.objects for delete
  using (bucket_id = 'receipt-images' and auth.uid()::text = (storage.foldername(name))[1]);
