# V12_GUIDE.md — Cơ sở dữ liệu tập trung (Supabase) cho Ghi điểm + Chơi với AI

> **Dành cho ai đọc file này:**
> - Nếu bạn là **Claude Code**: làm theo ĐÚNG THỨ TỰ 9 Phase bên dưới.
>   MỖI Phase xong phải DỪNG LẠI, báo cáo đã làm gì, để Huy tự kiểm tra
>   trước khi sang Phase tiếp theo. **Khác các version trước**: phần này
>   không kiểm thử được bằng Node.js thuần (không phải thuật toán, mà là
>   tích hợp dịch vụ bên ngoài) — checklist mỗi Phase dựa vào kiểm tra
>   qua trình duyệt/dashboard Supabase.
> - Nếu bạn là **Huy**: 1 vài bước ở Phase 1 CẦN CHÍNH BẠN tự làm qua
>   trình duyệt (tạo tài khoản, tạo project) — Claude Code không tự làm
>   thay được vì cần đăng nhập tài khoản cá nhân của bạn.

## Phạm vi V12 — thay đổi kiến trúc LỚN NHẤT từ trước tới giờ

Lần đầu tiên dự án có 1 phần "phía ngoài" (Supabase) — không còn 100%
chạy trong trình duyệt như từ V1 tới giờ.

- **Cả 2 nguồn đều chuyển lên Supabase**: "Ghi điểm" (thuộc về 1 NHÓM
  chơi, nhiều người cùng xem) và "Chơi với AI" (thuộc về CÁ NHÂN, chỉ
  chính chủ xem được, không chia sẻ nhóm).
- **Đăng nhập bằng email** — bảo vệ dữ liệu, biết ai đang xem/ghi gì.
- **Nhóm chơi**: ai cũng tự tạo được, mời người khác bằng email.
- **KHÔNG di chuyển dữ liệu local cũ** — dữ liệu Ghi điểm/Chơi AI đã lưu
  trong trình duyệt (V6-V11) giữ nguyên RIÊNG BIỆT, không tự động đưa
  lên Supabase, không mất đi nhưng cũng không hiện chung với dữ liệu mới.

**2 kiểu bảo mật khác nhau trên CÙNG hệ thống** (đây là điểm kỹ thuật
quan trọng nhất của cả V12):
- Ghi điểm: bảo vệ theo NHÓM (ai thuộc nhóm mới xem/ghi được dữ liệu của
  nhóm đó).
- Chơi với AI: bảo vệ theo CÁ NHÂN (chỉ chính người chơi mới xem/ghi
  được dữ liệu của chính mình, không ai khác xem được, kể cả người cùng
  nhóm Ghi điểm).

---

## Phase 1 — Tạo project Supabase (CẦN HUY TỰ LÀM)

Mục tiêu: có 1 project Supabase thật, lấy được 2 thông tin cần thiết để
kết nối app: URL và Anon Key.

### Bước 1 — Tạo tài khoản + project (làm qua trình duyệt, không phải VS Code)

1. Vào `supabase.com`, đăng ký tài khoản (có thể dùng GitHub để đăng
   nhập nhanh).
2. Bấm "New Project" — đặt tên (vd "mau-binh"), chọn mật khẩu database
   (LƯU LẠI mật khẩu này ở nơi an toàn, sẽ cần dùng sau).
3. Đợi vài phút để Supabase khởi tạo xong project.

### Bước 2 — Lấy URL và Anon Key

Vào **Project Settings → API** — copy lại 2 giá trị:
- **Project URL** (dạng `https://xxxxx.supabase.co`)
- **anon public key** (chuỗi dài, bắt đầu `eyJ...`)

**Giải thích:** "anon key" là khóa AN TOÀN để đặt trong code phía trình
duyệt (client) — không giống mật khẩu bí mật, nó được thiết kế để lộ ra
công khai, vì bản thân nó KHÔNG cho phép làm gì cả nếu không có RLS (Row
Level Security, sẽ cấu hình ở Phase 2) đồng ý. TUYỆT ĐỐI KHÔNG dùng
"service_role key" (1 khóa khác cũng có trong trang đó) ở phía trình
duyệt — khóa đó bỏ qua MỌI luật bảo mật, lộ ra là mất an toàn hoàn toàn.

### Bước 3 — Lưu 2 giá trị vào file môi trường của project

