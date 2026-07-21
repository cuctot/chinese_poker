-- V12 Phase 6 — Hiệp/Ván "Chơi với AI" gắn theo CÁ NHÂN (nguoi_dung_id),
-- khác Ghi điểm (gắn theo Nhóm chơi, xem ghi_diem_nhom.sql) — bảo mật
-- theo `auth.uid()` trực tiếp, không cần bảng trung gian kiểu
-- thanh_vien_nhom vì không ai khác được chia sẻ dữ liệu này.
--
-- Chạy tay 1 lần trong Supabase Dashboard > SQL Editor.

create table public.hiep_ai (
  id uuid primary key default gen_random_uuid(),
  nguoi_dung_id uuid not null default auth.uid() references auth.users(id),
  so_thu_tu int not null,
  bat_dau timestamptz not null default now(),
  nguoi_choi text[] not null,
  chu_thich text not null default '',
  nhan_vat_doi_thu jsonb
);

create table public.van_ai (
  id uuid primary key default gen_random_uuid(),
  -- Lưu thẳng nguoi_dung_id (không chỉ suy ra qua hiep_id) — cùng lý do
  -- với van_nhom: đơn giản hóa policy, không cần join ngược lên hiep_ai.
  nguoi_dung_id uuid not null default auth.uid() references auth.users(id),
  hiep_id uuid not null references public.hiep_ai(id) on delete cascade,
  so_thu_tu_trong_hiep int not null,
  lan_chia_thu int not null,
  nguoi_chia text not null,
  thoi_gian timestamptz not null default now(),
  diem jsonb not null,
  nguoi_choi_bai_that jsonb,
  la_thang_trang boolean,
  loai_thang_trang text,
  che_do_thuc_te_doi_thu jsonb
);

create index on public.hiep_ai (nguoi_dung_id);
create index on public.van_ai (nguoi_dung_id);
create index on public.van_ai (hiep_id);

alter table public.hiep_ai enable row level security;
alter table public.van_ai enable row level security;

create policy "chinh chu doc hiep ai" on public.hiep_ai for select
  using (nguoi_dung_id = auth.uid());
create policy "chinh chu tao hiep ai" on public.hiep_ai for insert
  with check (nguoi_dung_id = auth.uid());

create policy "chinh chu doc van ai" on public.van_ai for select
  using (nguoi_dung_id = auth.uid());
create policy "chinh chu tao van ai" on public.van_ai for insert
  with check (nguoi_dung_id = auth.uid());
