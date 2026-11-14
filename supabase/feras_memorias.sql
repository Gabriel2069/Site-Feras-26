begin;
create table public.feras_memorias (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('Cotidiano','Homenagem','Acontecimento','Despedida')),
  message text not null check (char_length(btrim(message)) between 1 and 2000),
  author text not null default '' check (char_length(author) <= 80),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.feras_memorias enable row level security;
revoke all on public.feras_memorias from public, anon, authenticated;
grant select (kind,message,author,created_at), insert (kind,message,author)
  on public.feras_memorias to anon, authenticated;
create policy feras_public_read on public.feras_memorias for select to anon, authenticated
  using (approved);
create policy feras_pending_submission on public.feras_memorias for insert to anon, authenticated
  with check (not approved);
commit;
