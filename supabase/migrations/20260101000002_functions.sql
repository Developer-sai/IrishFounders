-- Irish Founders: helpers, triggers and RPCs.
-- All privileged logic is SECURITY DEFINER with a pinned search_path so RLS policies
-- never query `profiles` recursively and clients can never self-elevate.

-- ---------------------------------------------------------------- pure helpers
create or replace function public.normalize_domain(input text)
returns text language plpgsql immutable set search_path = '' as $$
declare v text;
begin
  v := lower(btrim(coalesce(input, '')));
  v := regexp_replace(v, '^[a-z][a-z0-9+.-]*://', '');
  v := split_part(v, '/', 1);
  v := split_part(v, '?', 1);
  v := split_part(v, '#', 1);
  v := regexp_replace(v, '^.*@', '');
  v := regexp_replace(v, ':\d+$', '');
  v := regexp_replace(v, '\.+$', '');
  v := regexp_replace(v, '^www\.', '');
  return nullif(v, '');
end $$;

create or replace function public.normalize_linkedin(input text)
returns text language plpgsql immutable set search_path = '' as $$
declare v text;
begin
  v := lower(btrim(coalesce(input, '')));
  v := regexp_replace(v, '^[a-z][a-z0-9+.-]*://', '');
  v := split_part(split_part(v, '?', 1), '#', 1);
  v := regexp_replace(v, '^([a-z0-9-]+\.)?linkedin\.com', 'linkedin.com');
  v := regexp_replace(v, '/+$', '');
  return nullif(v, '');
end $$;

create or replace function public.slugify(input text)
returns text language sql immutable set search_path = '' as $$
  select coalesce(nullif(trim(both '-' from
    regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g')), ''), 'item');
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end $$;

-- ---------------------------------------------------------------- authorisation helpers
create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin' and suspended_at is null);
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
    where id = auth.uid() and role in ('super_admin', 'moderator') and suspended_at is null);
$$;

create or replace function public.is_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
    where id = auth.uid() and verification_status = 'approved' and suspended_at is null
      and role in ('founder', 'investor', 'ecosystem_partner', 'moderator', 'super_admin'));
$$;

create or replace function public.is_approved_founder()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
    where id = auth.uid() and role = 'founder' and verification_status = 'approved'
      and suspended_at is null);
$$;

create or replace function public.is_approved_investor()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
    where id = auth.uid() and role = 'investor' and verification_status = 'approved'
      and suspended_at is null);
$$;

create or replace function public.is_startup_admin(p_startup uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.startup_members
    where startup_id = p_startup and profile_id = auth.uid() and is_admin)
    or public.is_super_admin();
$$;

create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a));
$$;

create or replace function public.is_conversation_participant(p_conv uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.conversations
    where id = p_conv and auth.uid() in (participant_one, participant_two));
$$;

-- internal: write a notification
create or replace function public.notify(p_user uuid, p_type text, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, type, title, body, link)
  values (p_user, p_type, p_title, p_body, p_link);
$$;

