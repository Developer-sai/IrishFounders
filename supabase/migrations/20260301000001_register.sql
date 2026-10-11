-- Irish Founders v3: the public register (verified + in-review companies on the landing page).
-- Only whitelisted columns are exposed; applicants can opt out and admins can hide a name.

alter table public.membership_applications
  add column company_city text,
  add column show_publicly boolean not null default true,
  add column hidden_by_admin boolean not null default false,
  add constraint applications_company_name_len
    check (company_name is null or char_length(company_name) between 2 and 80),
  add constraint applications_company_city_len
    check (company_city is null or char_length(company_city) <= 60);

create index membership_applications_public_idx
  on public.membership_applications (status, submitted_at desc)
  where show_publicly and not hidden_by_admin;

-- submit_application now also stores the company city and the public-register preference
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
      relationship_to_company, company_city, show_publicly)
    values (
      v_uid, v_type, btrim(p ->> 'company_name'), p ->> 'company_website', v_dom,
      p ->> 'company_linkedin', v_li, p ->> 'industry', (p ->> 'stage')::public.startup_stage,
      (p ->> 'founded_year')::int, (p ->> 'team_size')::int, p ->> 'company_description',
      p ->> 'founder_role', (p ->> 'linkedin_follower_count')::int, v_posts,
      p ->> 'relationship_to_company', nullif(btrim(p ->> 'company_city'), ''),
      coalesce((p ->> 'show_publicly')::boolean, true))
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

-- ---------------------------------------------------------------- public register
create or replace function public.public_register(p_limit int default 120)
returns table (kind text, name text, slug text, industry text, stage text, city text,
  logo_url text, sort_at timestamptz)
language sql stable security definer set search_path = public as $$
  select r.* from (
    select 'verified'::text as kind, s.name, s.slug, s.industry, s.stage::text as stage,
      s.location as city, s.logo_url, coalesce(s.verified_at, s.created_at) as sort_at
    from public.startups s
    where s.is_verified and not s.is_demo
    union all
    select 'pending'::text, a.company_name, null::text, a.industry, a.stage::text,
      a.company_city, null::text, a.submitted_at
    from public.membership_applications a
    join public.profiles pr on pr.id = a.profile_id and not pr.is_demo and pr.suspended_at is null
    where a.applicant_type = 'founder' and a.show_publicly and not a.hidden_by_admin
      and a.status in ('submitted', 'under_review', 'info_required', 'interview_pending', 'interview_completed')
      and a.company_name is not null
      and not exists (select 1 from public.startups s2
        where s2.normalized_domain = a.normalized_domain and s2.is_verified)
  ) r
  order by (r.kind = 'verified') desc, r.sort_at desc
  limit least(greatest(p_limit, 1), 300);
$$;

create or replace function public.public_register_counts()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'verified', (select count(*) from public.startups where is_verified and not is_demo),
    'pending', (select count(*) from public.membership_applications a
      join public.profiles pr on pr.id = a.profile_id and not pr.is_demo and pr.suspended_at is null
      where a.applicant_type = 'founder' and a.show_publicly and not a.hidden_by_admin
        and a.status in ('submitted', 'under_review', 'info_required', 'interview_pending', 'interview_completed')
        and a.company_name is not null
        and not exists (select 1 from public.startups s2
          where s2.normalized_domain = a.normalized_domain and s2.is_verified)),
    'launches', (select count(*) from public.product_launches where status = 'published' and not is_demo)
  );
$$;

-- applicants control whether their company is shown while in review
create or replace function public.set_my_company_visibility(p_visible boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  update public.membership_applications set show_publicly = p_visible
    where profile_id = auth.uid() and status not in ('rejected', 'suspended', 'approved');
end $$;

-- admins can hide an abusive or mistaken name from the public register
create or replace function public.set_application_visibility(p_app uuid, p_hidden boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_super_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.membership_applications set hidden_by_admin = p_hidden where id = p_app;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  perform public.audit(case when p_hidden then 'register_hidden' else 'register_unhidden' end,
    'membership_applications', p_app, '{}'::jsonb);
end $$;

revoke execute on function public.public_register(int), public.public_register_counts(),
  public.set_my_company_visibility(boolean), public.set_application_visibility(uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.public_register(int), public.public_register_counts() to anon, authenticated;
grant execute on function public.set_my_company_visibility(boolean), public.set_application_visibility(uuid, boolean)
  to authenticated;
