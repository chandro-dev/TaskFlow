alter table public.member_invitations
add column if not exists invited_user_id uuid references public.profiles(id) on delete cascade;

update public.member_invitations mi
set invited_user_id = p.id,
    email = p.email
from public.profiles p
where mi.invited_user_id is null
  and lower(mi.email) = lower(p.email);

alter table public.member_invitations
alter column invited_user_id set not null;

create index if not exists idx_member_invitations_invited_user_status
on public.member_invitations(invited_user_id, status);
