create type public.invitation_status as enum ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');
create type public.invitation_channel as enum ('EMAIL');

create table if not exists public.member_invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  email text not null,
  role public.user_role not null default 'DEVELOPER',
  status public.invitation_status not null default 'PENDING',
  channel public.invitation_channel not null default 'EMAIL',
  invited_by uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  message text,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_member_invitations_updated_at on public.member_invitations;
create trigger trg_member_invitations_updated_at
before update on public.member_invitations
for each row execute function public.set_updated_at();

alter table public.member_invitations enable row level security;

drop policy if exists "member_invitations_project_access" on public.member_invitations;
create policy "member_invitations_project_access"
on public.member_invitations for all
to authenticated
using (
  exists (
    select 1 from public.projects p
    where p.id = member_invitations.project_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.project_members pm
          where pm.project_id = p.id and pm.user_id = auth.uid()
        )
        or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.role = 'ADMIN'
        )
      )
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = member_invitations.project_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.project_members pm
          where pm.project_id = p.id and pm.user_id = auth.uid()
        )
        or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.role = 'ADMIN'
        )
      )
  )
);

create index if not exists idx_member_invitations_project_status
on public.member_invitations(project_id, status);
