-- V12 Phase 5 — Hiệp/Ván ghi điểm gắn theo Nhóm chơi.
--
-- Project này CHƯA dùng Supabase CLI migrations — chạy tay 1 lần file
-- này trong Supabase Dashboard > SQL Editor. Yêu cầu 2 bảng đã có sẵn
-- từ trước (không tạo lại ở đây): `nhom_choi` (id, ten, nguoi_tao_id)
-- và `thanh_vien_nhom` (nhom_id, nguoi_dung_id).

create table public.hiep_nhom (
  id uuid primary key default gen_random_uuid(),
  nhom_id uuid not null references public.nhom_choi(id) on delete cascade,
  so_thu_tu int not null,
  bat_dau timestamptz not null default now(),
  nguoi_choi text[] not null,
  chu_thich text not null default '',
  nguoi_tao_id uuid not null default auth.uid() references auth.users(id)
);

create table public.van_nhom (
  id uuid primary key default gen_random_uuid(),
  -- Lưu thẳng nhom_id (không chỉ suy ra qua hiep_id) vì bộ lọc
  -- Realtime của Supabase chỉ so sánh được cột NGAY trên bảng đang
  -- subscribe, không join sang hiep_nhom được.
  nhom_id uuid not null references public.nhom_choi(id) on delete cascade,
  hiep_id uuid not null references public.hiep_nhom(id) on delete cascade,
  so_thu_tu_trong_hiep int not null,
  lan_chia_thu int not null,
  nguoi_chia text not null,
  thoi_gian timestamptz not null default now(),
  diem jsonb not null,
  nguoi_tao_id uuid not null default auth.uid() references auth.users(id)
);

create index on public.hiep_nhom (nhom_id);
create index on public.van_nhom (nhom_id);
create index on public.van_nhom (hiep_id);

alter table public.hiep_nhom enable row level security;
alter table public.van_nhom enable row level security;

create policy "thanh vien doc hiep" on public.hiep_nhom for select
  using (exists (
    select 1 from public.thanh_vien_nhom tv
    where tv.nhom_id = hiep_nhom.nhom_id and tv.nguoi_dung_id = auth.uid()
  ));
create policy "thanh vien tao hiep" on public.hiep_nhom for insert
  with check (exists (
    select 1 from public.thanh_vien_nhom tv
    where tv.nhom_id = hiep_nhom.nhom_id and tv.nguoi_dung_id = auth.uid()
  ));

create policy "thanh vien doc van" on public.van_nhom for select
  using (exists (
    select 1 from public.thanh_vien_nhom tv
    where tv.nhom_id = van_nhom.nhom_id and tv.nguoi_dung_id = auth.uid()
  ));
create policy "thanh vien tao van" on public.van_nhom for insert
  with check (exists (
    select 1 from public.thanh_vien_nhom tv
    where tv.nhom_id = van_nhom.nhom_id and tv.nguoi_dung_id = auth.uid()
  ));

alter publication supabase_realtime add table public.hiep_nhom, public.van_nhom;
