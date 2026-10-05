-- Private team reference images. No anonymous or public read/write policies.
-- Access goes through the server endpoint after checking the team access key.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('eva-team-images', 'eva-team-images', false, 20971520,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
