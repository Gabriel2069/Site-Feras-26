begin;
create schema if not exists feras_private;
revoke all on schema feras_private from public, anon, authenticated;
create table feras_private.mural_settings (
  singleton boolean primary key default true check(singleton),
  password_hash text not null
);
create table feras_private.mural_attempts (
  singleton boolean primary key default true check(singleton),
  window_started timestamptz not null default now(),
  failed integer not null default 0
);
insert into feras_private.mural_attempts(singleton) values(true);
alter table feras_private.mural_settings enable row level security;
alter table feras_private.mural_attempts enable row level security;
revoke all on all tables in schema feras_private from public, anon, authenticated;
alter table public.feras_memorias add column deleted_at timestamptz;
alter policy feras_public_read on public.feras_memorias using (approved and deleted_at is null);
grant select(id) on public.feras_memorias to anon, authenticated;
create function public.feras_apagar_memoria(p_id uuid, p_senha text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  stored_hash text;
  attempts feras_private.mural_attempts%rowtype;
  changed integer;
begin
  select password_hash into stored_hash from feras_private.mural_settings where singleton;
  if stored_hash is null then return jsonb_build_object('ok',false,'code','unavailable'); end if;
  select * into attempts from feras_private.mural_attempts where singleton for update;
  if attempts.window_started < clock_timestamp() - interval '1 minute' then
    update feras_private.mural_attempts set window_started=clock_timestamp(),failed=0 where singleton;
    attempts.failed := 0;
  end if;
  if attempts.failed >= 10 then return jsonb_build_object('ok',false,'code','rate_limit'); end if;
  if p_senha is null or length(p_senha)>64 or extensions.crypt(p_senha,stored_hash) is distinct from stored_hash then
    update feras_private.mural_attempts set failed=failed+1 where singleton;
    return jsonb_build_object('ok',false,'code','invalid_password');
  end if;
  -- Sem id, confirma somente a senha para lembranças antigas salvas neste navegador.
  if p_id is null then return jsonb_build_object('ok',true,'code','authorized'); end if;
  update public.feras_memorias set deleted_at=clock_timestamp()
    where id=p_id and approved and deleted_at is null;
  get diagnostics changed = row_count;
  return jsonb_build_object('ok',true,'code',case when changed=1 then 'deleted' else 'already_removed' end);
end;
$$;
revoke all on function public.feras_apagar_memoria(uuid,text) from public,anon,authenticated;
grant execute on function public.feras_apagar_memoria(uuid,text) to anon,authenticated;
comment on function public.feras_apagar_memoria(uuid,text) is 'Remoção de uma lembrança com senha validada no servidor e limite de tentativas. Não concede UPDATE ou DELETE diretos.';
commit;
