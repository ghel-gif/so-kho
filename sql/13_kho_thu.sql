-- SỔ KHO · KHO THỬ (số liệu ảo). Chạy 1 lần trong Supabase SQL Editor. Chạy lại được, không mất dữ liệu.
-- Tài khoản gắn kho_thu = true:
--   • chỉ đọc / ghi các trang "ao:<tên trang>" (kho thử) — KHÔNG đọc được trang thật, bảng cũ, ảnh, hồ sơ lô;
--   • không dùng được các quyền Quản lý ở máy chủ (đặt mật khẩu, xoá ảnh…).
-- Tài khoản thường: không thấy, không ghi được trang "ao:…".
begin;

alter table nguoi_dung add column if not exists kho_thu boolean not null default false;

create or replace function public.la_kho_thu() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce((select kho_thu from nguoi_dung where auth_uid = auth.uid()), false) $$;
grant execute on function public.la_kho_thu() to authenticated;

-- quyền theo vai trò ở máy chủ: tài khoản kho thử không bao giờ có
create or replace function public.co_vai_tro(vt text[]) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from nguoi_dung where auth_uid = auth.uid() and vai_tro = any(vt) and not kho_thu) $$;

-- đọc dữ liệu: kho thử chỉ thấy trang ao:…, tài khoản thường không thấy trang ao:…
drop policy if exists doc on sheet_rows;
create policy doc on sheet_rows for select to authenticated using (public.da_dang_nhap() and (sheet like 'ao:%') = public.la_kho_thu());
drop policy if exists doc on sheet_ver;
create policy doc on sheet_ver for select to authenticated using (public.da_dang_nhap() and (sheet like 'ao:%') = public.la_kho_thu());

-- bảng cũ: tài khoản kho thử không đọc được; danh sách người dùng: chỉ thấy chính mình
do $$ declare t text; begin
  foreach t in array array['vat_tu','phieu','lenh_sx','cong_thuc','qc_lo','ty_trong_lo','ham_luong_lo','ho_so_lo','anh_nhap','phieu_xnb','lenh_dg','quy_cach_dg','cai_dat'] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop policy if exists doc on %I', t);
      execute format('create policy doc on %I for select to authenticated using (public.da_dang_nhap() and not public.la_kho_thu())', t);
    end if;
  end loop; end $$;
drop policy if exists doc on nguoi_dung;
create policy doc on nguoi_dung for select to authenticated using (public.da_dang_nhap() and (not public.la_kho_thu() or auth_uid = auth.uid()));

-- ảnh nhập kho, hồ sơ lô: kho thử không xem / không tải lên
drop policy if exists "sokho anh xem" on storage.objects;
create policy "sokho anh xem" on storage.objects for select to authenticated using (bucket_id = 'anh-nhap' and public.da_dang_nhap() and not public.la_kho_thu());
drop policy if exists "sokho anh them" on storage.objects;
create policy "sokho anh them" on storage.objects for insert to authenticated with check (bucket_id = 'anh-nhap' and public.da_dang_nhap() and not public.la_kho_thu());
drop policy if exists "sokho hs xem" on storage.objects;
create policy "sokho hs xem" on storage.objects for select to authenticated using (bucket_id = 'ho-so' and public.da_dang_nhap() and not public.la_kho_thu());
drop policy if exists "sokho hs them" on storage.objects;
create policy "sokho hs them" on storage.objects for insert to authenticated with check (bucket_id = 'ho-so' and public.da_dang_nhap() and not public.la_kho_thu());

-- ghi dữ liệu: mỗi loại tài khoản chỉ ghi đúng phần của mình
create or replace function public.ghi_nhieu(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as
$$
declare me nguoi_dung; s jsonb; v bigint; out jsonb := '{}';
begin
  select * into me from nguoi_dung where auth_uid = auth.uid();
  if me is null then raise exception 'Vui lòng đăng nhập.'; end if;
  if me.vai_tro = 'Chỉ xem' then raise exception 'Tài khoản "Chỉ xem" không được ghi dữ liệu.'; end if;
  for s in select * from jsonb_array_elements(p) loop
    if ((s->>'sheet') like 'ao:%') <> me.kho_thu then
      raise exception '%', case when me.kho_thu then 'Tài khoản kho thử chỉ ghi được số liệu ảo.' else 'Không ghi vào kho thử từ tài khoản thật.' end; end if;
    insert into sheet_ver(sheet) values (s->>'sheet') on conflict do nothing;
    select ver into v from sheet_ver where sheet = s->>'sheet' for update;
    if v <> (s->>'base_ver')::bigint then raise exception 'DU_LIEU_DOI|%', s->>'sheet'; end if;
    if coalesce((s->>'replace')::boolean, false) then delete from sheet_rows where sheet = s->>'sheet'; end if;
    insert into sheet_rows(sheet, idx, data)
      select s->>'sheet', (r->>0)::int, r->1 from jsonb_array_elements(s->'rows') r
      on conflict (sheet, idx) do update set data = excluded.data;
    update sheet_ver set ver = ver + 1, updated_at = now(), updated_by = me.ten where sheet = s->>'sheet' returning ver into v;
    out := out || jsonb_build_object(s->>'sheet', v);
  end loop;
  return out;
end $$;
grant execute on function public.ghi_nhieu(jsonb) to authenticated;

-- sao lưu mỗi đêm: bỏ qua kho thử
create or replace function public.sao_luu(p_key text) returns jsonb
language plpgsql security definer set search_path = public, extensions as
$$
declare h text; out jsonb;
begin
  select gia_tri into h from bi_mat where khoa = 'sao_luu_sha256';
  if h is null or encode(digest(coalesce(p_key,''), 'sha256'), 'hex') <> h then raise exception 'Sai khoá sao lưu.'; end if;
  select jsonb_build_object(
    'luc', to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD HH24:MI:SS'),
    'ver', (select coalesce(jsonb_object_agg(sheet, ver), '{}') from sheet_ver where sheet not like 'ao:%'),
    'nguoi_dung', (select coalesce(jsonb_agg(jsonb_build_object('ten', ten, 'vai_tro', vai_tro, 'pham_vi', pham_vi, 'quyen_qc', quyen_qc, 'xem_cong_thuc', xem_cong_thuc, 'email', email)), '[]') from nguoi_dung),
    'sheets', (select coalesce(jsonb_object_agg(sheet, rows), '{}') from (select sheet, jsonb_agg(data order by idx) as rows from sheet_rows where sheet not like 'ao:%' group by sheet) s)
  ) into out;
  return out;
end $$;
revoke all on function public.sao_luu(text) from public;
grant execute on function public.sao_luu(text) to anon, authenticated;

-- tài khoản kho thử: Lê Thị Trúc Thanh (vai trò Quản lý trong kho thử để thử đủ chức năng)
insert into nguoi_dung (ten, vai_tro, pham_vi, quyen_qc, xem_cong_thuc, email, kho_thu)
  select 'Lê Thị Trúc Thanh', 'Quản lý', '', true, true, 'thanh@sokho.asata-usa.com', true
  where not exists (select 1 from nguoi_dung where ten = 'Lê Thị Trúc Thanh');
update nguoi_dung set kho_thu = true where ten = 'Lê Thị Trúc Thanh';

commit;
select ten, vai_tro, kho_thu, auth_uid is not null as da_kich_hoat from nguoi_dung order by kho_thu, ten;
