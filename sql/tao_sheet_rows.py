"""Tạo file SQL nạp dữ liệu Sổ Kho cũ (bản xuất JSON) vào bảng sheet_rows. Dùng: python3 tao_sheet_rows.py export.json out.sql"""
import json, sys
d = json.load(open(sys.argv[1]))
q = lambda s: "'" + s.replace("'", "''") + "'"
out = ["begin;", "delete from sheet_rows;", "delete from sheet_ver;"]
for name, rows in d.items():
    if name == 'NguoiDung':  # bản xuất bỏ cột PIN → chèn lại cột trống để giữ đúng vị trí cột
        rows = [[r[0], ''] + list(r[1:]) for r in rows]
    vals = []
    for i, r in enumerate(rows):
        r = list(r)
        while r and r[-1] == '': r.pop()
        vals.append(f"({q(name)},{i},{q(json.dumps(r, ensure_ascii=False))}::jsonb)")
    for k in range(0, len(vals), 300):
        out.append("insert into sheet_rows(sheet,idx,data) values\n" + ",\n".join(vals[k:k+300]) + ";")
    out.append(f"insert into sheet_ver(sheet,ver) values ({q(name)},1);")
out.append("commit;")
out.append("select sheet, count(*) from sheet_rows group by sheet order by sheet;")
open(sys.argv[2], 'w').write("\n".join(out))
