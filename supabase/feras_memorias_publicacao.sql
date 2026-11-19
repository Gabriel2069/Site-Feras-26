begin;
create function public.feras_censurar_ofensas(value text)
returns text language sql immutable security invoker set search_path = '' as $$
  select pg_catalog.regexp_replace(coalesce(value,''),
    '\m(filh[oa][[:space:]]+d[ae][[:space:]]+puta|vai[[:space:]]+se[[:space:]]+foder|f[o0]da[-[:space:]]?se|f[d]p|pqp|p[uú]ta|putinha|p[o0]rra|c[a4]r[a4]lh[o0]|f[o0]der|c[uú]|c[uú]z[aã]o|arrombad[oa]s?|b[a4]b[a4]c[a4]s?|idiotas?|imbecis|imbecil|ot[aá]ri[oa]s?|merda|b[o0]st[a4]|desgra[cç]ad[oa]s?|vagabund[oa]s?|piranhas?|viad[oa]s?|viadinh[oa]s?|bichas?|retardad[oa]s?)\M',
    '***', 'gi');
$$;
create function public.feras_publicar_memoria()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.message := public.feras_censurar_ofensas(new.message);
  new.author := public.feras_censurar_ofensas(new.author);
  new.approved := true;
  new.deleted_at := null;
  return new;
end;
$$;
revoke all on function public.feras_publicar_memoria() from public,anon,authenticated;
create trigger feras_censura_antes_de_publicar before insert on public.feras_memorias
for each row execute function public.feras_publicar_memoria();
alter policy feras_pending_submission on public.feras_memorias
  with check (approved and deleted_at is null);
comment on function public.feras_censurar_ofensas(text) is 'Filtro lexical de termos ofensivos; não identifica toda ofensa dependente de contexto.';
commit;