Tạo file `.env.local` ở thư mục gốc project (Vite tự đọc file này):
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Thêm `.env.local` vào `.gitignore` (nếu chưa có) — KHÔNG đưa file này
lên Git, dù anon key an toàn để lộ, vẫn nên giữ thói quen không commit
file cấu hình môi trường.

### Bước 4 — Cài thư viện + kết nối

```bash
npm install @supabase/supabase-js
```

Tạo file mới `src/supabaseClient.js`:
```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Kiểm tra Phase 1

1. File `.env.local` tồn tại, đủ 2 dòng, đúng giá trị đã copy.
2. Chạy `npm run dev` — không có lỗi Console về "supabaseUrl is
   required" hay tương tự (nghĩa là đọc biến môi trường thành công).

Dừng lại ở đây. Xác nhận đúng trước khi báo cáo và sang Phase 2.

---

## Phase 2 — Thiết kế database + bật bảo mật RLS

Mục tiêu: 4 bảng dữ liệu trên Supabase, mỗi bảng bật RLS đúng kiểu bảo
mật tương ứng (nhóm hoặc cá nhân).

### Bước 1 — Tạo bảng qua SQL Editor (Supabase Dashboard)

Vào **SQL Editor** trong dashboard Supabase, chạy đoạn SQL sau:

```sql
-- Nhóm chơi
create table nhom_choi (
  id uuid primary key default gen_random_uuid(),
  ten text not null,
  nguoi_tao_id uuid references auth.users(id) not null,
  tao_luc timestamptz default now()
);

-- Thành viên của từng nhóm (1 người có thể ở nhiều nhóm)
create table thanh_vien_nhom (
  nhom_id uuid references nhom_choi(id) on delete cascade,
  nguoi_dung_id uuid references auth.users(id),
  primary key (nhom_id, nguoi_dung_id)
);

-- Hiệp — dùng CHUNG cho cả 2 nguồn, phân biệt bằng "nguon"
create table hiep (
  id uuid primary key default gen_random_uuid(),
  nguon text not null check (nguon in ('thatNgoai', 'choiAI')),
  nhom_id uuid references nhom_choi(id), -- CHỈ có giá trị nếu nguon='thatNgoai'
  nguoi_dung_id uuid references auth.users(id), -- CHỈ có giá trị nếu nguon='choiAI'
  so_thu_tu int not null,
  bat_dau timestamptz default now(),
  nguoi_choi jsonb not null, -- mảng tên 4 người chơi
  chu_thich text default '',
  nhan_vat_doi_thu jsonb -- chỉ có ý nghĩa với choiAI
);

-- Ván
create table van (
  id uuid primary key default gen_random_uuid(),
  hiep_id uuid references hiep(id) on delete cascade,
  so_thu_tu_trong_hiep int,
  lan_chia_thu int,
  nguoi_chia text,
  thoi_gian timestamptz default now(),
  nguon text not null check (nguon in ('thatNgoai', 'choiAI')),
  diem jsonb not null,
  nguoi_choi_bai_that jsonb, -- chỉ choiAI
  la_thang_trang boolean,
  loai_thang_trang text,
  che_do_thuc_te_doi_thu jsonb, -- chỉ choiAI
  chi_tiet_ca_van jsonb -- chỉ choiAI, từ V13
);
```

**Giải thích:** đây chính là mô hình dữ liệu Hiệp/Ván đã dùng xuyên suốt
từ V8 (localStorage), CHUYỂN NGUYÊN VẸN sang dạng bảng Postgres — chỉ
thêm `nhom_id`/`nguoi_dung_id` để biết Hiệp đó thuộc về nhóm nào (Ghi
điểm) hay cá nhân nào (Chơi AI). Dùng kiểu `jsonb` (JSON lưu trong
Postgres) cho các field vốn là object/mảng phức tạp (`nguoi_choi`,
`diem`, `nguoi_choi_bai_that`...) — tránh phải tách thành nhiều bảng con
nhỏ lẻ, giữ đúng "hình dạng" dữ liệu JavaScript quen thuộc.

### Bước 2 — Bật RLS + viết policy cho từng bảng

```sql
alter table nhom_choi enable row level security;
alter table thanh_vien_nhom enable row level security;
alter table hiep enable row level security;
alter table van enable row level security;

