-- V14 Phase 1 — Bảng đánh dấu admin + mở rộng RLS của hiep_ai/van_ai
-- (dữ liệu "Chơi với AI") để admin xem được TOÀN BỘ ván của MỌI người
-- chơi, phục vụ trang "Phân tích" (kiểm chứng xác suất cần mẫu lớn,
-- gộp từ nhiều người chơi thay vì chỉ riêng admin).
--
-- LƯU Ý: V14_GUIDE.md (bản gốc Huy lưu ở ~/Downloads) viết SQL giả định
-- schema `hiep`/`van` dùng chung 1 bảng + cột `nguon` ('choiAI'/'thatNgoai')
-- — đó là thiết kế NHÁP cũ trước khi V12 thật sự triển khai. Schema THẬT
-- của project tách riêng `hiep_ai`/`van_ai` (Chơi với AI, xem choi_ai.sql)
-- và `hiep_nhom`/`van_nhom` (Ghi điểm, xem ghi_diem_nhom.sql). File này
-- viết lại ĐÚNG theo schema thật — chỉ đụng vào hiep_ai/van_ai vì trang
-- Phân tích hiện chỉ đọc dữ liệu "Chơi với AI".
--
-- Chạy tay 1 lần trong Supabase Dashboard > SQL Editor, SAU KHI đã chạy
-- choi_ai.sql (yêu cầu 2 bảng hiep_ai/van_ai đã tồn tại).

create table public.quan_tri_vien (
  nguoi_dung_id uuid primary key references auth.users(id)
);

alter table public.quan_tri_vien enable row level security;

-- Ai cũng được phép kiểm tra ĐÚNG BẢN THÂN mình có phải admin không —
-- không lộ được ai KHÁC có phải admin hay không.
create policy "tu kiem tra minh co phai admin" on public.quan_tri_vien for select
  using (nguoi_dung_id = auth.uid());

-- Thêm ngoại lệ "admin xem được hết" vào 2 policy SELECT đã có từ V12
-- Phase 6 (choi_ai.sql) — CHỈ thêm 1 điều kiện OR mới, không đụng gì
-- tới điều kiện gốc (chinh chủ vẫn hoạt động y hệt như trước).
drop policy "chinh chu doc hiep ai" on public.hiep_ai;
create policy "chinh chu hoac admin doc hiep ai" on public.hiep_ai for select
  using (
    nguoi_dung_id = auth.uid()
    or auth.uid() in (select nguoi_dung_id from public.quan_tri_vien)
  );

drop policy "chinh chu doc van ai" on public.van_ai;
create policy "chinh chu hoac admin doc van ai" on public.van_ai for select
  using (
    nguoi_dung_id = auth.uid()
    or auth.uid() in (select nguoi_dung_id from public.quan_tri_vien)
  );

-- SAU KHI Huy đã đăng ký/đăng nhập bằng huy.mof@gmail.com (màn Đăng nhập
-- có từ V12): vào Authentication > Users trên Dashboard, copy UID của
-- đúng dòng email này, rồi chạy (thay UID thật vào):
--
-- insert into public.quan_tri_vien (nguoi_dung_id) values ('dán-UID-vào-đây');
