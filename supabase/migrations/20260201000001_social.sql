-- Irish Founders v2: the social layer (profiles, follows, stories, milestones,
-- explainable matching, launch ranking, search, mentions).
-- Same rules as v1: RLS on every table, column-level grants, trust-bearing writes via RPC.

-- ---------------------------------------------------------------- profile identity
alter table public.profiles
  add column handle extensions.citext unique,
  add column cover_url text,
  add column open_to text[] not null default '{}',
  add column offering text[] not null default '{}';

alter table public.profiles
  add constraint profiles_handle_format
    check (handle is null or (handle::text ~ '^[A-Za-z0-9_]{3,30}$'
      and lower(handle::text) not in ('admin', 'support', 'irishfounders', 'founders', 'me', 'api', 'settings'))),
  add constraint profiles_open_to_values
    check (open_to <@ array['cofounder', 'mentor', 'hiring', 'investors', 'design_partners', 'collaborators']::text[]),
  add constraint profiles_offering_values
    check (offering <@ array['cofounder', 'mentor', 'talent', 'investment', 'feedback', 'collaboration']::text[]);

create index profiles_name_trgm_idx on public.profiles using gin (full_name extensions.gin_trgm_ops);

grant select (handle, cover_url, open_to, offering) on public.profiles to authenticated;
grant update (handle, cover_url, open_to, offering) on public.profiles to authenticated;

-- public read model gains the new columns (appended: existing columns keep their positions)
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
  p.created_at,
  p.handle::text as handle,
  p.cover_url,
  p.open_to,
  p.offering
from public.profiles p
where p.role = 'founder' and p.verification_status = 'approved' and p.suspended_at is null;

-- ---------------------------------------------------------------- follows
create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followed_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (follower_id, followed_id),
  constraint follows_not_self check (follower_id <> followed_id)
);
create index follows_followed_idx on public.follows (followed_id);

create table public.startup_follows (
  user_id uuid not null references public.profiles (id) on delete cascade,
  startup_id uuid not null references public.startups (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, startup_id)
);

-- ---------------------------------------------------------------- stories (24h updates)
create table public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  startup_id uuid references public.startups (id) on delete set null,
  kind text not null default 'update' check (kind in ('update', 'milestone', 'hiring', 'looking_for', 'launch')),
  text text check (text is null or char_length(text) <= 280),
  media_url text,
  expires_at timestamptz not null default timezone('utc', now()) + interval '24 hours',
  created_at timestamptz not null default timezone('utc', now()),
  constraint stories_has_content check (text is not null or media_url is not null)
);
create index stories_active_idx on public.stories (author_id, expires_at);
create index stories_expiry_idx on public.stories (expires_at);

create table public.story_views (
  story_id uuid not null references public.stories (id) on delete cascade,
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  viewed_at timestamptz not null default timezone('utc', now()),
  primary key (story_id, viewer_id)
);

-- ---------------------------------------------------------------- milestones, passes
create table public.startup_milestones (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 140),
  occurred_on date not null default current_date,
  kind text not null default 'milestone' check (kind in ('milestone', 'launch', 'funding', 'hire', 'award', 'other')),
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);
create index startup_milestones_startup_idx on public.startup_milestones (startup_id, occurred_on desc);

create table public.discover_passes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  target_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, target_id),
  constraint passes_not_self check (user_id <> target_id)
);

-- posts: at most four images
alter table public.posts add constraint posts_media_max check (cardinality(media_urls) <= 4);

-- ---------------------------------------------------------------- RLS + grants for new tables
revoke all on public.follows, public.startup_follows, public.stories, public.story_views,
  public.startup_milestones, public.discover_passes from anon, authenticated;

alter table public.follows enable row level security;
alter table public.startup_follows enable row level security;
alter table public.stories enable row level security;
alter table public.story_views enable row level security;
alter table public.startup_milestones enable row level security;
alter table public.discover_passes enable row level security;

-- follows: members read the graph; following goes through follow_user (blocked-aware)
grant select, delete on public.follows to authenticated;
create policy follows_select on public.follows for select to authenticated using (public.is_member());
create policy follows_delete on public.follows for delete to authenticated using (follower_id = auth.uid());

grant select, insert, delete on public.startup_follows to authenticated;
create policy startup_follows_select on public.startup_follows for select to authenticated using (user_id = auth.uid());
create policy startup_follows_insert on public.startup_follows for insert to authenticated
  with check (user_id = auth.uid() and public.is_member());
create policy startup_follows_delete on public.startup_follows for delete to authenticated using (user_id = auth.uid());