-- nhom_choi: chỉ thành viên của nhóm mới xem được nhóm đó
create policy "Xem nhóm mình thuộc về"
  on nhom_choi for select
  using (id in (select nhom_id from thanh_vien_nhom where nguoi_dung_id = auth.uid()));

-- Ai đăng nhập cũng tạo được nhóm mới
create policy "Tạo nhóm mới"
  on nhom_choi for insert
  with check (nguoi_tao_id = auth.uid());

-- thanh_vien_nhom: xem được danh sách thành viên của nhóm mình thuộc về
create policy "Xem thành viên nhóm mình"
  on thanh_vien_nhom for select
  using (nhom_id in (select nhom_id from thanh_vien_nhom where nguoi_dung_id = auth.uid()));

create policy "Tự thêm mình vào nhóm (khi được mời)"
  on thanh_vien_nhom for insert
  with check (nguoi_dung_id = auth.uid());

-- hiep: 2 NHÁNH bảo mật khác nhau tùy "nguon"
create policy "Xem Hiệp (nhóm HOẶC cá nhân)"
  on hiep for select
  using (
    (nguon = 'choiAI' and nguoi_dung_id = auth.uid())
    or
    (nguon = 'thatNgoai' and nhom_id in (select nhom_id from thanh_vien_nhom where nguoi_dung_id = auth.uid()))
  );

create policy "Tạo Hiệp (nhóm HOẶC cá nhân)"
  on hiep for insert
  with check (
    (nguon = 'choiAI' and nguoi_dung_id = auth.uid())
    or
    (nguon = 'thatNgoai' and nhom_id in (select nhom_id from thanh_vien_nhom where nguoi_dung_id = auth.uid()))
  );

-- van: kiểm tra qua Hiệp cha (van không tự có nhom_id/nguoi_dung_id
-- riêng, phải join ngược lên hiep để biết ai được xem)
create policy "Xem Ván (qua Hiệp cha)"
  on van for select
  using (
    hiep_id in (
      select id from hiep where
        (nguon = 'choiAI' and nguoi_dung_id = auth.uid())
        or
        (nguon = 'thatNgoai' and nhom_id in (select nhom_id from thanh_vien_nhom where nguoi_dung_id = auth.uid()))
    )
  );

create policy "Tạo Ván (qua Hiệp cha)"
  on van for insert
  with check (
    hiep_id in (
      select id from hiep where
        (nguon = 'choiAI' and nguoi_dung_id = auth.uid())
        or
        (nguon = 'thatNgoai' and nhom_id in (select nhom_id from thanh_vien_nhom where nguoi_dung_id = auth.uid()))
    )
  );
```

**Giải thích:** đây chính là điểm đã cảnh báo từ đầu — 1 project Supabase
THẬT SỰ đã từng bị rò rỉ 1,5 triệu bản ghi hồi đầu 2026 chỉ vì QUÊN bật
RLS (2 câu SQL đơn giản `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` là
đủ để tránh, nhưng thiệt hại đã xảy ra trước khi kịp sửa). **BẮT BUỘC**
bật RLS cho MỌI bảng chứa dữ liệu người dùng TRƯỚC KHI đưa app lên dùng
thật — nếu không, BẤT KỲ AI có `anon key` (vốn công khai trong code
client) đều đọc/ghi được TOÀN BỘ dữ liệu của MỌI người dùng, không phân
biệt nhóm nào. `auth.uid()` là hàm Supabase cung cấp sẵn, tự động trả về
ID của người ĐANG đăng nhập gọi API — không cần code phía app tự gửi
"tôi là ai", Supabase tự xác thực qua token đăng nhập.

### Kiểm tra Phase 2

1. Vào **Table Editor** trên dashboard — thấy đủ 4 bảng.
2. Vào **Authentication → Policies** — mỗi bảng đều có ít nhất 1 policy,
   biểu tượng RLS hiện "Enabled" (màu xanh), KHÔNG phải "Disabled".
3. Thử query bằng `anon key` mà CHƯA đăng nhập (qua SQL Editor, chạy
   `select * from hiep;` với vai trò `anon`) — phải trả về RỖNG (vì chưa
   có `auth.uid()` nào khớp).

Dừng lại ở đây. Xác nhận cả 3 điều trên đúng trước khi báo cáo và sang
Phase 3.

---

## Phase 3 — Màn hình Đăng nhập / Đăng ký

Mục tiêu: đăng nhập bằng email + mật khẩu qua Supabase Auth.

### Bước 1 — Tạo file mới `src/DangNhap.jsx`

```jsx
import { useState } from 'react'
import { supabase } from './supabaseClient.js'

