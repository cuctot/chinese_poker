# V7_GUIDE.md — Trang Lịch sử (Bài thật + Chơi với AI)

> **Dành cho ai đọc file này:**
> - Nếu bạn là **Claude Code**: làm theo ĐÚNG THỨ TỰ 6 Phase bên dưới.
>   MỖI Phase xong phải DỪNG LẠI, báo cáo đã làm gì, và để Huy tự kiểm
>   tra theo checklist cuối Phase đó trước khi sang Phase tiếp theo.
> - Nếu bạn là **Huy**: đọc phần "Giải thích" sau mỗi khối code.
>
> Toàn bộ logic lõi mới (đếm toàn cục, cắt bớt 500 ván/nguồn, tự động
> quản lý phiên AI theo mốc 8 tiếng) đã kiểm thử bằng Node.js trước khi
> đưa vào tài liệu.

## Phạm vi V7

Trang "Lịch sử" — xem lại TOÀN BỘ lịch sử chơi, từ 2 nguồn:
1. **Bài thật** (đã ghi qua trang Ghi điểm — V6)
2. **Chơi với AI** (mới — trước giờ không lưu lại gì cả)

**Thay đổi lớn so với V6:** áp dụng ĐÚNG mô hình Phiên/Hiệp/Ván (đã xây ở
V6) cho CẢ 2 nguồn, không chỉ riêng bài thật — Chơi với AI giờ cũng có
khái niệm Hiệp (12 ván, 4 lần chia), **hiển thị SỐNG ngay trên màn chơi**
(đánh số Hiệp/Ván LẠI TỪ ĐẦU theo từng phiên — giống hệt cách Ghi điểm đã
hiển thị), hết hiệp tự hiện tổng kết + 2 lựa chọn "Chơi tiếp"/"Dừng chơi",
không cần Huy tự bấm "bắt đầu phiên" thủ công.

