# V14_PATCH.md — Đổi thứ tự nút "Thống kê" xuống dưới cùng

> **Bối cảnh**: nút "Thống kê" (trang Phân tích) vừa được gắn kiểm soát
> quyền admin ở V14 Phase 1 (`TrangChu.jsx`, xem `V14_GUIDE.md`) — đây là
> version gần nhất đụng tới file này. Huy muốn nút này nằm CUỐI danh sách
> điều hướng ở Trang chủ (sau "Luật chơi"), thay vì đứng giữa "Lịch sử"
> và "Luật chơi" như trước — vì đây là nút chỉ dành riêng cho Admin, hợp
> lý hơn khi để cuối cùng thay vì chen giữa các nút dùng chung cho mọi
> người chơi.

## Thay đổi

`src/TrangChu.jsx` — chuyển khối `<button>` "📊 Thống kê" xuống SAU khối
`<button>` "📖 Luật chơi" trong `<div className="danh-sach-dieu-huong">`.
Không đổi logic kiểm tra `laAdmin`, chỉ đổi vị trí trong JSX.

**Thứ tự nút cũ**: Chơi với AI → Chơi với bạn bè → Ghi điểm → Lịch sử →
Thống kê → Luật chơi.

**Thứ tự nút mới**: Chơi với AI → Chơi với bạn bè → Ghi điểm → Lịch sử →
Luật chơi → Thống kê.

## Kiểm tra sau khi sửa

1. Vào Trang chủ — nút "Thống kê" nằm cuối cùng, sau "Luật chơi".
2. Hành vi làm mờ/disable theo quyền admin (từ V14 Phase 1) không đổi —
   vẫn mờ + "Chỉ dành cho Admin" nếu tài khoản đang đăng nhập không có
   trong bảng `quan_tri_vien`.
