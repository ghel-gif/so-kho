import json,re
d=json.load(open('export.json'))
def q(v):
    if v is None or v=='': return 'NULL'
    return "'"+str(v).replace("'","''")+"'"
def num(v):
    if v is None or v=='': return 'NULL'
    if isinstance(v,(int,float)): return repr(v) if isinstance(v,float) else str(v)
    s=str(v).strip().replace(' ','')
    if re.fullmatch(r'-?\d+(,\d+)?',s): s=s.replace(',','.')
    try: float(s); return s
    except: return 'NULL'
def dt(v):
    s=str(v or '').strip()
    m=re.match(r'(\d{4}-\d{2}-\d{2})',s)
    if m: return q(m.group(1))
    m=re.match(r'(\d{2})/(\d{2})/(\d{4})',s)
    if m: return q(f'{m.group(3)}-{m.group(2)}-{m.group(1)}')
    return 'NULL'
def b(v): return 'true' if str(v).strip()=='Có' else 'false'
def jb(v):
    s=str(v or '').strip()
    if not s: return 'NULL'
    try: json.loads(s); return q(s)+'::jsonb'
    except: return q(json.dumps(s,ensure_ascii=False))+'::jsonb'
def rows(name): return [r for r in d.get(name,[])[1:] if any(str(c).strip() for c in r)]
def pad(r,n): return list(r)+['']*(n-len(r))
out=[]
W=out.append
W("""-- SỔ KHO trên Supabase: tạo bảng + chép dữ liệu từ Google Sheet (xuất lúc """+__import__('datetime').datetime.now().strftime('%d/%m/%Y %H:%M')+""")
-- Chạy 1 lần trong SQL Editor. Chạy lại sẽ XOÁ và tạo lại các bảng dưới đây.
begin;
drop view if exists ton_kho, ton_lo;
drop table if exists phieu, vat_tu, lenh_sx, cong_thuc, qc_lo, ty_trong_lo, ham_luong_lo, ho_so_lo, anh_nhap, phieu_xnb, lenh_dg, quy_cach_dg, cai_dat, nguoi_dung cascade;

create table vat_tu (
  ma text primary key, ten text not null, nhom text not null default 'Khác', don_vi text not null default 'kg',
  he_so numeric not null default 1, dau_ky numeric not null default 0, toi_thieu numeric, theo_lo boolean not null default false,
  han_thang int, chu_hang text, ham_luong text, kho text, created_at timestamptz not null default now());
create table phieu (
  id text primary key, lap text, ngay date not null, loai text not null check (loai in ('Nhập','Xuất','Kiểm kê')),
  ma text not null references vat_tu(ma) on update cascade, so_luong numeric, don_vi text, kg numeric not null default 0,
  chung_tu text, ghi_chu text, nguoi_lap text, trang_thai text, lenh text, lo text not null default '', nsx date, hsd date, ncc text,
  created_at timestamptz not null default now());
create index phieu_ma_idx on phieu(ma); create index phieu_ngay_idx on phieu(ngay); create index phieu_lenh_idx on phieu(lenh);
create table lenh_sx (
  so text primary key, ngay date, ma_sp text, sl_du_kien numeric, trang_thai text, ngay_ht date, sl_thuc_te numeric,
  nguoi_lap text, nguoi_ht text, ghi_chu text, khach_hang text, nguoi_sx text, qc_sx text, ty_trong numeric, created_at timestamptz not null default now());
create table cong_thuc (id bigserial primary key, ma_sp text not null, ma_vt text not null, dinh_muc numeric not null);
create index cong_thuc_sp_idx on cong_thuc(ma_sp);
create table qc_lo (id bigserial primary key, ma text not null, lo text not null default '', trang_thai text, ngay date, nguoi text, ghi_chu text, hsd_moi date, luc text);
create index qc_lo_idx on qc_lo(ma, lo);
create table ty_trong_lo (id bigserial primary key, ma text not null, lo text not null default '', ty_trong numeric, ngay date, nguoi text, luc text);
create table ham_luong_lo (id bigserial primary key, ma text not null, lo text not null default '', kiem text, ngay date, nguoi text, ghi_chu text, luc text);
create table ho_so_lo (id bigserial primary key, ma text not null, lo text not null default '', loai text, ten_file text, link text, nguoi text, luc text, file_id text);
create table anh_nhap (id bigserial primary key, phieu_id text, ma text, lo text, ten_file text, link text, file_id text, nguoi text, luc text);
create table phieu_xnb (so text primary key, ngay date, ly_do text, nguoi_nhan text, bo_phan text, ghi_chu text, nguoi_lap text, luc text, trang_thai text, da_nhap_amis text, dong jsonb);
create table lenh_dg (so text primary key, ma_qc text, ke_hoach jsonb, nguoi_lap text, luc text);
create table quy_cach_dg (ma_qc text primary key, ma_nhan text, san_pham text, ma_btp text, du_lieu jsonb not null);
create table cai_dat (khoa text primary key, gia_tri text, giai_thich text);
create table nguoi_dung (ten text primary key, vai_tro text, pham_vi text, quyen_qc boolean, xem_cong_thuc boolean, auth_uid uuid unique);
""")
def ins(table,cols,vals):
    if not vals: return
    for i in range(0,len(vals),200):
        W(f"insert into {table} ({','.join(cols)}) values\n"+",\n".join('('+','.join(v)+')' for v in vals[i:i+200])+';')
