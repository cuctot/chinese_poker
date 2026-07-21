-- V13 Phase 1 — Thêm cột chi_tiet_ca_van vào van_ai (loại bài từng chi,
-- có binh lủng/ăn sập không, của MỖI người chơi trong ván) — chỉ áp dụng
-- ván "Chơi với AI" thắng thường (thắng trắng không chia 3 chi nên NULL).
--
-- Chạy tay 1 lần trong Supabase Dashboard > SQL Editor, SAU KHI đã chạy
-- choi_ai.sql (yêu cầu bảng van_ai đã tồn tại).

alter table public.van_ai add column chi_tiet_ca_van jsonb;
