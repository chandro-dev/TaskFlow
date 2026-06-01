do $$
begin
  if not exists (
    select 1
    from pg_enum
    where enumlabel = 'IN_APP'
      and enumtypid = 'public.invitation_channel'::regtype
  ) then
    alter type public.invitation_channel add value 'IN_APP';
  end if;
end
$$;

alter table public.member_invitations
alter column channel set default 'IN_APP';

update public.member_invitations
set channel = 'IN_APP'
where channel = 'EMAIL';