-- stories: approved members only, only while active, never from someone who blocked you / you blocked
grant select, delete on public.stories to authenticated;
create policy stories_select on public.stories for select to authenticated using (
  public.is_admin()
  or author_id = auth.uid()
  or (public.is_member() and expires_at > now() and not public.is_blocked_between(author_id, auth.uid()))
);
create policy stories_delete on public.stories for delete to authenticated using (author_id = auth.uid() or public.is_admin());

grant select, insert (story_id, viewer_id) on public.story_views to authenticated;
create policy story_views_select on public.story_views for select to authenticated using (
  viewer_id = auth.uid()
  or exists (select 1 from public.stories s where s.id = story_id and s.author_id = auth.uid())
);
create policy story_views_insert on public.story_views for insert to authenticated with check (
  viewer_id = auth.uid() and public.is_member()
  and exists (select 1 from public.stories s where s.id = story_id)
);

-- milestones: public for verified startups, written by company admins
grant select on public.startup_milestones to anon, authenticated;
grant insert (startup_id, title, occurred_on, kind, created_by), delete on public.startup_milestones to authenticated;
create policy milestones_select on public.startup_milestones for select to anon, authenticated using (
  exists (select 1 from public.startups s where s.id = startup_id)
);
create policy milestones_insert on public.startup_milestones for insert to authenticated with check (
  created_by = auth.uid() and public.is_startup_admin(startup_id)
);
create policy milestones_delete on public.startup_milestones for delete to authenticated using (public.is_startup_admin(startup_id));

grant select, insert, delete on public.discover_passes to authenticated;
create policy passes_select on public.discover_passes for select to authenticated using (user_id = auth.uid());
create policy passes_insert on public.discover_passes for insert to authenticated
  with check (user_id = auth.uid() and public.is_member());
create policy passes_delete on public.discover_passes for delete to authenticated using (user_id = auth.uid());

