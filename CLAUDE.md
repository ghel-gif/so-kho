
## Phiên bản
- Mỗi lần sửa xong và đẩy lên web: chạy `./bump.sh "ghi chú ngắn"` (tăng 3.4.0 → 3.4.1, số cuối chỉ 1 chữ số: 3.4.9 → 3.5.0, 3.9.9 → 4.0.0; `./bump.sh minor "…"` cho thay đổi lớn) để cập nhật APP_VER trong index.html và version.txt. Người dùng xem số phiên bản ở đầu trang để biết web đã tải bản mới; máy đang mở bản cũ sẽ hiện nút "Có phiên bản mới – bấm để tải lại".

## Định dạng số (người dùng đã nhắc nhiều lần — luôn áp dụng khi làm màn hình / bản in mới)
- **Tỷ trọng luôn 3 số lẻ** (1,090 — không viết 1,09 hay 1,1). Dùng `ttf()` trong index.html hoặc `toFixed(3)`.
- **Phiếu in cho xưởng sản xuất** (định mức phối liệu, hướng dẫn phối liệu…): **không tách hàng nghìn bằng dấu chấm** (viết 1001,56, không viết 1.001,56 — xưởng đọc nhầm thành số lẻ); dấu phẩy thập phân; khối lượng kg 1 số lẻ như mẫu Excel BM.02 (1100,0; số lẻ hơn thì giữ 2 số: 0,05), %w/w 2 số lẻ, lít 1 số lẻ.
- Phiếu định lượng đóng gói BM.04 / BM.05 / BM.06: giới hạn khối lượng 1 số lẻ (29,0).