function DangNhap({ onDangNhapThanhCong }) {
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [dangDangKy, setDangDangKy] = useState(false);
  const [loi, setLoi] = useState('');
  const [dangXuLy, setDangXuLy] = useState(false);

  async function xuLy() {
    setLoi(''); setDangXuLy(true);
    const ketQua = dangDangKy
      ? await supabase.auth.signUp({ email, password: matKhau })
      : await supabase.auth.signInWithPassword({ email, password: matKhau });
    setDangXuLy(false);
    if (ketQua.error) {
      setLoi(ketQua.error.message);
      return;
    }
    onDangNhapThanhCong();
  }

  return (
    <div className="trang-dang-nhap">
      <h2>{dangDangKy ? 'Đăng ký' : 'Đăng nhập'}</h2>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
             style={{ display: 'block', width: '100%', marginBottom: 8 }} />
      <input type="password" placeholder="Mật khẩu" value={matKhau} onChange={e => setMatKhau(e.target.value)}
             style={{ display: 'block', width: '100%', marginBottom: 8 }} />
      {loi && <p className="ghi-chu-canh-bao">{loi}</p>}
      <button className="nut-choi" onClick={xuLy} disabled={dangXuLy}>
        {dangXuLy ? 'Đang xử lý...' : (dangDangKy ? 'Đăng ký' : 'Đăng nhập')}
      </button>
      <button className="nut-choi" onClick={() => setDangDangKy(d => !d)} style={{ marginTop: 8 }}>
        {dangDangKy ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
      </button>
    </div>
  );
}

export default DangNhap;
```

**Giải thích:** `supabase.auth.signUp`/`signInWithPassword` là 2 hàm có
sẵn từ thư viện Supabase — không cần tự viết logic mã hóa mật khẩu, gửi
email xác nhận... Supabase lo hết phần đó. Mặc định Supabase sẽ gửi 1
email xác nhận sau khi đăng ký — Huy cần kiểm tra hộp thư và bấm link
xác nhận trước khi đăng nhập được lần đầu (có thể tắt yêu cầu này trong
Dashboard → Authentication → Settings nếu muốn thử nhanh mà không cần
xác nhận email).

### Bước 2 — Gắn vào `App.jsx`: chỉ vào được app khi đã đăng nhập

```jsx
import { supabase } from './supabaseClient.js'
import DangNhap from './DangNhap.jsx'

const [nguoiDangNhap, setNguoiDangNhap] = useState(null);
const [dangTaiPhien, setDangTaiPhien] = useState(true);

useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setNguoiDangNhap(data.session?.user ?? null);
    setDangTaiPhien(false);
  });
  const { data: listener } = supabase.auth.onAuthStateChange((_su, session) => {
    setNguoiDangNhap(session?.user ?? null);
  });
  return () => listener.subscription.unsubscribe();
}, []);
```

```jsx
if (dangTaiPhien) return <p>Đang tải...</p>;
if (!nguoiDangNhap) return <DangNhap onDangNhapThanhCong={() => {}} />;
// ...toàn bộ nội dung app hiện tại (trang chủ, chơi AI, ghi điểm...) giữ nguyên, đặt SAU dòng này...
```

**Giải thích:** `onAuthStateChange` là 1 "lắng nghe" tự động — Supabase
tự báo lại MỖI KHI trạng thái đăng nhập đổi (đăng nhập, đăng xuất, token
hết hạn tự làm mới...), không cần tự kiểm tra thủ công định kỳ.
`getSession()` kiểm tra NGAY LÚC MỞ APP xem có phiên đăng nhập cũ còn
hiệu lực không (Supabase tự lưu token vào trình duyệt, không cần đăng
nhập lại mỗi lần mở app).

### Kiểm tra Phase 3

1. Mở app lần đầu (chưa đăng nhập) — thấy màn Đăng nhập, không vào được
   nội dung chính.
2. Đăng ký tài khoản mới — xác nhận email (nếu bật) — đăng nhập được.
3. Tắt/mở lại trình duyệt — vẫn đang đăng nhập (không phải đăng nhập lại
   từ đầu).

Dừng lại ở đây. Xác nhận cả 3 điều trên đúng trước khi báo cáo và sang
Phase 4.

---

## Phase 4 — Quản lý Nhóm chơi (`src/NhomChoi.jsx`)

Mục tiêu: tạo nhóm mới, mời thành viên bằng email, chọn nhóm đang dùng
cho Ghi điểm.

### Bước 1 — Tạo file mới `src/NhomChoi.jsx`

```jsx
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient.js'

