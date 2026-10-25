-- Góc Học Tập: bật video MP4 riêng tư cho bài học.
-- Chạy MỘT LẦN trong Supabase > SQL Editor của dự án đang dùng.
-- Tệp MP4 không lưu trong bảng lessons; bảng chỉ lưu đường dẫn video_path.

alter table public.lessons add column if not exists video_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lesson-videos', 'lesson-videos', false, 524288000, array['video/mp4'])
on conflict (id) do update set
  public = false,
  file_size_limit = 524288000,
  allowed_mime_types = array['video/mp4'];

drop policy if exists "Signed-in users can read lesson videos" on storage.objects;
create policy "Signed-in users can read lesson videos"
on storage.objects for select to authenticated
using (bucket_id = 'lesson-videos');

drop policy if exists "Teachers upload lesson videos" on storage.objects;
create policy "Teachers upload lesson videos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'lesson-videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'teacher'
  )
);

drop policy if exists "Teachers delete lesson videos" on storage.objects;
create policy "Teachers delete lesson videos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'lesson-videos'
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'teacher'
  )
);
