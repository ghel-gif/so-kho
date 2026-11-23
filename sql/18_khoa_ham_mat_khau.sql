-- 23/11/2026 — Đóng lỗ hổng: hàm đặt / đặt lại mật khẩu gọi được từ máy chưa đăng nhập
-- (Postgres mặc định cấp EXECUTE cho PUBLIC; kiểm tra quyền trong hàm bỏ qua khi auth.uid() rỗng).
-- Web không gọi 2 hàm này; Quản lý đặt mật khẩu bằng cách chạy hàm trong SQL editor (quyền postgres).
revoke all on function public.dat_mat_khau(text, text) from public, anon, authenticated;
revoke all on function public.dat_lai_mat_khau(text) from public, anon, authenticated;
