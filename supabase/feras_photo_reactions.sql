begin;

create table public.feras_photo_reactions (
  photo_path text primary key
    check (char_length(photo_path) <= 240 and photo_path ~ '^\./media/[a-zA-Z0-9/_-]+\.(jpg|jpeg|png|webp|avif)$'),
  emoji text not null check (emoji in ('❤️', '😂', '🥹', '🔥', '👏', '💙'))
);

alter table public.feras_photo_reactions enable row level security;
revoke all on public.feras_photo_reactions from public, anon, authenticated;

grant select (photo_path, emoji), insert (photo_path, emoji), update (photo_path, emoji)
  on public.feras_photo_reactions to anon, authenticated;

-- The memorial intentionally lets each visitor replace the current emoji.
create policy feras_reactions_read on public.feras_photo_reactions
  for select to anon, authenticated using (true);
create policy feras_reactions_insert on public.feras_photo_reactions
  for insert to anon, authenticated with check (true);
create policy feras_reactions_replace on public.feras_photo_reactions
  for update to anon, authenticated using (true) with check (true);

commit;
