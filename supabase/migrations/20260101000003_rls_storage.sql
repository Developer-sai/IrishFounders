-- Irish Founders: RLS, column-level grants, storage, realtime.
-- Defence in depth: RLS decides *which rows*, column grants decide *which columns*,
-- and anything that changes trust state goes through SECURITY DEFINER RPCs only.

-- ---------------------------------------------------------------- extra helpers
create or replace function public.is_startup_member(p_startup uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.startup_members
    where startup_id = p_startup and profile_id = auth.uid());
$$;

create or replace function public.is_approved_as(p_user uuid, p_role public.user_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
    where id = p_user and role = p_role and verification_status = 'approved' and suspended_at is null);
$$;

-- admin-only: emails are not selectable by clients, so admins resolve them here
create or replace function public.admin_profile_emails(p_ids uuid[])
returns table (id uuid, email text) language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_super_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query select p.id, p.email::text from public.profiles p where p.id = any (p_ids);
end $$;

revoke execute on function public.is_startup_member(uuid), public.is_approved_as(uuid, public.user_role),
  public.admin_profile_emails(uuid[]) from public, anon, authenticated;
grant execute on function public.is_startup_member(uuid), public.is_approved_as(uuid, public.user_role)
  to anon, authenticated;
grant execute on function public.admin_profile_emails(uuid[]) to authenticated;

-- ---------------------------------------------------------------- base privileges
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- ---------------------------------------------------------------- enable RLS everywhere
alter table public.profiles enable row level security;
alter table public.startups enable row level security;
alter table public.startup_members enable row level security;
alter table public.startup_claims enable row level security;
alter table public.membership_applications enable row level security;
alter table public.verification_evidence enable row level security;
alter table public.interviews enable row level security;
alter table public.investor_profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_comments enable row level security;
alter table public.post_reactions enable row level security;
alter table public.saved_items enable row level security;
alter table public.product_launches enable row level security;
alter table public.launch_votes enable row level security;
alter table public.product_feedback enable row level security;
alter table public.design_partner_requests enable row level security;
alter table public.design_partner_applications enable row level security;
alter table public.collaboration_listings enable row level security;
alter table public.connections enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.investor_introductions enable row level security;
alter table public.notifications enable row level security;
alter table public.opportunities enable row level security;
alter table public.reports enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.platform_settings enable row level security;

-- ---------------------------------------------------------------- profiles
-- email is deliberately NOT granted: members must never see each other's addresses.
grant select (id, full_name, role, verification_status, avatar_url, headline, bio, location,
  linkedin_url, skills, areas_of_expertise, hidden_fields, suspended_at, is_demo, created_at, updated_at)
  on public.profiles to authenticated;
grant update (full_name, avatar_url, headline, bio, location, linkedin_url, skills,
  areas_of_expertise, hidden_fields) on public.profiles to authenticated;

create policy profiles_select on public.profiles for select to authenticated using (
  id = auth.uid() or public.is_admin()
  or (public.is_member() and verification_status = 'approved' and suspended_at is null)
);
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- public, privacy-aware read models (views run with owner rights by design)
grant select on public.public_founders, public.public_startup_team to anon, authenticated;

-- ---------------------------------------------------------------- startups
grant select on public.startups to anon, authenticated;
grant update (name, logo_url, industry, stage, location, team_size, short_description,
  problem_statement, product_overview, screenshots) on public.startups to authenticated;

create policy startups_select on public.startups for select to anon, authenticated using (
  is_verified or public.is_startup_member(id) or public.is_admin()
);
create policy startups_update on public.startups for update to authenticated
  using (public.is_startup_admin(id)) with check (public.is_startup_admin(id));

grant select, delete on public.startup_members to authenticated;
create policy startup_members_select on public.startup_members for select to authenticated using (
  profile_id = auth.uid() or public.is_startup_member(startup_id) or public.is_admin()
);
create policy startup_members_delete on public.startup_members for delete to authenticated using (
  profile_id = auth.uid() or public.is_startup_admin(startup_id)
);

grant select on public.startup_claims to authenticated;
create policy startup_claims_select on public.startup_claims for select to authenticated using (
  claimant_id = auth.uid() or public.is_startup_admin(startup_id)
);

-- ---------------------------------------------------------------- applications & verification
grant select on public.membership_applications to authenticated;
create policy applications_select on public.membership_applications for select to authenticated using (
  profile_id = auth.uid() or public.is_super_admin()
);

grant select, insert (application_id, uploaded_by, storage_path, kind) on public.verification_evidence to authenticated;
create policy evidence_select on public.verification_evidence for select to authenticated using (
  uploaded_by = auth.uid() or public.is_super_admin()
);
create policy evidence_insert on public.verification_evidence for insert to authenticated with check (
  uploaded_by = auth.uid()
  and exists (select 1 from public.membership_applications a
              where a.id = application_id and a.profile_id = auth.uid())
  and storage_path like auth.uid()::text || '/%'
);

-- interviews hold internal admin notes: applicants never read this table directly
grant select on public.interviews to authenticated;
create policy interviews_select on public.interviews for select to authenticated using (public.is_super_admin());

