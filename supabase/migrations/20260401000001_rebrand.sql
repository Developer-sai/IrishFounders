-- Space of Founders: the product is renamed and worldwide. Reserve the new brand handles.
alter table public.profiles drop constraint profiles_handle_format;
alter table public.profiles add constraint profiles_handle_format
  check (handle is null or (handle::text ~ '^[A-Za-z0-9_]{3,30}$'
    and lower(handle::text) not in ('admin', 'support', 'irishfounders', 'spaceoffounders', 'space', 'founders', 'me', 'api', 'settings')));
