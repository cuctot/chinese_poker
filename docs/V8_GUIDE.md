# V8_GUIDE.md — Đơn giản hóa cơ cấu chơi (bỏ Phiên) + làm mới giao diện

> **Dành cho ai đọc file này:**
> - Nếu bạn là **Claude Code**: làm theo ĐÚNG THỨ TỰ 6 Phase bên dưới.
>   MỖI Phase xong phải DỪNG LẠI, báo cáo đã làm gì, để Huy tự kiểm tra
>   trước khi sang Phase tiếp theo.
> - Nếu bạn là **Huy**: đọc phần "Giải thích" sau mỗi khối code.

## Phạm vi V8 — 5 thay đổi lớn

1. **Bỏ hẳn cấu trúc Phiên** (cả Ghi điểm lẫn Chơi với AI) — chỉ còn 2
   tầng: **Hiệp** (12 ván, 4 lần chia) và **Ván**. Mọi ván đều thuộc 1
   hiệp. Vào chơi chỉ có 2 lựa chọn: tiếp tục hiệp đang dở, hoặc bắt đầu
   hiệp mới. Hiệp dở dang (chưa đủ 12 ván) vẫn được lưu, xem lại được
   trong Lịch sử.
2. **Lịch sử đổi thành danh sách Hiệp** (không phải Phiên) — mỗi hiệp là
   1 dòng: số hiệp, thời gian bắt đầu, thời gian chơi (bắt đầu → kết
   thúc), điểm theo tên. Bấm vào mở rộng xem từng Ván; với Chơi AI, bấm
   vào 1 ván hiện lại bài đã lưu.
3. **Chuẩn hóa toàn bộ nút bấm trong màn chơi**: cùng font, căn giữa,
   không icon, xếp thành 1 hàng ngang ngay dưới khu vực bài.
4. **Bỏ 5 nội dung thông báo**: nhãn Chi Đầu/Giữa/Cuối, dòng "Tính theo
   luật...", thông báo "Hợp lệ — sẵn sàng!", cảnh báo "Binh lủng!", tiêu
   đề "Bài của 3 đối thủ".
5. **Giao diện bàn tròn**: 4 người xếp theo vị trí đồng hồ — Bạn ở 6h,
   3 đối thủ ở 9h/12h/3h, chia bài theo chiều kim đồng hồ (6h→9h→12h→3h).
   Cả 4 người dùng chung 1 kiểu thẻ bài đơn giản mới; riêng của Bạn vẫn
   kéo-thả được.

---

## Phase 1 — Đơn giản hóa mô hình dữ liệu (`src/lichSuChoi.js`)

Mục tiêu: bỏ hẳn Phiên — Hiệp trở thành thực thể GỐC (không còn `phienId`).
Mọi thứ (hiệp đã xong chưa, tổng kết, thời điểm kết thúc) đều **suy ra từ
chính danh sách Ván**, không cache thêm field nào — tránh dữ liệu cache
bị lệch với thực tế.

### Bước 1 — Ghi đè toàn bộ `src/lichSuChoi.js`

```js
// lichSuChoi.js (V8) — Chỉ còn Hiệp (gốc) và Ván. Không còn Phiên.

function taoId(tienTo) {
  return `${tienTo}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

const SO_VAN_TOI_DA_MOI_NGUON = 500;

function layDemToanCuc(khoa) {
  return Number(localStorage.getItem(khoa) || '0');
}
function tangDemToanCuc(khoa) {
  const moi = layDemToanCuc(khoa) + 1;
  localStorage.setItem(khoa, String(moi));
  return moi;
}
const KHOA_DEM_HIEP = 'mauBinhDemHiepToanCuc';

// Tạo 1 Hiệp mới — soThuTu là số TOÀN CỤC, tăng liên tục mãi mãi (không
// còn khái niệm "hiệp thứ mấy trong phiên nào" vì Phiên đã bỏ).
export function taoHiepMoi(nguon, nguoiChoi, chuThich = '') {
  return {
    id: taoId('hiep'),
    soThuTu: tangDemToanCuc(KHOA_DEM_HIEP),
    batDau: Date.now(),
    nguon, // 'thatNgoai' | 'choiAI'
    nguoiChoi: [...nguoiChoi],
    chuThich,
  };
}

export function taoVanMoi({ hiepId, soThuTuTrongHiep, lanChiaThu, nguoiChia, nguon, diem, nguoiChoiBaiThat, laThangTrang, loaiThangTrang }) {
  return {
    id: taoId('van'), hiepId, soThuTuTrongHiep, lanChiaThu, nguoiChia,
    thoiGian: Date.now(), nguon, diem: { ...diem },
    ...(nguoiChoiBaiThat ? { nguoiChoiBaiThat } : {}),
    ...(laThangTrang !== undefined ? { laThangTrang, loaiThangTrang: loaiThangTrang || null } : {}),
  };
}

export function nguoiChiaChoVan(nguoiChoi, soThuTuVanTrongHiep) {
  const lanChia = Math.ceil(soThuTuVanTrongHiep / 3);
  const idx = (lanChia - 1) % nguoiChoi.length;
  return { nguoiChia: nguoiChoi[idx], lanChia };
}

export function tongDiemHopLe(diem) {
  return Object.values(diem).reduce((a, b) => a + b, 0) === 0;
}

export function tinhTongKetHiep(danhSachVanCuaHiep) {
  const tongKet = {};
  danhSachVanCuaHiep.forEach(van => {
    Object.entries(van.diem).forEach(([ten, d]) => { tongKet[ten] = (tongKet[ten] || 0) + d; });
  });
  return tongKet;
}

export function layVanCuaHiep(hiepId, danhSachVan) {
  return danhSachVan.filter(v => v.hiepId === hiepId).sort((a, b) => a.thoiGian - b.thoiGian);
}

// Hiệp coi là XONG khi đủ 12 ván — luôn tính lại từ dữ liệu thật.
export function hiepDaXong(hiepId, danhSachVan) {
  return layVanCuaHiep(hiepId, danhSachVan).length >= 12;
}

// Thời điểm "kết thúc" 1 hiệp = thời gian của ván CUỐI CÙNG đã lưu.
export function thoiGianKetThucHiep(hiepId, danhSachVan) {
  const van = layVanCuaHiep(hiepId, danhSachVan);
  return van.length > 0 ? van[van.length - 1].thoiGian : null;
}

export function themVanVaoLichSu(vanMoi, danhSachVanHienTai) {
  const danhSachMoi = [...danhSachVanHienTai, vanMoi];
  const cungNguon = danhSachMoi.filter(v => v.nguon === vanMoi.nguon).sort((a, b) => a.thoiGian - b.thoiGian);
  if (cungNguon.length > SO_VAN_TOI_DA_MOI_NGUON) {
    const soCanXoa = cungNguon.length - SO_VAN_TOI_DA_MOI_NGUON;
    const idCanXoa = new Set(cungNguon.slice(0, soCanXoa).map(v => v.id));
    return danhSachMoi.filter(v => !idCanXoa.has(v.id));
  }
  return danhSachMoi;
}

// Tìm hiệp DỞ DANG gần nhất của 1 nguồn (chưa đủ 12 ván) — null nếu
// không có (chưa từng chơi, hoặc mọi hiệp trước đó đều đã xong).
export function layHiepDangDoHoacNull(danhSachHiep, danhSachVan, nguon) {
  const hiepCungNguon = danhSachHiep.filter(h => h.nguon === nguon).sort((a, b) => b.soThuTu - a.soThuTu);
  for (const hiep of hiepCungNguon) {
    if (!hiepDaXong(hiep.id, danhSachVan)) return hiep;
  }
  return null;
}

