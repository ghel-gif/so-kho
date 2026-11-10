-- SỔ KHO · ảnh chụp khi "Ghi bao bì về" (sổ kiểm bao bì nhập kho BM.01–04). Chạy lại được.
-- Ảnh kiểm bao bì lưu chung kho ảnh "anh-nhap" (trang AnhNhap, cột ID ghi "QA:<số hồ sơ>").
-- Mỗi đêm Apps Script dời ảnh sang Google Drive như ảnh nhập kho; riêng ảnh kiểm bao bì thì dời sau 7 ngày,
-- không chờ hết tồn (bao bì còn tồn lâu). Ảnh nhập kho giữ nguyên quy tắc cũ: lô / mã hết tồn và đủ p_ngay ngày.
create or replace function public.anh_cu(p_ngay int) returns table(ten text, kich_thuoc bigint, tao_luc timestamptz)
language plpgsql stable security definer set search_path = public, storage as
$$ begin
  if not public.co_vai_tro(array['Hệ thống']) then raise exception 'Không có quyền.'; end if;
  return query
  with num as (select r.data, case when (r.data->>7) ~ '^-?[0-9]+([.,][0-9]+)?$' then replace(r.data->>7, ',', '.')::numeric else 0 end as kg
               from sheet_rows r where r.sheet = 'Phieu' and r.idx > 0 and coalesce(r.data->>11, '') = ''),
  ton as (select n.data->>4 as ma, coalesce(n.data->>13, '') as lo, sum(case when n.data->>3 = 'Xuất' then -n.kg else n.kg end) as t from num n group by 1, 2),
  dk as (select v.data->>0 as ma, case when (v.data->>5) ~ '^-?[0-9]+([.,][0-9]+)?$' then replace(v.data->>5, ',', '.')::numeric else 0 end as dau_ky
         from sheet_rows v where v.sheet = 'VatTu' and v.idx > 0),
  anh as (select substr(a.data->>5, 4) as ten_obj, coalesce(a.data->>0, '') as id, a.data->>1 as ma, coalesce(a.data->>2, '') as lo
          from sheet_rows a where a.sheet = 'AnhNhap' and a.idx > 0 and a.data->>5 like 'sb:%')
  select o.name, coalesce((o.metadata->>'size')::bigint, 0), o.created_at
  from storage.objects o join anh on anh.ten_obj = o.name
  left join ton on ton.ma = anh.ma and ton.lo = anh.lo
  left join dk on dk.ma = anh.ma
  where o.bucket_id = 'anh-nhap' and (
        (anh.id like 'QA:%' and o.created_at < now() - make_interval(days => least(greatest(p_ngay, 0), 7)))
     or (anh.id not like 'QA:%' and o.created_at < now() - make_interval(days => p_ngay)
         and coalesce(ton.t, 0) + case when anh.lo = '' then coalesce(dk.dau_ky, 0) else 0 end <= 0.001))
  order by o.created_at limit 200;
end $$;
grant execute on function public.anh_cu(int) to authenticated;
select 'OK: ảnh kiểm bao bì sẽ tự dời sang Drive sau 7 ngày' as ket_qua;
