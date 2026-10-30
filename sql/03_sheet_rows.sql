-- SỔ KHO · bước 3: lưu dữ liệu theo đúng cấu trúc các trang của Google Sheet
-- (để bản web mới chạy y nguyên chức năng của Sổ Kho cũ). Chạy lại được.
begin;
create table if not exists sheet_rows (
  sheet text not null, idx int not null, data jsonb not null default '[]',
  primary key (sheet, idx));
create table if not exists sheet_ver (sheet text primary key, ver bigint not null default 0, updated_at timestamptz not null default now(), updated_by text);
alter table sheet_rows enable row level security;
alter table sheet_ver enable row level security;
drop policy if exists doc on sheet_rows; create policy doc on sheet_rows for select to authenticated using ((select public.toi()) is not null);
drop policy if exists doc on sheet_ver; create policy doc on sheet_ver for select to authenticated using ((select public.toi()) is not null);

-- Ghi nhiều trang trong 1 lần (all-or-nothing). Nếu trang đã bị người khác đổi kể từ lúc tải (base_ver khác) → báo DU_LIEU_DOI để máy tải lại và chạy lại.
-- p = [{sheet, base_ver, replace (bool), rows: [[idx, data], ...]}]
create or replace function public.ghi_nhieu(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as
$$
declare me nguoi_dung; s jsonb; v bigint; out jsonb := '{}';
begin
  select * into me from nguoi_dung where auth_uid = auth.uid();
  if me is null then raise exception 'Vui lòng đăng nhập.'; end if;
  if me.vai_tro = 'Chỉ xem' then raise exception 'Tài khoản "Chỉ xem" không được ghi dữ liệu.'; end if;
  for s in select * from jsonb_array_elements(p) loop
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
commit;