**Các tính năng cụ thể:**
- Đánh số Ván/Hiệp **liên tục xuyên suốt vòng đời app** ("Ván số 4523 kể
  từ khi cài app") — nhưng số này **CHỈ hiện trong trang Lịch sử**. Trên
  MÀN CHƠI THẬT (cả Ghi điểm lẫn Chơi với AI), số hiển thị luôn là số cục
  bộ, đếm lại từ 1 cho mỗi Hiệp/Phiên mới — 2 cách đếm dùng cho 2 mục
  đích khác nhau (số toàn cục để tra cứu/thống kê lâu dài, số cục bộ để
  dễ theo dõi trong lúc đang chơi).
- Chơi với AI hết 1 hiệp (12 ván) tự hiện **màn tổng kết hiệp**, có đúng
  2 nút: **"Chơi tiếp"** (bắt đầu hiệp mới, vẫn cùng phiên) hoặc **"Dừng
  chơi"** (kết thúc hẳn phiên, về trang chủ) — tách biệt với nút "Dừng
  chơi" thường (V5, chỉ tạm dừng giữa ván, không kết thúc phiên).
- Thêm **chú thích** tự do cho mỗi Phiên (vd "Chơi ở nhà bác A").
- **Lọc/tìm kiếm** theo ngày, theo tên người chơi, theo chú thích.
- Ván Chơi với AI lưu **toàn bộ bài thật đã xếp** của cả 4 người — bấm
  vào 1 ván để **tái hiện lại y hệt** giao diện chơi (dùng lại `Card.jsx`).
- Giữ tối đa **500 ván gần nhất CHO MỖI NGUỒN riêng biệt** (500 bài thật +
  500 Chơi AI, không đụng vào nhau) — tự động xóa bớt ván cũ nhất khi
  vượt, nhưng Phiên/Hiệp (nhẹ hơn nhiều, chỉ có tên + tổng kết) được giữ
  **VĨNH VIỄN**, không bị cắt.
- Phiên Chơi với AI: **tự động** — hết hiệp tự sang hiệp mới (nếu chọn
  "Chơi tiếp"); nếu ngừng chơi quá **8 tiếng**, lần chơi sau tự đóng phiên
  cũ và tạo phiên mới.
- Nút điều hướng ở trang chủ: thêm **nút MỚI "Lịch sử"**, giữ nguyên nút
  "Phân tích" (để dành phiên bản biểu đồ/phân tích sâu hơn sau này).

---

## Phase 1 — Mở rộng mô hình dữ liệu (`src/lichSuChoi.js`)

Mục tiêu: `lichSuChoi.js` (đã có từ V6) giờ dùng CHUNG được cho cả 2
nguồn, có đếm toàn cục, có cắt bớt theo nguồn, có hàm quản lý phiên AI.

### Bước 1 — Thay các hàm tạo mới, thêm field `nguon`

Sửa `taoPhienMoi`, `taoHiepMoi`, `taoVanMoi` (đã có từ V6) — thêm tham số
`nguon` và (cho Ván) các field chỉ dùng riêng cho Chơi AI:

```js
function taoId(tienTo) {
  return `${tienTo}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

const SO_VAN_TOI_DA_MOI_NGUON = 500;
const TAM_NGUNG_PHIEN_AI_MS = 8 * 60 * 60 * 1000; // 8 tiếng

function layDemToanCuc(khoa) {
  return Number(localStorage.getItem(khoa) || '0');
}
function tangDemToanCuc(khoa) {
  const moi = layDemToanCuc(khoa) + 1;
  localStorage.setItem(khoa, String(moi));
  return moi;
}
const KHOA_DEM_VAN = 'mauBinhDemVanToanCuc';
const KHOA_DEM_HIEP = 'mauBinhDemHiepToanCuc';

// Thêm tham số "nguon" ('thatNgoai' | 'choiAI') và "chuThich" (mặc định rỗng)
export function taoPhienMoi(cheDo, nguon, nguoiChoi, chuThich = '') {
  return {
    id: taoId('phien'), batDau: Date.now(), ketThuc: null,
    cheDo, nguon, nguoiChoi: [...nguoiChoi], chuThich,
  };
}

// Thêm "nguon" + số thứ tự TOÀN CỤC (không reset theo phiên)
export function taoHiepMoi(phienId, soThuTu, nguon, nguoiChoi) {
  return {
    id: taoId('hiep'), phienId, soThuTu,
    soThuTuToanCuc: tangDemToanCuc(KHOA_DEM_HIEP),
    nguon, nguoiChoi: [...nguoiChoi], tongKet: null,
  };
}

// Thêm "nguon", số thứ tự toàn cục, và 3 field CHỈ CÓ nếu là Chơi AI:
// nguoiChoiBaiThat (bài đã xếp), laThangTrang, loaiThangTrang.
export function taoVanMoi({ phienId, hiepId, lanChiaThu, nguoiChia, nguon, diem, nguoiChoiBaiThat, laThangTrang, loaiThangTrang }) {
  return {
    id: taoId('van'), phienId, hiepId: hiepId ?? null, lanChiaThu: lanChiaThu ?? null,
    nguoiChia, thoiGian: Date.now(), nguon,
    soThuTuToanCuc: tangDemToanCuc(KHOA_DEM_VAN),
    diem: { ...diem },
    ...(nguoiChoiBaiThat ? { nguoiChoiBaiThat } : {}),
    ...(laThangTrang !== undefined ? { laThangTrang, loaiThangTrang: loaiThangTrang || null } : {}),
  };
}
```

**Giải thích:**
- **Vì sao thêm `nguon` thay vì tạo 2 file/module riêng cho 2 nguồn:**
  vì Phiên/Hiệp/Ván của 2 nguồn có CÙNG hình dạng cốt lõi (đều có
  `phienId`, `soThuTu`, `tongKet`...) — chỉ khác nhau vài field phụ (Ván
  của Chơi AI có thêm bài thật). Dùng chung 1 module + 1 field phân biệt
  giúp mọi hàm tính toán (tổng kết hiệp, truy vấn...) VIẾT 1 LẦN, DÙNG
  ĐƯỢC CHO CẢ 2 — tránh nhân đôi code.
- **Đếm toàn cục (`layDemToanCuc`/`tangDemToanCuc`) tách RIÊNG khỏi mảng
  dữ liệu chính:** đây là lý do vì sao con số này KHÔNG bị ảnh hưởng dù
  sau này cắt bớt Ván cũ (Bước 3) — nó chỉ là 1 con số đơn giản lưu ở 1
  khóa RIÊNG, tăng dần mỗi khi có Ván/Hiệp mới, không phụ thuộc gì vào
  việc mảng Ván/Hiệp còn giữ được bao nhiêu phần tử.
- **Cú pháp `...(dieuKien ? {...} : {})`:** đây là mẹo hay trong
  JavaScript để THÊM CÓ ĐIỀU KIỆN 1 vài field vào object — nếu điều kiện
  sai, `{...{}}` không thêm gì cả (object rỗng trải ra không có tác
  dụng); nếu đúng, các field bên trong được trải vào object chính. Nhờ
  vậy, Ván của "bài thật" sẽ KHÔNG có field `nguoiChoiBaiThat`/
  `laThangTrang` gì cả (nhẹ hơn), còn Ván của "Chơi AI" mới có đủ.

### Bước 2 — Sửa hàm cắt bớt: 500 ván/nguồn, ĐỘC LẬP nhau

Thay hàm cắt bớt (nếu V6 đã có hàm tương tự, thay thế bằng bản này):

```js
// Thêm 1 ván mới, cắt bớt CHỈ trong phạm vi CÙNG NGUỒN với ván vừa thêm —
// không đụng tới ván của nguồn kia.
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
```

**Giải thích:** lọc RIÊNG những ván CÙNG nguồn với ván vừa thêm
(`cungNguon`), sắp xếp theo thời gian, nếu vượt quá 500 thì xóa đúng số
lượng CŨ NHẤT dư ra. Vì lọc riêng theo `nguon` trước khi đếm, việc cắt
bớt bên "bài thật" không bao giờ ảnh hưởng tới số lượng ván "Chơi AI"
đang có, và ngược lại.

### Bước 3 — Thêm hàm quản lý phiên Chơi-AI tự động (mốc 8 tiếng)

```js
// Tìm phiên Chơi-AI đang mở (nếu có) — trả về null nếu KHÔNG có, hoặc
// nếu có nhưng ván cuối cùng đã CÁCH ĐÂY quá 8 tiếng (coi như "đã chết",
// nơi gọi hàm này cần tự đóng phiên đó lại rồi tạo phiên mới).
export function layPhienAIDangMoHoacNull(danhSachPhien, danhSachVan) {
  const phien = danhSachPhien.find(p => p.nguon === 'choiAI' && p.ketThuc === null);
  if (!phien) return null;
  const vanCuaPhien = danhSachVan.filter(v => v.phienId === phien.id).sort((a, b) => a.thoiGian - b.thoiGian);
  const vanCuoi = vanCuaPhien[vanCuaPhien.length - 1];
  if (vanCuoi && Date.now() - vanCuoi.thoiGian >= TAM_NGUNG_PHIEN_AI_MS) {
    return null;
  }
  return phien;
}

export { SO_VAN_TOI_DA_MOI_NGUON, TAM_NGUNG_PHIEN_AI_MS, KHOA_DEM_VAN, KHOA_DEM_HIEP, layDemToanCuc };
```

**Giải thích:** hàm này KHÔNG tự đóng phiên cũ — nó chỉ TRẢ VỀ đúng phiên
nếu còn "sống" (chơi cách đây chưa tới 8 tiếng), hoặc `null` nếu phiên
cũ coi như đã hết hạn. Việc THỰC SỰ đóng phiên cũ (ghi `ketThuc`) và tạo
phiên mới được làm ở nơi GỌI hàm này (Phase 2, trong `App.jsx`) — tách
biệt "kiểm tra" khỏi "hành động" giúp hàm này thuần túy (không tự ý thay
đổi dữ liệu), dễ kiểm thử.

### Kiểm tra Phase 1

Đã kiểm thử kỹ bằng Node.js: đếm toàn cục tăng liên tục qua cả 2 nguồn
không phân biệt; cắt bớt 500/nguồn hoạt động độc lập (502 ván "bài thật"
+ 3 ván "Chơi AI" → sau khi cắt còn đúng 500 + 3, không lẫn nhau); còn
trong 8 tiếng thì tái sử dụng đúng phiên cũ; quá 8 tiếng thì trả về
`null`; phiên vừa tạo chưa có ván nào vẫn coi là hợp lệ.

Mở Console xác nhận lại nhanh:
```js
import { taoVanMoi, layDemToanCuc, KHOA_DEM_VAN } from './lichSuChoi.js'
taoVanMoi({ phienId: 'x', nguon: 'thatNgoai', diem: {} });
console.log(layDemToanCuc(KHOA_DEM_VAN)); // phải tăng thêm 1 so với trước
```

Dừng lại ở đây. Xác nhận đúng trước khi báo cáo và sang Phase 2.

---

## Phase 2 — Chơi với AI có Hiệp/Ván hiển thị + tổng kết hiệp (`src/App.jsx`)

Mục tiêu: Chơi với AI giờ hiển thị RÕ đang ở Hiệp mấy, Ván mấy (đánh số
LẠI TỪ ĐẦU theo từng phiên — số đếm TOÀN CỤC ở Phase 1 chỉ dùng nội bộ để
lưu trữ/hiển thị trong trang Lịch sử, KHÔNG hiện ra màn chơi). Hết 12 ván
tự hiện tổng kết hiệp, có 2 lựa chọn: "Chơi tiếp" (hiệp mới, vẫn phiên
này) hoặc "Dừng chơi" (kết thúc hẳn phiên, về trang chủ).

### Bước 1 — Thêm import

```jsx
import {
  taoPhienMoi, taoHiepMoi, taoVanMoi, themVanVaoLichSu, layPhienAIDangMoHoacNull,
  docDanhSach, ghiDanhSach, KHOA_PHIEN, KHOA_HIEP, KHOA_VAN,
  nguoiChiaChoVan, tinhTongKetHiep,
} from './lichSuChoi.js'
```

### Bước 2 — Thêm state cho Phiên/Hiệp/Ván lưu trữ + tổng kết hiệp

Thêm cạnh các `useState` khác trong `App`:

```jsx
const [danhSachPhienLS, setDanhSachPhienLS] = useState(() => docDanhSach(KHOA_PHIEN));
const [danhSachHiepLS, setDanhSachHiepLS] = useState(() => docDanhSach(KHOA_HIEP));
const [danhSachVanLS, setDanhSachVanLS] = useState(() => docDanhSach(KHOA_VAN));

const TEN_AI_CO_DINH = ['Bạn', 'Đối thủ 1', 'Đối thủ 2', 'Đối thủ 3'];

// Kết quả tổng kết hiệp (nếu VÁN VỪA XONG là ván thứ 12) — null nếu chưa
// tới lúc tổng kết. Khi khác null, màn hình chuyển sang hiện tổng kết
// hiệp thay vì "Ván tiếp theo" bình thường.
const [ketQuaHiepVuaXong, setKetQuaHiepVuaXong] = useState(null);
```

### Bước 3 — Hàm "đảm bảo có phiên/hiệp AI đang mở" (giữ nguyên như đã kiểm thử)

```jsx
function damBaoPhienHiepAI() {
  let phien = layPhienAIDangMoHoacNull(danhSachPhienLS, danhSachVanLS);

  if (!phien) {
    const phienCuDaChet = danhSachPhienLS.find(p => p.nguon === 'choiAI' && p.ketThuc === null);
    let danhSachPhienMoi = danhSachPhienLS;
    if (phienCuDaChet) {
      const daDong = { ...phienCuDaChet, ketThuc: Date.now() };
      danhSachPhienMoi = danhSachPhienLS.map(p => p.id === phienCuDaChet.id ? daDong : p);
    }
    phien = taoPhienMoi('theoHiep', 'choiAI', TEN_AI_CO_DINH);
    danhSachPhienMoi = [...danhSachPhienMoi, phien];
    setDanhSachPhienLS(danhSachPhienMoi);
    ghiDanhSach(KHOA_PHIEN, danhSachPhienMoi);
  }

  const hiepCuaPhien = danhSachHiepLS.filter(h => h.phienId === phien.id);
  let hiep = hiepCuaPhien.find(h => !h.tongKet) || null;
  if (!hiep) {
    hiep = taoHiepMoi(phien.id, hiepCuaPhien.length + 1, 'choiAI', TEN_AI_CO_DINH);
    const danhSachHiepMoi = [...danhSachHiepLS, hiep];
    setDanhSachHiepLS(danhSachHiepMoi);
    ghiDanhSach(KHOA_HIEP, danhSachHiepMoi);
  }

  return { phien, hiep };
}
```

### Bước 4 — Đọc SẴN Hiệp/Phiên hiện tại ngay lúc vào màn chơi (để hiển thị)

Thêm ngay sau khối khai báo `damBaoPhienHiepAI` ở trên:

```jsx
// Tính 1 LẦN lúc vào màn chơi — biết ngay đang ở Hiệp nào, Ván thứ mấy,
// để hiển thị SỐNG trên đầu màn hình (đánh số LẠI THEO PHIÊN, không phải
// số toàn cục).
const [{ hiep: hiepAIHienTai }] = useState(() => damBaoPhienHiepAI());
const soVanDaXongTrongHiep = danhSachVanLS.filter(v => v.hiepId === hiepAIHienTai.id).length;
const soVanDangHienThi = Math.min(soVanDaXongTrongHiep + (daXacNhan ? 0 : 1), 12);
```

**Giải thích:** `soVanDaXongTrongHiep` đếm số ván ĐÃ LƯU thuộc hiệp này.
Nếu CHƯA xác nhận ván hiện tại (`!daXacNhan`), ván đang chơi CHƯA được
tính vào đó, nên cộng thêm 1 để hiển thị đúng "đang ở ván thứ mấy". Nếu
ĐÃ xác nhận (`daXacNhan`), ván đó đã được ghi log rồi (xem Bước 6), nên
không cộng thêm nữa — tránh hiển thị lệch 1 số so với thực tế đã lưu.

### Bước 5 — Sửa hàm ghi log: trả về biết "hiệp vừa xong hay chưa"

```jsx
function ghiVanAIVaoLichSu({ nguoiChoiBaiThat, diem, laThangTrang, loaiThangTrang }) {
  const { phien, hiep } = damBaoPhienHiepAI();
  const soVanHienTaiCuaHiep = danhSachVanLS.filter(v => v.hiepId === hiep.id).length;
  const soThuTuVanTrongHiep = soVanHienTaiCuaHiep + 1;
  const { nguoiChia, lanChia } = nguoiChiaChoVan(hiep.nguoiChoi, soThuTuVanTrongHiep);

  const vanMoi = taoVanMoi({
    phienId: phien.id, hiepId: hiep.id, lanChiaThu: lanChia, nguoiChia,
    nguon: 'choiAI', diem, nguoiChoiBaiThat, laThangTrang, loaiThangTrang,
  });
  const danhSachVanMoi = themVanVaoLichSu(vanMoi, danhSachVanLS);
  setDanhSachVanLS(danhSachVanMoi);
  ghiDanhSach(KHOA_VAN, danhSachVanMoi);

  if (soThuTuVanTrongHiep === 12) {
    const tongKet = tinhTongKetHiep(danhSachVanMoi.filter(v => v.hiepId === hiep.id));
    const danhSachHiepMoi = danhSachHiepLS.map(h => h.id === hiep.id ? { ...h, tongKet } : h);
    setDanhSachHiepLS(danhSachHiepMoi);
    ghiDanhSach(KHOA_HIEP, danhSachHiepMoi);
    return { hiepVuaXong: true, tongKetHiep: tongKet, hiepSoThuTu: hiep.soThuTu, phienId: phien.id };
  }
  return { hiepVuaXong: false, phienId: phien.id };
}
```

**Giải thích:** khác bản trước (chỉ âm thầm ghi log), hàm giờ TRẢ VỀ 1
object cho biết ván vừa ghi có phải là ván THỨ 12 của hiệp hay không —
nơi gọi hàm (Bước 6) dựa vào đó để quyết định hiện màn "Ván tiếp theo"
bình thường hay màn "Tổng kết Hiệp".

### Bước 6 — Cập nhật 3 chỗ gọi `ghiVanAIVaoLichSu` để dùng kết quả trả về

**6a. Trong `xacNhanBai()`:**
```jsx
function xacNhanBai() {
  const nguoiChoi = [
    { ten: 'Bạn', chiDau: chiDauGoc, chiGiua: chiGiuaGoc, chiCuoi: chiCuoiGoc },
    { ten: 'Đối thủ 1', ...baiDoiThu[0] },
    { ten: 'Đối thủ 2', ...baiDoiThu[1] },
    { ten: 'Đối thủ 3', ...baiDoiThu[2] },
  ];
  const ketQua = tinhDiem(nguoiChoi, ruleset);
  setKetQuaDiem(ketQua);
  const ketQuaLog = ghiVanAIVaoLichSu({
    nguoiChoiBaiThat: nguoiChoi.map(p => ({ ten: p.ten, chiDau: p.chiDau, chiGiua: p.chiGiua, chiCuoi: p.chiCuoi })),
    diem: ketQua.diem,
  });
  if (ketQuaLog.hiepVuaXong) setKetQuaHiepVuaXong(ketQuaLog);
  setDaXacNhan(true);
}
```

**6b. Trong khối `useState(() => ...)` tính `ketQuaThangTrang`** (AI tự
động thắng trắng, từ V4) — thêm ngay TRƯỚC dòng `return
tinhDiemThangTrangAI(...)`. Lưu ý: KHÔNG gọi `setKetQuaHiepVuaXong` ở
đây được (vì đang ở TRONG hàm khởi tạo `useState`, chưa thể gọi
`setState` khác lúc này) — xử lý bằng 1 `useEffect` nhỏ ngay sau đó:

```jsx
const [ketQuaThangTrang] = useState(() => {
  const nguoiChoiThangTrang = [
    { ten: 'Bạn', ca13La: tatCaBai[0] },
    { ten: 'Đối thủ 1', ca13La: tatCaBai[1] },
    { ten: 'Đối thủ 2', ca13La: tatCaBai[2] },
    { ten: 'Đối thủ 3', ca13La: tatCaBai[3] },
  ];
  return tinhDiemThangTrangAI(nguoiChoiThangTrang, ruleset);
});

useEffect(() => {
  if (ketQuaThangTrang) {
    const ketQuaLog = ghiVanAIVaoLichSu({
      nguoiChoiBaiThat: [0, 1, 2, 3].map(i => ({
        ten: ['Bạn', 'Đối thủ 1', 'Đối thủ 2', 'Đối thủ 3'][i], ca13La: tatCaBai[i],
      })),
      diem: ketQuaThangTrang.diem,
      laThangTrang: true,
      loaiThangTrang: ketQuaThangTrang.ketQuaLoai?.find(l => l !== null),
    });
    if (ketQuaLog.hiepVuaXong) setKetQuaHiepVuaXong(ketQuaLog);
  }
}, []); // chỉ chạy 1 lần lúc mount, đúng lúc ketQuaThangTrang đã có sẵn
```

**6c. Trong `xacNhanBaoU()`** (Báo Ù đúng/sai, từ patch V4):
```jsx
function xacNhanBaoU() {
  setDangXacNhanBaoU(false);
  const nguoiChoiThangTrang = [
    { ten: 'Bạn', ca13La: chiDauGoc.concat(chiGiuaGoc, chiCuoiGoc) },
    { ten: 'Đối thủ 1', ...baiDoiThu[0] },
    { ten: 'Đối thủ 2', ...baiDoiThu[1] },
    { ten: 'Đối thủ 3', ...baiDoiThu[2] },
  ];
  const ketQuaDung = tinhDiemBaoUDung(nguoiChoiThangTrang, ruleset);
  const baiThatDeGhi = nguoiChoiThangTrang.map(p => ({ ten: p.ten, ca13La: p.ca13La }));

  let ketQuaCuoi, ketQuaLog;
  if (ketQuaDung) {
    ketQuaCuoi = ketQuaDung;
    ketQuaLog = ghiVanAIVaoLichSu({
      nguoiChoiBaiThat: baiThatDeGhi, diem: ketQuaDung.diem,
      laThangTrang: true, loaiThangTrang: ketQuaDung.ketQuaLoai?.[0],
    });
  } else {
    ketQuaCuoi = tinhDiemBaoUSai(nguoiChoiThangTrang, ruleset);
    ketQuaLog = ghiVanAIVaoLichSu({
      nguoiChoiBaiThat: baiThatDeGhi, diem: ketQuaCuoi.diem,
      laThangTrang: false, loaiThangTrang: null,
    });
  }
  setKetQuaDiem(ketQuaCuoi);
  if (ketQuaLog.hiepVuaXong) setKetQuaHiepVuaXong(ketQuaLog);
  setDaXacNhan(true);
}
```

### Bước 7 — Thêm 2 hàm xử lý cho màn Tổng kết Hiệp

```jsx
function vanTiepTheo() {
  // Đơn giản nhất: tải lại trang — damBaoPhienHiepAI() (Bước 3) sẽ tự
  // phát hiện hiệp hiện tại CHƯA đủ 12 ván (chưa có tongKet), tự tiếp
  // tục đúng hiệp đó, chia ván mới.
  window.location.reload();
}

function choiTiepHiepMoi() {
  // Giống hệt cơ chế trên — nhưng lần này hiệp cũ ĐÃ có tongKet (vừa
  // tính xong ở Bước 5), nên damBaoPhienHiepAI() sẽ tự tạo HIỆP MỚI
  // (vẫn cùng phiên) thay vì tiếp tục hiệp cũ.
  window.location.reload();
}

function dungChoiKetThucPhienAI() {
  const phien = danhSachPhienLS.find(p => p.id === ketQuaHiepVuaXong.phienId);
  if (phien) {
    const daDong = { ...phien, ketThuc: Date.now() };
    const dsPhienMoi = danhSachPhienLS.map(p => p.id === phien.id ? daDong : p);
    setDanhSachPhienLS(dsPhienMoi);
    ghiDanhSach(KHOA_PHIEN, dsPhienMoi);
  }
  setTrang('trangChu');
}
```

**Giải thích:** `vanTiepTheo` và `choiTiepHiepMoi` dùng CHUNG 1 cơ chế
(tải lại trang) — điểm khác biệt DUY NHẤT nằm ở dữ liệu đã lưu (hiệp hiện
tại còn thiếu ván hay đã đủ 12 và có `tongKet`), không phải ở code gọi.
Đây là lý do Bước 3 (`damBaoPhienHiepAI`) được thiết kế để tự đọc dữ liệu
và QUYẾT ĐỊNH đúng, thay vì phải truyền tham số "muốn ván mới hay hiệp
mới" từ bên ngoài vào.

### Bước 8 — Thêm giao diện: hiển thị Hiệp/Ván sống + màn Tổng kết Hiệp

Thêm ngay dưới nút "Dừng chơi" đã có (từ V5), trong nhánh
`trang === 'choiAI' && daChonVan`:

```jsx
<p className="ghi-chu-luat" style={{ textAlign: 'center' }}>
  Hiệp {hiepAIHienTai.soThuTu} — Ván {soVanDangHienThi}/12
</p>
```

Thay khối hiển thị "Kết quả" (đã có từ V3, dùng lại nguyên) — thêm rẽ
nhánh: nếu `ketQuaHiepVuaXong` có giá trị, hiện màn Tổng kết Hiệp THAY VÌ
nút "Ván tiếp theo" bình thường:

```jsx
{daXacNhan && ketQuaDiem && (
  <div className="ket-qua">
    {/* ... toàn bộ nội dung "Kết quả" cũ (điểm từng người, nút Xem cách
        tính chi tiết...) giữ nguyên y hệt ở đây ... */}

    {ketQuaHiepVuaXong ? (
      <div className="khoi-luat" style={{ marginTop: 12 }}>
        <div className="khoi-luat-tieu-de">Tổng kết Hiệp {ketQuaHiepVuaXong.hiepSoThuTu}</div>
        {Object.entries(ketQuaHiepVuaXong.tongKetHiep).map(([ten, d]) => (
          <p key={ten}>{ten}: <b className={d >= 0 ? 'diem-duong' : 'diem-am'}>{d > 0 ? '+' : ''}{d}</b></p>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="nut-chon-van nut-chon-van-tiep" onClick={choiTiepHiepMoi}>Chơi tiếp</button>
          <button className="nut-chon-van" onClick={dungChoiKetThucPhienAI}>Dừng chơi (kết thúc)</button>
        </div>
      </div>
    ) : (
      <button className="nut-chon-van nut-chon-van-tiep" style={{ marginTop: 12 }} onClick={vanTiepTheo}>
        Ván tiếp theo
      </button>
    )}
  </div>
)}
```

**Giải thích:** nút "Dừng chơi" (V5) VẪN CÒN Y NGUYÊN, không đổi gì —
đó là cách TẠM DỪNG (lưu trạng thái, về sau còn "Chơi tiếp" đúng ván đang
xếp dở). Nút "Dừng chơi (kết thúc)" ở màn Tổng kết Hiệp là hành động
KHÁC — chủ động ĐÓNG HẲN phiên đang chơi tại đúng điểm dừng tự nhiên
(cuối 1 hiệp), không chỉ tạm dừng. 2 khái niệm "tạm dừng" và "kết thúc
phiên" tách biệt nhau, phục vụ 2 nhu cầu khác nhau.

### Kiểm tra Phase 2

1. Vào Chơi với AI — thấy dòng "Hiệp 1 — Ván 1/12" ngay dưới nút "Dừng
   chơi".
2. Chơi xong 1 ván (chưa phải ván 12) — thấy nút "Ván tiếp theo" (không
   phải màn tổng kết), bấm vào — trang tải lại, đúng "Hiệp 1 — Ván 2/12".
3. Chơi liên tục tới hết ván 12 — thay vì "Ván tiếp theo", hiện màn
   "Tổng kết Hiệp 1" với điểm cộng dồn cả 12 ván, đúng 2 nút.
4. Bấm "Chơi tiếp" — trang tải lại, đúng "Hiệp 2 — Ván 1/12" (số Hiệp
   tăng, số Ván reset về 1).
5. Ở 1 hiệp khác, bấm "Dừng chơi (kết thúc)" thay vì "Chơi tiếp" — về
   trang chủ; Console kiểm tra `localStorage.getItem('mauBinhLichSuPhien')`
   — đúng phiên đó phải có `ketThuc` khác `null`.
6. Vào lại "Chơi với AI" sau khi đã kết thúc phiên ở bước 5 — phải bắt
   đầu ĐÚNG "Hiệp 1" của 1 PHIÊN MỚI (không phải Hiệp 3 tiếp nối phiên cũ
   đã đóng).

Dừng lại ở đây. Xác nhận cả 6 điều trên đúng trước khi báo cáo và sang
Phase 3.

---

## Phase 3 — Khung trang Lịch sử (2 tab) + bộ lọc

Mục tiêu: trang mới `src/LichSu.jsx`, 2 tab "Bài thật" / "Chơi với AI",
có ô lọc theo ngày / tên người chơi / chú thích.

### Bước 1 — Tạo file mới `src/LichSu.jsx`

```jsx
import { useState } from 'react'
import {
  docDanhSach, KHOA_PHIEN, KHOA_HIEP, KHOA_VAN,
  layHiepCuaPhien, layVanCuaHiep, layVanCuaPhien,
} from './lichSuChoi.js'

function LichSu() {
  const [danhSachPhien] = useState(() => docDanhSach(KHOA_PHIEN));
  const [danhSachHiep] = useState(() => docDanhSach(KHOA_HIEP));
  const [danhSachVan] = useState(() => docDanhSach(KHOA_VAN));

  const [tabDangXem, setTabDangXem] = useState('thatNgoai'); // 'thatNgoai' | 'choiAI'
  const [locNgay, setLocNgay] = useState('');
  const [locTen, setLocTen] = useState('');
  const [locChuThich, setLocChuThich] = useState('');

  function phienKhopBoLoc(phien) {
    if (locNgay) {
      const ngayPhien = new Date(phien.batDau).toISOString().slice(0, 10);
      if (ngayPhien !== locNgay) return false;
    }
    if (locTen.trim() && !phien.nguoiChoi.some(t => t.toLowerCase().includes(locTen.trim().toLowerCase()))) {
      return false;
    }
    if (locChuThich.trim() && !(phien.chuThich || '').toLowerCase().includes(locChuThich.trim().toLowerCase())) {
      return false;
    }
    return true;
  }

  const phienDungTab = danhSachPhien
    .filter(p => p.nguon === tabDangXem)
    .filter(phienKhopBoLoc);

  return (
    <div className="trang-lich-su">
      <h2>Lịch sử</h2>

      <div className="chuyen-tab">
        <button className={tabDangXem === 'thatNgoai' ? 'nut-tab nut-tab-dang-chon' : 'nut-tab'}
                onClick={() => setTabDangXem('thatNgoai')}>Bài thật</button>
        <button className={tabDangXem === 'choiAI' ? 'nut-tab nut-tab-dang-chon' : 'nut-tab'}
                onClick={() => setTabDangXem('choiAI')}>Chơi với AI</button>
      </div>

      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Lọc</div>
        <input type="date" value={locNgay} onChange={e => setLocNgay(e.target.value)} />
        <input type="text" placeholder="Tên người chơi..." value={locTen} onChange={e => setLocTen(e.target.value)} />
        {tabDangXem === 'thatNgoai' && (
          <input type="text" placeholder="Chú thích..." value={locChuThich} onChange={e => setLocChuThich(e.target.value)} />
        )}
      </div>

      {/* Phase 4 sẽ thêm nội dung tab "Bài thật" ở đây */}
      {/* Phase 5 sẽ thêm nội dung tab "Chơi với AI" ở đây */}
    </div>
  );
}

export default LichSu;
```

**Giải thích:**
- **3 ô lọc, 3 biến state riêng** (`locNgay`, `locTen`, `locChuThich`) —
  mỗi ô lọc theo 1 tiêu chí độc lập, `phienKhopBoLoc` kiểm tra CẢ 3 điều
  kiện cùng lúc (chỉ hiện Phiên nào khớp HẾT các ô đang lọc — ô nào để
  trống thì bỏ qua điều kiện đó).
- **`locNgay` dùng `<input type="date">`**: trình duyệt tự hiện lịch chọn
  ngày, giá trị trả về luôn đúng dạng `"YYYY-MM-DD"` — so sánh trực tiếp
  với `new Date(...).toISOString().slice(0,10)` (cũng ra đúng dạng đó)
  mà không cần tự viết code xử lý định dạng ngày tháng phức tạp.
- **Ô "Chú thích" chỉ hiện ở tab "Bài thật"**: vì Chơi AI không có chú
  thích (tên 4 người luôn cố định, không có gì để ghi chú thêm).

### Kiểm tra Phase 3

1. Vào trang (tạm gắn thử vào `App.jsx` giống cách đã làm ở V6 Phase 2) —
   thấy 2 tab, đổi qua lại được.
2. Gõ vào ô lọc ngày/tên — chưa thấy gì đổi (vì Phase 4-5 chưa thêm nội
   dung hiển thị), nhưng không lỗi Console.

Dừng lại ở đây. Xác nhận đúng trước khi báo cáo và sang Phase 4.

---

## Phase 4 — Tab "Bài thật": xem lại Ghi điểm (Phiên → Hiệp → Ván)

Mục tiêu: hiện danh sách Phiên (đã lọc), mở rộng xem Hiệp, mở rộng xem
Ván — đúng như thiết kế ban đầu (đã rút khỏi V6, giờ đưa vào đây).

### Bước 1 — Thêm state mở rộng

```jsx
const [phienDangXem, setPhienDangXem] = useState(null);
const [hiepDangXem, setHiepDangXem] = useState(null);
```

### Bước 2 — Thêm nội dung tab "Bài thật"

Thay dòng `{/* Phase 4 sẽ thêm nội dung tab "Bài thật" ở đây */}` bằng:

```jsx
{tabDangXem === 'thatNgoai' && (
  <div className="khoi-luat">
    {[...phienDungTab].reverse().map(phien => (
      <div key={phien.id} className="the-preset">
        <div className="the-preset-ten" style={{ cursor: 'pointer' }}
             onClick={() => setPhienDangXem(phienDangXem === phien.id ? null : phien.id)}>
          {new Date(phien.batDau).toLocaleDateString('vi-VN')} — {phien.nguoiChoi.join(', ')}
          {phien.ketThuc === null && ' (đang chơi)'}
        </div>
        {phien.chuThich && <div className="the-preset-mo-ta">📝 {phien.chuThich}</div>}

        {phienDangXem === phien.id && (
          <div style={{ paddingLeft: 12 }}>
            {phien.cheDo === 'theoHiep' ? (
              layHiepCuaPhien(phien.id, danhSachHiep).map(hiep => (
                <div key={hiep.id}>
                  <div style={{ cursor: 'pointer', fontWeight: 'bold', margin: '6px 0' }}
                       onClick={() => setHiepDangXem(hiepDangXem === hiep.id ? null : hiep.id)}>
                    Hiệp #{hiep.soThuTuToanCuc} (thứ {hiep.soThuTu} của phiên) {hiep.tongKet ? '✅' : '(chưa xong)'}
                  </div>
                  {hiepDangXem === hiep.id && (
                    <div style={{ paddingLeft: 12 }}>
                      {layVanCuaHiep(hiep.id, danhSachVan).map((van, idx) => (
                        <p key={van.id} style={{ fontSize: 13 }}>
                          Ván #{van.soThuTuToanCuc} ({van.nguoiChia} chia):{' '}
                          {Object.entries(van.diem).map(([t, d]) => `${t} ${d > 0 ? '+' : ''}${d}`).join(', ')}
                        </p>
                      ))}
                      {hiep.tongKet && (
                        <p style={{ fontSize: 13, fontWeight: 'bold' }}>
                          Tổng hiệp: {Object.entries(hiep.tongKet).map(([t, d]) => `${t} ${d > 0 ? '+' : ''}${d}`).join(', ')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              layVanCuaPhien(phien.id, danhSachVan).map(van => (
                <p key={van.id} style={{ fontSize: 13 }}>
                  Ván #{van.soThuTuToanCuc}:{' '}
                  {Object.entries(van.diem).map(([t, d]) => `${t} ${d > 0 ? '+' : ''}${d}`).join(', ')}
                </p>
              ))
            )}
          </div>
        )}
      </div>
    ))}
  </div>
)}
```

**Giải thích:** gần như y hệt thiết kế ban đầu ở V6 (trước khi rút ra) —
chỉ thêm hiện `soThuTuToanCuc` (số Ván/Hiệp TÍNH TỪ KHI CÀI APP, không
phải chỉ trong phiên này) cạnh số thứ tự trong phiên, và thêm dòng chú
thích (📝) nếu Phiên có ghi.

### Kiểm tra Phase 4

1. Ghi vài phiên/hiệp/ván qua trang Ghi điểm (V6), quay lại Lịch sử — tab
   "Bài thật" hiện đúng, mở rộng được từng cấp.
2. Gõ vào ô lọc ngày đúng ngày đã ghi — chỉ còn hiện đúng phiên đó.
3. Gõ tên 1 người chơi — chỉ hiện phiên có người đó.
4. Số `#` hiển thị phải là số TĂNG DẦN xuyên suốt, không phải chỉ 1, 2, 3
   trong phạm vi phiên/hiệp đó.

Dừng lại ở đây. Xác nhận cả 4 điều trên đúng trước khi báo cáo và sang
Phase 5.

---

## Phase 5 — Tab "Chơi với AI": danh sách + xem chi tiết (tái hiện bài)

Mục tiêu: danh sách các ván đã chơi AI, bấm vào 1 ván để xem lại ĐÚNG
giao diện bài đã xếp lúc đó.

### Bước 1 — Thêm state xem chi tiết 1 ván

```jsx
const [vanAIDangXem, setVanAIDangXem] = useState(null); // object ván đang xem chi tiết, hoặc null
```

### Bước 2 — Thêm nội dung tab "Chơi với AI"

```jsx
{tabDangXem === 'choiAI' && !vanAIDangXem && (
  <div className="khoi-luat">
    {[...danhSachVan]
      .filter(v => v.nguon === 'choiAI')
      .filter(v => !locTen.trim() || v.nguoiChoiBaiThat?.some(p => p.ten.toLowerCase().includes(locTen.trim().toLowerCase())))
      .filter(v => !locNgay || new Date(v.thoiGian).toISOString().slice(0, 10) === locNgay)
      .reverse()
      .slice(0, 100) // chỉ hiện 100 ván gần nhất trong danh sách (dù lưu tới 500), tránh danh sách quá dài khó cuộn
      .map(van => (
        <div key={van.id} className="the-preset" style={{ cursor: 'pointer' }}
             onClick={() => setVanAIDangXem(van)}>
          <div className="the-preset-ten">
            Ván #{van.soThuTuToanCuc} — {new Date(van.thoiGian).toLocaleString('vi-VN')}
            {van.laThangTrang && ' 🎉 Ù'}
          </div>
          <div className="the-preset-mo-ta">
            {Object.entries(van.diem).map(([t, d]) => `${t} ${d > 0 ? '+' : ''}${d}`).join(', ')}
          </div>
        </div>
      ))}
  </div>
)}

{tabDangXem === 'choiAI' && vanAIDangXem && (
  <div className="khoi-luat">
    <button className="nut-ve-trang-chu" onClick={() => setVanAIDangXem(null)}>← Quay lại danh sách</button>
    <div className="khoi-luat-tieu-de">
      Ván #{vanAIDangXem.soThuTuToanCuc} — {new Date(vanAIDangXem.thoiGian).toLocaleString('vi-VN')}
      {vanAIDangXem.laThangTrang && ` 🎉 Ù bằng ${vanAIDangXem.loaiThangTrang}`}
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
```

Thêm import ở đầu `LichSu.jsx`:
```jsx
import Card from './Card.jsx'
import { sapXepDeHienThi } from './cardEngine.js'
```

### Bước 3 — Sửa 2 nút chuyển tab (đã thêm ở Phase 3) để tự đóng màn chi tiết khi đổi tab

Giờ đã có `setVanAIDangXem`, sửa lại 2 nút chuyển tab ở Phase 3 — thêm
`setVanAIDangXem(null)` vào mỗi nút, đảm bảo đổi tab luôn quay về đúng
màn danh sách, không giữ lại màn xem chi tiết của lần trước:

```jsx
<button className={tabDangXem === 'thatNgoai' ? 'nut-tab nut-tab-dang-chon' : 'nut-tab'}
        onClick={() => { setTabDangXem('thatNgoai'); setVanAIDangXem(null); }}>Bài thật</button>
<button className={tabDangXem === 'choiAI' ? 'nut-tab nut-tab-dang-chon' : 'nut-tab'}
        onClick={() => { setTabDangXem('choiAI'); setVanAIDangXem(null); }}>Chơi với AI</button>
```

**Giải thích:** đây chính là điểm đã bị bỏ sót khi thiết kế ban đầu (kiểm
tra lại phát hiện ra) — nếu chỉ khóa hiển thị theo `tabDangXem` (Bước 2)
mà không reset `vanAIDangXem`, đổi tab đi rồi quay lại "Chơi với AI" sẽ
bị kẹt ở đúng màn chi tiết ván đã xem trước đó thay vì về danh sách — vi
phạm hành vi thông thường của tab (mỗi lần bấm vào 1 tab phải luôn thấy
đúng ĐIỂM BẮT ĐẦU của tab đó).

**Giải thích:**
- **`.slice(0, 100)` trên danh sách hiển thị:** dù LƯU TRỮ tới 500 ván
  (Phase 1), danh sách hiển thị chỉ cần hiện 100 ván gần nhất là đủ dùng
  thực tế — tránh render 1 danh sách quá dài gây chậm giao diện. Nếu
  Huy muốn xem xa hơn, có thể tăng số này sau.
- **`p.chiDau ? (...) : (...)`:** phân biệt 2 KIỂU dữ liệu đã lưu — ván
  thắng THƯỜNG lưu bài đã chia rõ 3 chi (`chiDau`/`chiGiua`/`chiCuoi`,
  xem lại Phase 2 mục 4a), còn ván THẮNG TRẮNG chỉ lưu nguyên 13 lá
  (`ca13La`, mục 4b/4c) vì thắng trắng không quan tâm cách xếp. Giao diện
  tự nhận biết kiểu nào để hiển thị đúng — chia 3 hàng rõ ràng cho ván
  thường, hoặc 1 hàng 13 lá cho ván thắng trắng.
- **Dùng lại `<Card>` và `sapXepDeHienThi`:** đây chính là "tái hiện lại
  bài như đang chơi" mà Huy yêu cầu — không vẽ lại giao diện lá bài từ
  đầu, mà TÁI SỬ DỤNG đúng component đã có từ V1, đảm bảo lá bài hiện ra
  giống hệt lúc chơi thật.

### Kiểm tra Phase 5

1. Chơi vài ván AI, vào tab "Chơi với AI" — thấy danh sách, mới nhất trên
   đầu.
2. Bấm vào 1 ván thắng THƯỜNG — thấy đúng 3 hàng (Đầu/Giữa/Cuối) của cả 4
   người, giống hệt lúc chơi.
3. Nếu có ván Ù (hoặc tự dựng bộ bài thử) — bấm vào thấy đúng 1 hàng 13
   lá, có ghi rõ "🎉 Ù bằng [loại]".
4. Bấm "← Quay lại danh sách" — về đúng danh sách, không mất vị trí lọc
   đang chọn.

Dừng lại ở đây. Xác nhận cả 4 điều trên đúng trước khi báo cáo và sang
Phase 6.

---

## Phase 6 — Gắn nút "Lịch sử" vào trang chủ

### Bước 1 — Sửa `src/TrangChu.jsx`

Thêm nút MỚI (không đổi nút "Phân tích" hiện có, vẫn để "Sắp ra mắt"):

```jsx
<button className="nut-dieu-huong" onClick={() => onDieuHuong('lichSu')}>
  🕘 Lịch sử
</button>
```

(Đặt cạnh nút "Ghi điểm" đã bật từ V6, TRƯỚC nút "Phân tích" vẫn đang mờ.)

### Bước 2 — Sửa `src/App.jsx`

```jsx
import LichSu from './LichSu.jsx'
```

```jsx
{trang === 'lichSu' && (
  <>
    <button className="nut-ve-trang-chu" onClick={() => setTrang('trangChu')}>
      ← Trang chủ
    </button>
    <LichSu />
  </>
)}
```

### Kiểm tra Phase 6

1. Trang chủ: nút "Lịch sử" bấm được, nút "Phân tích" vẫn mờ "Sắp ra mắt".
2. Luồng đầy đủ: Trang chủ → Lịch sử → đổi tab → lọc → mở rộng phiên/hiệp
   → xem chi tiết 1 ván AI → quay về trang chủ — không lỗi, không mất dữ
   liệu.

---

## Cập nhật thực tế khi triển khai (khác với mô tả gốc ở trên)

Bản mô tả gốc viết đúng Ý TƯỞNG, nhưng khi ráp vào codebase thật (đã qua
V5/V6 với nhiều state khác nhau, và chạy trong `<StrictMode>`), phát hiện
**4 lỗi thật sự** qua kiểm thử bằng Playwright — không chỉ đọc code mà
chơi thử nhiều ván/hiệp/phiên liên tục. Ghi lại đây để không lặp lại:

### Lỗi 1 — Tạo phiên/hiệp AI "ma" ngay cả khi chưa từng chơi AI

Bản gốc khởi tạo `hiepAIHienTai` bằng
`useState(() => damBaoPhienHiepAI())` (hoặc effect chạy lúc mount với
`[]`). Vấn đề: `App()` là component gốc, LUÔN mount bất kể đang ở trang
nào (trang chủ, Ghi điểm, Luật chơi...) — nên logic "tạo phiên/hiệp AI
nếu chưa có" chạy NGAY LÚC MỞ APP, kể cả khi người dùng chỉ định dùng Ghi
điểm và chưa bao giờ bấm "Chơi với AI". Phát hiện qua kiểm thử: mở app,
chỉ ghi 1 phiên Ghi điểm, kiểm tra `localStorage` thấy THÊM 1 phiên
`nguon: 'choiAI'` không ai yêu cầu.

**Sửa:** bỏ hẳn effect/useState khởi tạo lúc mount. Gọi
`damBaoPhienHiepAI()` + `setHiepAIHienTai(...)` trực tiếp tại ĐÚNG 2 điểm
người chơi thực sự bắt đầu chơi AI — trong `chonVanMoi()` (ván mới) và
`chonChoiTiep()` (tiếp tục ván đang dở, đã có từ V5) — không cần effect
hay ref chống StrictMode nào cả, vì đây giờ là các hàm gọi từ sự kiện
click (event handler), không phải initializer/effect nên StrictMode
không gọi lại 2 lần.

### Lỗi 2 — Đếm sai "Ván Y/12" khi AI tự thắng trắng

Công thức gốc `soVanDangHienThi = soVanDaXongTrongHiep + (daXacNhan ? 0 : 1)`
giả định "chưa xác nhận thì ván chưa được ghi log". Nhưng khi AI TỰ ĐỘNG
thắng trắng, ván ĐÃ được ghi log (qua effect) mà `daXacNhan` KHÔNG BAO GIỜ
được set `true` trong trường hợp này (chỉ `xacNhanBai`/`xacNhanBaoU` mới
set) — dẫn tới hiển thị lố 1 số (vd "Ván 2/12" ngay từ ván đầu tiên).

**Sửa:** dùng biến `vanDaKetThuc` đã có sẵn từ V5
(`!!(ketQuaThangTrang || (daXacNhan && ketQuaDiem))`) thay vì chỉ
`daXacNhan` — biến này đúng cho CẢ 2 trường hợp (thắng trắng tự động HOẶC
đã xác nhận/báo Ù).

### Lỗi 3 — Mất dữ liệu chéo giữa Ghi điểm và Chơi AI (nghiêm trọng nhất)

`App.jsx` (Chơi AI) và `GhiDiem.jsx` (Ghi điểm) là 2 component ĐỘC LẬP,
mỗi bên tự giữ 1 bản sao state RIÊNG của CÙNG 3 mảng Phiên/Hiệp/Ván
(cùng đọc/ghi chung 3 khóa `localStorage`). `App.jsx` LUÔN mount (đọc 1
lần lúc mở app), còn `GhiDiem.jsx` mount/unmount theo điều hướng (đọc lại
mỗi lần vào trang). Nếu người dùng: (1) ghi vài ván Ghi điểm, (2) sang
chơi AI — lúc này `damBaoPhienHiepAI()`/`ghiVanAIVaoLichSu()` bên
`App.jsx` GHI dựa trên bản sao state CŨ (từ lúc mở app, TRƯỚC KHI có dữ
liệu Ghi điểm) → **ghi đè, XÓA MẤT** phiên Ghi điểm vừa lưu! Phát hiện
được đúng kịch bản này khi kiểm thử: ghi 2 ván Ghi điểm → chơi 1 ván AI →
vào Lịch sử thấy phiên Ghi điểm biến mất hoàn toàn.

**Sửa:** `damBaoPhienHiepAI()`, `ghiVanAIVaoLichSu()`,
`dungChoiKetThucPhienAI()` (phía `App.jsx`) đều đọc THẲNG từ
`localStorage` bằng `docDanhSach()` ngay tại đầu hàm — KHÔNG tin vào
`danhSachPhienLS`/`danhSachHiepLS`/`danhSachVanLS` (state React, có thể
đã cũ) — rồi mới tính toán/ghi tiếp dựa trên dữ liệu tươi nhất đó (vẫn
`setDanhSachXxxLS(...)` sau cùng để state hiển thị đúng theo).

```jsx
// Ví dụ đoạn đầu damBaoPhienHiepAI() sau khi sửa:
function damBaoPhienHiepAI() {
  const dsPhienTuoi = docDanhSach(KHOA_PHIEN);
  const dsHiepTuoi = docDanhSach(KHOA_HIEP);
  const dsVanTuoi = docDanhSach(KHOA_VAN);
  // ... toàn bộ logic còn lại dùng dsPhienTuoi/dsHiepTuoi/dsVanTuoi thay
  // vì danhSachPhienLS/danhSachHiepLS/danhSachVanLS ...
}
```

**Dọn thêm sau khi sửa:** vì 3 hàm trên giờ đọc thẳng `localStorage`, state
React `danhSachPhienLS`/`danhSachHiepLS` không còn được ĐỌC ở bất kỳ chỗ
nào khác trong `App.jsx` nữa (chỉ còn được GHI qua `setDanhSachPhienLS`/
`setDanhSachHiepLS` — vô nghĩa nếu không ai đọc lại) — linter báo
"unused variable". Đã bỏ hẳn 2 state này, chỉ giữ lại `danhSachVanLS` (vẫn
cần để tính `soVanDaXongTrongHiep` hiển thị sống).

**Hệ quả kèm theo cần sửa ở `GhiDiem.jsx`:** vì `danhSachPhien` giờ chứa
CẢ phiên Ghi điểm LẪN phiên Chơi AI (dùng chung khóa lưu trữ), 2 chỗ
trong `GhiDiem.jsx` phải LỌC đúng `nguon === 'thatNgoai'` (nếu không sẽ
tưởng nhầm 1 phiên Chơi AI đang mở là "phiên Ghi điểm dở dang", hoặc lấy
nhầm tên "Bạn/Đối thủ 1/2/3" làm tên mặc định):

```jsx
const NGUON = 'thatNgoai';

// 1. Tên mặc định — lọc đúng nguồn trước khi lấy phần tử cuối
const phienThatNgoai = danhSachPhien.filter(p => p.nguon === NGUON);
const phienGanNhat = phienThatNgoai[phienThatNgoai.length - 1];

// 2. Phát hiện "phiên chưa kết thúc" — lọc đúng nguồn
const phienChuaKetThuc = !phienDangGhi
  ? (danhSachPhien.find(p => p.nguon === NGUON && p.ketThuc === null) || null)
  : null;
```

### Lỗi 4 — Ghi log thắng trắng AI dù không đang ở màn Chơi AI

Tương tự Lỗi 1: `ketQuaThangTrang` (bộ bài "Bạn" hiện có trong state) được
tính SẴN ngay cả khi người dùng đang ở trang khác (`App()` luôn tính mọi
thứ dù đang hiện trang nào). Nếu không kiểm tra thêm điều kiện, 1 ván ma
có thể bị ghi vào lịch sử Chơi AI dù người chơi chưa từng mở màn đó.

**Sửa:** thêm điều kiện `trang === 'choiAI' && daChonVan` vào ĐẦU effect
ghi log thắng trắng tự động, cả trong điều kiện VÀ trong mảng dependency:

```jsx
useEffect(() => {
  if (!(trang === 'choiAI' && daChonVan)) return;
  if (ketQuaThangTrang && boBaiDaGhiThangTrangRef.current !== boBaiCuaToi) {
    // ... phần còn lại giữ nguyên như bản gốc ...
  }
}, [trang, daChonVan, boBaiCuaToi, ketQuaThangTrang]);
```

### Lỗi nhỏ khác (không thuộc V7, phát lộ ra khi stress-test)

`renderRaw13()` (đã có từ V4, dùng để vẽ banner thắng trắng) khi gọi
trong `.map()` (hiện bài của 3 đối thủ lúc AI thắng trắng) THIẾU `key` —
React cảnh báo "Each child in a list should have a unique key prop" mỗi
khi banner này xuất hiện. Chỉ lộ ra khi kiểm thử BẰNG CÁCH LẶP NHIỀU VÁN
để cố tình gặp AI thắng trắng (bình thường xác suất thấp nên ít khi thấy
banner này khi test qua loa). Đã thêm tham số `key` cho `renderRaw13` và
truyền `idx` khi gọi trong `.map()`.

---

## Cập nhật thực tế lần 2 (sau khi Huy tự chơi và báo lỗi)

Sau khi 6 Phase ở trên đã "xanh" hết theo kiểm thử tự động, Huy tự chơi
thật trên UI và báo thêm **3 lỗi** không lộ ra qua Playwright kịch bản cũ
(vì kịch bản cũ không thử bấm nút quay lại, không thử chế độ "theo ván",
không zoom kỹ vào bài đối thủ lúc thắng trắng). Ghi lại:

### Lỗi 5 — "Chơi với AI" không có nút quay lại Trang chủ

Màn `ChonVan` (chọn chơi tiếp / chơi mới) không có cách nào thoát ra
ngoài trừ đóng tab — thiếu nút back như các trang khác (Ghi điểm, Luật
chơi, Lịch sử đều có).

**Sửa:** thêm nút "← Trang chủ" ngay phía trên `<ChonVan>` trong
`App.jsx`, chỉ set `setTrang('trangChu')` (không đụng tới phiên/hiệp AI
đang mở — vẫn giữ nguyên để chơi tiếp sau):

```jsx
{trang === 'choiAI' && !daChonVan && (
  <>
    <button className="nut-ve-trang-chu" onClick={() => setTrang('trangChu')}>← Trang chủ</button>
    <ChonVan coVanDaLuu={coVanDaLuu} onChonTiep={chonChoiTiep} onChonMoi={chonVanMoi} />
  </>
)}
```

### Lỗi 6 — Chơi AI không có chế độ "theo ván" như Ghi điểm

Bản gốc V7 chỉ có 1 chế độ chơi AI: theo hiệp (12 ván/hiệp, số Ván
luôn kẹp về 1-12). "Ghi điểm" thì cho chọn "Ghi ván mới" (không giới
hạn, không gộp hiệp) HOẶC "Ghi hiệp mới" — Chơi AI thiếu chế độ tương
đương "theo ván", không đồng bộ trải nghiệm giữa 2 chức năng.

**Sửa:** thêm tham số `cheDo` xuyên suốt:
- `ChonVan.jsx`: đổi 1 nút "Bắt đầu ván mới" thành 2 nút — "🆕 Chơi ván
  mới" (`onChonMoi('theoVan')`) và "🃏 Chơi hiệp mới (12 ván)"
  (`onChonMoi('theoHiep')`).
- `damBaoPhienHiepAI(cheDoMoi)` (App.jsx): nhận thêm tham số chế độ; nếu
  đang có phiên AI mở nhưng KHÁC chế độ với `cheDoMoi`, ĐÓNG phiên đó lại
  trước khi tạo phiên mới (không trộn lẫn ván theo-ván với ván theo-hiệp
  trong cùng 1 phiên). Trả về `{ phien, hiep }`, với `hiep: null` khi
  `cheDoMoi === 'theoVan'` (chế độ theo ván không có khái niệm hiệp).
- `chonVanMoi(cheDoMoi)`: nhận tham số chế độ, truyền xuống
  `damBaoPhienHiepAI`.
- `chonChoiTiep()`: khi "Chơi tiếp ván đang dở", tự suy ra đúng chế độ từ
  phiên AI đang mở (`layPhienAIDangMoHoacNull`) thay vì luôn mặc định
  `'theoHiep'`.
- `ghiVanAIVaoLichSu()`: gọi `damBaoPhienHiepAI(phienAIHienTai.cheDo)` để
  tiếp tục ĐÚNG chế độ hiện tại (không tự đổi chế độ giữa chừng); toàn bộ
  logic chỉ áp dụng cho hiệp được gói trong `if (hiep) { ... }` vì chế độ
  theo ván không có hiệp.
- Số ván hiển thị (`soVanDangHienThi`) tính khác nhau theo chế độ: theo
  hiệp thì đếm trong hiệp và kẹp về tối đa 12 (`Math.min(..., 12)`), theo
  ván thì đếm trong CẢ phiên, không kẹp.
- Thêm nút "⏹ Kết thúc phiên" (chỉ hiện khi chế độ là `theoVan` VÀ ván
  hiện tại đã xong) — vì chế độ theo ván không tự kết thúc như hiệp (hết
  12 ván), cần 1 cách chủ động để đóng phiên; đổi tên hàm
  `dungChoiKetThucPhienAI` cũ thành `dongPhienAIHienTai()`, đóng thẳng
  `phienAIHienTai` (không còn phụ thuộc `ketQuaHiepVuaXong.phienId`).

**Bẫy đã gặp khi sửa:** vài nơi gọi `onClick={chonVanMoi}` (bare
reference, không phải `() => chonVanMoi()`) — từ khi `chonVanMoi` nhận
thêm tham số `cheDoMoi`, cách gọi bare này vô tình TRUYỀN LUÔN đối tượng
sự kiện click (`SyntheticEvent`) làm `cheDoMoi` → sai lệch logic ngầm
(không throw lỗi rõ ràng, chỉ đi sai nhánh). Đã rà và sửa hết các chỗ
gọi bare thành arrow function.

### Lỗi 7 — Bài đối thủ vẫn hiện úp dù đã lộ bài lúc AI thắng trắng

Khi có người thắng trắng (tự động, vd "Lục phé bôn"), banner thắng trắng
đã hiện đúng VÀ hiện bài của người thắng — nhưng khu vực hiển thị bài
CÁC ĐỐI THỦ KHÁC (không phải người thắng trắng) vẫn dùng điều kiện cũ
`faceDown={!daXacNhan}` — mà `daXacNhan` KHÔNG BAO GIỜ được set `true`
trong đường thắng trắng tự động (giống hệt nguyên nhân Lỗi 2 ở trên) →
bài đối thủ hiện úp dù ván đã kết thúc và lẽ ra phải lộ hết.

**Sửa:** đổi điều kiện `faceDown` trong `renderBaiDoiThu` từ
`!daXacNhan` sang `!vanDaKetThuc` (biến đã tồn tại, đúng cho cả 2
trường hợp xác nhận thường VÀ thắng trắng tự động — cùng cách sửa như
Lỗi 2).

**Kiểm thử xác nhận (Playwright, chơi thật đến khi gặp AI thắng
trắng):** `.la-bai-sap` (class bài úp) đếm được 0 phần tử ngay khi
banner `.banner-thang-trang` xuất hiện — không còn lá nào úp sai chỗ.

---

## Cập nhật thực tế lần 3 (2 yêu cầu tiếp theo từ Huy)

### Yêu cầu 8 — Quay lại Chơi AI không có cách "chơi tiếp Hiệp đang dở"

Trước đó, màn `ChonVan` chỉ có 2 nút: "Chơi tiếp ván đang dở" (chỉ xuất
hiện khi còn 1 THẾ BÀI đang xếp dở — `coVanDaLuu`) và 2 nút chọn chế độ
"Chơi ván mới"/"Chơi hiệp mới". Vấn đề: nếu người chơi ĐÃ xác nhận xong 1
vài ván trong 1 hiệp (vd đang ở Ván 4/12), rồi bấm "Dừng chơi" (không còn
thế bài dở để lưu, `coVanDaLuu` = false), thì lúc quay lại KHÔNG có nút
nào nói rõ "tiếp tục đúng Hiệp đang dở đó" — chỉ có "Chơi hiệp mới (12
ván)" mà bấm vào lại ÂM THẦM tiếp tục đúng hiệp cũ (vì
`damBaoPhienHiepAI()` vẫn tìm thấy hiệp `!tongKet` sẵn có), gây hiểu lầm
vì nút ghi rõ chữ "mới". Không giống `GhiDiem.jsx` — nơi đã có sẵn 1 nút
riêng biệt "Ghi tiếp Hiệp X đang dở" (`hiepDangDoDang`) tách bạch rõ với
"Ghi hiệp mới".

**Sửa** (đồng bộ đúng theo cách `GhiDiem.jsx` đã làm):
- Thêm biến tính sẵn `hiepAIDoDang` trong `App.jsx` — đọc thẳng
  `localStorage` (không dùng state cũ), chỉ tính khi đang ở màn `ChonVan`
  (`trang==='choiAI' && !daChonVan`) VÀ không có thế bài dở (`!coVanDaLuu`,
  ưu tiên nút "Chơi tiếp ván đang dở" hơn nếu có cả hai) — tìm phiên AI
  đang mở chế độ `theoHiep`, lấy hiệp mới nhất chưa `tongKet`.
- `ChonVan.jsx` thêm nút mới "▶ Chơi tiếp Hiệp X đang dở (Ván Y/12)" hiện
  ngay phía trên 2 nút chọn chế độ, gọi `onChonTiepHiep` (App.jsx:
  `chonTiepHiepDoDang()` — chỉ gọi `chonVanMoi()` KHÔNG truyền `cheDoMoi`,
  nên tự động tiếp tục đúng phiên/hiệp dở dang hiện có).
- **Đồng thời sửa hành vi nút "Chơi hiệp mới" cho ĐÚNG NGHĨA "mới"**: thêm
  tham số `boQuaHiepDoDang` cho `damBaoPhienHiepAI(cheDoMoi,
  boQuaHiepDoDang)` — CHỈ `true` khi gọi từ 2 nút chọn chế độ ở `ChonVan`
  (tức có truyền `cheDoMoi` tường minh: `chonVanMoi(cheDoMoi)` truyền
  `cheDoMoi !== undefined` làm `boQuaHiepDoDang`). Khi `true` VÀ đang có 1
  hiệp dở dang của phiên mở — ĐÓNG HẲN phiên cũ (giữ nguyên trong Lịch sử,
  không xóa) rồi mở phiên + Hiệp 1 hoàn toàn mới, thay vì âm thầm ghi tiếp
  vào hiệp cũ như trước — giống hệt cách `batDauHanhDong()` bên
  `GhiDiem.jsx` xử lý (`tiepTucDuocPhienCu` chỉ đúng khi `!hiepDangDoDang`).
  Các lệnh gọi `chonVanMoi()` không tham số (nút "Chơi ván mới" giữa ván,
  nút "Chơi tiếp" sau tổng kết hiệp, `chonTiepHiepDoDang()`) không bị ảnh
  hưởng — vẫn luôn tiếp tục êm như cũ.
- Thêm dòng cảnh báo trong `ChonVan.jsx`: "Bấm 'Chơi hiệp mới' sẽ bỏ dở
  Hiệp X (vẫn giữ trong Lịch sử) và bắt đầu hiệp mới từ đầu" khi
  `hiepAIDoDang` tồn tại.

**Kiểm thử (Playwright):** chơi hiệp mới → xác nhận 3 ván → Dừng chơi →
vào lại "Chơi với AI" → xác nhận có nút "▶ Chơi tiếp Hiệp 1 đang dở (Ván
4/12)" → bấm vào → xác nhận hiển thị đúng "Hiệp 1 — Ván 4/12" (tiếp tục
đúng, không mất tiến độ). Kiểm thử riêng nút "Chơi hiệp mới" khi đang có
hiệp dở dang: xác nhận có cảnh báo, bấm vào → hiển thị "Hiệp [mới] — Ván
1/12" (KHÔNG phải Ván 4/12 — xác nhận đã bỏ dở đúng như cảnh báo, không
lặng lẽ tiếp tục nữa).

### Yêu cầu 9 — Trang Lịch sử: đổi sang dạng bảng giống Ghi điểm

Bản gốc V7 hiển thị điểm từng ván trong 1 hiệp/phiên bằng các dòng `<p>`
văn bản rời rạc (`Ván #12 (An chia): An +6, Bình -2, ...`) — khó nhìn,
không nhất quán với bảng điểm dạng lưới (`<table className="bang-diem">`)
đã có sẵn ở `GhiDiem.jsx`. Tab "Chơi với AI" còn khác cấu trúc hẳn — hiện
1 danh sách PHẲNG tất cả ván (không nhóm theo phiên/hiệp), giới hạn 100
ván gần nhất.

**Sửa:**
- Thêm 1 component con `BangDiemVan({ nguoiChoi, danhSachVan, onChonVan })`
  trong `LichSu.jsx`, dựng lại ĐÚNG cấu trúc bảng của `GhiDiem.jsx`: `<table
  className="bang-diem">` bọc trong `<div className="boc-bang-diem">`,
  `<thead>` cột "Ván" + 1 cột/người chơi, `<tbody>` 1 hàng/ván, `<tfoot>`
  hàng `.hang-tong-diem` hiển thị "Tổng" — tính bằng `tinhTongKetHiep(...)`
  (dùng chung được cho cả theo hiệp lẫn theo ván, vì `tinhTongKetPhien` chỉ
  là alias gọi lại `tinhTongKetHiep`).
- Tab "Bài thật": thay khối `<p>` liệt kê ván bằng `<BangDiemVan
  nguoiChoi={phien.nguoiChoi} danhSachVan={...} />` — giữ nguyên cấu trúc
  mở rộng Phiên → Hiệp (bấm để mở/đóng) như cũ.
- Tab "Chơi với AI": đổi hẳn từ danh sách phẳng sang CÙNG cấu trúc phân
  cấp Phiên → Hiệp/Ván như tab "Bài thật" (nhất quán 2 tab) — mỗi phiên AI
  hiện theo ngày + chế độ (theo hiệp/theo ván), mở ra xem đúng
  `BangDiemVan`, TRUYỀN THÊM `onChonVan={setVanAIDangXem}` để mỗi hàng ván
  bấm được — mở đúng màn xem lại chi tiết 13 lá bài đã chia của ván đó
  (giữ nguyên UI xem bài, không đổi).
- `doiTab()` giờ reset cả `phienDangXem`/`hiepDangXem` (không chỉ
  `vanAIDangXem` như trước) khi đổi tab — tránh mở nhầm đúng ID phiên/hiệp
  của tab kia (2 tab dùng chung 1 state mở/đóng).

**Kiểm thử (Playwright):** chơi 1 hiệp AI, dừng chơi giữa hiệp → vào Lịch
sử → tab "Chơi với AI" → mở phiên → mở hiệp → xác nhận `table.bang-diem`
xuất hiện đúng 1 bảng với hàng `.hang-tong-diem` — bấm vào 1 hàng ván →
xác nhận mở đúng màn "← Quay lại danh sách" xem chi tiết bài (không lỗi
console).

---

## Hoàn thành V7 — báo cáo lại với Huy

1. Toàn bộ 6 Phase chạy đúng, không lỗi Console.
2. Chơi liên tục qua nhiều hiệp AI (đủ 24+ ván) — xác nhận hiệp tự động
   chuyển sang hiệp mới, không cần thao tác gì.
3. Xác nhận số `#` (toàn cục) của Ván/Hiệp tăng liên tục, không reset dù
   là Ghi điểm hay Chơi AI, dù bắt đầu phiên mới bao nhiêu lần.
4. Ghi chú cho tương lai: nút "Phân tích" (biểu đồ, phân tích xu hướng,
   tỷ lệ thắng...) để dành version sau — khi làm sẽ đọc lại đúng dữ liệu
   đã có ở đây (`lichSuChoi.js` + `lichSuChoiAI` gộp chung), không cần
   thêm lưu trữ mới.
