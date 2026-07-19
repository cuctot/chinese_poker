# CLAUDE.md

Hướng dẫn cho Claude Code khi làm việc trong repo này.

## Dự án

Game bài Mậu Binh (Chinese Poker/Pusoy) chạy trên trình duyệt — React +
Vite. Lịch sử phát triển theo từng version, mỗi version có tài liệu
riêng ở `docs/V*_GUIDE.md` (V1 tới V11), và `docs/V12_GUIDE.md` nếu đã
sao chép vào (bản gốc hiện ở `~/Downloads/V12_GUIDE.md`) mô tả kế hoạch
chuyển "Ghi điểm" (theo Nhóm chơi) và "Chơi với AI" (theo cá nhân) sang
Supabase — đăng nhập bằng email, RLS theo nhóm/cá nhân tương ứng.

Trạng thái V12 (tính tới thời điểm ghi chú này): đã xong đăng nhập,
Nhóm chơi, và Ghi điểm đọc/ghi qua Supabase (`hiep_nhom`/`van_nhom`,
xem `supabase/ghi_diem_nhom.sql`) kèm đồng bộ Realtime. "Chơi với AI"
CHƯA chuyển sang Supabase — vẫn dùng `localStorage` như V6-V11.

## Quy ước đặt tên (LƯU Ý: có xung đột với code hiện tại)

Quy ước chính thức, áp dụng xuyên suốt dự án:
- Mọi tên hàm, biến, file, class, tên bảng/cột cơ sở dữ liệu... đặt
  bằng **tiếng Anh chuẩn** — `camelCase` cho JS/TS, `snake_case` cho
  SQL.
- Comment giải thích trong code có thể viết tiếng Việt.
- Toàn bộ giao diện người dùng (chữ hiển thị, thông báo, nhãn nút...)
  viết **tiếng Việt có dấu đầy đủ**.
- Không trộn lẫn 2 ngôn ngữ trong cùng 1 tên định danh.

⚠️ Toàn bộ code hiện tại (từ V1 tới V12 Phase 5) đặt tên NGƯỢC LẠI — tên
file, tên hàm, tên biến đều bằng tiếng Việt (`GhiDiem.jsx`,
`batDauHiepMoi`, `danhSachHiep`, `nguoiChoi`, bảng `hiep_nhom`/`van_nhom`
với cột `nguoi_choi`/`chu_thich`...). Quy ước tiếng Anh này áp dụng cho
CODE MỚI viết từ nay trở đi — code cũ giữ nguyên tiếng Việt cho tới khi
Huy yêu cầu đổi tên riêng (không tự ý đổi tên hàng loạt code cũ nếu
không được yêu cầu).

## Dev server

**KHÔNG tự khởi động hoặc dừng dev server (`npm run dev`).** Huy tự quản
lý server ở 1 terminal riêng, luôn để chạy liên tục. Khi cần kiểm tra
app đang chạy, giả định server đã sẵn có ở `http://localhost:5183` —
không chạy `npm run dev`/`vite preview` rồi tự tắt như các phiên trước.
