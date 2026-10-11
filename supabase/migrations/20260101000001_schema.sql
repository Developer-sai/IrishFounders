-- Irish Founders: core schema (enums, tables, indexes)
create extension if not exists citext with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------- enums
create type public.user_role as enum
  ('public_visitor', 'founder', 'investor', 'ecosystem_partner', 'moderator', 'super_admin');
create type public.verification_status as enum
  ('unverified', 'submitted', 'under_review', 'info_required', 'interview_pending',
   'interview_completed', 'approved', 'rejected', 'suspended');
create type public.applicant_type as enum ('founder', 'investor', 'partner');
create type public.startup_stage as enum ('idea', 'prototype', 'mvp', 'early_revenue', 'scaling');
create type public.connection_status as enum ('pending', 'accepted', 'declined', 'blocked');
create type public.post_category as enum
  ('building_in_public', 'product_update', 'startup_milestone', 'ask_community',
   'looking_for_feedback', 'seeking_design_partners', 'collaboration_request',
   'lessons_learned', 'product_launch');
create type public.request_status as enum ('pending', 'accepted', 'declined', 'withdrawn');
create type public.content_status as enum ('published', 'removed');
create type public.report_status as enum ('open', 'dismissed', 'actioned');
create type public.opportunity_status as enum ('pending', 'approved', 'rejected', 'archived');

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email extensions.citext not null unique,
  full_name text not null default '',
  role public.user_role not null default 'public_visitor',
  verification_status public.verification_status not null default 'unverified',
  avatar_url text,
  headline text,
  bio text,
  location text,
  linkedin_url text,
  skills text[] not null default '{}',
  areas_of_expertise text[] not null default '{}',
  hidden_fields text[] not null default '{}',
  suspended_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_bio_len check (bio is null or char_length(bio) <= 2000),
  constraint profiles_headline_len check (headline is null or char_length(headline) <= 160)
);
create index profiles_role_status_idx on public.profiles (role, verification_status);

-- ---------------------------------------------------------------- startups
create table public.startups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  normalized_domain text not null unique,
  website_url text not null,
  linkedin_url text not null,
  normalized_linkedin text not null unique,
  logo_url text,
  industry text not null,
  stage public.startup_stage not null default 'prototype',
  location text,
  founded_year int not null check (founded_year between 1900 and 2100),
  team_size int not null default 1 check (team_size >= 1),
  short_description text not null,
  problem_statement text,
  product_overview text,
  screenshots text[] not null default '{}',
  is_verified boolean not null default false,
  verified_at timestamptz,
  is_demo boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint startups_desc_len check (char_length(short_description) <= 500)
);
create index startups_name_trgm_idx on public.startups using gin (name extensions.gin_trgm_ops);
create index startups_verified_idx on public.startups (is_verified, is_demo, created_at desc);

create table public.startup_members (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role_title text not null default 'Founder',
  is_admin boolean not null default false,
  joined_at timestamptz not null default timezone('utc', now()),
  unique (startup_id, profile_id)
);
create index startup_members_profile_idx on public.startup_members (profile_id);

create table public.startup_claims (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade,
  claimant_id uuid not null references public.profiles (id) on delete cascade,
  message text not null,
  status public.request_status not null default 'pending',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);
create unique index startup_claims_one_pending_idx
  on public.startup_claims (startup_id, claimant_id) where status = 'pending';

-- ---------------------------------------------------------------- applications
create table public.membership_applications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  applicant_type public.applicant_type not null default 'founder',
  status public.verification_status not null default 'submitted',

  -- company snapshot (founders)
  company_name text,
  company_website text,
  normalized_domain text,
  company_linkedin text,
  normalized_linkedin text,
  industry text,
  stage public.startup_stage,
  founded_year int,
  team_size int,
  company_description text,
  founder_role text,
  linkedin_follower_count int check (linkedin_follower_count is null or linkedin_follower_count >= 0),
  sample_post_urls text[] not null default '{}',
  relationship_to_company text,

  -- partner / investor snapshot
  organisation_name text,
  organisation_website text,
  applicant_details jsonb not null default '{}'::jsonb,

  -- admin verification checklist
  check_website boolean not null default false,
  check_followers boolean not null default false,
  check_posts boolean not null default false,
  check_relationship boolean not null default false,

  rejection_reason text,
  info_request text,
  internal_admin_notes text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  submitted_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index membership_applications_status_idx on public.membership_applications (status, submitted_at);
create index membership_applications_domain_idx on public.membership_applications (normalized_domain);
create unique index membership_applications_one_open_idx
  on public.membership_applications (profile_id)
  where status not in ('rejected', 'suspended');

create table public.verification_evidence (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.membership_applications (id) on delete cascade,
  uploaded_by uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  kind text not null default 'supporting_document',
  created_at timestamptz not null default timezone('utc', now())
);

