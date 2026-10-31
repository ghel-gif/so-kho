-- SỔ KHO · hồ sơ lô (PKQ, COA…) lưu cố định trên Supabase (mở nhanh cho mọi người),
-- mỗi đêm Apps Script chép thêm 1 bản sang thư mục hồ sơ lô trên Google Drive (không xoá trên Supabase). Chạy lại được.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ho-so', 'ho-so', false, 15728640, array['application/pdf','image/jpeg','image/png','image/webp','image/heic','image/heif','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "sokho hs xem" on storage.objects;
create policy "sokho hs xem" on storage.objects for select to authenticated using (bucket_id = 'ho-so' and public.da_dang_nhap());
drop policy if exists "sokho hs them" on storage.objects;
create policy "sokho hs them" on storage.objects for insert to authenticated with check (bucket_id = 'ho-so' and public.da_dang_nhap());

-- File nào đã chép sang Drive
create table if not exists hs_da_chep (ten text primary key, drive_id text, luc timestamptz not null default now());
alter table hs_da_chep enable row level security;

create or replace function public.hs_cho_chep() returns table(ten text, kich_thuoc bigint)
language plpgsql stable security definer set search_path = public, storage as
$$ begin
  if not public.co_vai_tro(array['Hệ thống']) then raise exception 'Không có quyền.'; end if;
  return query select o.name, coalesce((o.metadata->>'size')::bigint, 0) from storage.objects o
    where o.bucket_id = 'ho-so' and not exists (select 1 from hs_da_chep c where c.ten = o.name)
    order by o.created_at limit 100;
end $$;
create or replace function public.hs_da_chep_xong(p_ten text, p_drive_id text) returns void
language plpgsql security definer set search_path = public as
$$ begin
  if not public.co_vai_tro(array['Hệ thống']) then raise exception 'Không có quyền.'; end if;
  insert into hs_da_chep(ten, drive_id) values (p_ten, p_drive_id) on conflict (ten) do update set drive_id = excluded.drive_id, luc = now();
end $$;
grant execute on function public.hs_cho_chep(), public.hs_da_chep_xong(text, text) to authenticated;
select 'OK: đã bật lưu hồ sơ lô trên bản web' as ket_qua;
