-- SỔ KHO · bước 2: đăng nhập, phân quyền, hàm lưu phiếu
-- Chạy 1 lần trong Supabase SQL Editor (sau file sokho_supabase.sql). Chạy lại được, không mất dữ liệu.
begin;

-- 1. Mỗi người dùng 1 email nội bộ (không cần là email thật) để đăng nhập Supabase
alter table nguoi_dung add column if not exists email text unique;
update nguoi_dung set email = case ten
  when 'Nguyễn Ô Ghel' then 'ghel@sokho.asata-usa.com'
  when 'Phan Thị Cẩm Tiên' then 'tien@sokho.asata-usa.com'
  when 'Châu Trần Yến Nhi' then 'nhi@sokho.asata-usa.com'
  when 'KT Kho' then 'ktkho@sokho.asata-usa.com'
  else email end
where email is null;

-- 2. Người đang đăng nhập
create or replace function public.toi() returns nguoi_dung
language sql stable security definer set search_path = public as
$$ select * from nguoi_dung where auth_uid = auth.uid() $$;

create or replace function public.co_vai_tro(vt text[]) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from nguoi_dung where auth_uid = auth.uid() and vai_tro = any(vt)) $$;

-- 3. Danh sách tên để chọn ở màn đăng nhập (chỉ tên + email nội bộ + đã kích hoạt chưa)
create or replace function public.ds_dang_nhap() returns table(ten text, email text, da_kich_hoat boolean)
language sql stable security definer set search_path = public as
$$ select ten, email, auth_uid is not null from nguoi_dung where email is not null order by ten $$;
grant execute on function public.ds_dang_nhap() to anon, authenticated;

-- 4. Kích hoạt lần đầu: tài khoản Supabase mới phải trùng email 1 người trong danh sách và chưa ai kích hoạt
create or replace function public.lien_ket_nguoi_dung() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
  update nguoi_dung set auth_uid = new.id where lower(email) = lower(new.email) and auth_uid is null;
  if not found then
    raise exception 'Tên này không có trong danh sách người dùng Sổ Kho hoặc đã được kích hoạt.';
  end if;
  return new;
end $$;
drop trigger if exists lien_ket_nguoi_dung on auth.users;
create trigger lien_ket_nguoi_dung after insert on auth.users for each row execute function public.lien_ket_nguoi_dung();

-- 5. Trạng thái QC mới nhất của từng lô
create or replace view lo_qc with (security_invoker = on) as
select distinct on (ma, lo) ma, lo, trang_thai, ngay, nguoi, ghi_chu, hsd_moi
from qc_lo order by ma, lo, id desc;


-- 5b. Tồn theo lô có tính cả tồn đầu kỳ (đầu kỳ của mã theo lô nằm ở "không lô", giống Sổ Kho cũ)
create or replace view ton_lo with (security_invoker = on) as
select ma, lo, min(nsx) as nsx, max(hsd) as hsd, round(sum(kg), 4) as ton_kg from (
  select ma, ''::text as lo, null::date as nsx, null::date as hsd, dau_ky as kg from vat_tu where theo_lo and dau_ky <> 0
  union all
  select ma, lo, nsx, hsd, case when loai = 'Xuất' then -kg else kg end from phieu where coalesce(trang_thai,'') = ''
) x group by ma, lo;

-- 6. Quyền đọc: ai đăng nhập (đã liên kết) cũng xem được
do $$ declare t text; begin
  foreach t in array array['vat_tu','phieu','lenh_sx','cong_thuc','qc_lo','ty_trong_lo','ham_luong_lo','ho_so_lo','anh_nhap','phieu_xnb','lenh_dg','quy_cach_dg','cai_dat','nguoi_dung'] loop
    execute format('drop policy if exists doc on %I', t);
    execute format('create policy doc on %I for select to authenticated using ((select public.toi()) is not null)', t);
  end loop; end $$;
-- Ghi: chỉ qua hàm luu_phieu / huy_phieu / luu_qc bên dưới (bảo đảm đúng quy tắc). Sửa danh mục: Quản lý, Kế toán.
drop policy if exists sua_vt on vat_tu;
create policy sua_vt on vat_tu for all to authenticated
  using (public.co_vai_tro(array['Quản lý','Kế toán'])) with check (public.co_vai_tro(array['Quản lý','Kế toán']));