# vat_tu
V=[];seen=set()
for r in rows('VatTu'):
    r=pad(r,12)
    if not str(r[0]).strip() or r[0] in seen: continue
    seen.add(r[0])
    V.append([q(str(r[0]).strip()),q(r[1] or r[0]),q(r[2] or 'Khác'),q(r[3] or 'kg'),num(r[4]) if num(r[4])!='NULL' else '1',num(r[5]) if num(r[5])!='NULL' else '0',num(r[6]),b(r[7]),num(r[8]),q(r[9]),q(r[10]),q(r[11])])
ins('vat_tu',['ma','ten','nhom','don_vi','he_so','dau_ky','toi_thieu','theo_lo','han_thang','chu_hang','ham_luong','kho'],V)
# phieu
P=[];pid=set();miss=set()
for r in rows('Phieu'):
    r=pad(r,17)
    if not str(r[0]).strip(): continue
    i=str(r[0]).strip()
    while i in pid: i+='_dup'
    pid.add(i)
    if r[4] not in seen: miss.add(r[4])
    P.append([q(i),q(r[1]),dt(r[2]),q(r[3]),q(r[4]),num(r[5]),q(r[6]),num(r[7]) if num(r[7])!='NULL' else '0',q(r[8]),q(r[9]),q(r[10]),q(r[11]),q(r[12]),q(str(r[13]).strip()) if str(r[13]).strip() else "''",dt(r[14]),dt(r[15]),q(r[16])])
print('phieu ma not in vat_tu:',miss)
ins('phieu',['id','lap','ngay','loai','ma','so_luong','don_vi','kg','chung_tu','ghi_chu','nguoi_lap','trang_thai','lenh','lo','nsx','hsd','ncc'],P)
L=[];ls=set()
for r in rows('LenhSX'):
    r=pad(r,14)
    if not str(r[0]).strip() or r[0] in ls: continue
    ls.add(r[0])
    L.append([q(r[0]),dt(r[1]),q(r[2]),num(r[3]),q(r[4]),dt(r[5]),num(r[6]),q(r[7]),q(r[8]),q(r[9]),q(r[10]),q(r[11]),q(r[12]),num(r[13])])
ins('lenh_sx',['so','ngay','ma_sp','sl_du_kien','trang_thai','ngay_ht','sl_thuc_te','nguoi_lap','nguoi_ht','ghi_chu','khach_hang','nguoi_sx','qc_sx','ty_trong'],L)
ins('cong_thuc',['ma_sp','ma_vt','dinh_muc'],[[q(r[0]),q(r[1]),num(r[2])] for r in (pad(x,3) for x in rows('CongThuc')) if r[0] and r[1] and num(r[2])!='NULL'])
ins('qc_lo',['ma','lo','trang_thai','ngay','nguoi','ghi_chu','hsd_moi','luc'],[[q(r[0]),q(str(r[1])) if str(r[1]) else "''",q(r[2]),dt(r[3]),q(r[4]),q(r[5]),dt(r[6]),q(r[7])] for r in (pad(x,8) for x in rows('QCLo')) if r[0]])
ins('ty_trong_lo',['ma','lo','ty_trong','ngay','nguoi','luc'],[[q(r[0]),q(str(r[1])) if str(r[1]) else "''",num(r[2]),dt(r[3]),q(r[4]),q(r[5])] for r in (pad(x,6) for x in rows('TyTrongLo')) if r[0]])
ins('ham_luong_lo',['ma','lo','kiem','ngay','nguoi','ghi_chu','luc'],[[q(r[0]),q(str(r[1])) if str(r[1]) else "''",q(r[2]),dt(r[3]),q(r[4]),q(r[5]),q(r[6])] for r in (pad(x,7) for x in rows('HamLuongLo')) if r[0]])
ins('ho_so_lo',['ma','lo','loai','ten_file','link','nguoi','luc','file_id'],[[q(r[0]),q(str(r[1])) if str(r[1]) else "''",q(r[2]),q(r[3]),q(r[4]),q(r[5]),q(r[6]),q(r[7])] for r in (pad(x,8) for x in rows('HoSoLo')) if r[0]])
ins('anh_nhap',['phieu_id','ma','lo','ten_file','link','file_id','nguoi','luc'],[[q(c) for c in pad(r,8)[:8]] for r in rows('AnhNhap')])
ins('phieu_xnb',['so','ngay','ly_do','nguoi_nhan','bo_phan','ghi_chu','nguoi_lap','luc','trang_thai','da_nhap_amis','dong'],[[q(r[0]),dt(r[1])]+[q(c) for c in r[2:10]]+[jb(r[10])] for r in (pad(x,11) for x in rows('PhieuXNB')) if r[0]])
ins('lenh_dg',['so','ma_qc','ke_hoach','nguoi_lap','luc'],[[q(r[0]),q(r[1]),jb(r[2]),q(r[3]),q(r[4])] for r in (pad(x,5) for x in rows('LenhDG')) if r[0]])
H=d['QuyCachDG'][0];Q=[];qs=set()
for r in rows('QuyCachDG'):
    r=pad(r,len(H))
    if not str(r[0]).strip() or r[0] in qs: continue
    qs.add(r[0])
    Q.append([q(r[0]),q(r[1]),q(r[2]),q(r[3]),q(json.dumps({H[i]:r[i] for i in range(len(H)) if str(r[i]).strip()!=''},ensure_ascii=False))+'::jsonb'])
