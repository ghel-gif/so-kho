-- SỔ KHO · sao lưu: Apps Script (Sổ Kho cũ) mỗi đêm gọi hàm này để chép toàn bộ dữ liệu bản web về Google Drive.
-- Chỉ ai có khoá sao lưu (lưu trong Script Properties của Apps Script) mới gọi được; DB chỉ giữ mã băm của khoá.
create table if not exists bi_mat (khoa text primary key, gia_tri text not null);
alter table bi_mat enable row level security;
insert into bi_mat values ('sao_luu_sha256', '1c2d175d10493df88dda2af075ee42338d5f6627c1647210c0b67815c4126d0a') on conflict (khoa) do update set gia_tri = excluded.gia_tri;

create or replace function public.sao_luu(p_key text) returns jsonb
language plpgsql security definer set search_path = public, extensions as
$$
declare h text; out jsonb;
begin
  select gia_tri into h from bi_mat where khoa = 'sao_luu_sha256';
  if h is null or encode(digest(coalesce(p_key,''), 'sha256'), 'hex') <> h then raise exception 'Sai khoá sao lưu.'; end if;
  select jsonb_build_object(
    'luc', to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD HH24:MI:SS'),
    'ver', (select coalesce(jsonb_object_agg(sheet, ver), '{}') from sheet_ver),
    'nguoi_dung', (select coalesce(jsonb_agg(jsonb_build_object('ten', ten, 'vai_tro', vai_tro, 'pham_vi', pham_vi, 'quyen_qc', quyen_qc, 'xem_cong_thuc', xem_cong_thuc, 'email', email)), '[]') from nguoi_dung),
    'sheets', (select coalesce(jsonb_object_agg(sheet, rows), '{}') from (select sheet, jsonb_agg(data order by idx) as rows from sheet_rows group by sheet) s)
  ) into out;
  return out;
end $$;
revoke all on function public.sao_luu(text) from public;
grant execute on function public.sao_luu(text) to anon, authenticated;
select 'OK: đã tạo hàm sao lưu' as ket_qua;