-- 7. Lưu phiếu nhập / xuất / kiểm kê (1 lần gọi, kiểm tra như Sổ Kho cũ)
create or replace function public.luu_phieu(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as
$$
declare
  me nguoi_dung; it vat_tu; v_loai text := p->>'loai'; v_ngay date := (p->>'ngay')::date;
  v_sl numeric := coalesce((p->>'so_luong')::numeric, 0); v_lo text := coalesce(trim(p->>'lo'), '');
  v_nsx date := nullif(p->>'nsx','')::date; v_hsd date := nullif(p->>'hsd','')::date;
  v_kg numeric; v_dv text; v_ton numeric; v_id text; nhom_qc text[]; can_qc boolean; v_qc text; v_hsd_lo date; canh_bao text[] := '{}';
begin
  select * into me from nguoi_dung where auth_uid = auth.uid();
  if me is null then raise exception 'Vui lòng đăng nhập.'; end if;
  if me.vai_tro = 'Chỉ xem' then raise exception 'Tài khoản "Chỉ xem" không lập phiếu được.'; end if;
  if v_loai not in ('Nhập','Xuất','Kiểm kê') then raise exception 'Loại phiếu không hợp lệ.'; end if;
  if v_ngay is null then raise exception 'Ngày không hợp lệ.'; end if;
  select * into it from vat_tu where ma = p->>'ma';
  if it is null then raise exception 'Không có mã vật tư %', p->>'ma'; end if;
  if me.pham_vi is not null and me.pham_vi <> '' and me.vai_tro not in ('Quản lý','Kế toán')
     and not (it.nhom = any(string_to_array(replace(me.pham_vi, ', ', ','), ','))) then
    raise exception 'Tài khoản % không làm phiếu cho nhóm %.', me.ten, it.nhom; end if;
  if v_sl < 0 or (v_loai <> 'Kiểm kê' and v_sl <= 0) then raise exception 'Số lượng phải lớn hơn 0.'; end if;
  if it.theo_lo and v_loai <> 'Kiểm kê' and v_lo = '' and v_loai = 'Nhập' then raise exception 'Mã % theo dõi lô: nhập số lô.', it.ma; end if;

  select string_to_array(replace(coalesce(gia_tri,'Nguyên liệu, Bán thành phẩm'), ', ', ','), ',') into nhom_qc from cai_dat where khoa = 'Nhóm cần QC theo lô';
  can_qc := it.theo_lo and it.nhom = any(coalesce(nhom_qc, array['Nguyên liệu','Bán thành phẩm']));

  -- tồn hiện tại (theo lô nếu mã theo lô)
  if it.theo_lo then
    select coalesce(sum(case when loai='Xuất' then -kg else kg end),0) into v_ton from phieu where ma = it.ma and lo = v_lo and coalesce(trang_thai,'') = '';
    if v_lo = '' then v_ton := v_ton + it.dau_ky; end if;
  else
    select it.dau_ky + coalesce(sum(case when loai='Xuất' then -kg else kg end),0) into v_ton from phieu where ma = it.ma and coalesce(trang_thai,'') = '';
  end if;

  if v_loai = 'Kiểm kê' then
    v_kg := round(v_sl - v_ton, 4); v_dv := 'kg';
    if abs(v_kg) < 1e-9 then raise exception 'Tồn thực tế bằng tồn sổ, không cần kiểm kê.'; end if;
  else
    v_kg := round(v_sl * it.he_so, 4); v_dv := it.don_vi;
  end if;

  if v_loai = 'Xuất' then
    if it.theo_lo and can_qc then
      select trang_thai, hsd_moi into v_qc, v_hsd_lo from lo_qc where ma = it.ma and lo = v_lo;
      if coalesce(v_qc,'Đạt') <> 'Đạt' then raise exception 'Lô % của % chưa QC đạt (%).', nullif(v_lo,''), it.ma, v_qc; end if;
    end if;
    if it.theo_lo then
      select coalesce(v_hsd_lo, max(hsd)) into v_hsd_lo from phieu where ma = it.ma and lo = v_lo and loai = 'Nhập' and coalesce(trang_thai,'') = '';
      if v_hsd_lo is not null and v_hsd_lo < v_ngay then canh_bao := canh_bao || format('Lô %s đã hết hạn %s', v_lo, to_char(v_hsd_lo,'DD/MM/YYYY')); end if;
    end if;
    if v_kg > v_ton + 1e-6 and not (it.ma = any(string_to_array(replace(coalesce((select gia_tri from cai_dat where khoa='Mã không theo dõi tồn'),''),' ',''), ','))) then
      canh_bao := canh_bao || format('Xuất %s kg vượt tồn %s kg', v_kg, round(v_ton,4)); end if;
    if array_length(canh_bao,1) > 0 and coalesce((p->>'xac_nhan')::boolean, false) = false then
      return jsonb_build_object('can_xac_nhan', to_jsonb(canh_bao));
    end if;
  end if;

  if v_loai = 'Nhập' and it.theo_lo then
    if v_nsx is null then v_nsx := v_ngay; end if;
    if v_hsd is null then v_hsd := (v_nsx + make_interval(months => coalesce(it.han_thang, case when it.nhom = 'Phân bón' then 36 else 24 end)))::date; end if;
  end if;

  v_id := to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'YYMMDDHH24MISS') || upper(substr(md5(random()::text), 1, 4));
  insert into phieu (id, lap, ngay, loai, ma, so_luong, don_vi, kg, chung_tu, ghi_chu, nguoi_lap, lo, nsx, hsd, ncc)
  values (v_id, to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'DD/MM/YYYY HH24:MI'), v_ngay, v_loai, it.ma, v_sl, v_dv, v_kg,
          nullif(p->>'chung_tu',''), nullif(p->>'ghi_chu',''), me.ten, v_lo, v_nsx, v_hsd, nullif(p->>'ncc',''));

  if v_loai = 'Nhập' and can_qc and not exists (select 1 from qc_lo where ma = it.ma and lo = v_lo) then
    insert into qc_lo (ma, lo, trang_thai, ngay, nguoi, ghi_chu, luc) values (it.ma, v_lo, 'Chờ kiểm', v_ngay, me.ten, 'Tự tạo khi nhập kho', to_char(now(),'YYYY-MM-DD HH24:MI'));
  end if;
  return jsonb_build_object('id', v_id, 'kg', v_kg);
