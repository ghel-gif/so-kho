-- SỔ KHO · giữ ảnh trên web (Supabase) ÍT NHẤT 45 NGÀY rồi mới dời sang Google Drive. Chạy lại được.
-- Thay bản ở 14_anh_kiem_bao_bi.sql:
--   · ảnh kiểm bao bì (ID "QA:<số hồ sơ>"): dời sau 45 ngày (trước là 7 ngày), không chờ hết tồn;
--   · ảnh nhập kho: dời khi lô / mã đã hết tồn VÀ đã chụp ít nhất 45 ngày (hoặc p_ngay nếu Apps Script truyền số lớn hơn).
-- Ảnh đã dời vẫn xem được trong app (mở từ Drive), chỉ chậm hơn một chút.
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
        (anh.id like 'QA:%' and o.created_at < now() - interval '45 days')
     or (anh.id not like 'QA:%' and o.created_at < now() - make_interval(days => greatest(coalesce(p_ngay, 0), 45))
         and coalesce(ton.t, 0) + case when anh.lo = '' then coalesce(dk.dau_ky, 0) else 0 end <= 0.001))
  order by o.created_at limit 200;
end $$;
grant execute on function public.anh_cu(int) to authenticated;
select 'OK: ảnh giữ trên web ít nhất 45 ngày rồi mới dời sang Drive' as ket_qua;
