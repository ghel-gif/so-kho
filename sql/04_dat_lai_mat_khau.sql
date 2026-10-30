-- SỔ KHO · đặt lại mật khẩu: xoá tài khoản đăng nhập để người đó kích hoạt lại (tự đặt mật khẩu mới).
-- Quản lý gọi được từ web: select dat_lai_mat_khau('Tên người dùng');
create or replace function public.dat_lai_mat_khau(p_ten text) returns void
language plpgsql security definer set search_path = public, auth as
$$
declare uid uuid;
begin
  if auth.uid() is not null and not public.co_vai_tro(array['Quản lý']) then raise exception 'Chỉ Quản lý được đặt lại mật khẩu.'; end if;
  select auth_uid into uid from nguoi_dung where ten = p_ten;
  update nguoi_dung set auth_uid = null where ten = p_ten;
  if uid is not null then delete from auth.users where id = uid; end if;
  delete from auth.users u where lower(u.email) = (select lower(email) from nguoi_dung where ten = p_ten);
end $$;
grant execute on function public.dat_lai_mat_khau(text) to authenticated;

-- Đặt lại ngay cho anh Ghel:
select dat_lai_mat_khau('Nguyễn Ô Ghel');
select ten, auth_uid is not null as da_kich_hoat from nguoi_dung order by ten;