function NhomChoi({ nguoiDangNhap, onChonNhom }) {
  const [danhSachNhom, setDanhSachNhom] = useState([]);
  const [tenNhomMoi, setTenNhomMoi] = useState('');
  const [emailMoi, setEmailMoi] = useState('');
  const [nhomDangXem, setNhomDangXem] = useState(null);

  useEffect(() => {
    supabase.from('nhom_choi').select('*').then(({ data }) => setDanhSachNhom(data || []));
  }, []);

  async function taoNhom() {
    if (!tenNhomMoi.trim()) return;
    const { data, error } = await supabase.from('nhom_choi')
      .insert({ ten: tenNhomMoi.trim(), nguoi_tao_id: nguoiDangNhap.id })
      .select().single();
    if (error) { alert(error.message); return; }
    await supabase.from('thanh_vien_nhom').insert({ nhom_id: data.id, nguoi_dung_id: nguoiDangNhap.id });
    setDanhSachNhom(prev => [...prev, data]);
    setTenNhomMoi('');
  }

  async function moiThanhVien(nhomId) {
    // ĐƠN GIẢN HÓA: tìm user theo email qua 1 hàm Postgres riêng (Bước 2)
    const { data, error } = await supabase.rpc('moi_thanh_vien_theo_email', {
      p_nhom_id: nhomId, p_email: emailMoi.trim(),
    });
    if (error) { alert(error.message); return; }
    alert('Đã mời thành công!');
    setEmailMoi('');
  }

  return (
    <div className="khoi-luat">
      <div className="khoi-luat-tieu-de">Nhóm chơi của bạn</div>
      {danhSachNhom.map(nhom => (
        <div key={nhom.id} className="the-preset">
          <div className="the-preset-ten" style={{ cursor: 'pointer' }}
               onClick={() => { setNhomDangXem(nhom.id); onChonNhom(nhom); }}>
            {nhom.ten}
          </div>
          {nhomDangXem === nhom.id && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input type="email" placeholder="Email người muốn mời" value={emailMoi}
                     onChange={e => setEmailMoi(e.target.value)} />
              <button className="nut-choi" onClick={() => moiThanhVien(nhom.id)}>Mời</button>
            </div>
          )}
        </div>
      ))}
      <div className="khoi-luu-rieng">
        <input type="text" placeholder="Tên nhóm mới..." value={tenNhomMoi}
               onChange={e => setTenNhomMoi(e.target.value)} />
        <button className="nut-choi" onClick={taoNhom} disabled={!tenNhomMoi.trim()}>Tạo nhóm</button>
      </div>
    </div>
  );
}

export default NhomChoi;
```

### Bước 2 — Hàm Postgres để mời theo email (chạy trong SQL Editor)

```sql
create or replace function moi_thanh_vien_theo_email(p_nhom_id uuid, p_email text)
returns void
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = p_email;
  if v_user_id is null then
    raise exception 'Không tìm thấy tài khoản với email này';
  end if;
  insert into thanh_vien_nhom (nhom_id, nguoi_dung_id) values (p_nhom_id, v_user_id)
    on conflict do nothing;