end $$;
grant execute on function public.luu_phieu(jsonb) to authenticated;

-- 8. Huỷ phiếu (Quản lý, Kế toán, hoặc người lập trong ngày)
create or replace function public.huy_phieu(p_id text, p_ly_do text) returns void
language plpgsql security definer set search_path = public as
$$
declare me nguoi_dung; ph phieu;
begin
  select * into me from nguoi_dung where auth_uid = auth.uid();
  select * into ph from phieu where id = p_id;
  if me is null then raise exception 'Vui lòng đăng nhập.'; end if;
  if ph is null then raise exception 'Không tìm thấy phiếu.'; end if;
  if coalesce(ph.trang_thai,'') <> '' then raise exception 'Phiếu đã huỷ.'; end if;
  if ph.lenh is not null and ph.lenh <> '' then raise exception 'Phiếu của lệnh % — huỷ ở lệnh.', ph.lenh; end if;
  if not (me.vai_tro in ('Quản lý','Kế toán') or (ph.nguoi_lap = me.ten and ph.created_at > now() - interval '1 day')) then
    raise exception 'Chỉ Quản lý, Kế toán hoặc người lập (trong 24 giờ) được huỷ phiếu.'; end if;
  update phieu set trang_thai = 'Đã huỷ bởi ' || me.ten || ' ' || to_char(now() at time zone 'Asia/Ho_Chi_Minh','DD/MM/YYYY') || coalesce(': ' || nullif(p_ly_do,''), '') where id = p_id;
end $$;
grant execute on function public.huy_phieu(text, text) to authenticated;

-- 9. QC lô: Đạt / Không đạt / Chờ kiểm
create or replace function public.luu_qc(p_ma text, p_lo text, p_tt text, p_ghi_chu text) returns void
language plpgsql security definer set search_path = public as
$$
declare me nguoi_dung;
begin
  select * into me from nguoi_dung where auth_uid = auth.uid();
  if me is null or not (me.quyen_qc or me.vai_tro = 'Quản lý') then raise exception 'Tài khoản chưa có quyền QC.'; end if;
  if p_tt not in ('Chờ kiểm','Đạt','Không đạt') then raise exception 'Trạng thái QC không hợp lệ.'; end if;
  insert into qc_lo (ma, lo, trang_thai, ngay, nguoi, ghi_chu, luc)
  values (p_ma, coalesce(p_lo,''), p_tt, (now() at time zone 'Asia/Ho_Chi_Minh')::date, me.ten, nullif(p_ghi_chu,''), to_char(now(),'YYYY-MM-DD HH24:MI'));
end $$;
grant execute on function public.luu_qc(text, text, text, text) to authenticated;

grant select on ton_kho, ton_lo, lo_qc to authenticated;
commit;