ins('quy_cach_dg',['ma_qc','ma_nhan','san_pham','ma_btp','du_lieu'],Q)
ins('cai_dat',['khoa','gia_tri','giai_thich'],[[q(r[0]),q(r[1]),q(r[2])] for r in (pad(x,3) for x in rows('CaiDat')) if r[0]])
ins('nguoi_dung',['ten','vai_tro','pham_vi','quyen_qc','xem_cong_thuc'],[[q(r[0]),q(r[1]),q(r[2]),b(r[3]),b(r[4])] for r in (pad(x,5) for x in rows('NguoiDung')) if r[0]])
W("""
-- Tồn kho từng mã (kg) — giống cách Sổ Kho đang tính: đầu kỳ + nhập − xuất + kiểm kê; mã không theo dõi tồn (NL.NUOC) = 0
create view ton_kho with (security_invoker = on) as
select v.ma, v.ten, v.nhom, v.don_vi, v.chu_hang, v.kho, v.toi_thieu,
  case when v.ma = any(string_to_array(replace(coalesce((select gia_tri from cai_dat where khoa='Mã không theo dõi tồn'),''),' ',''), ',')) then 0
  else round(v.dau_ky + coalesce(sum(case when p.loai='Nhập' then p.kg when p.loai='Xuất' then -p.kg else p.kg end),0), 4) end as ton_kg
from vat_tu v left join phieu p on p.ma = v.ma and coalesce(p.trang_thai,'') = ''
group by v.ma;
-- Tồn theo lô
create view ton_lo with (security_invoker = on) as
select p.ma, p.lo, min(p.nsx) as nsx, max(p.hsd) as hsd,
  round(sum(case when p.loai='Nhập' then p.kg when p.loai='Xuất' then -p.kg else p.kg end),4) as ton_kg
from phieu p where coalesce(p.trang_thai,'') = '' group by p.ma, p.lo;

-- Bảo mật: bật RLS cho mọi bảng. Chưa mở quyền cho khoá công khai — web mới sẽ thêm quyền khi có đăng nhập.
do $$ declare t text; begin
  foreach t in array array['vat_tu','phieu','lenh_sx','cong_thuc','qc_lo','ty_trong_lo','ham_luong_lo','ho_so_lo','anh_nhap','phieu_xnb','lenh_dg','quy_cach_dg','cai_dat','nguoi_dung'] loop
    execute format('alter table %I enable row level security', t);
  end loop; end $$;
commit;

-- Kiểm tra nhanh: số dòng mỗi bảng
select 'vat_tu' bang, count(*) from vat_tu union all select 'phieu', count(*) from phieu union all select 'lenh_sx', count(*) from lenh_sx
union all select 'cong_thuc', count(*) from cong_thuc union all select 'qc_lo', count(*) from qc_lo union all select 'quy_cach_dg', count(*) from quy_cach_dg;
""")
open('sokho_supabase.sql','w').write('\n'.join(out))
print(len(V),len(P),len(L),len(Q))
import os;print(os.path.getsize('sokho_supabase.sql'))
