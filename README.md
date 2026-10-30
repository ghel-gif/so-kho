# Sổ Kho — bản mới (Supabase)

Phần mềm theo dõi nhập / xuất / kiểm kê / tồn kho (kg) của Công ty CP BVTV Asata Hoa Kỳ,
chạy song song với Sổ Kho cũ trên Google Sheet.

- Giao diện: `index.html` = giao diện Sổ Kho cũ (giữ nguyên menu, cách nhập), làm mịn thêm bằng `web.css`
- `server.gs` = mã máy chủ Sổ Kho cũ, chạy trong trình duyệt nhờ `gas-shim.js` (giả lập Google Sheet trên dữ liệu Supabase)
- Dữ liệu: bảng `sheet_rows` giữ đúng cấu trúc từng trang của Google Sheet; ghi qua hàm `ghi_nhieu` (có kiểm tra 2 người sửa cùng lúc)
- Đăng nhập: tài khoản Supabase (tên + mật khẩu), bảng `nguoi_dung`
- `sql/`: các bước tạo cơ sở dữ liệu; `sql/tao_sheet_rows.py` tạo file nạp dữ liệu từ bản xuất JSON của Sổ Kho cũ

Chưa có ở bản web (cần Google Drive / email): tải ảnh, hồ sơ lô (COA), xuất file Excel phiếu xuất lên Drive, gửi email cảnh báo, sao lưu đêm.
