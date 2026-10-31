-- SỬA LỖI: quyền đọc dùng "toi() is not null" — với 1 dòng có ô trống (VD phạm vi nhóm trống) Postgres coi là KHÔNG "not null"
-- → web không đọc được dữ liệu (báo trống / DU_LIEU_DOI). Đổi sang kiểm tra theo auth_uid.
create or replace function public.da_dang_nhap() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from nguoi_dung where auth_uid = auth.uid()) $$;
grant execute on function public.da_dang_nhap() to authenticated;
do $$ declare t text; begin
  foreach t in array array['vat_tu','phieu','lenh_sx','cong_thuc','qc_lo','ty_trong_lo','ham_luong_lo','ho_so_lo','anh_nhap','phieu_xnb','lenh_dg','quy_cach_dg','cai_dat','nguoi_dung','sheet_rows','sheet_ver'] loop
    execute format('drop policy if exists doc on %I', t);
    execute format('create policy doc on %I for select to authenticated using (public.da_dang_nhap())', t);
  end loop; end $$;
select sheet, ver, (select count(*) from sheet_rows r where r.sheet = v.sheet) as so_dong from sheet_ver v order by sheet;