-- internal: write an audit row
create or replace function public.audit(p_action text, p_table text, p_target uuid, p_details jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.admin_audit_logs (admin_id, action, target_table, target_id, details)
  values (auth.uid(), p_action, p_table, p_target, coalesce(p_details, '{}'::jsonb));
$$;

-- ---------------------------------------------------------------- triggers
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.sync_user_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end $$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.sync_user_email();

create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger startups_updated before update on public.startups
  for each row execute function public.set_updated_at();
create trigger applications_updated before update on public.membership_applications
  for each row execute function public.set_updated_at();
create trigger interviews_updated before update on public.interviews
  for each row execute function public.set_updated_at();
create trigger posts_updated before update on public.posts
  for each row execute function public.set_updated_at();
create trigger launches_updated before update on public.product_launches
  for each row execute function public.set_updated_at();
create trigger connections_updated before update on public.connections
  for each row execute function public.set_updated_at();

-- normalise company identifiers at write time (single source of truth)
create or replace function public.startups_normalise()
returns trigger language plpgsql set search_path = public as $$
begin
  new.normalized_domain := public.normalize_domain(new.website_url);
  new.normalized_linkedin := public.normalize_linkedin(new.linkedin_url);
  if new.normalized_domain is null or new.normalized_linkedin is null then
    raise exception 'invalid_company_identifiers' using errcode = '22023';
  end if;
  return new;
end $$;
create trigger startups_normalise before insert or update of website_url, linkedin_url
  on public.startups for each row execute function public.startups_normalise();

create or replace function public.launches_prepare()
returns trigger language plpgsql set search_path = public as $$
begin
  new.normalized_domain := coalesce(public.normalize_domain(new.website_url), '');
  if tg_op = 'INSERT' then
    new.slug := public.slugify(coalesce(nullif(new.slug, ''), new.name));
    if exists (select 1 from public.product_launches where slug = new.slug) then
      new.slug := new.slug || '-' || substr(md5(random()::text), 1, 5);
    end if;
  end if;
  return new;
end $$;
create trigger launches_prepare before insert or update of website_url
  on public.product_launches for each row execute function public.launches_prepare();

-- counters
create or replace function public.bump_post_reactions()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set reactions_count = reactions_count + 1 where id = new.post_id;
  else
    update public.posts set reactions_count = greatest(reactions_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end $$;
create trigger post_reactions_count after insert or delete on public.post_reactions
  for each row execute function public.bump_post_reactions();

create or replace function public.bump_post_comments()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_author uuid;
begin
  if tg_op = 'INSERT' then
    update public.posts set comments_count = comments_count + 1 where id = new.post_id
      returning author_id into v_author;
    if v_author is not null and v_author <> new.author_id then
      perform public.notify(v_author, 'post_comment', 'New comment on your post',
        left(new.content, 140), '/feed');
    end if;
  elsif tg_op = 'DELETE' then
    update public.posts set comments_count = greatest(comments_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end $$;
create trigger post_comments_count after insert or delete on public.post_comments
  for each row execute function public.bump_post_comments();

create or replace function public.bump_launch_votes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.product_launches set votes_count = votes_count + 1 where id = new.launch_id;
  else
    update public.product_launches set votes_count = greatest(votes_count - 1, 0) where id = old.launch_id;
  end if;
  return null;
end $$;
create trigger launch_votes_count after insert or delete on public.launch_votes
  for each row execute function public.bump_launch_votes();

create or replace function public.notify_launch_feedback()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  select founder_id into v_owner from public.product_launches where id = new.launch_id;
  if v_owner is not null and v_owner <> new.author_id then
    perform public.notify(v_owner, 'product_feedback', 'New feedback on your launch',
      left(new.content, 140), '/launches');
  end if;
  return null;
end $$;
create trigger product_feedback_notify after insert on public.product_feedback
  for each row execute function public.notify_launch_feedback();

-- messaging
create or replace function public.on_message_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_other uuid;
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id
    returning case when participant_one = new.sender_id then participant_two else participant_one end
    into v_other;
  if v_other is not null then
    perform public.notify(v_other, 'message', 'New message', left(new.content, 140), '/messages');
  end if;
  return null;
end $$;
create trigger messages_after_insert after insert on public.messages
  for each row execute function public.on_message_insert();

-- ensure a conversation exists for two users (internal)
create or replace function public.ensure_conversation(a uuid, b uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_lo uuid := least(a, b); v_hi uuid := greatest(a, b);
begin
  insert into public.conversations (participant_one, participant_two)
  values (v_lo, v_hi)
  on conflict (participant_one, participant_two) do nothing;
  select id into v_id from public.conversations
    where participant_one = v_lo and participant_two = v_hi;
  return v_id;
end $$;

-- ---------------------------------------------------------------- public read models
create or replace function public.public_stats()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'verified_startups', (select count(*) from public.startups where is_verified and not is_demo),
    'approved_founders', (select count(*) from public.profiles
        where role = 'founder' and verification_status = 'approved' and suspended_at is null and not is_demo),
    'launches', (select count(*) from public.product_launches where status = 'published' and not is_demo)
  );
$$;

create or replace view public.public_founders as
select p.id,
  p.full_name,
  case when 'avatar' = any (p.hidden_fields) then null else p.avatar_url end as avatar_url,
  p.headline,
  case when 'bio' = any (p.hidden_fields) then null else p.bio end as bio,
  case when 'location' = any (p.hidden_fields) then null else p.location end as location,
  case when 'linkedin' = any (p.hidden_fields) then null else p.linkedin_url end as linkedin_url,
  case when 'skills' = any (p.hidden_fields) then '{}'::text[] else p.skills end as skills,
  p.areas_of_expertise,
  p.is_demo,
  p.created_at
from public.profiles p
where p.role = 'founder' and p.verification_status = 'approved' and p.suspended_at is null;

create or replace view public.public_startup_team as
select m.startup_id, m.role_title, m.is_admin, f.id as profile_id, f.full_name, f.avatar_url, f.headline
from public.startup_members m
join public.public_founders f on f.id = m.profile_id
join public.startups s on s.id = m.startup_id and s.is_verified;

-- ---------------------------------------------------------------- application RPCs
create or replace function public.check_company(p_website text, p_linkedin text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_dom text := public.normalize_domain(p_website);
        v_li text := public.normalize_linkedin(p_linkedin);
        v_s record;
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  select id, name, slug into v_s from public.startups
    where normalized_domain = v_dom or (v_li is not null and normalized_linkedin = v_li) limit 1;
  return jsonb_build_object(
    'normalized_domain', v_dom,
    'startup', case when v_s.id is null then null
                    else jsonb_build_object('id', v_s.id, 'name', v_s.name, 'slug', v_s.slug) end,
    'pending_application', exists (select 1 from public.membership_applications
        where normalized_domain = v_dom and status not in ('rejected', 'suspended', 'approved')
          and profile_id <> auth.uid())
  );
end $$;

create or replace function public.submit_application(p jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_type public.applicant_type;
  v_app uuid;
  v_dom text; v_li text;
  v_min_followers int; v_min_posts int;
  v_posts text[];
  v_profile jsonb := coalesce(p -> 'profile', '{}'::jsonb);
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not coalesce((select (value)::text::boolean from public.platform_settings
                   where key = 'applications_open'), true) then
    raise exception 'applications_closed' using errcode = 'P0001';
  end if;
  if (select role from public.profiles where id = v_uid) <> 'public_visitor' then
    raise exception 'already_member' using errcode = 'P0001';
  end if;
  if (select count(*) from public.membership_applications
      where profile_id = v_uid and submitted_at > now() - interval '24 hours') >= 3 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  v_type := (p ->> 'applicant_type')::public.applicant_type;

  update public.profiles set
    full_name = coalesce(nullif(v_profile ->> 'full_name', ''), full_name),
    avatar_url = coalesce(nullif(v_profile ->> 'avatar_url', ''), avatar_url),
    linkedin_url = coalesce(nullif(v_profile ->> 'linkedin_url', ''), linkedin_url),
    location = coalesce(nullif(v_profile ->> 'location', ''), location),
    headline = coalesce(nullif(v_profile ->> 'headline', ''), headline)
  where id = v_uid;

  if v_type = 'founder' then
    v_dom := public.normalize_domain(p ->> 'company_website');
    v_li := public.normalize_linkedin(p ->> 'company_linkedin');
    select (value)::text::int into v_min_followers from public.platform_settings where key = 'min_company_followers';
    select (value)::text::int into v_min_posts from public.platform_settings where key = 'min_company_posts';
    select coalesce(array_agg(x), '{}') into v_posts
      from jsonb_array_elements_text(coalesce(p -> 'sample_post_urls', '[]'::jsonb)) x
      where btrim(x) <> '';
    if coalesce(p ->> 'company_name', '') = '' or v_dom is null then
      raise exception 'invalid_company' using errcode = '22023';
    end if;
    if v_li is null or v_li !~ '^linkedin\.com/company/[^/]+$' then
      raise exception 'invalid_company_linkedin' using errcode = '22023';
    end if;
    if coalesce((p ->> 'linkedin_follower_count')::int, 0) < coalesce(v_min_followers, 50) then
      raise exception 'insufficient_followers' using errcode = 'P0001';
    end if;
    if coalesce(array_length(v_posts, 1), 0) < coalesce(v_min_posts, 2) then
      raise exception 'insufficient_posts' using errcode = 'P0001';
    end if;
    insert into public.membership_applications (
      profile_id, applicant_type, company_name, company_website, normalized_domain,
      company_linkedin, normalized_linkedin, industry, stage, founded_year, team_size,
      company_description, founder_role, linkedin_follower_count, sample_post_urls,
      relationship_to_company)
    values (
      v_uid, v_type, btrim(p ->> 'company_name'), p ->> 'company_website', v_dom,
      p ->> 'company_linkedin', v_li, p ->> 'industry', (p ->> 'stage')::public.startup_stage,
      (p ->> 'founded_year')::int, (p ->> 'team_size')::int, p ->> 'company_description',
      p ->> 'founder_role', (p ->> 'linkedin_follower_count')::int, v_posts,
      p ->> 'relationship_to_company')
    returning id into v_app;
  elsif v_type = 'investor' then
    insert into public.membership_applications (
      profile_id, applicant_type, organisation_name, organisation_website, applicant_details)
    values (v_uid, v_type, p ->> 'organisation_name', p ->> 'organisation_website',
      coalesce(p -> 'investor', '{}'::jsonb))
    returning id into v_app;
    insert into public.investor_profiles (
      profile_id, investor_category, organisation_name, organisation_website,
      professional_background, investment_sectors, preferred_stages,
      geographic_preferences, public_portfolio_links, regulatory_disclaimer_accepted)
    values (
      v_uid, p #>> '{investor,investor_category}', p ->> 'organisation_name',
      p ->> 'organisation_website', p #>> '{investor,professional_background}',
      coalesce(array(select jsonb_array_elements_text(p #> '{investor,investment_sectors}')), '{}'),
      coalesce(array(select jsonb_array_elements_text(p #> '{investor,preferred_stages}')::public.startup_stage), '{}'),
      coalesce(array(select jsonb_array_elements_text(p #> '{investor,geographic_preferences}')), '{}'),
      coalesce(array(select jsonb_array_elements_text(p #> '{investor,public_portfolio_links}')), '{}'),
      coalesce((p #>> '{investor,disclaimer_accepted}')::boolean, false))
    on conflict (profile_id) do update set
      investor_category = excluded.investor_category,
      organisation_name = excluded.organisation_name,
      organisation_website = excluded.organisation_website,
      professional_background = excluded.professional_background,
      investment_sectors = excluded.investment_sectors,
      preferred_stages = excluded.preferred_stages,
      geographic_preferences = excluded.geographic_preferences,
      public_portfolio_links = excluded.public_portfolio_links,
      regulatory_disclaimer_accepted = excluded.regulatory_disclaimer_accepted;
    if not coalesce((p #>> '{investor,disclaimer_accepted}')::boolean, false) then
      raise exception 'disclaimer_required' using errcode = 'P0001';
    end if;
  else
    insert into public.membership_applications (
      profile_id, applicant_type, organisation_name, organisation_website, applicant_details)
    values (v_uid, v_type, p ->> 'organisation_name', p ->> 'organisation_website',
      coalesce(p -> 'partner', '{}'::jsonb))
    returning id into v_app;
  end if;

  insert into public.interviews (application_id, answers, status)
  values (v_app, coalesce(p -> 'interview', '{}'::jsonb), 'completed');

  update public.profiles set verification_status = 'submitted' where id = v_uid;
  return v_app;
end $$;

create or replace function public.respond_to_info_request(p_app uuid, p jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_app public.membership_applications;
begin
  select * into v_app from public.membership_applications
    where id = p_app and profile_id = auth.uid() for update;
  if v_app.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if v_app.status <> 'info_required' then raise exception 'not_awaiting_info' using errcode = 'P0001'; end if;
  update public.membership_applications set
    linkedin_follower_count = coalesce((p ->> 'linkedin_follower_count')::int, linkedin_follower_count),
    sample_post_urls = coalesce(array(select jsonb_array_elements_text(p -> 'sample_post_urls')), sample_post_urls),
    relationship_to_company = coalesce(nullif(p ->> 'relationship_to_company', ''), relationship_to_company),
    status = 'submitted'
  where id = p_app;
  if p ? 'interview' then
    update public.interviews set answers = p -> 'interview' where application_id = p_app;
  end if;
  update public.profiles set verification_status = 'submitted' where id = auth.uid();
end $$;

-- admin: review decisions
create or replace function public.review_application(
  p_app uuid, p_decision text, p_notes text default null,
  p_reason text default null, p_checks jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_app public.membership_applications;
  v_role public.user_role;
  v_status public.verification_status;
  v_existing uuid;
  v_slug text; v_base text; v_startup uuid;
  v_interview_done boolean;
begin
  if not public.is_super_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into v_app from public.membership_applications where id = p_app for update;
  if v_app.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if v_app.profile_id = auth.uid() then raise exception 'cannot_review_own' using errcode = '42501'; end if;

  if p_checks is not null then
    update public.membership_applications set
      check_website = coalesce((p_checks ->> 'website')::boolean, check_website),
      check_followers = coalesce((p_checks ->> 'followers')::boolean, check_followers),
      check_posts = coalesce((p_checks ->> 'posts')::boolean, check_posts),
      check_relationship = coalesce((p_checks ->> 'relationship')::boolean, check_relationship)
    where id = p_app;
    select * into v_app from public.membership_applications where id = p_app;
  end if;
  if p_notes is not null and p_decision <> 'request_info' then
    update public.membership_applications
      set internal_admin_notes = trim(both E'\n' from concat_ws(E'\n',
        internal_admin_notes, to_char(now() at time zone 'utc', 'YYYY-MM-DD HH24:MI') || ' UTC: ' || p_notes))
      where id = p_app;
  end if;

  case p_decision
    when 'save' then
      perform public.audit('application_checks_saved', 'membership_applications', p_app, p_checks);
      return;
    when 'under_review' then v_status := 'under_review';
    when 'interview_pending' then v_status := 'interview_pending';
    when 'interview_completed' then v_status := 'interview_completed';
    when 'request_info' then
      if coalesce(btrim(p_notes), '') = '' then raise exception 'notes_required' using errcode = 'P0001'; end if;
      update public.membership_applications set info_request = p_notes where id = p_app;
      v_status := 'info_required';
    when 'reject' then
      if coalesce(btrim(p_reason), '') = '' then raise exception 'reason_required' using errcode = 'P0001'; end if;
      update public.membership_applications set rejection_reason = p_reason where id = p_app;
      v_status := 'rejected';
    when 'suspend' then v_status := 'suspended';
    when 'approve' then
      select coalesce(bool_or(status = 'completed'), false) into v_interview_done
        from public.interviews where application_id = p_app;
      if not v_interview_done then raise exception 'interview_incomplete' using errcode = 'P0001'; end if;
      if v_app.applicant_type = 'founder' and not
         (v_app.check_website and v_app.check_followers and v_app.check_posts and v_app.check_relationship) then
        raise exception 'checklist_incomplete' using errcode = 'P0001';
      end if;
      v_status := 'approved';
      v_role := (case v_app.applicant_type
        when 'founder' then 'founder' when 'investor' then 'investor' else 'ecosystem_partner' end)::public.user_role;
      update public.profiles set role = v_role, verification_status = 'approved', suspended_at = null
        where id = v_app.profile_id;

      if v_app.applicant_type = 'founder' then
        select id into v_existing from public.startups
          where normalized_domain = v_app.normalized_domain
             or normalized_linkedin = v_app.normalized_linkedin limit 1;
        if v_existing is not null then
          insert into public.startup_claims (startup_id, claimant_id, message)
          values (v_existing, v_app.profile_id,
            'Auto-created: approved founder applied with an existing company domain.')
          on conflict do nothing;
        else
          v_base := public.slugify(v_app.company_name);
          v_slug := v_base;
          while exists (select 1 from public.startups where slug = v_slug) loop
            v_slug := v_base || '-' || substr(md5(random()::text), 1, 4);
          end loop;
          insert into public.startups (
            name, slug, website_url, linkedin_url, industry, stage, founded_year, team_size,
            short_description, is_verified, verified_at, created_by, normalized_domain, normalized_linkedin)
          values (
            v_app.company_name, v_slug, v_app.company_website, v_app.company_linkedin,
            coalesce(v_app.industry, 'Other'), coalesce(v_app.stage, 'prototype'),
            coalesce(v_app.founded_year, extract(year from now())::int), coalesce(v_app.team_size, 1),
            left(coalesce(v_app.company_description, v_app.company_name), 500),
            true, now(), v_app.profile_id, '', '')
          returning id into v_startup;
          insert into public.startup_members (startup_id, profile_id, role_title, is_admin)
          values (v_startup, v_app.profile_id, coalesce(v_app.founder_role, 'Founder'), true);
        end if;
      end if;
    else
      raise exception 'invalid_decision' using errcode = '22023';
  end case;

  update public.membership_applications
    set status = v_status, reviewed_by = auth.uid(), reviewed_at = now() where id = p_app;
  if p_decision <> 'approve' then
    update public.profiles set verification_status = v_status
      where id = v_app.profile_id and role = 'public_visitor';
  end if;

  perform public.audit('application_' || p_decision, 'membership_applications', p_app,
    jsonb_build_object('status', v_status, 'reason', p_reason, 'applicant', v_app.profile_id));
  perform public.notify(v_app.profile_id, 'application_decision',
    'Application update: ' || replace(v_status::text, '_', ' '),
    case when p_decision = 'request_info' then p_notes
         when p_decision = 'reject' then 'Your application was not approved at this time.'
         else null end,
    case when p_decision = 'approve' then '/dashboard' else '/application/status' end);
end $$;

create or replace function public.manage_interview(
  p_app uuid, p_action text, p_scheduled_at timestamptz default null,
  p_meeting_link text default null, p_notes text default null, p_recommendation text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_profile uuid;
begin
  if not public.is_super_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select profile_id into v_profile from public.membership_applications where id = p_app;
  if v_profile is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if p_action = 'schedule' then
    if p_scheduled_at is null then raise exception 'date_required' using errcode = 'P0001'; end if;
    update public.interviews set status = 'scheduled', interview_type = 'video',
      scheduled_at = p_scheduled_at, meeting_link = p_meeting_link, interviewer_id = auth.uid()
      where application_id = p_app;
    update public.membership_applications set status = 'interview_pending' where id = p_app;
    update public.profiles set verification_status = 'interview_pending'
      where id = v_profile and role = 'public_visitor';
    perform public.notify(v_profile, 'interview', 'Interview scheduled',
      to_char(p_scheduled_at at time zone 'utc', 'DD Mon YYYY HH24:MI') || ' UTC', '/application/status');
  elsif p_action = 'complete' then
    update public.interviews set status = 'completed', internal_notes = coalesce(p_notes, internal_notes),
      outcome_recommendation = p_recommendation, interviewer_id = auth.uid()
      where application_id = p_app;
    update public.membership_applications set status = 'interview_completed' where id = p_app;
    update public.profiles set verification_status = 'interview_completed'
      where id = v_profile and role = 'public_visitor';
  elsif p_action = 'notes' then
    update public.interviews set internal_notes = p_notes, outcome_recommendation = p_recommendation
      where application_id = p_app;
  else
    raise exception 'invalid_action' using errcode = '22023';
  end if;
  perform public.audit('interview_' || p_action, 'interviews', p_app, jsonb_build_object('recommendation', p_recommendation));
end $$;

-- ---------------------------------------------------------------- startups
create or replace function public.create_startup(p jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_dom text; v_li text; v_dup record; v_slug text; v_base text; v_id uuid;
begin
  if not public.is_approved_founder() then raise exception 'forbidden' using errcode = '42501'; end if;
  v_dom := public.normalize_domain(p ->> 'website_url');
  v_li := public.normalize_linkedin(p ->> 'linkedin_url');
  if v_li is null or v_li !~ '^linkedin\.com/company/[^/]+$' then
    raise exception 'invalid_company_linkedin' using errcode = '22023';
  end if;
  select id, slug into v_dup from public.startups
    where normalized_domain = v_dom or normalized_linkedin = v_li limit 1;
  if v_dup.id is not null then
    raise exception 'duplicate_company:%', v_dup.slug using errcode = '23505';
  end if;
  v_base := public.slugify(p ->> 'name');
  v_slug := v_base;
  while exists (select 1 from public.startups where slug = v_slug) loop
    v_slug := v_base || '-' || substr(md5(random()::text), 1, 4);
  end loop;
  insert into public.startups (name, slug, website_url, linkedin_url, industry, stage, location,
      founded_year, team_size, short_description, problem_statement, product_overview,
      created_by, normalized_domain, normalized_linkedin)
  values (btrim(p ->> 'name'), v_slug, p ->> 'website_url', p ->> 'linkedin_url', p ->> 'industry',
      (p ->> 'stage')::public.startup_stage, p ->> 'location', (p ->> 'founded_year')::int,
      coalesce((p ->> 'team_size')::int, 1), p ->> 'short_description',
      p ->> 'problem_statement', p ->> 'product_overview', v_uid, '', '')
  returning id into v_id;
  insert into public.startup_members (startup_id, profile_id, role_title, is_admin)
  values (v_id, v_uid, coalesce(p ->> 'role_title', 'Founder'), true);
  return v_slug;
end $$;

create or replace function public.claim_startup(p_startup uuid, p_message text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.is_approved_founder() then raise exception 'forbidden' using errcode = '42501'; end if;
  if exists (select 1 from public.startup_members where startup_id = p_startup and profile_id = auth.uid()) then
    raise exception 'already_member' using errcode = 'P0001';
  end if;
  insert into public.startup_claims (startup_id, claimant_id, message)
  values (p_startup, auth.uid(), p_message) returning id into v_id;
  return v_id;
end $$;

create or replace function public.resolve_claim(p_claim uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_c public.startup_claims;
begin
  if not public.is_super_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into v_c from public.startup_claims where id = p_claim and status = 'pending' for update;
  if v_c.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  update public.startup_claims set status = case when p_approve then 'accepted' else 'declined' end::public.request_status,
    reviewed_by = auth.uid(), reviewed_at = now() where id = p_claim;
  if p_approve then
    insert into public.startup_members (startup_id, profile_id, role_title, is_admin)
    values (v_c.startup_id, v_c.claimant_id, 'Co-founder', false) on conflict do nothing;
  end if;
  perform public.audit(case when p_approve then 'claim_approved' else 'claim_declined' end,
    'startup_claims', p_claim, jsonb_build_object('startup', v_c.startup_id));
  perform public.notify(v_c.claimant_id, 'claim', 'Company claim ' ||
    case when p_approve then 'approved' else 'declined' end, null, '/dashboard/startup');
end $$;

create or replace function public.verify_startup(p_startup uuid, p_verify boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_super_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.startups set is_verified = p_verify,
    verified_at = case when p_verify then now() else null end where id = p_startup;
  perform public.audit(case when p_verify then 'startup_verified' else 'startup_unverified' end,
    'startups', p_startup, '{}'::jsonb);
end $$;

-- ---------------------------------------------------------------- users (admin)
create or replace function public.admin_set_user_status(p_user uuid, p_action text, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_target public.profiles;
begin
  if not public.is_super_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into v_target from public.profiles where id = p_user for update;
  if v_target.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if v_target.id = auth.uid() or v_target.role = 'super_admin' then
    raise exception 'cannot_modify_admin' using errcode = '42501';
  end if;
  if p_action = 'suspend' then
    if coalesce(btrim(p_reason), '') = '' then raise exception 'reason_required' using errcode = 'P0001'; end if;
    update public.profiles set suspended_at = now(), verification_status = 'suspended' where id = p_user;
  elsif p_action = 'restore' then
    update public.profiles set suspended_at = null,
      verification_status = (case when role = 'public_visitor' then 'unverified' else 'approved' end)::public.verification_status
      where id = p_user;
  elsif p_action = 'revoke_verification' then
    if coalesce(btrim(p_reason), '') = '' then raise exception 'reason_required' using errcode = 'P0001'; end if;
    update public.profiles set role = 'public_visitor', verification_status = 'unverified' where id = p_user;
  elsif p_action in ('make_moderator', 'remove_moderator') then
    update public.profiles set role = case when p_action = 'make_moderator' then 'moderator'
      else 'founder' end::public.user_role where id = p_user and verification_status = 'approved';
  else
    raise exception 'invalid_action' using errcode = '22023';
  end if;
  perform public.audit('user_' || p_action, 'profiles', p_user, jsonb_build_object('reason', p_reason));
  perform public.notify(p_user, 'account', 'Account update', p_reason, '/application/status');
end $$;

-- ---------------------------------------------------------------- networking
create or replace function public.request_connection(p_recipient uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_me uuid := auth.uid(); v_name text;
begin
  if not public.is_member() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_recipient = v_me then raise exception 'cannot_connect_self' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.profiles where id = p_recipient
      and verification_status = 'approved' and suspended_at is null) then
    raise exception 'recipient_unavailable' using errcode = 'P0001';
  end if;
  if public.is_blocked_between(v_me, p_recipient) then
    raise exception 'blocked' using errcode = '42501';
  end if;
  if exists (select 1 from public.connections
      where least(requester_id, recipient_id) = least(v_me, p_recipient)
        and greatest(requester_id, recipient_id) = greatest(v_me, p_recipient)) then
    raise exception 'connection_exists' using errcode = '23505';
  end if;
  insert into public.connections (requester_id, recipient_id) values (v_me, p_recipient) returning id into v_id;
  select full_name into v_name from public.profiles where id = v_me;
  perform public.notify(p_recipient, 'connection_request', v_name || ' wants to connect', null, '/dashboard');
  return v_id;
end $$;

create or replace function public.respond_connection(p_id uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_c public.connections; v_name text;
begin
  select * into v_c from public.connections
    where id = p_id and recipient_id = auth.uid() and status = 'pending' for update;
  if v_c.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  update public.connections set status = case when p_accept then 'accepted' else 'declined' end::public.connection_status
    where id = p_id;
  if p_accept then
    perform public.ensure_conversation(v_c.requester_id, v_c.recipient_id);
    select full_name into v_name from public.profiles where id = v_c.recipient_id;
    perform public.notify(v_c.requester_id, 'connection_accepted', v_name || ' accepted your request', null, '/messages');
  end if;
end $$;

create or replace function public.block_user(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_member() or p_user = auth.uid() then raise exception 'forbidden' using errcode = '42501'; end if;
  insert into public.blocks (blocker_id, blocked_id) values (auth.uid(), p_user) on conflict do nothing;
  update public.connections set status = 'blocked'
    where least(requester_id, recipient_id) = least(auth.uid(), p_user)
      and greatest(requester_id, recipient_id) = greatest(auth.uid(), p_user);
end $$;

create or replace function public.mark_conversation_read(p_conv uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_conversation_participant(p_conv) then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.messages set is_read = true
    where conversation_id = p_conv and sender_id <> auth.uid() and not is_read;
end $$;

create or replace function public.can_message(p_conv uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversations c
    where c.id = p_conv and auth.uid() in (c.participant_one, c.participant_two)
      and not public.is_blocked_between(c.participant_one, c.participant_two)
      and exists (select 1 from public.connections k
        where least(k.requester_id, k.recipient_id) = c.participant_one
          and greatest(k.requester_id, k.recipient_id) = c.participant_two
          and k.status = 'accepted'));
$$;

create or replace function public.request_introduction(p_founder uuid, p_startup uuid, p_message text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_name text;
begin
  if not public.is_approved_investor() then raise exception 'forbidden' using errcode = '42501'; end if;
  if not exists (select 1 from public.startup_members m join public.startups s on s.id = m.startup_id
      where m.profile_id = p_founder and s.id = p_startup and s.is_verified) then
    raise exception 'invalid_target' using errcode = 'P0001';
  end if;
  insert into public.investor_introductions (investor_id, founder_id, startup_id, message)
  values (auth.uid(), p_founder, p_startup, p_message) returning id into v_id;
  select full_name into v_name from public.profiles where id = auth.uid();
  perform public.notify(p_founder, 'introduction_request', v_name || ' requested an introduction', left(p_message, 140), '/dashboard');
  return v_id;
end $$;

create or replace function public.respond_introduction(p_id uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_i public.investor_introductions;
begin
  select * into v_i from public.investor_introductions
    where id = p_id and founder_id = auth.uid() and status = 'pending' for update;
  if v_i.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  update public.investor_introductions set status = case when p_accept then 'accepted' else 'declined' end::public.request_status
    where id = p_id;
  if p_accept then
    insert into public.connections (requester_id, recipient_id, status)
    values (v_i.investor_id, v_i.founder_id, 'accepted') on conflict do nothing;
    perform public.ensure_conversation(v_i.investor_id, v_i.founder_id);
  end if;
  perform public.notify(v_i.investor_id, 'introduction_response',
    'Introduction ' || case when p_accept then 'accepted' else 'declined' end, null, '/investor/introductions');
end $$;

create or replace function public.respond_design_partner(p_id uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_a public.design_partner_applications; v_founder uuid;
begin
  select a.* into v_a from public.design_partner_applications a
    join public.design_partner_requests r on r.id = a.request_id
    where a.id = p_id and r.founder_id = auth.uid() and a.status = 'pending' for update of a;
  if v_a.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  update public.design_partner_applications set status = case when p_accept then 'accepted' else 'declined' end::public.request_status
    where id = p_id;
  if p_accept then
    v_founder := auth.uid();
    insert into public.connections (requester_id, recipient_id, status)
    values (v_founder, v_a.applicant_id, 'accepted') on conflict do nothing;
    perform public.ensure_conversation(v_founder, v_a.applicant_id);
  end if;
  perform public.notify(v_a.applicant_id, 'design_partner', 'Design partner request ' ||
    case when p_accept then 'accepted' else 'declined' end, null, '/design-partners');
end $$;

-- ---------------------------------------------------------------- moderation
create or replace function public.moderate_report(p_report uuid, p_action text, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_r public.reports; v_owner uuid;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into v_r from public.reports where id = p_report and status = 'open' for update;
  if v_r.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if p_action = 'remove_content' then
    if v_r.target_type = 'post' then
      update public.posts set status = 'removed' where id = v_r.target_id returning author_id into v_owner;
    elsif v_r.target_type = 'comment' then
      update public.post_comments set status = 'removed' where id = v_r.target_id returning author_id into v_owner;
    elsif v_r.target_type = 'launch' then
      update public.product_launches set status = 'removed' where id = v_r.target_id returning founder_id into v_owner;
    end if;
    update public.reports set status = 'actioned' where id = p_report;
  elsif p_action = 'dismiss' then
    update public.reports set status = 'dismissed' where id = p_report;
  else
    raise exception 'invalid_action' using errcode = '22023';
  end if;
  update public.reports set resolved_by = auth.uid(), resolved_at = now(), resolution_note = p_note
    where id = p_report;
  perform public.audit('report_' || p_action, 'reports', p_report,
    jsonb_build_object('target_type', v_r.target_type, 'target_id', v_r.target_id, 'note', p_note));
  if v_owner is not null then
    perform public.notify(v_owner, 'moderation', 'Your content was removed',
      coalesce(p_note, 'It did not meet our community guidelines. You may appeal by contacting support.'), '/feed');
  end if;
end $$;

create or replace function public.review_opportunity(p_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.opportunities set status = case when p_approve then 'approved' else 'rejected' end::public.opportunity_status,
    reviewed_by = auth.uid() where id = p_id;
  perform public.audit(case when p_approve then 'opportunity_approved' else 'opportunity_rejected' end,
    'opportunities', p_id, '{}'::jsonb);
end $$;

create or replace function public.archive_expired_opportunities()
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.opportunities set status = 'archived'
    where status = 'approved' and expires_at is not null and expires_at < now();
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.admin_overview()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return jsonb_build_object(
    'accounts', (select count(*) from public.profiles),
    'pending_applications', (select count(*) from public.membership_applications
        where status in ('submitted', 'under_review', 'info_required', 'interview_pending', 'interview_completed')),
    'approved_founders', (select count(*) from public.profiles where role = 'founder' and verification_status = 'approved'),
    'verified_startups', (select count(*) from public.startups where is_verified),
    'approved_investors', (select count(*) from public.profiles where role = 'investor' and verification_status = 'approved'),
    'pending_interviews', (select count(*) from public.interviews where status in ('pending', 'scheduled')),
    'open_reports', (select count(*) from public.reports where status = 'open'),
    'active_members', (select count(*) from public.profiles where verification_status = 'approved' and suspended_at is null),
    'recent_launches', (select count(*) from public.product_launches where created_at > now() - interval '30 days'),
    'pending_claims', (select count(*) from public.startup_claims where status = 'pending'),
    'pending_opportunities', (select count(*) from public.opportunities where status = 'pending')
  );
end $$;

-- ---------------------------------------------------------------- privileges
-- Lock every function down, then grant back only what clients may call.
revoke execute on all functions in schema public from public, anon, authenticated;

-- used inside RLS policies (evaluated as the calling role)
grant execute on function
  public.is_super_admin(), public.is_admin(), public.is_member(), public.is_approved_founder(),
  public.is_approved_investor(), public.is_startup_admin(uuid), public.is_blocked_between(uuid, uuid),
  public.is_conversation_participant(uuid), public.can_message(uuid),
  public.normalize_domain(text), public.normalize_linkedin(text), public.slugify(text)
  to anon, authenticated;

grant execute on function public.public_stats() to anon, authenticated;

grant execute on function
  public.check_company(text, text), public.submit_application(jsonb),
  public.respond_to_info_request(uuid, jsonb), public.review_application(uuid, text, text, text, jsonb),
  public.manage_interview(uuid, text, timestamptz, text, text, text),
  public.create_startup(jsonb), public.claim_startup(uuid, text), public.resolve_claim(uuid, boolean),
  public.verify_startup(uuid, boolean), public.admin_set_user_status(uuid, text, text),
  public.request_connection(uuid), public.respond_connection(uuid, boolean), public.block_user(uuid),
  public.mark_conversation_read(uuid), public.request_introduction(uuid, uuid, text),
  public.respond_introduction(uuid, boolean), public.respond_design_partner(uuid, boolean),
  public.moderate_report(uuid, text, text), public.review_opportunity(uuid, boolean),
  public.admin_overview()
  to authenticated;
