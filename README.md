# Sổ Kho — bản mới (Supabase)

Phần mềm theo dõi nhập / xuất / kiểm kê / tồn kho (kg) của Công ty CP BVTV Asata Hoa Kỳ,
chạy song song với Sổ Kho cũ trên Google Sheet.

- Giao diện: `index.html`, `app.js` (web tĩnh, chạy trên GitHub Pages)
- Dữ liệu: Supabase (Postgres), khoá công khai trong `config.js`; dữ liệu được bảo vệ bằng đăng nhập + RLS
- `sql/02_dang_nhap_quyen.sql`: đăng nhập, phân quyền, hàm lưu phiếu (`luu_phieu`), huỷ phiếu, QC lô
- `sql/tao_tu_google_sheet.py`: tạo file SQL chép dữ liệu từ bản xuất JSON của Sổ Kho cũ

Đợt 1: đăng nhập, tồn kho, tồn theo lô, phiếu nhập / xuất / kiểm kê, lịch sử, huỷ phiếu, QC lô.
Đợt sau: lệnh SX, đóng gói, xuất nội bộ, báo cáo, in phiếu.