export function docDanhSach(khoa) {
  try {
    const raw = localStorage.getItem(khoa);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
export function ghiDanhSach(khoa, mang) {
  localStorage.setItem(khoa, JSON.stringify(mang));
}

export const KHOA_HIEP = 'mauBinhLichSuHiep';
export const KHOA_VAN = 'mauBinhLichSuVan';
export { SO_VAN_TOI_DA_MOI_NGUON };
```

**Giải thích:**
- **Vì sao bỏ hẳn Phiên đơn giản hóa được nhiều thứ:** trước đây (V7) cần
  1 lớp Phiên để nhóm nhiều Hiệp lại, kèm logic phức tạp (8 tiếng ngắt
  quãng, đóng/mở phiên...). Giờ Hiệp tự nó là đơn vị nhóm cao nhất — số
  thứ tự Hiệp LUÔN LÀ số toàn cục (không cần phân biệt "số trong phiên"
  với "số toàn cục" như V7 nữa, vì không còn phiên nào để so sánh với).
- **Không cache `tongKet`/`ketThuc` vào Hiệp:** khác V6/V7 (từng lưu sẵn
  `tongKet` vào Hiệp lúc đủ 12 ván), giờ bỏ HẲN việc cache này — mọi lúc
  cần biết "hiệp đã xong chưa" hay "tổng kết bao nhiêu", đều tính TRỰC
  TIẾP từ danh sách Ván thật (`hiepDaXong`, `tinhTongKetHiep`). Với tối đa
  12 ván/hiệp, việc tính lại này cực nhanh (không có lý do gì phải cache
  và chấp nhận rủi ro cache bị lệch dữ liệu thật).
- **`layHiepDangDoHoacNull`:** thay thế hoàn toàn cơ chế "8 tiếng ngắt
  quãng" của V7 — giờ đơn giản hơn nhiều: hiệp DỞ (chưa đủ 12 ván) thì
  LUÔN có thể tiếp tục, bất kể đã bao lâu — không có mốc thời gian nào
  bắt buộc phải "đóng" nó cả, vì không còn khái niệm Phiên cần đóng nữa.

### Kiểm tra Phase 1

Đã kiểm thử kỹ bằng Node.js: Hiệp là thực thể gốc, số thứ tự toàn cục
tăng liên tục ngay từ đầu (không cần đợi tạo Phiên trước); đủ 12 ván thì
`hiepDaXong` đúng `true`, tổng kết đúng, có thời điểm kết thúc; tìm đúng
hiệp DỞ (bỏ qua hiệp đã xong); không có hiệp nào thì trả `null`; cắt bớt
500/nguồn vẫn hoạt động đúng sau khi bỏ Phiên.

Mở Console xác nhận nhanh:
```js
import { taoHiepMoi } from './lichSuChoi.js'
const h = taoHiepMoi('thatNgoai', ['An','Bình','Chi','Dũng']);
console.log(h); // không còn field "phienId" nào cả
```

Dừng lại ở đây. Xác nhận đúng trước khi báo cáo và sang Phase 2.

---

## Phase 2 — Ghi điểm: bỏ chọn chế độ, chỉ còn Hiệp (`src/GhiDiem.jsx`)

Mục tiêu: bỏ màn "bắt đầu phiên" + lựa chọn "theo ván/theo hiệp" (giờ
LUÔN theo hiệp) — thay bằng: nếu có hiệp dở, cho tiếp tục; nếu không (hoặc
chọn bỏ), bắt đầu hiệp mới (nhập tên 4 người, giữ nguyên tên cũ nếu có
sẵn để sửa lại cho nhanh).

### Bước 1 — Sửa import + bỏ state liên quan tới Phiên/chế độ

```jsx
import { useState } from 'react'
import {
  taoHiepMoi, taoVanMoi, nguoiChiaChoVan, tongDiemHopLe, tinhTongKetHiep,
  layVanCuaHiep, hiepDaXong, layHiepDangDoHoacNull, themVanVaoLichSu,
  docDanhSach, ghiDanhSach, KHOA_HIEP, KHOA_VAN,
} from './lichSuChoi.js'

function GhiDiem() {
  const [danhSachHiep, setDanhSachHiep] = useState(() => docDanhSach(KHOA_HIEP));
  const [danhSachVan, setDanhSachVan] = useState(() => docDanhSach(KHOA_VAN));

  const hiepDangDo = layHiepDangDoHoacNull(danhSachHiep, danhSachVan, 'thatNgoai');

  const [dangNhapTen, setDangNhapTen] = useState(false);
  const [tenNguoiChoi, setTenNguoiChoi] = useState(() => hiepDangDo ? [...hiepDangDo.nguoiChoi] : ['', '', '', '']);
  const [chuThich, setChuThich] = useState('');

  const [hiepDangGhi, setHiepDangGhi] = useState(null);
  const [diemNhap, setDiemNhap] = useState({});
```

**Giải thích:** bỏ hẳn `cheDo` (theo ván/theo hiệp) và mọi state liên
quan tới Phiên — Ghi điểm giờ chỉ xoay quanh 1 khái niệm DUY NHẤT là
Hiệp. `tenNguoiChoi` khởi tạo SẴN từ `hiepDangDo.nguoiChoi` nếu có hiệp dở
— để nếu Huy chọn "bắt đầu hiệp mới" thay vì tiếp tục, form vẫn điền sẵn
đúng 4 tên lần trước, chỉ cần sửa nếu muốn đổi.

### Bước 2 — Hàm bắt đầu hiệp mới + tiếp tục hiệp dở

```jsx
function suaTen(idx, gtri) {
  setTenNguoiChoi(prev => prev.map((t, i) => i === idx ? gtri : t));
}

function batDauHiepMoi() {
  const tenSach = tenNguoiChoi.map(t => t.trim());
  if (tenSach.some(t => !t)) return;
  const hiepMoi = taoHiepMoi('thatNgoai', tenSach, chuThich.trim());
  const dsHiepMoi = [...danhSachHiep, hiepMoi];
  setDanhSachHiep(dsHiepMoi);
  ghiDanhSach(KHOA_HIEP, dsHiepMoi);

  setDangNhapTen(false);
  setHiepDangGhi(hiepMoi);
  const diemRong = {};
  tenSach.forEach(t => { diemRong[t] = ''; });
  setDiemNhap(diemRong);
}

function tiepTucHiepDo() {
  setHiepDangGhi(hiepDangDo);
  const diemRong = {};
  hiepDangDo.nguoiChoi.forEach(t => { diemRong[t] = ''; });
  setDiemNhap(diemRong);
}
```

### Bước 3 — Hàm lưu 1 ván (gần như y hệt V6, chỉ bớt phần `phienId`)

```jsx
function luuVan() {
  const diemSo = {};
  for (const ten of hiepDangGhi.nguoiChoi) {
    const gtri = Number(diemNhap[ten]);
    if (diemNhap[ten] === '' || Number.isNaN(gtri)) return;
    diemSo[ten] = gtri;
  }
  if (!tongDiemHopLe(diemSo)) {
    alert('Tổng điểm phải bằng 0 — kiểm tra lại số vừa nhập.');
    return;
  }

  const soVanHienTai = layVanCuaHiep(hiepDangGhi.id, danhSachVan).length + 1;
  const { nguoiChia, lanChia } = nguoiChiaChoVan(hiepDangGhi.nguoiChoi, soVanHienTai);

  const vanMoi = taoVanMoi({
    hiepId: hiepDangGhi.id, soThuTuTrongHiep: soVanHienTai, lanChiaThu: lanChia,
    nguoiChia, nguon: 'thatNgoai', diem: diemSo,
  });
  const dsVanMoi = themVanVaoLichSu(vanMoi, danhSachVan);
  setDanhSachVan(dsVanMoi);
  ghiDanhSach(KHOA_VAN, dsVanMoi);

  const diemRong = {};
  hiepDangGhi.nguoiChoi.forEach(t => { diemRong[t] = ''; });
  setDiemNhap(diemRong);
}

function hiepMoiTiepTheo() {
  const hiepMoi = taoHiepMoi('thatNgoai', hiepDangGhi.nguoiChoi, '');
  const dsHiepMoi = [...danhSachHiep, hiepMoi];
  setDanhSachHiep(dsHiepMoi);
  ghiDanhSach(KHOA_HIEP, dsHiepMoi);
  setHiepDangGhi(hiepMoi);
  const diemRong = {};
  hiepMoi.nguoiChoi.forEach(t => { diemRong[t] = ''; });
  setDiemNhap(diemRong);
}
```

### Bước 4 — Giao diện

```jsx
return (
  <div className="trang-ghi-diem">
    <h2>Ghi điểm</h2>

    {hiepDangDo && !hiepDangGhi && !dangNhapTen && (
      <div className="khoi-luat">
        <p>Đang có 1 hiệp chưa xong ({hiepDangDo.nguoiChoi.join(', ')}).</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="nut-choi" onClick={tiepTucHiepDo}>Ghi tiếp hiệp này</button>
          <button className="nut-choi" onClick={() => setDangNhapTen(true)}>Bỏ, bắt đầu hiệp mới</button>
        </div>
      </div>
    )}

    {!hiepDangDo && !hiepDangGhi && !dangNhapTen && (
      <button className="nut-choi" onClick={() => setDangNhapTen(true)}>Bắt đầu hiệp mới</button>
    )}

    {dangNhapTen && (
      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Tên 4 người chơi (theo thứ tự chia bài)</div>
        {tenNguoiChoi.map((ten, idx) => (
          <input key={idx} type="text" placeholder={`Người chơi ${idx + 1}`} value={ten}
                 onChange={e => suaTen(idx, e.target.value)}
                 style={{ display: 'block', width: '100%', marginBottom: 8 }} />
        ))}
        <input type="text" placeholder="Chú thích (không bắt buộc)..." value={chuThich}
               onChange={e => setChuThich(e.target.value)}
               style={{ display: 'block', width: '100%', marginBottom: 8 }} />
        <button className="nut-choi" onClick={batDauHiepMoi}>Bắt đầu</button>
      </div>
    )}

    {hiepDangGhi && !hiepDaXong(hiepDangGhi.id, danhSachVan) && (
      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">
          Điểm cộng dồn Hiệp {hiepDangGhi.soThuTu}
        </div>
        {(() => {
          const tongCongDon = tinhTongKetHiep(layVanCuaHiep(hiepDangGhi.id, danhSachVan));
          return hiepDangGhi.nguoiChoi.map(ten => {
            const d = tongCongDon[ten] || 0;
            return <p key={ten}>{ten}: <b className={d >= 0 ? 'diem-duong' : 'diem-am'}>{d > 0 ? '+' : ''}{d}</b></p>;
          });
        })()}
        <hr style={{ margin: '10px 0', opacity: 0.2 }} />
        <div className="khoi-luat-tieu-de">
          Ván {layVanCuaHiep(hiepDangGhi.id, danhSachVan).length + 1} — người chia:{' '}
          {nguoiChiaChoVan(hiepDangGhi.nguoiChoi, layVanCuaHiep(hiepDangGhi.id, danhSachVan).length + 1).nguoiChia}
        </div>
        {hiepDangGhi.nguoiChoi.map(ten => (
          <label key={ten} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            {ten}
            <input type="number" value={diemNhap[ten] ?? ''}
                   onChange={e => setDiemNhap(prev => ({ ...prev, [ten]: e.target.value }))}
                   style={{ width: 70 }} />
          </label>
        ))}
        <button className="nut-choi" onClick={luuVan}>Lưu ván này</button>
      </div>
    )}

    {hiepDangGhi && hiepDaXong(hiepDangGhi.id, danhSachVan) && (
      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Tổng kết Hiệp {hiepDangGhi.soThuTu}</div>
        {Object.entries(tinhTongKetHiep(layVanCuaHiep(hiepDangGhi.id, danhSachVan))).map(([ten, d]) => (
          <p key={ten}>{ten}: <b className={d >= 0 ? 'diem-duong' : 'diem-am'}>{d > 0 ? '+' : ''}{d}</b></p>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="nut-choi" onClick={hiepMoiTiepTheo}>Hiệp tiếp theo</button>
          <button className="nut-choi" onClick={() => setHiepDangGhi(null)}>Kết thúc</button>
        </div>
      </div>
    )}
  </div>
);
```

**Giải thích:** không còn dòng lưu "kết thúc phiên" nào cả — bấm "Kết
thúc" chỉ đơn giản `setHiepDangGhi(null)`, quay về màn đầu (nơi tự động
lại kiểm tra có hiệp dở hay không dựa vào chính danh sách Hiệp/Ván thật,
không cần ghi lại trạng thái "đã kết thúc" ở đâu cả).

### Kiểm tra Phase 2

1. Chưa từng ghi gì — vào Ghi điểm chỉ thấy "Bắt đầu hiệp mới".
2. Nhập tên, bắt đầu, ghi vài ván (chưa đủ 12) — thoát ra (đóng
   tab/refresh), vào lại: thấy đúng "Đang có 1 hiệp chưa xong", tiếp tục
   đúng chỗ đã dừng.
3. Ghi đủ 12 ván — hiện tổng kết, "Hiệp tiếp theo" giữ nguyên 4 tên.
4. Ở màn tổng kết, bấm "Kết thúc" — về màn đầu, không hỏi gì thêm.

Dừng lại ở đây. Xác nhận cả 4 điều trên đúng trước khi báo cáo và sang
Phase 3.

---

## Phase 3 — Chơi với AI: bỏ Phiên, chỉ còn Hiệp (`src/App.jsx`)

Mục tiêu: bỏ hẳn `damBaoPhienHiepAI` (V7) và mọi logic 8-tiếng — thay
bằng cơ chế đơn giản hơn nhiều: có hiệp dở thì tiếp tục, không thì tạo
hiệp mới.

### Bước 1 — Sửa import

```jsx
import {
  taoHiepMoi, taoVanMoi, themVanVaoLichSu, layHiepDangDoHoacNull,
  docDanhSach, ghiDanhSach, KHOA_HIEP, KHOA_VAN, nguoiChiaChoVan, tinhTongKetHiep, layVanCuaHiep, hiepDaXong,
} from './lichSuChoi.js'
```

### Bước 2 — Thay `damBaoPhienHiepAI` bằng `damBaoHiepAI` (đơn giản hơn nhiều)

```jsx
const [danhSachHiepLS, setDanhSachHiepLS] = useState(() => docDanhSach(KHOA_HIEP));
const [danhSachVanLS, setDanhSachVanLS] = useState(() => docDanhSach(KHOA_VAN));

const TEN_AI_CO_DINH = ['Bạn', 'Đối thủ 1', 'Đối thủ 2', 'Đối thủ 3'];

// Trả về Hiệp đang dùng để ghi ván AI vào — tiếp tục hiệp dở nếu có,
// không thì tạo hiệp mới. KHÔNG còn logic 8-tiếng/đóng phiên nào cả.
function damBaoHiepAI() {
  let hiep = layHiepDangDoHoacNull(danhSachHiepLS, danhSachVanLS, 'choiAI');
  if (!hiep) {
    hiep = taoHiepMoi('choiAI', TEN_AI_CO_DINH);
    const dsHiepMoi = [...danhSachHiepLS, hiep];
    setDanhSachHiepLS(dsHiepMoi);
    ghiDanhSach(KHOA_HIEP, dsHiepMoi);
  }
  return hiep;
}

// Đọc SẴN hiệp hiện tại lúc vào màn chơi — để hiển thị "Hiệp X — Ván Y/12"
const [hiepAIHienTai] = useState(() => damBaoHiepAI());
const soVanDaXongTrongHiep = layVanCuaHiep(hiepAIHienTai.id, danhSachVanLS).length;
const soVanDangHienThi = Math.min(soVanDaXongTrongHiep + (daXacNhan ? 0 : 1), 12);
```

**Giải thích:** so với V7, hàm này ngắn hơn hẳn — không cần kiểm tra "đã
quá 8 tiếng chưa", không cần đóng Phiên cũ trước khi tạo mới. Toàn bộ
quyết định "tiếp tục hay tạo mới" giờ chỉ dựa vào 1 câu hỏi DUY NHẤT:
"có hiệp nào của Chơi AI chưa đủ 12 ván không?".

### Bước 3 — Sửa hàm ghi log (bớt tham số `phienId`)

```jsx
function ghiVanAIVaoLichSu({ nguoiChoiBaiThat, diem, laThangTrang, loaiThangTrang }) {
  const hiep = damBaoHiepAI();
  const soThuTuVanTrongHiep = layVanCuaHiep(hiep.id, danhSachVanLS).length + 1;
  const { nguoiChia, lanChia } = nguoiChiaChoVan(hiep.nguoiChoi, soThuTuVanTrongHiep);

  const vanMoi = taoVanMoi({
    hiepId: hiep.id, soThuTuTrongHiep: soThuTuVanTrongHiep, lanChiaThu: lanChia, nguoiChia,
    nguon: 'choiAI', diem, nguoiChoiBaiThat, laThangTrang, loaiThangTrang,
  });
  const dsVanMoi = themVanVaoLichSu(vanMoi, danhSachVanLS);
  setDanhSachVanLS(dsVanMoi);
  ghiDanhSach(KHOA_VAN, dsVanMoi);

  if (soThuTuVanTrongHiep === 12) {
    return { hiepVuaXong: true, tongKetHiep: tinhTongKetHiep(layVanCuaHiep(hiep.id, dsVanMoi)), hiepSoThuTu: hiep.soThuTu };
  }
  return { hiepVuaXong: false };
}
```

(3 chỗ gọi hàm này — trong `xacNhanBai()`, `useEffect` cho `ketQuaThangTrang`,
và `xacNhanBaoU()` — giữ nguyên y hệt cách gọi đã có ở V7, không cần sửa
gì thêm vì chữ ký hàm không đổi tên tham số nào.)

### Bước 4 — Sửa 2 hàm xử lý màn Tổng kết Hiệp

```jsx
function vanTiepTheo() {
  window.location.reload();
}

function choiTiepHiepMoi() {
  window.location.reload(); // damBaoHiepAI() sẽ tự tạo Hiệp MỚI vì hiệp cũ đã đủ 12 ván
}

function dungChoiKetThucHiepAI() {
  // Không còn "đóng Phiên" nào để làm nữa — chỉ đơn giản về trang chủ.
  setTrang('trangChu');
}
```

**Giải thích:** đây là chỗ code NGẮN ĐI RÕ RỆT so với V7 — trước đây
"Dừng chơi (kết thúc)" phải tự tay ghi `ketThuc` vào Phiên; giờ không còn
Phiên nào để đóng, hàm chỉ còn duy nhất 1 dòng điều hướng.

### Kiểm tra Phase 3

1. Chơi vài ván AI, tắt/mở lại trình duyệt — vào lại đúng tiếp tục hiệp
   đang dở, không hỏi gì, không mất ván đã chơi.
2. Chơi đủ 12 ván — tổng kết hiện đúng, bấm "Chơi tiếp" — Hiệp mới bắt
   đầu, số Hiệp tăng thêm 1.
3. Ở màn tổng kết, bấm "Dừng chơi (kết thúc)" — về trang chủ ngay, không
   có bước xử lý nào khác.

Dừng lại ở đây. Xác nhận cả 3 điều trên đúng trước khi báo cáo và sang
Phase 4.

---

## Phase 4 — Lịch sử: danh sách Hiệp (không phải Phiên) (`src/LichSu.jsx`)

Mục tiêu: đổi toàn bộ cách hiển thị — danh sách giờ là các HIỆP (không
còn 1 lớp Phiên bọc ngoài), mỗi hiệp có đủ số hiệp/thời gian bắt đầu/thời
gian chơi/điểm, mở rộng xem từng Ván.

### Bước 1 — Ghi đè toàn bộ `src/LichSu.jsx`

```jsx
import { useState } from 'react'
import {
  docDanhSach, KHOA_HIEP, KHOA_VAN,
  layVanCuaHiep, tinhTongKetHiep, hiepDaXong, thoiGianKetThucHiep,
} from './lichSuChoi.js'
import Card from './Card.jsx'
import { sapXepDeHienThi } from './cardEngine.js'

function dinhDangThoiLuong(ms) {
  const phut = Math.round(ms / 60000);
  if (phut < 60) return `${phut} phút`;
  const gio = Math.floor(phut / 60);
  const phutConLai = phut % 60;
  return `${gio} giờ ${phutConLai} phút`;
}

function LichSu() {
  const [danhSachHiep] = useState(() => docDanhSach(KHOA_HIEP));
  const [danhSachVan] = useState(() => docDanhSach(KHOA_VAN));

  const [tabDangXem, setTabDangXem] = useState('thatNgoai');
  const [locNgay, setLocNgay] = useState('');
  const [locTen, setLocTen] = useState('');
  const [locChuThich, setLocChuThich] = useState('');
  const [hiepDangXem, setHiepDangXem] = useState(null);
  const [vanAIDangXem, setVanAIDangXem] = useState(null);

  function hiepKhopBoLoc(hiep) {
    if (locNgay) {
      const ngayHiep = new Date(hiep.batDau).toISOString().slice(0, 10);
      if (ngayHiep !== locNgay) return false;
    }
    if (locTen.trim() && !hiep.nguoiChoi.some(t => t.toLowerCase().includes(locTen.trim().toLowerCase()))) return false;
    if (locChuThich.trim() && !(hiep.chuThich || '').toLowerCase().includes(locChuThich.trim().toLowerCase())) return false;
    return true;
  }

  const hiepDungTab = danhSachHiep.filter(h => h.nguon === tabDangXem).filter(hiepKhopBoLoc);

  return (
    <div className="trang-lich-su">
      <h2>Lịch sử</h2>

      <div className="chuyen-tab">
        <button className={tabDangXem === 'thatNgoai' ? 'nut-tab nut-tab-dang-chon' : 'nut-tab'}
                onClick={() => { setTabDangXem('thatNgoai'); setVanAIDangXem(null); setHiepDangXem(null); }}>Bài thật</button>
        <button className={tabDangXem === 'choiAI' ? 'nut-tab nut-tab-dang-chon' : 'nut-tab'}
                onClick={() => { setTabDangXem('choiAI'); setVanAIDangXem(null); setHiepDangXem(null); }}>Chơi với AI</button>
      </div>

      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Lọc</div>
        <input type="date" value={locNgay} onChange={e => setLocNgay(e.target.value)} />
        <input type="text" placeholder="Tên người chơi..." value={locTen} onChange={e => setLocTen(e.target.value)} />
        {tabDangXem === 'thatNgoai' && (
          <input type="text" placeholder="Chú thích..." value={locChuThich} onChange={e => setLocChuThich(e.target.value)} />
        )}
      </div>

      {!vanAIDangXem && (
        <div className="khoi-luat">
          {[...hiepDungTab].reverse().map(hiep => {
            const vanCuaHiep = layVanCuaHiep(hiep.id, danhSachVan);
            const daXong = hiepDaXong(hiep.id, danhSachVan);
            const tKetThuc = thoiGianKetThucHiep(hiep.id, danhSachVan);
            const tongKet = tinhTongKetHiep(vanCuaHiep);
            return (
              <div key={hiep.id} className="the-preset">
                <div className="the-preset-ten" style={{ cursor: 'pointer' }}
                     onClick={() => setHiepDangXem(hiepDangXem === hiep.id ? null : hiep.id)}>
                  Hiệp #{hiep.soThuTu} — {hiep.nguoiChoi.join(', ')} {!daXong && '(chưa xong)'}
                </div>
                <div className="the-preset-mo-ta">
                  Bắt đầu: {new Date(hiep.batDau).toLocaleString('vi-VN')}
                  {daXong && tKetThuc && ` — Thời gian chơi: ${dinhDangThoiLuong(tKetThuc - hiep.batDau)}`}
                </div>
                {hiep.chuThich && <div className="the-preset-mo-ta">📝 {hiep.chuThich}</div>}
                <div className="the-preset-mo-ta">
                  {Object.entries(tongKet).map(([t, d]) => `${t} ${d > 0 ? '+' : ''}${d}`).join(', ')}
                </div>

                {hiepDangXem === hiep.id && (
                  <div style={{ paddingLeft: 12 }}>
                    {vanCuaHiep.map(van => (
                      <p key={van.id} style={{ fontSize: 13, cursor: tabDangXem === 'choiAI' ? 'pointer' : 'default' }}
                         onClick={() => tabDangXem === 'choiAI' && setVanAIDangXem(van)}>
                        Ván {van.soThuTuTrongHiep} — {new Date(van.thoiGian).toLocaleTimeString('vi-VN')} ({van.nguoiChia} chia):{' '}
                        {Object.entries(van.diem).map(([t, d]) => `${t} ${d > 0 ? '+' : ''}${d}`).join(', ')}
                        {van.laThangTrang && ' 🎉 Ù'}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tabDangXem === 'choiAI' && vanAIDangXem && (
        <div className="khoi-luat">
          <button className="nut-choi" onClick={() => setVanAIDangXem(null)}>Quay lại</button>
          <div className="khoi-luat-tieu-de">
            Ván {vanAIDangXem.soThuTuTrongHiep} — {new Date(vanAIDangXem.thoiGian).toLocaleString('vi-VN')}
            {vanAIDangXem.laThangTrang && ` — Ù bằng ${vanAIDangXem.loaiThangTrang}`}
          </div>
          {vanAIDangXem.nguoiChoiBaiThat.map(p => (
            <div key={p.ten} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{p.ten}</div>
              {p.chiDau ? (
                <>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {sapXepDeHienThi(p.chiDau).map(l => <Card key={`${l.rank}-${l.suit}`} laBai={l} onPointerDown={() => {}} />)}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {sapXepDeHienThi(p.chiGiua).map(l => <Card key={`${l.rank}-${l.suit}`} laBai={l} onPointerDown={() => {}} />)}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {sapXepDeHienThi(p.chiCuoi).map(l => <Card key={`${l.rank}-${l.suit}`} laBai={l} onPointerDown={() => {}} />)}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {sapXepDeHienThi(p.ca13La).map(l => <Card key={`${l.rank}-${l.suit}`} laBai={l} onPointerDown={() => {}} />)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LichSu;
```

**Giải thích:**
- **Bỏ hẳn 1 tầng lồng** so với V7: trước đây phải bấm Phiên → mở Hiệp →
  mở Ván (3 lượt bấm); giờ chỉ còn Hiệp → Ván (2 lượt bấm) — đúng như
  yêu cầu, vì Phiên không còn tồn tại để làm tầng trung gian nữa.
- **`dinhDangThoiLuong`:** hàm nhỏ đổi số mili-giây thành chuỗi dễ đọc
  ("45 phút" hoặc "1 giờ 20 phút") — chỉ tính khi hiệp đã XONG (có thời
  điểm kết thúc rõ ràng); hiệp còn dở thì không hiện "thời gian chơi" vì
  chưa biết khi nào sẽ xong.
- **Bấm vào TÊN Ván (không phải cả dòng) mới mở chi tiết**, và CHỈ áp
  dụng cho tab "Chơi với AI" (`cursor: pointer` có điều kiện) — vì tab
  "Bài thật" không có gì để "xem lại bài" (không lưu lá bài, chỉ có số
  điểm nhập tay).

### Kiểm tra Phase 4

1. Ghi/chơi vài hiệp — Lịch sử hiện đúng danh sách Hiệp (không còn 1 lớp
   Phiên bọc ngoài nữa).
2. Hiệp ĐÃ xong: có hiện "Thời gian chơi: X phút/giờ". Hiệp CHƯA xong:
   không hiện dòng đó, có ghi "(chưa xong)".
3. Ở tab Chơi AI, bấm vào 1 ván — hiện đúng bài đã xếp lúc đó.

Dừng lại ở đây. Xác nhận cả 3 điều trên đúng trước khi báo cáo và sang
Phase 5.

---

## Phase 5 — Chuẩn hóa nút bấm + bỏ 5 nội dung thông báo

Mục tiêu: mọi nút trong màn chơi dùng chung 1 kiểu (font, căn giữa,
không icon), xếp thành 1 hàng dưới khu vực bài. Bỏ 5 nội dung đã xác
nhận: nhãn Chi Đầu/Giữa/Cuối, dòng "Tính theo luật...", "Hợp lệ — sẵn
sàng!", cảnh báo "Binh lủng!", tiêu đề "Bài của 3 đối thủ".

### Bước 1 — Thêm 1 class CSS DÙNG CHUNG cho mọi nút màn chơi

Thêm vào `src/App.css`:

```css
.nut-choi {
  font-family: inherit;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid rgba(240,192,64,0.4);
  background: rgba(255,255,255,0.06);
  color: white;
  cursor: pointer;
}
.nut-choi:hover {
  background: rgba(240,192,64,0.12);
}

.hang-nut-choi {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
}
```

**Giải thích:** trước đây mỗi nút có 1 class RIÊNG (`.nut-dung-choi`,
`.nut-bao-u`, `.nut-xac-nhan`, `.nut-chon-van-tiep`...) với màu/kiểu chữ
khác nhau — giờ TẤT CẢ đổi về dùng chung đúng 1 class `.nut-choi` (đã
xuất hiện xuyên suốt Phase 2-4 ở trên), đảm bảo đồng nhất tuyệt đối. Class
`.hang-nut-choi` dùng để gói TẤT CẢ nút lại thành 1 hàng ngang, tự xuống
dòng nếu màn hình hẹp (`flex-wrap: wrap`).

### Bước 2 — Sửa `src/App.jsx`: gom mọi nút vào 1 hàng dưới khu vực bài, xóa icon

Tìm và xóa emoji khỏi nội dung TẤT CẢ nút trong màn chơi (`⏸ Dừng chơi` →
`Dừng chơi`, `📣 Báo Ù` → `Báo Ù`...), đổi class thành `.nut-choi`, và di
chuyển toàn bộ (Dừng chơi, Xác nhận bài / Báo Ù, Ván tiếp theo...) vào
CHUNG 1 khối `<div className="hang-nut-choi">` đặt NGAY DƯỚI phần hiển
thị 3 chi (Đầu/Giữa/Cuối) — không rải rác nhiều chỗ như trước:

```jsx
<div className="hang-nut-choi">
  <button className="nut-choi" onClick={dungChoi}>Dừng chơi</button>
  {!daXacNhan && (
    <>
      <button className="nut-choi" onClick={xacNhanBai}>Xác nhận bài</button>
      <button className="nut-choi" onClick={moHopThoaiBaoU}>Báo Ù</button>
    </>
  )}
</div>
```

Và ở màn kết quả (sau khi `daXacNhan`), gom tương tự:
```jsx
<div className="hang-nut-choi">
  {ketQuaHiepVuaXong ? (
    <>
      <button className="nut-choi" onClick={choiTiepHiepMoi}>Chơi tiếp</button>
      <button className="nut-choi" onClick={dungChoiKetThucHiepAI}>Dừng chơi</button>
    </>
  ) : (
    <button className="nut-choi" onClick={vanTiepTheo}>Ván tiếp theo</button>
  )}
</div>
```

### Bước 3 — Xóa 5 nội dung đã xác nhận

**3a. Bỏ nhãn Chi Đầu/Giữa/Cuối** — trong `renderVungDangXep`/
`renderVungChiXem`, bỏ tham số `nhan` và dòng `<div className="vung-tieu-de">{nhan}</div>`:
```jsx
function renderVungDangXep(danhSachGoc, chiSoBatDau) {
  return (
    <div className="vung-chi">
      <div className="vung-noi-dung">
        {/* ... giữ nguyên phần map lá bài ... */}
      </div>
    </div>
  );
}
```
(Sửa tương tự cho `renderVungChiXem`, và bỏ tham số `nhan` ở mọi lời gọi
2 hàm này.)

**3b. Bỏ dòng "Tính theo luật..."** — xóa hẳn thẻ `<p className="ghi-chu-luat">`
trong khối kết quả.

**3c. Bỏ thông báo "Hợp lệ — sẵn sàng!" và cảnh báo "Binh lủng!"** — xóa
hẳn thẻ hiển thị `hopLe ? 'Hợp lệ...' : 'Binh lủng!'`. (Thông tin binh
lủng vẫn còn được giải thích đầy đủ trong "Xem cách tính chi tiết" sau
khi xác nhận — chỉ bỏ cảnh báo hiện SẴN lúc đang xếp bài.)

**3d. Bỏ tiêu đề "Bài của 3 đối thủ (AI đã xếp)"** — xóa dòng `<h2>Bài của 3 đối thủ</h2>`
(nội dung hiện bài đối thủ bên dưới vẫn giữ, chỉ bỏ tiêu đề — Phase 6 sẽ
thiết kế lại HẲN cách hiển thị bài đối thủ theo bàn tròn, nên phần này chỉ
là bước dọn dẹp tạm thời trước khi Phase 6 thay đổi lớn hơn).

### Kiểm tra Phase 5

1. Toàn bộ nút trong màn chơi cùng 1 kiểu (font, màu, không icon), nằm
   chung 1 hàng ngang dưới khu vực bài.
2. Không còn thấy nhãn Chi Đầu/Giữa/Cuối, dòng "Tính theo luật", "Hợp lệ/
   Binh lủng", "Bài của 3 đối thủ" ở đâu trong màn chơi.
3. Xếp bài sai (binh lủng) rồi xác nhận — vẫn bị xử thua đúng luật (chỉ
   không còn cảnh báo TRƯỚC khi xác nhận nữa).

Dừng lại ở đây. Xác nhận cả 3 điều trên đúng trước khi báo cáo và sang
Phase 6.

---

## Phase 6 — Giao diện bàn tròn (6h/9h/12h/3h) + thẻ bài đơn giản

Mục tiêu: thay cách hiển thị "Bạn + danh sách đối thủ xếp dọc" bằng bố
cục hình chữ thập mô phỏng bàn tròn — Bạn ở dưới (6h), 3 đối thủ ở trái
(9h)/trên (12h)/phải (3h). Cả 4 người dùng chung 1 kiểu thẻ bài mới, đơn
giản như ảnh mẫu Huy gửi — riêng thẻ của Bạn vẫn kéo-thả được.

### Bước 1 — Tạo file mới `src/TheBaiDon.jsx` (thẻ bài tĩnh, đơn giản)

```jsx
const TEN_RANK = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const KY_HIEU_CHAT = ['♠', '♥', '♣', '♦'];
const MAU_CHAT = ['#1a1a1a', '#d63031', '#1a1a1a', '#e67e22'];

// Thẻ bài TĨNH (không kéo được) — dùng cho 3 đối thủ, và cho Bạn lúc XEM
// KẾT QUẢ (đã xác nhận, không cần kéo nữa). Kiểu dáng đơn giản: rank ở
// trên, ký hiệu chất to ở giữa — không viền cầu kỳ, không góc trang trí.
function TheBaiDon({ laBai }) {
  const ten = TEN_RANK[laBai.rank - 2];
  const kyHieu = KY_HIEU_CHAT[laBai.suit];
  const mau = MAU_CHAT[laBai.suit];
  return (
    <div className="the-bai-don" style={{ color: mau }}>
      <div className="the-bai-don-rank">{ten}</div>
      <div className="the-bai-don-chat">{kyHieu}</div>
    </div>
  );
}

export default TheBaiDon;
```

### Bước 2 — Thêm CSS cho thẻ bài đơn giản + bố cục bàn tròn

```css
.the-bai-don {
  width: 44px;
  height: 62px;
  background: white;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
  font-weight: bold;
}
.the-bai-don-rank {
  font-size: 14px;
}
.the-bai-don-chat {
  font-size: 18px;
}

.ban-choi {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  grid-template-rows: auto auto auto;
  gap: 10px;
  align-items: center;
  justify-items: center;
}
.vi-tri-12h { grid-column: 2; grid-row: 1; }
.vi-tri-9h  { grid-column: 1; grid-row: 2; }
.vi-tri-3h  { grid-column: 3; grid-row: 2; }
.vi-tri-6h  { grid-column: 2; grid-row: 3; }

.ten-vi-tri {
  text-align: center;
  font-weight: bold;
  color: #f0c040;
  margin-bottom: 4px;
  font-size: 13px;
}
.hang-chi-don {
  display: flex;
  gap: 3px;
  justify-content: center;
  margin-bottom: 3px;
}
```

**Giải thích `grid-template-columns: 1fr 2fr 1fr`:** cột giữa RỘNG GẤP
ĐÔI 2 cột 2 bên — vì cột giữa cần chứa cả vị trí 12h VÀ 6h (mỗi vị trí có
tới 5 lá bài xếp ngang ở chi Giữa/Cuối, cần nhiều chỗ hơn 2 cột bên chỉ
chứa 1 phần của layout).

### Bước 3 — Sửa `src/App.jsx`: vẽ 4 vị trí theo đúng chỗ

Thay toàn bộ cách hiển thị "Bạn" (đang xếp bài) và "Bài của 3 đối thủ"
(đã xóa tiêu đề ở Phase 5) bằng bố cục bàn tròn:

```jsx
import TheBaiDon from './TheBaiDon.jsx'
```

```jsx
function renderChiDonTinh(danhSachLa) {
  return (
    <div className="hang-chi-don">
      {sapXepDeHienThi(danhSachLa).map(l => (
        <TheBaiDon key={`${l.rank}-${l.suit}`} laBai={l} />
      ))}
    </div>
  );
}

function renderViTriDoiThu(ten, doiThu) {
  return (
    <div>
      <div className="ten-vi-tri">{ten}</div>
      {renderChiDonTinh(doiThu.chiDau)}
      {renderChiDonTinh(doiThu.chiGiua)}
      {renderChiDonTinh(doiThu.chiCuoi)}
    </div>
  );
}
```

Trong JSX trả về (nhánh `trang === 'choiAI' && daChonVan`), thay toàn bộ
phần hiển thị bài bằng:

```jsx
<div className="ban-choi">
  <div className="vi-tri-12h">{renderViTriDoiThu('Đối thủ 2', baiDoiThu[1])}</div>
  <div className="vi-tri-9h">{renderViTriDoiThu('Đối thủ 1', baiDoiThu[0])}</div>
  <div className="vi-tri-3h">{renderViTriDoiThu('Đối thủ 3', baiDoiThu[2])}</div>

  <div className="vi-tri-6h">
    <div className="ten-vi-tri">Bạn</div>
    {!daXacNhan ? (
      <>
        {renderVungDangXep(chiDauGoc, BAT_DAU.dau)}
        {renderVungDangXep(chiGiuaGoc, BAT_DAU.giua)}
        {renderVungDangXep(chiCuoiGoc, BAT_DAU.cuoi)}
      </>
    ) : (
      <>
        {renderChiDonTinh(chiDauGoc)}
        {renderChiDonTinh(chiGiuaGoc)}
        {renderChiDonTinh(chiCuoiGoc)}
      </>
    )}
  </div>
</div>
```

**Giải thích:**
- **Ánh xạ vị trí đồng hồ:** `tatCaBai[0]` (Bạn) luôn ở 6h. Chia bài theo
  chiều kim đồng hồ bắt đầu từ 6h → tiếp là 9h → 12h → 3h → về lại 6h —
  đúng thứ tự này khớp với thứ tự chia bài đã có sẵn từ V1
  (`tatCaBai[1]`→Đối thủ 1→9h, `tatCaBai[2]`→Đối thủ 2→12h,
  `tatCaBai[3]`→Đối thủ 3→3h) — KHÔNG cần đổi gì ở hàm `chiaBai()`, chỉ
  đổi CÁCH BÀY TRÍ trên màn hình.
- **Bạn dùng 2 CÁCH VẼ khác nhau tùy trạng thái:** lúc CHƯA xác nhận, vẫn
  dùng `renderVungDangXep` cũ (kéo-thả được, dùng `Card.jsx` chuẩn); lúc
  ĐÃ xác nhận (xem kết quả), chuyển sang `renderChiDonTinh` (thẻ bài đơn
  giản, tĩnh) — giống hệt cách hiển thị của 3 đối thủ, cho cảm giác đồng
  nhất khi xem lại kết quả cuối ván.
- **3 đối thủ LUÔN dùng thẻ bài tĩnh** (`renderChiDonTinh`) vì họ không
  bao giờ cần tương tác kéo-thả.

### Kiểm tra Phase 6

1. Vào màn chơi — thấy đúng bố cục hình chữ thập: Bạn ở dưới, đối thủ ở
   trái/trên/phải.
2. Lúc đang xếp bài: Bạn vẫn kéo-thả được bình thường; 3 đối thủ hiện thẻ
   bài đơn giản (rank + ký hiệu chất), không kéo được.
3. Sau khi xác nhận: cả 4 người đều hiện cùng 1 kiểu thẻ bài đơn giản,
   đồng nhất.
4. Thẻ bài mới đúng kiểu ảnh mẫu — không viền cầu kỳ, không góc bo trang
   trí thừa, chữ rank + ký hiệu chất rõ ràng, dễ đọc.

---

## Hoàn thành V8 — báo cáo lại với Huy

1. Toàn bộ 6 Phase chạy đúng, không lỗi Console.
2. Luồng đầy đủ: Chơi với AI → xếp bài (bàn tròn, kéo-thả) → xác nhận →
   xem kết quả (bàn tròn, thẻ tĩnh) → Ván tiếp theo → ... → đủ 12 ván →
   Tổng kết Hiệp → Chơi tiếp / Dừng chơi.
3. Vào Lịch sử — xác nhận chỉ còn 2 cấp (Hiệp → Ván), không còn Phiên.
4. Ghi điểm — luồng tương tự, không còn hỏi "theo ván hay theo hiệp".
5. Giao diện tổng thể: nút bấm đồng nhất, gọn 1 hàng; không còn 5 nội
   dung thông báo đã bỏ; thẻ bài đơn giản áp dụng cho cả 4 người.

---

## Phase 7 — Sửa lỗi hiện bài AI 2 lần, bài luôn nằm ngang mọi màn hình,
## điểm cạnh tên, bàn tròn cho màn nhập tên/bắt đầu chơi

Bổ sung sau khi Huy dùng thử V8 (Phase 1-6) và phản hồi thêm 6 điểm.

### 1. Lỗi "AI thắng trắng hiển thị bài của AI 2 lần"

**Đã XÁC NHẬN lỗi này VỐN CÓ TỪ TRƯỚC Phase 6** (không phải do Phase 1-6
gây ra) — nguyên nhân: đoạn `<h2>Bài của 3 đối thủ</h2>` + hiển thị bài
đối thủ ở CUỐI trang (bản trước Phase 6) LUÔN render bất kể có đang thắng
trắng hay không, trong khi nhánh thắng trắng lại có 1 đoạn hiển thị bài
đối thủ RIÊNG ở trên — 2 đoạn cùng tồn tại nên bài đối thủ hiện 2 lần mỗi
khi thắng trắng. **Phase 6 (gộp toàn bộ hiển thị bài vào 1 khối
`.ban-choi` duy nhất) đã VÔ TÌNH SỬA LUÔN lỗi này** — đã kiểm chứng lại
bằng cách ép 1 ván "Rồng cuốn" thật (kiểm soát `Math.random` để tạo đúng
bộ bài mong muốn): đúng 52 lá hiện đúng 1 lần mỗi lá, không lặp. Không
cần sửa gì thêm — chỉ cần đảm bảo không quay lại kiểu code cũ (2 nơi cùng
render bài đối thủ).

### 2. Bài luôn nằm ngang 1 hàng, tự co giãn + chồng lấn (overlap) —
### vừa mọi màn hình

Vấn đề cũ: chi Giữa/Cuối (5 lá) tự động XUỐNG DÒNG (wrap) trên màn hình
hẹp vì lá bài có kích thước CỐ ĐỊNH bằng px trong khi khung chứa (đặc
biệt 2 vị trí 9h/3h trong bàn tròn) có thể rất hẹp.

**Giải pháp:** viết lại `TheBaiDon.jsx` + thêm `HangBai.jsx`, cùng 1 khối
CSS "engine" `.hang-chi-bai` tính sẵn bề rộng mỗi lá (biến `--w`) dựa
trên số lá trong hàng (`--n`, do component set qua `style={{'--n': n}}`)
và tỉ lệ chồng lấn (`--overlap`), CHẶN TRẦN bằng `--cap` (px) để không
phình to quá đà trên màn hình rộng:

```css
.hang-chi-bai {
  --overlap: 0.42;
  --cap: 42px;
  --w: min(calc(100% / (1 + (var(--n) - 1) * (1 - var(--overlap)))), var(--cap));
  display: flex;
  width: 100%;
}
.hang-chi-bai > * {
  flex: 0 0 auto;
  width: var(--w);
}
.hang-chi-bai > *:not(:first-child) {
  margin-left: calc(-1 * var(--w) * var(--overlap));
}
.hang-chi-bai-lon { --cap: 62px; --overlap: 0.32; }   /* bài Bạn — to hơn */
```

**Giải thích công thức:** dùng `%` (không phải px cố định) cho cả bề
rộng LẪN độ chồng lấn nên LUÔN vừa đúng 100% khung chứa dù khung rộng
hay hẹp cỡ nào — khung hẹp thì `--w` tự nhỏ lại, khung rộng thì bị chặn
bởi `--cap` (không phình to). `min-width`/`margin-left` cùng tính từ 1
biến `--w` DUY NHẤT (đặt trên hàng cha, các lá con `var()` lại) để đảm
bảo mọi lá trong cùng 1 hàng luôn đồng nhất kích thước.

**Lỗi thực tế gặp phải khi làm (ghi lại để không lặp lại):** ban đầu đặt
`width: 100%` ngay trên chính `.the-bai-don` (để lá tự lấp đầy khi nằm
trong 1 div bọc ngoài có ref, dùng cho bài Bạn lúc đang kéo-thả) — do
CÙNG ĐỘ ĐẶC HIỆU CSS (đều 1 class) và khai báo SAU `.hang-chi-bai > *`
trong file, luật `width:100%` này THẮNG luôn luật `width: var(--w)`,
khiến lá bài phình to bằng 100% khung chứa GỐC (khung chứa của cả `.ban-
choi`, không phải của riêng hàng lá), sập toàn bộ layout. **Cách sửa: bỏ
hẳn `width` khỏi `.the-bai-don`** — mặc định 1 `<div>` (block) đã tự lấp
đầy chiều rộng khung chứa của nó, nên khi là lá TRỰC TIẾP trong
`.hang-chi-bai` thì ăn theo `width: var(--w)`; khi nằm trong 1 div bọc
riêng (trường hợp kéo-thả) thì tự lấp đầy đúng bề rộng của div bọc đó
(div bọc mới là "lá" thật sự nhận `var(--w)` từ `.hang-chi-bai > *`).

**Chỉ số góc (không phải icon ở giữa):** `TheBaiDon` hiện rank+chất ở
GÓC TRÊN-TRÁI (`.the-bai-don-chi-so`, giống lá bài thật) thay vì ở giữa
— vì khi chồng lấn, lá SAU đè lên PHẦN BÊN PHẢI của lá TRƯỚC, chỉ có góc
trên-trái là LUÔN lộ ra để đọc được dù bị che một phần.

**Đảo thứ tự dò ô khi thả bài** (`onPointerUp` trong `App.jsx`): duyệt
NGƯỢC từ ô 12 về ô 0 (thay vì 0→12) — vì lá có index LỚN HƠN trong cùng
1 hàng luôn được vẽ ĐÈ LÊN TRÊN (sau trong DOM), duyệt ngược đảm bảo ô
đang hiện ra ngoài (dễ thấy, dễ nhắm) luôn được ưu tiên khớp trước.

**Card.jsx bị xóa hẳn** — hợp nhất vào `TheBaiDon.jsx` (dùng chung cho cả
Bạn kéo-thả được và AI tĩnh, chỉ khác kích thước qua class
`.hang-chi-bai-lon`/mặc định), đúng yêu cầu "bài người chơi giống bài
AI hiện nay, không cần viền phân tách từng chi, có thể to hơn AI".

### 3. Điểm số cạnh tên, bỏ bảng điểm riêng

`renderTenVaDiem(ten)` trong `App.jsx` — hiện NGAY DƯỚI mỗi tên trên bàn,
đúng format **"Tên: <điểm ván hiện tại> - Cả hiệp: <điểm tích lũy>"**:
- **`: <điểm ván>`** — điểm RIÊNG của ván vừa xong, CHỈ hiện khi ván đó
  đã có kết quả (đã xác nhận bài hoặc thắng trắng); trong lúc còn đang
  xếp bài thì chưa có gì để hiện, chỉ hiện tên suông.
- **`- Cả hiệp: <tổng>`** — điểm tích lũy CỦA HIỆP ĐANG CHƠI DỞ, tính lại
  trực tiếp từ danh sách Ván thật mỗi lần render
  (`tinhTongKetHiep(layVanCuaHiep(...))`), không cache — hiện SUỐT quá
  trình chơi, kể cả khi chưa xong ván nào (lúc đó tổng = 0).

Khối "Kết quả" không còn liệt kê lại từng tên/điểm (đã dư thừa) — chỉ
còn nút "Xem cách tính chi tiết" + khối giải trình + tổng kết hiệp (khi
vừa xong hiệp — đây là 1 màn TỔNG KẾT RIÊNG lúc kết thúc, khác với điểm
tích lũy hiệp DỞ hiện cạnh tên trong lúc đang chơi).

### 4. Bàn tròn cho màn nhập tên (Ghi điểm) + màn bắt đầu chơi (Chơi AI)

**`GhiDiem.jsx`** — màn nhập tên (`dangNhapTen`) đổi từ 4 ô nhập xếp dọc
sang bố cục `.ban-choi` (dùng lại đúng 4 vị trí 6h/9h/12h/3h đã có từ
Phase 6): vị trí 6h luôn là "Chia đầu tiên" (idx 0), các vị trí còn lại
chia theo chiều kim đồng hồ — giúp Huy hình dung trước ai ngồi đâu, ai
chia trước, giống hệt quy ước đã dùng ở màn chơi thật.

**`ChonVan.jsx`** — thêm preview bàn tròn TĨNH (chỉ tên, không có bài)
phía trên 2 nút Tiếp hiệp cũ/Bắt đầu hiệp mới, kèm điểm tích lũy của hiệp
đang dở ngay cạnh tên (nếu có) — `hiepAIDoDang` ở `App.jsx` tính thêm
field `tongKet` (`tinhTongKetHiep`) truyền xuống làm prop `hiepDoDang`.

Thêm modifier CSS `.ban-choi-nhap-ten`/`.ban-choi-preview` (giới hạn
`max-width`, tăng khoảng cách dòng) vì 2 chỗ này chỉ chứa tên/điểm/ô
nhập — không cần chiếm nhiều chỗ dọc như bàn chơi thật (có bài).

### 5. Chỉnh chữ màn chơi (theo phản hồi sau khi dùng thử Phase 7)

- Tiêu đề `<h1>` đổi từ "Chinese Poker" → **"Chơi với AI"** — khớp đúng
  tên tính năng, tránh lẫn với tên tiếng Anh chung chung của trò chơi.
- Bỏ hẳn dòng gợi ý "Kéo 2 lá để đổi chỗ cho nhau, sắp xếp theo ý bạn"
  (đã quen thao tác, không cần nhắc mỗi ván).
- Nút "Dừng chơi" → **"Dừng"**, nút "Ván tiếp theo" → **"Tiếp"** — ngắn
  gọn hơn, vẫn đủ rõ nghĩa trong ngữ cảnh 1 hàng nút ngay dưới bàn chơi.
  (Nút "Chơi tiếp" — dùng khi vừa xong cả hiệp, sang hiệp mới — giữ
  nguyên tên vì mang nghĩa khác hẳn "Tiếp" của 1 ván thường.)

### Kiểm tra Phase 7

Đã kiểm thử bằng Playwright (dựng lại 1 ván "Rồng cuốn" thật bằng cách
ép chuỗi `Math.random`, và test kéo-thả bằng `page.mouse`):
1. Thắng trắng: đúng 52 lá (13×4), không lá nào lặp; không còn tiêu đề
   "Bài của 3 đối thủ" nào sót lại.
2. Mọi hàng chi (3 lá lẫn 5 lá), ở cả 4 vị trí bàn tròn, trước VÀ sau khi
   xác nhận: tất cả các lá trong 1 hàng luôn cùng 1 tọa độ Y (không bao
   giờ xuống dòng) — kiểm tra ở viewport 375px (điện thoại hẹp).
3. Kéo lá đầu đổi chỗ với lá cuối trong 1 hàng đã chồng lấn — đổi đúng
   lá, không bị lệch sang lá bên cạnh.
4. Tên mỗi vị trí hiện đúng "Tên - Cả hiệp: ±X" khi chưa có ván nào xong
   (X = 0 lúc mới vào), và "Tên: ±Y - Cả hiệp: ±X" ngay khi ván vừa xong
   có kết quả (Y = điểm riêng ván đó).
5. Ghi điểm — màn nhập tên hiện đúng bàn tròn 4 ô, nhập xong bấm "Bắt
   đầu" vẫn hoạt động bình thường.
6. Chơi AI — màn ChonVan hiện đúng preview 4 tên; nếu đang có hiệp dở,
   hiện thêm điểm tích lũy cạnh tên.
7. Lịch sử — xem lại 1 ván AI cũ: bài cả 4 người vẫn hiện đúng, dùng
   chung `HangBai`/`TheBaiDon`, không còn dùng `Card.jsx` (đã xóa file).
8. Màn chơi hiện đúng tiêu đề "Chơi với AI" (không còn "Chinese Poker"),
   không còn dòng gợi ý "Kéo 2 lá...", nút bấm đúng "Dừng"/"Tiếp".
