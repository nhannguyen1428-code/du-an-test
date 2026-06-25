-- Chạy trong Supabase Dashboard → SQL Editor

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null default 'secret-base',
  nickname text not null,
  client_id text,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists messages_room_created_idx
  on public.messages (room_id, created_at desc);

alter table public.messages enable row level security;

drop policy if exists "Anyone can read messages" on public.messages;
create policy "Anyone can read messages"
  on public.messages for select
  using (true);

drop policy if exists "Anyone can insert messages" on public.messages;
create policy "Anyone can insert messages"
  on public.messages for insert
  with check (true);

alter publication supabase_realtime add table public.messages;