grant select on public.investor_profiles to authenticated;
create policy investor_profiles_select on public.investor_profiles for select to authenticated using (
  profile_id = auth.uid() or public.is_super_admin()
  or (public.is_member() and public.is_approved_as(profile_id, 'investor'))
);

-- ---------------------------------------------------------------- posts & community
grant select, delete on public.posts to authenticated;
grant insert (author_id, startup_id, category, title, content, media_urls, external_link) on public.posts to authenticated;
grant update (category, title, content, media_urls, external_link) on public.posts to authenticated;
create policy posts_select on public.posts for select to authenticated using (
  public.is_admin() or (public.is_member() and (status = 'published' or author_id = auth.uid()))
);
create policy posts_insert on public.posts for insert to authenticated with check (
  author_id = auth.uid() and public.is_member()
  and (startup_id is null or public.is_startup_member(startup_id))
);
create policy posts_update on public.posts for update to authenticated
  using (author_id = auth.uid() and public.is_member() and status = 'published')
  with check (author_id = auth.uid());
create policy posts_delete on public.posts for delete to authenticated using (
  author_id = auth.uid() or public.is_admin()
);

grant select, delete on public.post_comments to authenticated;
grant insert (post_id, author_id, parent_id, content) on public.post_comments to authenticated;
create policy comments_select on public.post_comments for select to authenticated using (
  public.is_admin() or (public.is_member() and (status = 'published' or author_id = auth.uid()))
);
create policy comments_insert on public.post_comments for insert to authenticated with check (
  author_id = auth.uid() and public.is_member()
  and exists (select 1 from public.posts p where p.id = post_id and p.status = 'published')
);
create policy comments_delete on public.post_comments for delete to authenticated using (
  author_id = auth.uid() or public.is_admin()
);

grant select, insert, delete on public.post_reactions to authenticated;
create policy reactions_select on public.post_reactions for select to authenticated using (public.is_member());
create policy reactions_insert on public.post_reactions for insert to authenticated
  with check (user_id = auth.uid() and public.is_member());
create policy reactions_delete on public.post_reactions for delete to authenticated using (user_id = auth.uid());

grant select, insert, delete on public.saved_items to authenticated;
create policy saved_select on public.saved_items for select to authenticated using (user_id = auth.uid());
create policy saved_insert on public.saved_items for insert to authenticated
  with check (user_id = auth.uid() and public.is_member());
create policy saved_delete on public.saved_items for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------- launches
grant select on public.product_launches to anon, authenticated;
grant delete on public.product_launches to authenticated;
grant insert (startup_id, founder_id, name, slug, tagline, description, website_url, logo_url,
  screenshots, category, stage, launch_date, feedback_requested) on public.product_launches to authenticated;
grant update (tagline, description, logo_url, screenshots, category, stage, feedback_requested)
  on public.product_launches to authenticated;
create policy launches_select on public.product_launches for select to anon, authenticated using (
  status = 'published' or founder_id = auth.uid() or public.is_admin()
);
create policy launches_insert on public.product_launches for insert to authenticated with check (
  founder_id = auth.uid() and public.is_approved_founder() and public.is_startup_member(startup_id)
);
create policy launches_update on public.product_launches for update to authenticated
  using (founder_id = auth.uid() and status = 'published') with check (founder_id = auth.uid());
create policy launches_delete on public.product_launches for delete to authenticated
  using (founder_id = auth.uid() or public.is_admin());

grant select, insert, delete on public.launch_votes to authenticated;
create policy votes_select on public.launch_votes for select to authenticated using (public.is_member());
create policy votes_insert on public.launch_votes for insert to authenticated
  with check (user_id = auth.uid() and public.is_member());
create policy votes_delete on public.launch_votes for delete to authenticated using (user_id = auth.uid());

grant select, delete on public.product_feedback to authenticated;
grant insert (launch_id, author_id, content) on public.product_feedback to authenticated;
create policy feedback_select on public.product_feedback for select to authenticated using (
  public.is_admin() or (public.is_member() and (status = 'published' or author_id = auth.uid()))
);
create policy feedback_insert on public.product_feedback for insert to authenticated
  with check (author_id = auth.uid() and public.is_member());
create policy feedback_delete on public.product_feedback for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------- design partners & collaboration
grant select, delete on public.design_partner_requests to authenticated;
grant insert (startup_id, founder_id, title, product_name, target_user, problem_statement,
  feedback_type, partners_needed, expected_commitment, work_mode, deadline)
  on public.design_partner_requests to authenticated;
grant update (is_active, title, deadline, partners_needed) on public.design_partner_requests to authenticated;
create policy dpr_select on public.design_partner_requests for select to authenticated using (public.is_member());
create policy dpr_insert on public.design_partner_requests for insert to authenticated with check (
  founder_id = auth.uid() and public.is_approved_founder() and public.is_startup_member(startup_id)
);
create policy dpr_update on public.design_partner_requests for update to authenticated
  using (founder_id = auth.uid()) with check (founder_id = auth.uid());
create policy dpr_delete on public.design_partner_requests for delete to authenticated using (founder_id = auth.uid());