end;
$$;
```

**Giải thích:** vì bảng `auth.users` (do Supabase quản lý) KHÔNG cho
phép app phía client tự do `SELECT` để "tìm ai có email này" (lý do bảo
mật — không muốn lộ danh sách toàn bộ user), cần 1 **hàm Postgres** chạy
với quyền `security definer` (tạm hiểu: "chạy với quyền của người TẠO
hàm", không phải quyền người GỌI hàm) để làm việc TRA CỨU này 1 cách có
kiểm soát — chỉ cho phép đúng 1 thao tác cụ thể (thêm vào
`thanh_vien_nhom`), không mở toang quyền xem hết `auth.users`.

### Kiểm tra Phase 4

1. Tạo 1 nhóm mới — hiện trong danh sách ngay.
2. Mời 1 email KHÔNG tồn tại — hiện lỗi rõ ràng.
3. Tạo 2 tài khoản test (2 email khác nhau), mời tài khoản B vào nhóm của
   tài khoản A — đăng nhập bằng B, xác nhận thấy đúng nhóm đó.

Dừng lại ở đây. Xác nhận cả 3 điều trên đúng trước khi báo cáo và sang
Phase 5.

---

## Phase 5 — Ghi điểm: chuyển từ localStorage sang Supabase

Mục tiêu: `GhiDiem.jsx` gọi Supabase thay vì `localStorage`, gắn đúng
`nhom_id` đang chọn.

### Bước 1 — Thay các hàm đọc/ghi

Thay `docDanhSach(KHOA_HIEP)`/`ghiDanhSach(...)` bằng:
```jsx
async function taoHiepMoiSupabase(nhomId, nguoiChoi, chuThich) {
  const { data, error } = await supabase.from('hiep')
    .insert({ nguon: 'thatNgoai', nhom_id: nhomId, so_thu_tu: /* xem Bước 2 */ 0, nguoi_choi: nguoiChoi, chu_thich: chuThich })
    .select().single();
  if (error) throw error;
  return data;
}

async function luuVanSupabase(hiepId, vanData) {
  const { error } = await supabase.from('van').insert({ hiep_id: hiepId, nguon: 'thatNgoai', ...vanData });
  if (error) throw error;
}

async function layHiepDangDoSupabase(nhomId) {
  const { data } = await supabase.from('hiep')
    .select('*, van(*)')
    .eq('nguon', 'thatNgoai').eq('nhom_id', nhomId)
    .order('so_thu_tu', { ascending: false });
  return (data || []).find(h => (h.van?.length || 0) < 12) || null;
}
```

### Bước 2 — Tính `so_thu_tu` (đếm toàn cục) qua Supabase

Vì nhiều người có thể tạo Hiệp CÙNG LÚC (đúng bản chất nhiều người dùng
chung 1 CSDL — khác hẳn localStorage chỉ 1 mình dùng), KHÔNG thể đếm đơn
giản kiểu "đọc số cũ rồi +1" (2 người cùng đọc, cùng +1, dễ bị TRÙNG số).
Dùng 1 **sequence** của Postgres (tự tăng, an toàn khi nhiều người dùng
cùng lúc):

```sql
create sequence hiep_thatngoai_seq;
create sequence hiep_choiai_seq;
```

Sửa lại `taoHiepMoiSupabase` để lấy số từ sequence:
```jsx
async function laySoThuTuTiepTheo(nguon) {
  const tenSequence = nguon === 'choiAI' ? 'hiep_choiai_seq' : 'hiep_thatngoai_seq';
  const { data, error } = await supabase.rpc('lay_so_tiep_theo', { p_sequence: tenSequence });
  if (error) throw error;
  return data;
}
```

```sql
create or replace function lay_so_tiep_theo(p_sequence text)
returns int language plpgsql as $$
begin
  return nextval(p_sequence);
