do $$
begin
  if not exists (
    select 1
    from pg_enum
    where enumlabel = 'system'
      and enumtypid = 'public.theme_mode'::regtype
  ) then
    alter type public.theme_mode add value 'system';
  end if;
end
$$;

alter table public.profiles
alter column theme_preference set default 'system';

alter table public.system_settings
alter column default_theme set default 'system';
