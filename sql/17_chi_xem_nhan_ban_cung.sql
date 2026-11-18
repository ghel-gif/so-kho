-- SỔ KHO · tài khoản "Chỉ xem" được xác nhận nhận bản cứng phiếu kết quả (sổ Gửi mẫu KTCL) — vẫn không ghi được dữ liệu nào khác.
-- Chạy 1 lần trong Supabase SQL Editor. Chạy lại được, không mất dữ liệu.
create or replace function public.ghi_nhieu(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as
$$
declare me nguoi_dung; s jsonb; v bigint; out jsonb := '{}';
begin
  select * into me from nguoi_dung where auth_uid = auth.uid();
  if me is null then raise exception 'Vui lòng đăng nhập.'; end if;
  for s in select * from jsonb_array_elements(p) loop
    if me.vai_tro = 'Chỉ xem' and (s->>'sheet') not in ('GuiMau', 'NhatKy') then raise exception 'Tài khoản "Chỉ xem" không được ghi dữ liệu.'; end if;
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