end;
$$;
```

**Giải thích:** đây là điểm KHÁC BIỆT CĂN BẢN so với localStorage — trước
đây (V6-V11), `localStorage` chỉ có 1 người dùng (chính Huy), không bao
giờ có 2 thao tác "đọc số cũ, +1, ghi lại" xảy ra ĐỒNG THỜI. Giờ NHIỀU
người có thể cùng lúc bắt đầu 1 Hiệp mới — nếu vẫn dùng kiểu "đọc rồi +1"
cũ, 2 người có thể VÔ TÌNH nhận CÙNG 1 số thứ tự (race condition). Dùng
`sequence` của Postgres giải quyết đúng vấn đề này — cơ sở dữ liệu tự
đảm bảo mỗi lần gọi `nextval()` luôn trả về số KHÁC NHAU, dù có bao nhiêu
người gọi cùng lúc.

### Kiểm tra Phase 5

1. Ghi 1 hiệp mới qua Ghi điểm — vào Table Editor Supabase, thấy đúng
   dữ liệu.
2. Đăng nhập bằng tài khoản THỨ 2 (đã mời ở Phase 4) cùng nhóm — thấy
   ĐÚNG hiệp vừa ghi (chia sẻ đúng theo nhóm).
3. Đăng nhập bằng tài khoản KHÔNG thuộc nhóm — KHÔNG thấy gì (RLS chặn
   đúng).

Dừng lại ở đây. Xác nhận cả 3 điều trên đúng trước khi báo cáo và sang
Phase 6.

---

## Phase 6 — Chơi với AI: chuyển từ localStorage sang Supabase

Mục tiêu: tương tự Phase 5, nhưng gắn theo `nguoi_dung_id` (cá nhân) thay
vì `nhom_id`.

### Bước 1 — Thay đổi tương tự Phase 5, đổi field khóa

```jsx
async function damBaoHiepAISupabase(nguoiDungId) {
  const { data } = await supabase.from('hiep')
    .select('*, van(*)')
    .eq('nguon', 'choiAI').eq('nguoi_dung_id', nguoiDungId)
    .order('so_thu_tu', { ascending: false });
  let hiep = (data || []).find(h => (h.van?.length || 0) < 12);
  if (!hiep) {
    const soThuTu = await laySoThuTuTiepTheo('choiAI');
    const { data: hiepMoi } = await supabase.from('hiep')
      .insert({ nguon: 'choiAI', nguoi_dung_id: nguoiDungId, so_thu_tu: soThuTu, nguoi_choi: TEN_AI_CO_DINH })
      .select().single();
    hiep = hiepMoi;
  }
  return hiep;
}
```

**Giải thích:** logic GẦN NHƯ Y HỆT Phase 5 — chỉ đổi `nhom_id` thành
`nguoi_dung_id`, và điều kiện lọc `.eq('nguon', 'choiAI')` thay vì
`'thatNgoai'`. Đây là lợi ích của việc đã thiết kế 2 nguồn dùng CHUNG 1
cấu trúc bảng từ Phase 2 — code cho 2 nguồn chỉ khác nhau đúng 1-2 dòng.

### Kiểm tra Phase 6

1. Chơi 1 ván AI — Table Editor thấy đúng dữ liệu, `nguoi_dung_id` đúng
   người vừa chơi.
2. Đăng nhập tài khoản KHÁC — KHÔNG thấy ván AI của người kia (dù đó là
   người cùng nhóm Ghi điểm) — xác nhận đúng "cá nhân, không chia sẻ".

Dừng lại ở đây. Xác nhận cả 2 điều trên đúng trước khi báo cáo và sang
Phase 7.

---

## Phase 7 — Lịch sử: đọc từ Supabase thay vì localStorage

Mục tiêu: `LichSu.jsx` (cả 2 tab) đọc dữ liệu qua Supabase.

### Bước 1 — Thay lời gọi đọc dữ liệu

```jsx
useEffect(() => {
  async function taiDuLieu() {
    const nguonHienTai = tabDangXem === 'thatNgoai' ? 'thatNgoai' : 'choiAI';
    let query = supabase.from('hiep').select('*, van(*)').eq('nguon', nguonHienTai);
    if (nguonHienTai === 'choiAI') query = query.eq('nguoi_dung_id', nguoiDangNhap.id);
    else query = query.eq('nhom_id', nhomDangChon.id);
    const { data } = await query.order('so_thu_tu', { ascending: false });
    setDanhSachHiep(data || []);
  }
  taiDuLieu();
}, [tabDangXem, nhomDangChon]);
```

**Giải thích:** khác với `localStorage` (đọc TỨC THÌ, đồng bộ), gọi
Supabase là **bất đồng bộ** (`await`, cần thời gian chờ mạng) — cần đặt
trong `useEffect` + `async function`, không thể đọc trực tiếp lúc render
như trước. Nên cân nhắc thêm trạng thái "đang tải" (xem Phase 8).

### Kiểm tra Phase 7

1. Vào Lịch sử — thấy đúng dữ liệu (có độ trễ nhỏ do phải tải qua
   mạng, khác hẳn cảm giác "tức thì" của localStorage trước đây).
2. Đổi nhóm đang chọn (nếu ở nhiều nhóm) — tab "Ghi điểm" tự động đổi
   theo đúng nhóm mới chọn.

Dừng lại ở đây. Xác nhận cả 2 điều trên đúng trước khi báo cáo và sang
Phase 8.

---

## Phase 8 — Xử lý trạng thái tải/lỗi mạng

Mục tiêu: vì mọi thao tác giờ qua mạng (có thể chậm/lỗi), thêm trạng thái
"đang tải" và thông báo lỗi rõ ràng thay vì màn hình trống khó hiểu.

### Bước 1 — Thêm state tải/lỗi ở MỌI nơi gọi Supabase

Mẫu chung áp dụng cho `GhiDiem.jsx`, `NhomChoi.jsx`, `LichSu.jsx`,
`App.jsx` (phần Chơi AI):
```jsx
const [dangTai, setDangTai] = useState(true);
const [loiMang, setLoiMang] = useState(null);