create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.membership_applications (id) on delete cascade,
  interview_type text not null default 'written' check (interview_type in ('written', 'video')),
  status text not null default 'pending' check (status in ('pending', 'scheduled', 'completed')),
  answers jsonb not null default '{}'::jsonb,
  scheduled_at timestamptz,
  meeting_link text,
  interviewer_id uuid references public.profiles (id) on delete set null,
  internal_notes text,
  outcome_recommendation text check (outcome_recommendation in ('approve', 'reject', 'needs_more_info')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.investor_profiles (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  investor_category text not null
    check (investor_category in ('angel', 'vc', 'syndicate', 'family_office', 'institutional')),
  organisation_name text,
  organisation_website text,
  professional_background text not null,
  investment_sectors text[] not null default '{}',
  preferred_stages public.startup_stage[] not null default '{}',
  geographic_preferences text[] not null default '{}',
  public_portfolio_links text[] not null default '{}',
  regulatory_disclaimer_accepted boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------- community
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  startup_id uuid references public.startups (id) on delete set null,
  category public.post_category not null,
  title text,
  content text not null check (char_length(content) between 1 and 5000),
  media_urls text[] not null default '{}',
  external_link text,
  status public.content_status not null default 'published',
  reactions_count int not null default 0,
  comments_count int not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index posts_feed_idx on public.posts (status, created_at desc);
create index posts_author_idx on public.posts (author_id);

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.post_comments (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  status public.content_status not null default 'published',
  created_at timestamptz not null default timezone('utc', now())
);
create index post_comments_post_idx on public.post_comments (post_id, created_at);

create table public.post_reactions (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, user_id)
);

create table public.saved_items (
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_type text not null check (item_type in ('post', 'launch', 'startup', 'opportunity')),
  item_id uuid not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, item_type, item_id)
);

create table public.product_launches (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade,
  founder_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null unique,
  tagline text not null check (char_length(tagline) <= 140),
  description text not null,
  website_url text not null,
  normalized_domain text not null default '',
  logo_url text,
  screenshots text[] not null default '{}',
  category text not null,
  stage public.startup_stage not null,
  launch_date date not null default current_date,
  feedback_requested text,
  votes_count int not null default 0,
  is_featured boolean not null default false,
  status public.content_status not null default 'published',
  is_demo boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (startup_id, name)
);
create index product_launches_recent_idx on public.product_launches (status, created_at desc);

create table public.launch_votes (
  launch_id uuid not null references public.product_launches (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (launch_id, user_id)
);

create table public.product_feedback (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.product_launches (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  status public.content_status not null default 'published',
  created_at timestamptz not null default timezone('utc', now())
);

create table public.design_partner_requests (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade,
  founder_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  product_name text,
  target_user text not null,
  problem_statement text not null,
  feedback_type text not null,
  partners_needed int not null default 3 check (partners_needed between 1 and 50),
  expected_commitment text not null,
  work_mode text not null default 'remote' check (work_mode in ('remote', 'in_person', 'hybrid')),
  deadline date,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.design_partner_applications (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.design_partner_requests (id) on delete cascade,
  applicant_id uuid not null references public.profiles (id) on delete cascade,
  message text not null,
  status public.request_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  unique (request_id, applicant_id)
);

create table public.collaboration_listings (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  startup_id uuid references public.startups (id) on delete set null,
  category text not null check (category in
    ('technical_cofounder', 'business_cofounder', 'product_designer',
     'early_collaborators', 'mentor', 'adviser', 'other')),
  title text not null,
  description text not null,
  skills_needed text[] not null default '{}',
  industry text,
  location text,
  commitment_type text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------- networking
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  status public.connection_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint connections_not_self check (requester_id <> recipient_id)
);
create unique index connections_pair_idx
  on public.connections (least(requester_id, recipient_id), greatest(requester_id, recipient_id));
create index connections_recipient_idx on public.connections (recipient_id, status);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_one uuid not null references public.profiles (id) on delete cascade,
  participant_two uuid not null references public.profiles (id) on delete cascade,
  last_message_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint conversations_ordered check (participant_one < participant_two),
  unique (participant_one, participant_two)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 4000),
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);

create table public.investor_introductions (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references public.profiles (id) on delete cascade,
  founder_id uuid not null references public.profiles (id) on delete cascade,
  startup_id uuid references public.startups (id) on delete set null,
  message text not null,
  status public.request_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (investor_id, founder_id, startup_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);
create index notifications_user_idx on public.notifications (user_id, is_read, created_at desc);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (id) on delete cascade,
  category text not null check (category in
    ('event', 'accelerator', 'incubator', 'grant', 'meetup', 'job', 'hackathon', 'mentorship')),
  title text not null,
  description text not null,
  source_url text not null,
  location text,
  starts_at timestamptz,
  expires_at timestamptz,
  status public.opportunity_status not null default 'pending',
  reviewed_by uuid references public.profiles (id) on delete set null,
  is_demo boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);
create index opportunities_listing_idx on public.opportunities (status, expires_at);

-- ---------------------------------------------------------------- moderation / audit
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in
    ('post', 'comment', 'profile', 'startup', 'launch', 'message', 'conversation')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 3 and 1000),
  status public.report_status not null default 'open',
  resolution_note text,
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (reporter_id, target_type, target_id)
);
create index reports_status_idx on public.reports (status, created_at);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_table text not null,
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);
create index admin_audit_logs_created_idx on public.admin_audit_logs (created_at desc);

create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default timezone('utc', now())
);
insert into public.platform_settings (key, value) values
  ('applications_open', 'true'::jsonb),
  ('min_company_followers', '50'::jsonb),
  ('min_company_posts', '2'::jsonb);