-- story media bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('story-media', 'story-media', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;
create policy "story-media own folder write" on storage.objects for insert to authenticated
  with check (bucket_id = 'story-media' and (storage.foldername(name))[1] = auth.uid()::text and public.is_member());
create policy "story-media own folder delete" on storage.objects for delete to authenticated
  using (bucket_id = 'story-media' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------- mentions (@handle)
create or replace function public.notify_mentions(p_content text, p_author uuid, p_link text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, type, title, body, link)
  select distinct p.id, 'mention',
    coalesce((select full_name from public.profiles where id = p_author), 'Someone') || ' mentioned you',
    left(p_content, 140), p_link
  from regexp_matches(p_content, '@([A-Za-z0-9_]{3,30})', 'g') as m(g)
  join public.profiles p on p.handle = m.g[1]::extensions.citext
  where p.id <> p_author
    and p.verification_status = 'approved' and p.suspended_at is null
    and not public.is_blocked_between(p.id, p_author);
$$;

create or replace function public.posts_notify_mentions()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_mentions(new.content, new.author_id, '/feed');
  return null;
end $$;
create trigger posts_mentions after insert on public.posts
  for each row execute function public.posts_notify_mentions();

create or replace function public.comments_notify_mentions()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_mentions(new.content, new.author_id, '/feed');
  return null;
end $$;
create trigger comments_mentions after insert on public.post_comments
  for each row execute function public.comments_notify_mentions();

-- ---------------------------------------------------------------- follow / story RPCs
create or replace function public.follow_user(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_name text;
begin
  if not public.is_member() or p_user = v_me then raise exception 'forbidden' using errcode = '42501'; end if;
  if not exists (select 1 from public.profiles where id = p_user
      and verification_status = 'approved' and suspended_at is null) then
    raise exception 'recipient_unavailable' using errcode = 'P0001';
  end if;
  if public.is_blocked_between(v_me, p_user) then raise exception 'blocked' using errcode = '42501'; end if;
  insert into public.follows (follower_id, followed_id) values (v_me, p_user) on conflict do nothing;
  if found then
    select full_name into v_name from public.profiles where id = v_me;
    perform public.notify(p_user, 'follow', v_name || ' started following you', null, '/feed');
  end if;
end $$;

create or replace function public.create_story(p_text text, p_media_url text, p_kind text, p_startup uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.is_member() then raise exception 'forbidden' using errcode = '42501'; end if;
  if coalesce(btrim(p_text), '') = '' and coalesce(p_media_url, '') = '' then
    raise exception 'story_empty' using errcode = '22023';
  end if;
  if p_media_url is not null and p_media_url !~ ('/storage/v1/object/public/story-media/' || auth.uid()::text || '/') then
    raise exception 'invalid_media' using errcode = '22023';
  end if;
  if p_startup is not null and not public.is_startup_member(p_startup) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if (select count(*) from public.stories where author_id = auth.uid()
      and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'story_limit' using errcode = 'P0001';
  end if;
  insert into public.stories (author_id, startup_id, kind, text, media_url)
  values (auth.uid(), p_startup, p_kind, nullif(btrim(p_text), ''), nullif(p_media_url, ''))
  returning id into v_id;
  return v_id;
end $$;

-- the tray: everyone with an active story, you first, then people you follow, unseen first
create or replace function public.story_tray()
returns table (author_id uuid, full_name text, avatar_url text, handle text,
  story_count int, unseen_count int, latest_at timestamptz, is_followed boolean)
language sql stable set search_path = public as $$
  select t.* from (
    select s.author_id, p.full_name, p.avatar_url, p.handle::text,
      count(*)::int as story_count,
      (count(*) filter (where v.story_id is null))::int as unseen_count,
      max(s.created_at) as latest_at,
      exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.followed_id = s.author_id) as is_followed
    from public.stories s
    join public.profiles p on p.id = s.author_id
    left join public.story_views v on v.story_id = s.id and v.viewer_id = auth.uid()
    where s.expires_at > now()
    group by s.author_id, p.full_name, p.avatar_url, p.handle
  ) t
  order by (t.author_id = auth.uid()) desc, t.is_followed desc, (t.unseen_count > 0) desc, t.latest_at desc
  limit 30;
$$;

-- ---------------------------------------------------------------- explainable matching
create or replace function public.match_score(a uuid, b uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  pa public.profiles; pb public.profiles;
  score int := 0; reasons text[] := array[]::text[];
  pairs text[][] := array[['cofounder', 'cofounder'], ['mentor', 'mentor'], ['hiring', 'talent'],
    ['investors', 'investment'], ['design_partners', 'feedback'], ['collaborators', 'collaboration']];
  label text; shared_skills text[]; ind text;
begin
  select * into pa from public.profiles where id = a;
  select * into pb from public.profiles where id = b;
  if pa.id is null or pb.id is null then return jsonb_build_object('score', 0, 'reasons', '[]'::jsonb); end if;

  for i in 1 .. array_length(pairs, 1) loop
    label := replace(pairs[i][1], '_', ' ');
    if pairs[i][1] = any (pa.open_to) and pairs[i][2] = any (pb.offering) then
      score := score + 30; reasons := reasons || ('You want ' || label || ' · they offer it');
    end if;
    if pairs[i][1] = any (pb.open_to) and pairs[i][2] = any (pa.offering) then
      score := score + 20; reasons := reasons || ('They want ' || label || ' · you offer it');
    end if;
  end loop;

  select string_agg(distinct x, ', ') into ind from (
    select sa.industry as x from public.startup_members ma
      join public.startups sa on sa.id = ma.startup_id
      join public.startup_members mb on mb.profile_id = b
      join public.startups sb on sb.id = mb.startup_id
    where ma.profile_id = a and lower(sa.industry) = lower(sb.industry)) q;
  if ind is not null then score := score + 15; reasons := reasons || ('Both in ' || ind); end if;

  select array(select lower(s) from unnest(pa.skills) s intersect select lower(s) from unnest(pb.skills) s limit 3)
    into shared_skills;
  if coalesce(array_length(shared_skills, 1), 0) > 0 then
    score := score + least(array_length(shared_skills, 1) * 5, 15);
    reasons := reasons || ('Shared skills: ' || array_to_string(shared_skills, ', '));
  end if;

  if pa.location is not null and pb.location is not null and lower(pa.location) = lower(pb.location) then
    score := score + 10; reasons := reasons || ('Both in ' || pb.location);
  end if;

  return jsonb_build_object('score', score, 'reasons', to_jsonb(reasons));
end $$;

create or replace function public.suggested_matches(p_limit int default 12, p_open_to text default null, p_industry text default null)
returns table (profile_id uuid, full_name text, headline text, avatar_url text, cover_url text, handle text,
  location text, open_to text[], offering text[], score int, reasons text[], mutual int)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_member() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  with my_conn as (
    select case when c.requester_id = auth.uid() then c.recipient_id else c.requester_id end as other
    from public.connections c where c.status = 'accepted' and auth.uid() in (c.requester_id, c.recipient_id)
  )
  select f.id, f.full_name, f.headline, f.avatar_url, f.cover_url, f.handle, f.location, f.open_to, f.offering,
    (m.j ->> 'score')::int,
    array(select jsonb_array_elements_text(m.j -> 'reasons')),
    (select count(*)::int from public.connections c
      where c.status = 'accepted'
        and ((c.requester_id = f.id and c.recipient_id in (select other from my_conn))
          or (c.recipient_id = f.id and c.requester_id in (select other from my_conn))))
  from public.public_founders f
  cross join lateral (select public.match_score(auth.uid(), f.id) as j) m
  where f.id <> auth.uid()
    and not f.is_demo
    and not public.is_blocked_between(f.id, auth.uid())
    and not exists (select 1 from public.connections c
      where least(c.requester_id, c.recipient_id) = least(auth.uid(), f.id)
        and greatest(c.requester_id, c.recipient_id) = greatest(auth.uid(), f.id))
    and not exists (select 1 from public.discover_passes d where d.user_id = auth.uid() and d.target_id = f.id)
    and (p_open_to is null or p_open_to = any (f.open_to))
    and (p_industry is null or exists (
      select 1 from public.startup_members sm join public.startups s on s.id = sm.startup_id
      where sm.profile_id = f.id and s.industry ilike p_industry))
  order by (m.j ->> 'score')::int desc, f.created_at desc
  limit least(greatest(p_limit, 1), 50);
end $$;

create or replace function public.mutual_connections(p_user uuid)
returns table (id uuid, full_name text, avatar_url text)
language sql stable security definer set search_path = public as $$
  with mine as (
    select case when requester_id = auth.uid() then recipient_id else requester_id end as other
    from public.connections where status = 'accepted' and auth.uid() in (requester_id, recipient_id)),
  theirs as (
    select case when requester_id = p_user then recipient_id else requester_id end as other
    from public.connections where status = 'accepted' and p_user in (requester_id, recipient_id))
  select p.id, p.full_name, p.avatar_url
  from public.profiles p
  where public.is_member() and p.id in (select other from mine intersect select other from theirs)
  limit 8;
$$;

-- ---------------------------------------------------------------- launch board
create or replace function public.launch_board(p_range text default 'today')
returns table (id uuid, name text, slug text, tagline text, category text, stage public.startup_stage,
  votes_count int, website_url text, founder_id uuid, startup_name text, startup_slug text,
  created_at timestamptz, rank_score numeric, is_launch_of_day boolean)
language sql stable set search_path = public as $$
  select * from (
    select l.id, l.name, l.slug, l.tagline, l.category, l.stage, l.votes_count, l.website_url, l.founder_id,
      s.name as startup_name, s.slug as startup_slug, l.created_at,
      round((l.votes_count + 1) / power(extract(epoch from (now() - l.created_at)) / 3600.0 + 2, 1.5), 4) as rank_score,
      (l.created_at > now() - interval '24 hours'
        and row_number() over (partition by (l.created_at > now() - interval '24 hours')
          order by (l.votes_count + 1) / power(extract(epoch from (now() - l.created_at)) / 3600.0 + 2, 1.5) desc) = 1) as is_launch_of_day
    from public.product_launches l
    join public.startups s on s.id = l.startup_id
    where l.status = 'published' and not l.is_demo
      and case p_range
        when 'today' then l.created_at > now() - interval '24 hours'
        when 'week' then l.created_at > now() - interval '7 days'
        else true end
  ) t
  order by t.rank_score desc, t.created_at desc
  limit 60;
$$;

-- ---------------------------------------------------------------- global search
create or replace function public.search_all(q text)
returns table (kind text, id uuid, title text, subtitle text, href text)
language plpgsql stable set search_path = public as $$
declare pat text;
begin
  if char_length(btrim(coalesce(q, ''))) < 2 then return; end if;
  pat := '%' || replace(replace(replace(btrim(q), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  return query
    (select 'founder'::text, f.id, f.full_name, f.headline, '/founders/' || f.id::text
       from public.public_founders f
       where public.is_member() and not f.is_demo
         and (f.full_name ilike pat or f.handle ilike pat or f.headline ilike pat) limit 5)
    union all
    (select 'startup'::text, s.id, s.name, s.industry, '/startups/' || s.slug
       from public.startups s where s.is_verified and not s.is_demo
         and (s.name ilike pat or s.short_description ilike pat) limit 5)
    union all
    (select 'launch'::text, l.id, l.name, l.tagline, '/launches'
       from public.product_launches l where l.status = 'published' and not l.is_demo
         and (l.name ilike pat or l.tagline ilike pat) limit 5);
end $$;

-- ---------------------------------------------------------------- privileges
revoke execute on function public.notify_mentions(text, uuid, text), public.match_score(uuid, uuid),
  public.posts_notify_mentions(), public.comments_notify_mentions()
  from public, anon, authenticated;

revoke execute on function public.follow_user(uuid), public.create_story(text, text, text, uuid),
  public.story_tray(), public.suggested_matches(int, text, text), public.mutual_connections(uuid),
  public.launch_board(text), public.search_all(text) from public, anon, authenticated;

grant execute on function public.follow_user(uuid), public.create_story(text, text, text, uuid),
  public.story_tray(), public.suggested_matches(int, text, text), public.mutual_connections(uuid),
  public.search_all(text) to authenticated;

grant execute on function public.launch_board(text), public.search_all(text) to anon, authenticated;