// Trong hàm async gọi Supabase:
setDangTai(true); setLoiMang(null);
const { data, error } = await supabase.from(...).select(...);
setDangTai(false);
if (error) { setLoiMang(error.message); return; }
```

Hiện thị:
```jsx
{dangTai && <p>Đang tải...</p>}
{loiMang && <p className="ghi-chu-canh-bao">Lỗi kết nối: {loiMang} — thử lại sau.</p>}
```

**Giải thích:** đây là thay đổi TƯ DUY quan trọng khi chuyển từ
localStorage sang 1 dịch vụ bên ngoài — localStorage KHÔNG BAO GIỜ lỗi
mạng (nó nằm ngay trong trình duyệt), còn Supabase CÓ THỂ lỗi (mất mạng,
server bận, hết hạn mức miễn phí...) — mọi màn hình cần chuẩn bị SẴN cho
khả năng "không tải được" thay vì giả định luôn thành công.

### Kiểm tra Phase 8

1. Tắt Wi-Fi/mạng, thử vào Lịch sử — thấy thông báo lỗi rõ ràng, không
   phải màn hình trắng/treo.
2. Bật lại mạng, tải lại — hoạt động bình thường.

---

## Phase 9 — Dọn dẹp: xác nhận dữ liệu local cũ vẫn còn nguyên, không bị đụng tới

Mục tiêu: xác nhận đúng quyết định đã chốt — KHÔNG di chuyển dữ liệu cũ,
giữ nguyên riêng biệt.

### Bước 1 — Xác nhận code CŨ đọc localStorage (V6-V11) không còn được
GỌI TỪ NƠI NÀO nữa (đã thay hết bằng Supabase ở Phase 5-7), nhưng
KHÔNG XÓA dữ liệu đã có trong localStorage của trình duyệt.

Không cần code gì thêm — chỉ cần RÀ SOÁT lại `GhiDiem.jsx`, `App.jsx`,
`LichSu.jsx` xác nhận không còn dòng nào gọi `docDanhSach`/`ghiDanhSach`
(hàm cũ của `lichSuChoi.js`) cho mục đích ĐỌC/GHI khi đang chơi — các hàm
đó có thể XÓA hẳn khỏi `lichSuChoi.js` nếu không còn dùng ở đâu khác, HOẶC
giữ lại (không gây hại gì) nếu muốn thận trọng.

### Kiểm tra Phase 9

1. Mở Console: `localStorage.getItem('mauBinhLichSuHiep')` — vẫn còn dữ
   liệu CŨ (nếu trước đây có chơi) — xác nhận KHÔNG bị xóa mất.
2. Dữ liệu MỚI (sau khi chuyển sang Supabase) hoàn toàn không xuất hiện
   trong `localStorage` nữa — chỉ có trên Supabase.

---

## Hoàn thành V12 — báo cáo lại với Huy

1. Toàn bộ 9 Phase chạy đúng, không lỗi Console.
2. Test với ÍT NHẤT 2 tài khoản khác nhau (có thể dùng 2 trình duyệt/2
   cửa sổ ẩn danh) — xác nhận đúng: Ghi điểm chia sẻ theo nhóm, Chơi AI
   chỉ chính chủ xem được.
3. Kiểm tra lại Dashboard Supabase → Authentication → Policies MỘT LẦN
   NỮA trước khi coi là xong — đây là bước AN TOÀN quan trọng nhất của
   cả V12, không được bỏ qua.
4. Ghi chú cho tương lai: gói miễn phí Supabase có giới hạn (số lượng
   request/tháng, dung lượng database) — nếu nhóm chơi đông người dùng
   lâu dài, cần theo dõi Dashboard → Usage để biết khi nào cần nâng cấp
   gói trả phí.
