-- SỔ KHO · tự dời ảnh nhập kho cũ (hơn 90 ngày) từ Supabase sang Google Drive mỗi đêm. Chạy lại được.
-- 1) Tài khoản hệ thống cho Apps Script (không hiện ở màn đăng nhập)
insert into nguoi_dung (ten, vai_tro, pham_vi, quyen_qc, xem_cong_thuc, email)
values ('Hệ thống sao lưu', 'Hệ thống', '', false, false, 'he-thong@sokho.asata-usa.com')
on conflict (ten) do update set vai_tro = 'Hệ thống', email = excluded.email;
create or replace function public.ds_dang_nhap() returns table(ten text, email text, da_kich_hoat boolean)
language sql stable security definer set search_path = public as
$$ select ten, email, auth_uid is not null from nguoi_dung where email is not null and coalesce(vai_tro,'') <> 'Hệ thống' order by ten $$;
select dat_mat_khau('Hệ thống sao lưu', '<MẬT KHẨU HỆ THỐNG>');

-- 2) Danh sách ảnh cũ cần dời + tổng dung lượng (chỉ tài khoản hệ thống gọi được)
create or replace function public.anh_cu(p_ngay int) returns table(ten text, kich_thuoc bigint, tao_luc timestamptz)
language plpgsql stable security definer set search_path = public, storage as
$$ begin
  if not public.co_vai_tro(array['Hệ thống']) then raise exception 'Không có quyền.'; end if;
  return query select o.name, coalesce((o.metadata->>'size')::bigint, 0), o.created_at from storage.objects o
    where o.bucket_id = 'anh-nhap' and o.created_at < now() - make_interval(days => p_ngay) order by o.created_at limit 200;
end $$;
create or replace function public.dung_luong_anh() returns jsonb
language sql stable security definer set search_path = public, storage as
$$ select jsonb_build_object('so_anh', count(*), 'bytes', coalesce(sum((metadata->>'size')::bigint), 0)) from storage.objects where bucket_id = 'anh-nhap' $$;
grant execute on function public.anh_cu(int), public.dung_luong_anh() to authenticated;

-- 3) Ghi lại chỗ ảnh mới (Drive) vào trang AnhNhap
create or replace function public.anh_da_doi(p_cu text, p_moi text, p_link text) returns int
language plpgsql security definer set search_path = public as
$$ declare n int; begin
  if not public.co_vai_tro(array['Hệ thống']) then raise exception 'Không có quyền.'; end if;
  update sheet_rows set data = jsonb_set(jsonb_set(data, '{5}', to_jsonb(p_moi)), '{4}', to_jsonb(p_link))
    where sheet = 'AnhNhap' and data->>5 = p_cu;
  get diagnostics n = row_count;
  if n > 0 then update sheet_ver set ver = ver + 1, updated_at = now(), updated_by = 'Hệ thống sao lưu' where sheet = 'AnhNhap'; end if;
  return n;
end $$;
grant execute on function public.anh_da_doi(text, text, text) to authenticated;

-- 4) Chỉ tài khoản hệ thống được xoá ảnh khỏi Supabase (sau khi đã chép sang Drive)
drop policy if exists "sokho anh xoa" on storage.objects;
create policy "sokho anh xoa" on storage.objects for delete to authenticated using (bucket_id = 'anh-nhap' and public.co_vai_tro(array['Hệ thống']));
select 'OK: đã bật dời ảnh cũ sang Drive' as ket_qua;
