-- SỔ KHO · khoá tạm đăng nhập: nhập sai mật khẩu 3 lần liên tiếp → khoá tài khoản đó 30 phút. Chạy lại được, không mất dữ liệu.
-- Cách chạy: Supabase → SQL Editor → dán toàn bộ file này → Run. Thấy dòng "OK: ..." ở cuối là xong.
-- Không chứa mật khẩu hay khoá bí mật nào. Bảng chỉ ghi: tên người dùng, số lần sai liên tiếp, lần sai gần nhất, khoá đến lúc nào.
begin;

create table if not exists dang_nhap_sai (
  ten text primary key,
  lan int not null default 0,            -- số lần sai liên tiếp
  lan_cuoi timestamptz,                  -- lần sai gần nhất
  khoa_den timestamptz,                  -- đang khoá đến lúc nào (trống = không khoá)
  so_lan_khoa int not null default 0     -- đã bị khoá mấy lần (để Quản lý theo dõi)
);
-- Không ai đọc / ghi thẳng bảng này; chỉ đi qua các hàm bên dưới.
alter table dang_nhap_sai enable row level security;
revoke all on table dang_nhap_sai from anon, authenticated;

-- 1) Màn đăng nhập hỏi: tài khoản còn bị khoá bao nhiêu phút (0 = không khoá)
create or replace function public.khoa_dang_nhap(p_ten text) returns int
language sql stable security definer set search_path = public as
$$ select coalesce((select ceil(extract(epoch from (khoa_den - now())) / 60.0)::int from dang_nhap_sai where ten = p_ten and khoa_den > now()), 0) $$;

-- 2) Ghi 1 lần nhập sai. Đủ 3 lần liên tiếp (các lần cách nhau không quá 30 phút) thì khoá 30 phút.
--    Trả về: {"khoa": true, "con_phut": 30, "vua_khoa": true}  hoặc  {"khoa": false, "con_lan": 2}
create or replace function public.dang_nhap_sai_ghi(p_ten text) returns jsonb
language plpgsql security definer set search_path = public as
$$
declare
  r dang_nhap_sai;
  v_max constant int := 3;      -- số lần sai liên tiếp thì khoá
  v_phut constant int := 30;    -- số phút khoá
  n int;
begin
  -- tên không có trong danh sách (hoặc tài khoản hệ thống): không ghi gì
  if not exists (select 1 from nguoi_dung where ten = p_ten and email is not null and coalesce(vai_tro, '') <> 'Hệ thống') then
    return jsonb_build_object('khoa', false, 'con_lan', v_max);
  end if;
  insert into dang_nhap_sai (ten) values (p_ten) on conflict (ten) do nothing;
  select * into r from dang_nhap_sai where ten = p_ten for update;
  if r.khoa_den is not null and r.khoa_den > now() then
    return jsonb_build_object('khoa', true, 'con_phut', ceil(extract(epoch from (r.khoa_den - now())) / 60.0)::int);
  end if;
  -- hết hạn khoá, hoặc lần sai trước đã quá 30 phút: đếm lại từ đầu
  n := case when r.khoa_den is not null or r.lan_cuoi is null or r.lan_cuoi < now() - make_interval(mins => v_phut) then 0 else r.lan end + 1;
  if n >= v_max then
    update dang_nhap_sai set lan = 0, lan_cuoi = now(), khoa_den = now() + make_interval(mins => v_phut), so_lan_khoa = so_lan_khoa + 1 where ten = p_ten;
    return jsonb_build_object('khoa', true, 'con_phut', v_phut, 'vua_khoa', true);
  end if;
  update dang_nhap_sai set lan = n, lan_cuoi = now(), khoa_den = null where ten = p_ten;
  return jsonb_build_object('khoa', false, 'con_lan', v_max - n);
end $$;

-- 3) Đăng nhập đúng: xoá số lần sai của chính người vừa đăng nhập
create or replace function public.dang_nhap_dung() returns void
language sql security definer set search_path = public as
$$ update dang_nhap_sai set lan = 0, khoa_den = null where ten = (select ten from nguoi_dung where auth_uid = auth.uid()) $$;

-- 4) Quản lý xem tài khoản đang bị khoá / đang có lần nhập sai, và mở khoá
create or replace function public.ds_khoa_dang_nhap() returns table(ten text, con_phut int, lan int, so_lan_khoa int, lan_cuoi timestamptz)
language plpgsql stable security definer set search_path = public as
$$
begin
  if not public.co_vai_tro(array['Quản lý']) then raise exception 'Chỉ Quản lý xem được.'; end if;
  return query
    select d.ten,
           case when d.khoa_den > now() then ceil(extract(epoch from (d.khoa_den - now())) / 60.0)::int else 0 end,
           case when d.khoa_den is null and d.lan_cuoi > now() - interval '30 minutes' then d.lan else 0 end,
           d.so_lan_khoa, d.lan_cuoi
    from dang_nhap_sai d
    where d.khoa_den > now() or d.so_lan_khoa > 0 or (d.lan > 0 and d.lan_cuoi > now() - interval '30 minutes')
    order by (d.khoa_den > now()) desc nulls last, d.lan_cuoi desc nulls last;
end $$;

create or replace function public.mo_khoa_dang_nhap(p_ten text) returns void
language plpgsql security definer set search_path = public as
$$
begin
  if not public.co_vai_tro(array['Quản lý']) then raise exception 'Chỉ Quản lý mở khoá được.'; end if;
  update dang_nhap_sai set lan = 0, khoa_den = null where ten = p_ten;
end $$;

revoke all on function public.khoa_dang_nhap(text) from public;
revoke all on function public.dang_nhap_sai_ghi(text) from public;
revoke all on function public.dang_nhap_dung() from public;
revoke all on function public.ds_khoa_dang_nhap() from public;
revoke all on function public.mo_khoa_dang_nhap(text) from public;
grant execute on function public.khoa_dang_nhap(text) to anon, authenticated;
grant execute on function public.dang_nhap_sai_ghi(text) to anon, authenticated;
grant execute on function public.dang_nhap_dung() to authenticated;
grant execute on function public.ds_khoa_dang_nhap() to authenticated;
grant execute on function public.mo_khoa_dang_nhap(text) to authenticated;

commit;
select 'OK: đã bật khoá tạm đăng nhập — sai mật khẩu 3 lần liên tiếp thì khoá 30 phút' as ket_qua;
