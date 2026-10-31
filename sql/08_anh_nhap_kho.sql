-- SỔ KHO · ảnh hàng / marking khi nhập kho lưu trên Supabase Storage (thay Google Drive). Chạy lại được.
-- (gồm luôn phần sửa quyền đọc của file 07, phòng khi chưa chạy)
create or replace function public.da_dang_nhap() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from nguoi_dung where auth_uid = auth.uid()) $$;
grant execute on function public.da_dang_nhap() to authenticated;
do $$ declare t text; begin
  foreach t in array array['vat_tu','phieu','lenh_sx','cong_thuc','qc_lo','ty_trong_lo','ham_luong_lo','ho_so_lo','anh_nhap','phieu_xnb','lenh_dg','quy_cach_dg','cai_dat','nguoi_dung','sheet_rows','sheet_ver'] loop
    execute format('drop policy if exists doc on %I', t);
    execute format('create policy doc on %I for select to authenticated using (public.da_dang_nhap())', t);
  end loop; end $$;

-- Kho ảnh riêng tư, mỗi ảnh tối đa 8 MB, chỉ nhận JPG / PNG / WEBP
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('anh-nhap', 'anh-nhap', false, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "sokho anh xem" on storage.objects;
create policy "sokho anh xem" on storage.objects for select to authenticated using (bucket_id = 'anh-nhap' and public.da_dang_nhap());
drop policy if exists "sokho anh them" on storage.objects;
create policy "sokho anh them" on storage.objects for insert to authenticated with check (bucket_id = 'anh-nhap' and public.da_dang_nhap());
select 'OK: đã bật lưu ảnh nhập kho' as ket_qua;
