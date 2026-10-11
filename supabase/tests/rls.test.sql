begin;
select plan(11);

-- two users + one admin
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
values
 ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-000000000000','authenticated','authenticated','a@test.ie','{"full_name":"Alice"}'),
 ('00000000-0000-0000-0000-0000000000b2','00000000-0000-0000-0000-000000000000','authenticated','authenticated','b@test.ie','{"full_name":"Bob"}'),
 ('00000000-0000-0000-0000-0000000000c3','00000000-0000-0000-0000-000000000000','authenticated','authenticated','admin@test.ie','{"full_name":"Admin"}');
update public.profiles set role='super_admin', verification_status='approved' where id='00000000-0000-0000-0000-0000000000c3';

select is((select count(*)::int from public.profiles where email like '%@test.ie'), 3, 'signup trigger created profiles');

-- act as Alice
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}',true);

select throws_ok($$update public.profiles set role='super_admin' where id='00000000-0000-0000-0000-0000000000a1'$$,
  '42501', null, 'cannot self-elevate role');
select throws_ok($$update public.profiles set verification_status='approved' where id='00000000-0000-0000-0000-0000000000a1'$$,
  '42501', null, 'cannot self-approve');
select throws_ok($$select email from public.profiles$$, '42501', null, 'email column not readable');
select is((select count(*)::int from public.admin_audit_logs), 0, 'non-admin sees no audit logs');
select throws_ok($$select public.review_application(gen_random_uuid(),'approve')$$, '42501', null, 'non-admin cannot review');
select throws_ok($$select public.admin_overview()$$, '42501', null, 'non-admin cannot read overview');

select lives_ok($$select public.submit_application(jsonb_build_object(
  'applicant_type','founder','company_name','Acme','company_website','https://www.Acme.ie/x?y=1',
  'company_linkedin','https://ie.linkedin.com/company/acme/','industry','SaaS','stage','mvp',
  'founded_year',2024,'team_size',2,'company_description','d','linkedin_follower_count',80,
  'sample_post_urls',jsonb_build_array('https://l/1','https://l/2'),'relationship_to_company','CEO',
  'interview',jsonb_build_object('q1','a')))$$, 'valid founder application accepted');
select is((select normalized_domain from public.membership_applications limit 1), 'acme.ie', 'domain normalised');
select throws_ok($$select public.submit_application(jsonb_build_object('applicant_type','founder','company_name','X',
  'company_website','x.ie','company_linkedin','linkedin.com/company/x','linkedin_follower_count',10,
  'sample_post_urls','[]'::jsonb))$$, 'P0001', null, 'low followers rejected');

-- Bob cannot see Alice's application
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}',true);
select is((select count(*)::int from public.membership_applications), 0, 'applications are private');

select * from finish();
rollback;
