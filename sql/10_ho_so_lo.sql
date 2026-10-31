-- SỔ KHO · hồ sơ lô (PKQ, COA…) tải lên nhanh vào Supabase, mỗi đêm tự chép sang thư mục hồ sơ lô trên Google Drive. Chạy lại được.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ho-so', 'ho-so', false, 15728640, array['application/pdf','image/jpeg','image/png','image/webp','image/heic','image/heif','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "sokho hs xem" on storage.objects;
create policy "sokho hs xem" on storage.objects for select to authenticated using (bucket_id = 'ho-so' and public.da_dang_nhap());
drop policy if exists "sokho hs them" on storage.objects;
create policy "sokho hs them" on storage.objects for insert to authenticated with check (bucket_id = 'ho-so' and public.da_dang_nhap());
drop policy if exists "sokho hs xoa" on storage.objects;
create policy "sokho hs xoa" on storage.objects for delete to authenticated using (bucket_id = 'ho-so' and public.co_vai_tro(array['Hệ thống']));

create or replace function public.hs_cho_doi() returns table(ten text, kich_thuoc bigint, tao_luc timestamptz)
language plpgsql stable security definer set search_path = public, storage as
$$ begin
  if not public.co_vai_tro(array['Hệ thống']) then raise exception 'Không có quyền.'; end if;
  return query select o.name, coalesce((o.metadata->>'size')::bigint, 0), o.created_at from storage.objects o
    where o.bucket_id = 'ho-so' and o.created_at < now() - interval '1 hour' order by o.created_at limit 100;
end $$;
create or replace function public.hs_da_doi(p_cu text, p_link text, p_fid text) returns int
language plpgsql security definer set search_path = public as
$$ declare n int; begin
  if not public.co_vai_tro(array['Hệ thống']) then raise exception 'Không có quyền.'; end if;
  update sheet_rows set data = jsonb_set(jsonb_set(data, '{4}', to_jsonb(p_link)), '{7}', to_jsonb(p_fid))
    where sheet = 'HoSoLo' and data->>4 = p_cu;
  get diagnostics n = row_count;
  if n > 0 then update sheet_ver set ver = ver + 1, updated_at = now(), updated_by = 'Hệ thống sao lưu' where sheet = 'HoSoLo'; end if;
  return n;
end $$;
grant execute on function public.hs_cho_doi(), public.hs_da_doi(text, text, text) to authenticated;
select 'OK: đã bật lưu hồ sơ lô nhanh' as ket_qua;