grant select, delete on public.design_partner_applications to authenticated;
grant insert (request_id, applicant_id, message) on public.design_partner_applications to authenticated;
create policy dpa_select on public.design_partner_applications for select to authenticated using (
  applicant_id = auth.uid()
  or exists (select 1 from public.design_partner_requests r where r.id = request_id and r.founder_id = auth.uid())
);
create policy dpa_insert on public.design_partner_applications for insert to authenticated with check (
  applicant_id = auth.uid() and public.is_member()
  and not exists (select 1 from public.design_partner_requests r where r.id = request_id and r.founder_id = auth.uid())
);
create policy dpa_delete on public.design_partner_applications for delete to authenticated using (applicant_id = auth.uid());

grant select, delete on public.collaboration_listings to authenticated;
grant insert (creator_id, startup_id, category, title, description, skills_needed, industry, location, commitment_type)
  on public.collaboration_listings to authenticated;
grant update (title, description, skills_needed, is_active) on public.collaboration_listings to authenticated;
create policy collab_select on public.collaboration_listings for select to authenticated using (public.is_member());
create policy collab_insert on public.collaboration_listings for insert to authenticated with check (
  creator_id = auth.uid() and public.is_member()
  and (startup_id is null or public.is_startup_member(startup_id))
);
create policy collab_update on public.collaboration_listings for update to authenticated
  using (creator_id = auth.uid()) with check (creator_id = auth.uid());
create policy collab_delete on public.collaboration_listings for delete to authenticated using (creator_id = auth.uid());

-- ---------------------------------------------------------------- networking
grant select on public.connections, public.conversations, public.investor_introductions to authenticated;
create policy connections_select on public.connections for select to authenticated using (
  auth.uid() in (requester_id, recipient_id)
);
create policy conversations_select on public.conversations for select to authenticated using (
  auth.uid() in (participant_one, participant_two)
);
create policy introductions_select on public.investor_introductions for select to authenticated using (
  auth.uid() in (investor_id, founder_id) or public.is_super_admin()
);

grant select on public.messages to authenticated;
grant insert (conversation_id, sender_id, content) on public.messages to authenticated;
create policy messages_select on public.messages for select to authenticated using (
  public.is_conversation_participant(conversation_id)
);
create policy messages_insert on public.messages for insert to authenticated with check (
  sender_id = auth.uid() and public.is_member() and public.can_message(conversation_id)
);

grant select, delete on public.blocks to authenticated;
create policy blocks_select on public.blocks for select to authenticated using (blocker_id = auth.uid());
create policy blocks_delete on public.blocks for delete to authenticated using (blocker_id = auth.uid());

grant select, delete on public.notifications to authenticated;
grant update (is_read) on public.notifications to authenticated;
create policy notifications_select on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_delete on public.notifications for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------- opportunities
grant select on public.opportunities to anon, authenticated;
grant insert (created_by, category, title, description, source_url, location, starts_at, expires_at)
  on public.opportunities to authenticated;
create policy opportunities_select on public.opportunities for select to anon, authenticated using (
  (status = 'approved' and (expires_at is null or expires_at > now()))
  or created_by = auth.uid() or public.is_admin()
);
create policy opportunities_insert on public.opportunities for insert to authenticated with check (
  created_by = auth.uid()
  and (public.is_approved_as(auth.uid(), 'ecosystem_partner') or public.is_admin())
);

-- ---------------------------------------------------------------- reports, audit, settings
grant select on public.reports to authenticated;
grant insert (reporter_id, target_type, target_id, reason) on public.reports to authenticated;
create policy reports_select on public.reports for select to authenticated using (
  reporter_id = auth.uid() or public.is_admin()
);
create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and public.is_member());

grant select on public.admin_audit_logs to authenticated;
create policy audit_select on public.admin_audit_logs for select to authenticated using (public.is_super_admin());

grant select on public.platform_settings to authenticated;
grant update (value, updated_by, updated_at) on public.platform_settings to authenticated;
create policy settings_select on public.platform_settings for select to authenticated using (true);
create policy settings_update on public.platform_settings for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------------------------------------------------------------- realtime
alter publication supabase_realtime add table public.messages, public.notifications, public.connections;

-- ---------------------------------------------------------------- storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp']),
  ('post-media', 'post-media', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('company-assets', 'company-assets', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('verification-evidence', 'verification-evidence', false, 10485760,
     array['application/pdf', 'image/png', 'image/jpeg'])
on conflict (id) do nothing;

create policy "avatars own folder write" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars own folder update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars own folder delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "post-media own folder write" on storage.objects for insert to authenticated
  with check (bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text and public.is_member());
create policy "post-media own folder delete" on storage.objects for delete to authenticated
  using (bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "company-assets admin write" on storage.objects for insert to authenticated
  with check (bucket_id = 'company-assets'
    and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    and public.is_startup_admin(((storage.foldername(name))[1])::uuid));
create policy "company-assets admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'company-assets'
    and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    and public.is_startup_admin(((storage.foldername(name))[1])::uuid));

create policy "evidence owner upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'verification-evidence' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "evidence owner or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'verification-evidence'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_super_admin()));
