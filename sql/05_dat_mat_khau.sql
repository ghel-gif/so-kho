-- SỔ KHO · Quản lý đặt sẵn mật khẩu cho người dùng (tạo tài khoản nếu chưa có).
create or replace function public.dat_mat_khau(p_ten text, p_mk text) returns text
language plpgsql security definer set search_path = public, auth, extensions as
$$
declare v_email text; v_uid uuid;
begin
  if auth.uid() is not null and not public.co_vai_tro(array['Quản lý']) then raise exception 'Chỉ Quản lý được đặt mật khẩu.'; end if;
  if length(coalesce(p_mk,'')) < 6 then raise exception 'Mật khẩu ít nhất 6 ký tự.'; end if;
  select email into v_email from nguoi_dung where ten = p_ten;
  if v_email is null then raise exception 'Không có người dùng %', p_ten; end if;
  select id into v_uid from auth.users where lower(email) = lower(v_email);
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', v_email, crypt(p_mk, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid, v_uid::text, jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true), 'email', now(), now(), now());
  else
    update auth.users set encrypted_password = crypt(p_mk, gen_salt('bf')), email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now() where id = v_uid;
  end if;
  update nguoi_dung set auth_uid = v_uid where ten = p_ten;
  return p_ten || ': đã đặt mật khẩu';
end $$;
grant execute on function public.dat_mat_khau(text, text) to authenticated;
