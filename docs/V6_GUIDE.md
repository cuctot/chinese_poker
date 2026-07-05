# V6_GUIDE.md — Ghi điểm (Phiên / Hiệp / Ván)

> **Dành cho ai đọc file này:**
> - Nếu bạn là **Claude Code**: làm theo ĐÚNG THỨ TỰ 5 Phase bên dưới.
>   MỖI Phase xong phải DỪNG LẠI, báo cáo đã làm gì, và để Huy tự kiểm
>   tra theo checklist cuối Phase đó trước khi sang Phase tiếp theo.
> - Nếu bạn là **Huy**: đọc phần "Giải thích" sau mỗi khối code.

## Phạm vi V6

Trang "Ghi điểm" — công cụ ghi lại điểm khi Huy chơi bài THẬT ngoài đời
(không mô phỏng bài, chỉ nhập tay điểm cuối mỗi ván).

**Ranh giới quan trọng: V6 chỉ lo NHẬP LIỆU, không lo XEM LẠI.** Ban đầu
dự định gộp cả "xem lại lịch sử" vào chung trang này, nhưng tách riêng ra
hợp lý hơn — vì lý do:
1. Ghi điểm và xem lại là 2 mối quan tâm khác nhau (nhập liệu vs. duyệt
   lại), gộp chung dễ khiến trang phình to.
2. Trang xem lại (sẽ đặt tên "Lịch sử", làm ở version sau) không chỉ đọc
   dữ liệu Ghi điểm — còn cần gộp thêm lịch sử các ván Chơi với AI (khác
   hẳn hình dạng dữ liệu: 4 tên thật tự đặt vs. cố định "Bạn" + 3 AI,
   không có khái niệm Hiệp/lượt chia). Vì 2 nguồn dữ liệu khác nhau nhiều,
   không nên trộn logic đọc-để-hiển-thị vào ngay trong trang nhập liệu.

Vậy V6 CHỈ làm:
- **Phiên**: 1 lần ghi LIÊN TỤC theo ĐÚNG 1 chế độ (xem Phase 2) — không
  còn bước "khai báo phiên" tách riêng, chỉ cần bấm 1 trong 2 nút hành
  động ở màn bắt đầu là phiên tự được tạo/tiếp tục ngầm bên dưới.
- **2 chế độ ghi điểm, chọn qua 2 nút hành động trực tiếp** ("Ghi ván
  mới" / "Ghi hiệp mới") thay vì chọn chế độ trước rồi mới bắt đầu:
  - **Theo ván**: ghi từng ván rời rạc, không nhóm gì thêm.
  - **Theo hiệp**: 12 ván/hiệp, chia 4 lần đổi người chia (mỗi người chia
    đúng 3 ván liên tiếp theo thứ tự đã định) — hết hiệp tự tổng kết,
    Huy chọn chơi tiếp hiệp mới (giữ tên/thứ tự cũ, sửa được nếu muốn)
    hoặc kết thúc phiên.
- **4 người chơi cố định** cho mỗi phiên (đúng cấu trúc 4 lần chia) — tên
  tự nhớ từ phiên gần nhất, người chia đầu tiên luôn đứng đầu danh sách.

KHÔNG làm trong V6:
- **Xem lại lịch sử** (danh sách Phiên/Hiệp/Ván, mở rộng từng cấp) — để
  dành cho trang "Lịch sử" riêng ở version sau. Phase 1 (mô hình dữ liệu)
  vẫn viết đầy đủ và lưu trữ đúng như thiết kế — trang Lịch sử sau này sẽ
  ĐỌC LẠI đúng dữ liệu này qua `lichSuChoi.js`, không cần đổi gì ở V6.
- Chụp ảnh nhận diện bài tự động tính điểm (để dành version sau, khi làm
  sẽ chỉ cần thay cách TẠO RA object `diem` — mô hình dữ liệu Phiên/Hiệp/
  Ván ở V6 không cần đổi gì).

---

## Phase 1 — Mô hình dữ liệu (`src/lichSuChoi.js`)

Mục tiêu: có đủ hàm tạo/tính/truy vấn/lưu trữ, kiểm tra bằng Console
trước khi đụng gì tới giao diện.

### Bước 1 — Tạo file mới `src/lichSuChoi.js`

```js
// lichSuChoi.js — Mô hình dữ liệu lưu trữ lịch sử Ghi điểm.
// 3 mảng PHẲNG (không lồng nhau): Phiên, Hiệp, Ván — mỗi Hiệp/Ván chỉ giữ
// id tham chiếu ngược lên cấp cha, không lồng mảng con vào trong.

function taoId(tienTo) {
  return `${tienTo}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

// ---- Tạo mới ----

export function taoPhienMoi(cheDo, nguoiChoi) {
  return {
    id: taoId('phien'),
    batDau: Date.now(),
    ketThuc: null,
    cheDo, // 'theoVan' | 'theoHiep'
    nguoiChoi: [...nguoiChoi], // thứ tự chia bài
  };
}

export function taoHiepMoi(phienId, soThuTu, nguoiChoi) {
  return {
    id: taoId('hiep'),
    phienId,
    soThuTu,
    nguoiChoi: [...nguoiChoi], // CHỤP LẠI tại thời điểm hiệp bắt đầu
    tongKet: null, // tính khi đủ 12 ván, xem tinhTongKetHiep
  };
}

export function taoVanMoi({ phienId, hiepId, lanChiaThu, nguoiChia, diem }) {
  return {
    id: taoId('van'),
    phienId,
    hiepId: hiepId ?? null,
    lanChiaThu: lanChiaThu ?? null,
    nguoiChia,
    thoiGian: Date.now(),
    diem: { ...diem },
  };
}
```

**Giải thích:** 3 hàm `taoPhienMoi`/`taoHiepMoi`/`taoVanMoi` chỉ làm ĐÚNG
1 việc — trả về 1 object mới đúng khuôn dạng, không tự lưu vào đâu cả
(việc lưu trữ tách riêng ở Bước 4). `taoId` dùng `Date.now()` (mili-giây
hiện tại) + 1 số ngẫu nhiên nhỏ để tạo id gần như chắc chắn không trùng —
đủ dùng cho app chạy 1 mình trên máy Huy, không cần thuật toán tạo id
phức tạp hơn. Chú ý `Hiệp.nguoiChoi` là 1 BẢN SAO (`[...nguoiChoi]`,
không phải tham chiếu) — để nếu `Phiên.nguoiChoi` bị sửa sau này (đổi
tên người chơi ở hiệp kế tiếp), hiệp CŨ này không bị ảnh hưởng theo.

```js
// ---- Tính toán ----

// Xác định ai chia + lần chia thứ mấy, dựa trên số thứ tự ván TRONG HIỆP
// (1-12) và danh sách người chơi theo đúng thứ tự chia đã định.
export function nguoiChiaChoVan(nguoiChoi, soThuTuVanTrongHiep) {
  const lanChia = Math.ceil(soThuTuVanTrongHiep / 3); // 1-4
  const idx = (lanChia - 1) % nguoiChoi.length;
  return { nguoiChia: nguoiChoi[idx], lanChia };
}

// Kiểm tra 1 object điểm có "hợp lệ" không (tổng phải = 0, đúng bản chất
// trò chơi có tổng bằng 0 — dùng để CẢNH BÁO Huy nếu lỡ nhập sai tay).
export function tongDiemHopLe(diem) {
  const tong = Object.values(diem).reduce((a, b) => a + b, 0);
  return tong === 0;
}

// Tổng kết 1 hiệp — cộng dồn điểm tất cả ván thuộc hiệp đó.
export function tinhTongKetHiep(danhSachVanCuaHiep) {
  const tongKet = {};
  danhSachVanCuaHiep.forEach(van => {
    Object.entries(van.diem).forEach(([ten, d]) => {
      tongKet[ten] = (tongKet[ten] || 0) + d;
    });
  });
  return tongKet;
}

// Tổng kết 1 phiên — cộng dồn TẤT CẢ ván thuộc phiên (bất kể qua hiệp nào)
export function tinhTongKetPhien(danhSachVanCuaPhien) {
  return tinhTongKetHiep(danhSachVanCuaPhien); // logic giống hệt, dùng lại
}
```

**Giải thích `nguoiChiaChoVan`:** `Math.ceil(soThuTuVanTrongHiep / 3)`
biến số thứ tự ván (1-12) thành "lần chia thứ mấy" (1-4) — ví dụ ván 1,2,3
đều cho ra `Math.ceil(1/3)=1`, `Math.ceil(2/3)=1`, `Math.ceil(3/3)=1`;
ván 4,5,6 cho ra `2`; cứ vậy tới ván 12 cho ra `4`. Phép `% nguoiChoi.length`
đảm bảo vòng lặp quay lại từ đầu danh sách nếu (giả sử sau này) có nhiều
hơn 4 lần chia — dù hiện tại luôn đúng 4 lần khớp đúng 4 người, viết theo
kiểu `%` vẫn an toàn nếu sau này mở rộng.

**Giải thích `tinhTongKetHiep`/`tinhTongKetPhien`:** cùng 1 thuật toán
(cộng dồn điểm theo từng người qua nhiều ván) áp dụng được cho CẢ hiệp lẫn
phiên — vì về bản chất "tổng kết phiên" chỉ là "tổng kết của TẤT CẢ ván
trong phiên đó", không quan tâm chúng thuộc hiệp nào. Đây là lý do
`tinhTongKetPhien` chỉ gọi lại `tinhTongKetHiep` thay vì viết thêm 1 hàm
riêng — tránh lặp code không cần thiết.

```js
// ---- Truy vấn (lọc trên mảng phẳng) ----

export function layHiepCuaPhien(phienId, danhSachHiep) {
  return danhSachHiep.filter(h => h.phienId === phienId).sort((a, b) => a.soThuTu - b.soThuTu);
}

export function layVanCuaHiep(hiepId, danhSachVan) {
  return danhSachVan.filter(v => v.hiepId === hiepId).sort((a, b) => a.thoiGian - b.thoiGian);
}

export function layVanCuaPhien(phienId, danhSachVan) {
  return danhSachVan.filter(v => v.phienId === phienId).sort((a, b) => a.thoiGian - b.thoiGian);
}
```

**Giải thích:** đây chính là lợi ích của việc lưu PHẲNG (không lồng nhau)
— muốn biết "hiệp này có những ván nào", chỉ cần LỌC mảng Ván theo
`hiepId` khớp, không cần đào sâu vào cấu trúc lồng nhau nào cả. `.sort()`
đảm bảo luôn hiển thị đúng thứ tự thời gian, dù mảng gốc có thể không
được thêm vào theo đúng thứ tự (ví dụ nếu sau này cho sửa lại 1 ván cũ).

```js
// ---- Lưu trữ (localStorage) ----

const KHOA_PHIEN = 'mauBinhLichSuPhien';
const KHOA_HIEP = 'mauBinhLichSuHiep';
const KHOA_VAN = 'mauBinhLichSuVan';

export function docDanhSach(khoa) {
  try {
    const raw = localStorage.getItem(khoa);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function ghiDanhSach(khoa, mang) {
  localStorage.setItem(khoa, JSON.stringify(mang));
}

export { KHOA_PHIEN, KHOA_HIEP, KHOA_VAN };
```

**Giải thích:** 2 hàm `docDanhSach`/`ghiDanhSach` dùng CHUNG cho cả 3 loại
dữ liệu (Phiên/Hiệp/Ván) — chỉ khác nhau ở `khoa` (tên khóa localStorage)
truyền vào. Đây là ví dụ về việc viết 1 hàm TỔNG QUÁT thay vì viết riêng
`docDanhSachPhien`, `docDanhSachHiep`, `docDanhSachVan` 3 lần gần giống
hệt nhau — giảm trùng lặp code.

### Kiểm tra Phase 1

Mở Console (hoặc chạy bằng Node.js nếu quen), thử:
```js
import { nguoiChiaChoVan, tinhTongKetHiep, tongDiemHopLe } from './lichSuChoi.js'

console.log(nguoiChiaChoVan(['An','Bình','Chi','Dũng'], 5)); // { nguoiChia: 'Bình', lanChia: 2 }
console.log(tongDiemHopLe({ An: 3, Bình: -1, Chi: -1, Dũng: -1 })); // true
console.log(tongDiemHopLe({ An: 3, Bình: -1, Chi: -1, Dũng: -2 })); // false
```

**Bạn học được gì ở Phase 1:** đây là ví dụ về thiết kế dữ liệu kiểu
"chuẩn hóa" (normalization) — thay vì lồng Ván bên trong Hiệp bên trong
Phiên (trực quan hơn khi ĐỌC), tách thành 3 mảng phẳng chỉ liên kết bằng
id (giống 1 cơ sở dữ liệu quan hệ thu nhỏ). Đổi lại 1 chút khó đọc hơn,
nhưng đổi lấy việc GHI/SỬA dữ liệu an toàn hơn rất nhiều — thêm 1 ván mới
chỉ là thêm 1 phần tử vào cuối 1 mảng, không phải đào sâu 3 tầng lồng
nhau để tìm đúng chỗ chèn vào (dễ gây lỗi khi cập nhật state bất biến
trong React).

Dừng lại ở đây. Xác nhận cả 3 dòng in đúng trước khi báo cáo và sang
Phase 2.

---

## Phase 2 — Màn bắt đầu ghi điểm: tên người chơi + Ghi ván mới / Ghi hiệp mới

> **Đã đổi so với bản thiết kế đầu tiên** (dựa trên phản hồi thực tế của
> Huy sau khi dùng thử): bỏ hẳn bước "chọn chế độ" bằng radio + nút "Bắt
> đầu phiên" riêng. Giờ màn bắt đầu LUÔN hiện sẵn ô nhập tên (không cần
> gate/nút mở form), và có 2 nút hành động trực tiếp: **"Ghi ván mới"**
> và **"Ghi hiệp mới (12 ván)"** — bấm nút nào, chế độ tương ứng được
> quyết định NGAY LÚC ĐÓ, không cần bước chọn riêng trước.

Mục tiêu: có màn hình nhập tên/thứ tự 4 người chơi (tên tự nhớ từ lần
chơi gần nhất) + 2 nút hành động rõ ràng; ĐỒNG THỜI phát hiện đúng nếu có
hiệp từ trước còn dở dang hoặc vừa hoàn thành, cho Huy thêm lựa chọn phù
hợp bên cạnh 2 nút chính.

**Định nghĩa lại "Phiên":** 1 Phiên = 1 lần ghi LIÊN TỤC theo ĐÚNG 1 chế
độ (toàn ván, hoặc toàn hiệp). Không còn bước "khai báo phiên" riêng biệt
— Phiên được tạo/tiếp tục NGẦM mỗi khi bấm 1 trong 2 nút hành động:
- Nếu đang có 1 phiên còn mở (`ketThuc === null`) ĐÚNG chế độ vừa chọn
  (và không bị chặn bởi 1 hiệp dở dang chưa xử lý) → TIẾP TỤC phiên đó
  (ghi thêm ván vào, hoặc mở hiệp kế tiếp trong cùng phiên).
- Ngược lại (khác chế độ, hoặc đang có hiệp dở dang mà Huy chọn bỏ qua)
  → coi phiên cũ đã xong, đóng lại (`ketThuc: Date.now()`) rồi mở phiên
  mới theo đúng chế độ vừa bấm — không cần bước xác nhận "bỏ, bắt đầu
  mới" riêng như bản đầu.

### Bước 1 — Tạo file mới `src/GhiDiem.jsx`

```jsx
import { useState } from 'react'
import {
  taoPhienMoi, taoHiepMoi, docDanhSach, ghiDanhSach, layHiepCuaPhien,
  KHOA_PHIEN, KHOA_HIEP, KHOA_VAN,
} from './lichSuChoi.js'

function GhiDiem() {
  const [danhSachPhien, setDanhSachPhien] = useState(() => docDanhSach(KHOA_PHIEN));
  const [danhSachHiep, setDanhSachHiep] = useState(() => docDanhSach(KHOA_HIEP));
  const [danhSachVan, setDanhSachVan] = useState(() => docDanhSach(KHOA_VAN));

  const [phienDangGhi, setPhienDangGhi] = useState(null); // Phiên ĐANG hoạt động (đã quyết định xong)
  const [hiepDangGhi, setHiepDangGhi] = useState(null);   // Hiệp ĐANG hoạt động (chỉ có nếu theoHiep)
  const [diemNhap, setDiemNhap] = useState({});

  // Tên 4 người chơi — mặc định lấy đúng thứ tự đã dùng ở phiên GẦN NHẤT
  // (dù phiên đó đã kết thúc hay chưa), để "duy trì từ lần chơi trước" mà
  // không cần thêm 1 chỗ lưu trữ riêng — vị trí đầu danh sách LUÔN là
  // người chia đầu tiên, giữ nguyên ý nghĩa đó qua các phiên; đổi ai chia
  // trước bằng ô chọn "Người chia bài đầu tiên" bên dưới (xem
  // `chonNguoiChiaDauTien`), hoặc tự sửa/đổi chỗ tên ngay trong ô nhập.
  const [tenNguoiChoi, setTenNguoiChoi] = useState(() => {
    const phienGanNhat = danhSachPhien[danhSachPhien.length - 1];
    return phienGanNhat ? [...phienGanNhat.nguoiChoi] : ['', '', '', ''];
  });

  // Chỉ tính khi CHƯA quyết định xong (phienDangGhi còn null) — phát hiện
  // phiên từ TRƯỚC còn dở dang (ketThuc === null).
  const phienChuaKetThuc = !phienDangGhi ? (danhSachPhien.find(p => p.ketThuc === null) || null) : null;
  const hiepMoiNhatCuaPhienDo = phienChuaKetThuc && phienChuaKetThuc.cheDo === 'theoHiep'
    ? (layHiepCuaPhien(phienChuaKetThuc.id, danhSachHiep).slice(-1)[0] || null)
    : null;
  const hiepDangDoDang = hiepMoiNhatCuaPhienDo && hiepMoiNhatCuaPhienDo.tongKet === null
    ? hiepMoiNhatCuaPhienDo
    : null;
  // Hiệp mới nhất ĐÃ đủ 12 ván nhưng chưa kịp bấm "Hiệp tiếp theo"/"Kết
  // thúc phiên" trước khi rời trang lần trước — KHÁC với hiepDangDoDang
  // (chưa đủ 12 ván).
  const hiepVuaHoanThanh = hiepMoiNhatCuaPhienDo && hiepMoiNhatCuaPhienDo.tongKet !== null
    ? hiepMoiNhatCuaPhienDo
    : null;

  function suaTen(idx, gtri) {
    setTenNguoiChoi(prev => prev.map((t, i) => i === idx ? gtri : t));
  }

  // Đưa người được chọn ở vị trí idxDuocChon lên ĐẦU danh sách, các người
  // còn lại lùi xuống nhưng vẫn giữ nguyên thứ tự tương đối với nhau.
  function chonNguoiChiaDauTien(idxDuocChon) {
    setTenNguoiChoi(prev => {
      if (idxDuocChon === 0) return prev;
      const moi = [...prev];
      const [ten] = moi.splice(idxDuocChon, 1);
      moi.unshift(ten);
      return moi;
    });
  }

  function moDiemRong(danhSachTen) {
    const diemRong = {};
    danhSachTen.forEach(t => { diemRong[t] = ''; });
    setDiemNhap(diemRong);
  }

  // Đóng phiên đang mở lại — hiệp dở dang (nếu có) vẫn giữ nguyên trong
  // lịch sử, không xóa, chỉ không tính vào phiên đang hoạt động nữa.
  function dongPhienDangMo() {
    const daCapNhat = { ...phienChuaKetThuc, ketThuc: Date.now() };
    const dsMoi = danhSachPhien.map(p => p.id === phienChuaKetThuc.id ? daCapNhat : p);
    setDanhSachPhien(dsMoi);
    ghiDanhSach(KHOA_PHIEN, dsMoi);
    return dsMoi;
  }

  // Hành động DUY NHẤT cho cả 2 nút "Ghi ván mới"/"Ghi hiệp mới" — xem
  // định nghĩa lại "Phiên" ở đầu Phase này.
  function batDauHanhDong(cheDoMoi) {
    const tenSach = tenNguoiChoi.map(t => t.trim());
    if (tenSach.some(t => !t)) return;

    const tiepTucDuocPhienCu = phienChuaKetThuc
      && phienChuaKetThuc.cheDo === cheDoMoi
      && !hiepDangDoDang;

    if (tiepTucDuocPhienCu) {
      setPhienDangGhi(phienChuaKetThuc);
      if (cheDoMoi === 'theoHiep') {
        const soThuTuMoi = (hiepMoiNhatCuaPhienDo?.soThuTu ?? 0) + 1;
        const hiepMoi = taoHiepMoi(phienChuaKetThuc.id, soThuTuMoi, phienChuaKetThuc.nguoiChoi);
        const dsHiepMoi = [...danhSachHiep, hiepMoi];
        setDanhSachHiep(dsHiepMoi);
        ghiDanhSach(KHOA_HIEP, dsHiepMoi);
        setHiepDangGhi(hiepMoi);
      } else {
        setHiepDangGhi(null);
      }
      moDiemRong(phienChuaKetThuc.nguoiChoi);
      return;
    }

    const dsPhienSauKhiDong = phienChuaKetThuc ? dongPhienDangMo() : danhSachPhien;
    const phienMoi = taoPhienMoi(cheDoMoi, tenSach);
    const dsPhienMoi = [...dsPhienSauKhiDong, phienMoi];
    setDanhSachPhien(dsPhienMoi);
    ghiDanhSach(KHOA_PHIEN, dsPhienMoi);

    let hiepMoi = null;
    if (cheDoMoi === 'theoHiep') {
      hiepMoi = taoHiepMoi(phienMoi.id, 1, tenSach);
      const dsHiepMoi = [...danhSachHiep, hiepMoi];
      setDanhSachHiep(dsHiepMoi);
      ghiDanhSach(KHOA_HIEP, dsHiepMoi);
    }

    setPhienDangGhi(phienMoi);
    setHiepDangGhi(hiepMoi);
    moDiemRong(tenSach);
  }

  // Ghi tiếp đúng vào hiệp còn dở dang từ trước
  function ghiTiepHiepDoDang() {
    setPhienDangGhi(phienChuaKetThuc);
    setHiepDangGhi(hiepDangDoDang);
    moDiemRong(phienChuaKetThuc.nguoiChoi);
  }

  // Mở lại đúng màn tổng kết của hiệp vừa hoàn thành (xem Phase 4)
  function xemTongKetHiepVuaXong() {
    setPhienDangGhi(phienChuaKetThuc);
    setHiepDangGhi(hiepVuaHoanThanh);
  }

  const chuaDuTen = tenNguoiChoi.some(t => !t.trim());

  return (
    <div className="trang-ghi-diem">
      <h2>Ghi điểm</h2>

      {!phienDangGhi && (
        <div className="khoi-luat">
          <div className="khoi-luat-tieu-de">
            Tên 4 người chơi (theo đúng thứ tự chia bài)
          </div>
          {tenNguoiChoi.map((ten, idx) => (
            <input
              key={idx}
              type="text"
              placeholder={`Người chơi ${idx + 1}${idx === 0 ? ' (chia đầu tiên)' : ''}`}
              value={ten}
              onChange={e => suaTen(idx, e.target.value)}
              style={{ display: 'block', width: '100%', marginBottom: 8 }}
            />
          ))}

          <label style={{ display: 'block', marginBottom: 8 }}>
            Người chia bài đầu tiên
            <select
              value={0}
              onChange={e => chonNguoiChiaDauTien(Number(e.target.value))}
              style={{ display: 'block', width: '100%', marginTop: 4 }}
            >
              {tenNguoiChoi.map((ten, idx) => (
                <option key={idx} value={idx}>{ten.trim() || `Người chơi ${idx + 1}`}</option>
              ))}
            </select>
          </label>

          {hiepDangDoDang && (
            <button className="nut-chon-van nut-chon-van-tiep" onClick={ghiTiepHiepDoDang} style={{ marginBottom: 8 }}>
              Ghi tiếp Hiệp {hiepDangDoDang.soThuTu} đang dở
            </button>
          )}
          {hiepVuaHoanThanh && (
            <button className="nut-chon-van nut-chon-van-tiep" onClick={xemTongKetHiepVuaXong} style={{ marginBottom: 8 }}>
              Xem tổng kết Hiệp {hiepVuaHoanThanh.soThuTu} vừa xong
            </button>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="nut-chon-van" disabled={chuaDuTen} onClick={() => batDauHanhDong('theoVan')}>
              Ghi ván mới
            </button>
            <button className="nut-chon-van" disabled={chuaDuTen} onClick={() => batDauHanhDong('theoHiep')}>
              Ghi hiệp mới (12 ván)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GhiDiem;
```

**Giải thích:**
- `phienChuaKetThuc` chỉ tính khi `phienDangGhi` CÒN `null` — MỘT KHI Huy
  đã bấm 1 trong 2 nút hành động, `phienDangGhi` được set, cả khối màn
  bắt đầu (tên + nút) tự ẩn đi — không cần thêm biến cờ riêng để nhớ
  "đã bắt đầu ghi chưa", y hệt nguyên lý đã dùng ở bản thiết kế đầu.
- **`tenNguoiChoi` lấy mặc định từ `danhSachPhien[danhSachPhien.length - 1]`**
  (phần tử CUỐI mảng — luôn là phiên tạo gần đây nhất, vì mảng chỉ được
  nối thêm vào cuối, không chèn giữa) — tận dụng lại dữ liệu ĐÃ CÓ thay vì
  thêm 1 khóa `localStorage` riêng chỉ để nhớ "tên dùng lần trước". Người
  chia đầu tiên của phiên trước tự động vẫn đứng đầu danh sách mới.
- **Ô chọn "Người chia bài đầu tiên"** (`<select>` liệt kê đúng 4 tên vừa
  nhập): `chonNguoiChiaDauTien(idx)` đưa người được chọn lên VỊ TRÍ ĐẦU
  mảng `tenNguoiChoi`, giữ nguyên thứ tự tương đối của 3 người còn lại
  (dùng `splice` cắt ra rồi `unshift` chèn lại lên đầu). `<select>` luôn
  gán `value={0}` — vì sau khi đổi, người được chọn ĐÃ Ở vị trí 0, nên ô
  chọn hiển thị đúng "value 0 = tên hiện đang đứng đầu" một cách tự nhiên
  qua lần render lại, không cần thêm state riêng để nhớ "đang chọn ai".
- **`batDauHanhDong(cheDoMoi)` là hàm DUY NHẤT cho cả 2 nút** — nhánh
  `tiepTucDuocPhienCu` quyết định TIẾP TỤC (nếu cùng chế độ, không bị
  chặn bởi hiệp dở dang) hay ĐÓNG PHIÊN CŨ + MỞ PHIÊN MỚI (nếu khác chế
  độ, hoặc đang có hiệp dở dang mà Huy chọn bấm nút khác để bỏ qua nó).
  Theo đúng lựa chọn của Huy: khi có hiệp dở dang, CẢ 3 nút đều hiện cùng
  lúc — bấm "Ghi ván mới"/"Ghi hiệp mới" lúc đó sẽ tự kết thúc phiên cũ
  (hiệp dở dang vẫn lưu nguyên, không tổng kết) rồi vào thẳng phiên mới
  ngay, không cần bước xác nhận riêng.
- **`hiepVuaHoanThanh` (khác `hiepDangDoDang`)**: khi hiệp mới nhất ĐÃ đủ
  12 ván (có `tongKet`) nhưng phiên chưa đóng (Huy rời trang đúng lúc vừa
  xong hiệp, chưa kịp bấm "Hiệp tiếp theo"/"Kết thúc phiên") — giữ 1 nút
  riêng "Xem tổng kết Hiệp X vừa xong" để không mất dấu màn tổng kết đó,
  vẫn hiện cùng lúc với 2 nút chính như hiệp dở dang.
- Cả 2 nút "Ghi ván mới"/"Ghi hiệp mới" đều `disabled` nếu còn ô tên nào
  trống (`chuaDuTen`) — không phụ thuộc việc có đang tiếp tục phiên cũ
  hay không, để đơn giản hóa điều kiện kiểm tra.

### Kiểm tra Phase 2

1. Lần đầu mở (chưa có phiên nào) — thấy sẵn 4 ô tên (rỗng) + 2 nút "Ghi
   ván mới"/"Ghi hiệp mới" đang MỜ (disabled) vì chưa nhập đủ tên.
2. Nhập đủ 4 tên — 2 nút hết mờ. Bấm "Ghi hiệp mới (12 ván)" — màn bắt
   đầu biến mất (Phase 3 sẽ hiện màn nhập điểm thay vào đây).
3. Console: `localStorage.getItem('mauBinhLichSuPhien')` — 1 phiên đúng 4
   tên, `cheDo: 'theoHiep'`, `ketThuc: null`; `mauBinhLichSuHiep` — đúng 1
   hiệp (`soThuTu: 1`, `tongKet: null`).
4. Tải lại trang (F5) — vì hiệp đang dở dang, phải thấy ĐỦ 3 nút: "Ghi
   tiếp Hiệp 1 đang dở" + "Ghi ván mới" + "Ghi hiệp mới", tên 4 người đã
   tự điền sẵn đúng như lần trước.
5. Bấm "Ghi ván mới" (bỏ qua hiệp dở dang) — Console xác nhận: phiên cũ
   có `ketThuc` khác `null` NGAY, hiệp dở dang đó vẫn còn nguyên (không
   `tongKet`, không bị xóa); có thêm 1 phiên MỚI `cheDo: 'theoVan'`,
   `ketThuc: null`.
6. Tải lại trang lần nữa — giờ phiên đang mở là "theoVan", không còn hiệp
   dở dang/vừa xong nào → chỉ thấy đúng 2 nút chính. Bấm "Ghi ván mới" lần
   nữa — số phiên trong `localStorage` KHÔNG tăng thêm (vì tiếp tục đúng
   phiên "theoVan" đang mở, không tạo phiên mới).
7. Nhập 4 tên (vd An, Bình, Chi, Dũng), ô chọn "Người chia bài đầu tiên"
   chọn "Chi" — 4 ô tên phải tự đổi lại thành Chi, An, Bình, Dũng (Chi lên
   đầu, 3 người còn lại giữ nguyên thứ tự tương đối). Bấm 1 trong 2 nút
   hành động — `localStorage` phải lưu đúng thứ tự MỚI (Chi đứng đầu).

**Bạn học được gì ở Phase 2:** đây là ví dụ về việc gộp 2 bước UI (chọn
chế độ + bắt đầu) thành 1 hành động duy nhất khi 2 bước đó LUÔN đi cùng
nhau trong thực tế sử dụng — giảm số lần bấm mà không mất thông tin gì.
Đồng thời là ví dụ mở rộng của kỹ thuật đã dùng xuyên suốt các Phase trước
— "đừng lưu thông tin dư thừa suy ra được từ dữ liệu đã có": không cần 1
khóa lưu trữ riêng cho "tên dùng lần trước", chỉ cần đọc lại phần tử cuối
của mảng Phiên đã có sẵn.

Dừng lại ở đây. Xác nhận cả 7 điều trên đúng trước khi báo cáo và sang
Phase 3.

---

## Phase 3 — Nhập điểm từng ván + điểm cộng dồn hiển thị trực tiếp

Mục tiêu: form nhập điểm 4 người cho 1 ván, tự động biết "đang ở ván thứ
mấy, ai chia" (nếu chế độ theo hiệp); NGAY SAU MỖI VÁN, hiển thị điểm
cộng dồn tới hiện tại (theo hiệp nếu chế độ theo hiệp, theo cả phiên nếu
chế độ theo ván) — không phải đợi tới cuối mới biết.

### Bước 1 — Thêm import + hàm "Kết thúc phiên"

Trong `GhiDiem.jsx`, thêm import:
```jsx
import {
  taoVanMoi, nguoiChiaChoVan, tongDiemHopLe, tinhTongKetHiep, tinhTongKetPhien,
  layVanCuaHiep, layVanCuaPhien,
} from './lichSuChoi.js'
```

Thêm hàm `ketThucPhien` (cần cho CẢ chế độ theo ván ở Phase này, LẪN chế
độ theo hiệp ở Phase 4 — viết 1 lần, dùng chung cả 2 nơi):
```jsx
function ketThucPhien() {
  const phienDaCapNhat = { ...phienDangGhi, ketThuc: Date.now() };
  const danhSachPhienMoi = danhSachPhien.map(p => p.id === phienDangGhi.id ? phienDaCapNhat : p);
  setDanhSachPhien(danhSachPhienMoi);
  ghiDanhSach(KHOA_PHIEN, danhSachPhienMoi);
  setPhienDangGhi(null);
  setHiepDangGhi(null);
}
```

### Bước 2 — Thêm hàm lưu 1 ván

```jsx
function luuVan() {
  const diemSo = {};
  for (const ten of phienDangGhi.nguoiChoi) {
    const gtri = Number(diemNhap[ten]);
    if (diemNhap[ten] === '' || Number.isNaN(gtri)) return; // chưa nhập đủ
    diemSo[ten] = gtri;
  }
  if (!tongDiemHopLe(diemSo)) {
    alert('Tổng điểm phải bằng 0 — kiểm tra lại số vừa nhập.');
    return;
  }

  let lanChiaThu = null, nguoiChia = phienDangGhi.nguoiChoi[0];
  if (hiepDangGhi) {
    const soVanHienTai = layVanCuaHiep(hiepDangGhi.id, danhSachVan).length + 1;
    const ketQua = nguoiChiaChoVan(hiepDangGhi.nguoiChoi, soVanHienTai);
    lanChiaThu = ketQua.lanChia;
    nguoiChia = ketQua.nguoiChia;
  }

  const vanMoi = taoVanMoi({
    phienId: phienDangGhi.id,
    hiepId: hiepDangGhi ? hiepDangGhi.id : null,
    lanChiaThu,
    nguoiChia,
    diem: diemSo,
  });
  const danhSachVanMoi = [...danhSachVan, vanMoi];
  setDanhSachVan(danhSachVanMoi);
  ghiDanhSach(KHOA_VAN, danhSachVanMoi);

  moDiemRong(phienDangGhi.nguoiChoi);

  // (Phase 4 sẽ thêm đoạn kiểm tra "vừa đủ 12 ván" ngay tại đây)
}
```

### Bước 3 — Thêm giao diện BẢNG ĐIỂM (đã đổi so với bản thiết kế đầu)

> **Đã đổi theo phản hồi thực tế của Huy sau khi dùng thử Phase 3:** thay
> vì hiện "1 ván tại 1 thời điểm" (form 4 ô nhập + danh sách text riêng
> cho điểm cộng dồn), giờ hiện hẳn 1 BẢNG ĐIỂM — cột đầu là số thứ tự ván,
> 4 cột sau là tên 4 người chơi (đúng làm header bảng); mỗi ván đã lưu là
> 1 hàng, hàng CUỐI CÙNG của phần thân bảng luôn là hàng đang nhập (số ván
> kế tiếp + 4 ô input), và hàng "Tổng" cố định dưới cùng thay cho danh
> sách text điểm cộng dồn cũ. Áp dụng CHO CẢ 2 chế độ — theo hiệp bảng chỉ
> chứa ván của hiệp hiện tại (reset khi sang hiệp mới), theo ván bảng chứa
> TOÀN BỘ ván của phiên, phát triển không giới hạn 12 hàng.

Thêm biến tính trước phần JSX trả về (đặt cạnh biến `chuaDuTen` đã có):
```jsx
// Danh sách ván ĐÃ GHI trong phạm vi đang nhập (trong hiệp hiện tại nếu
// theo hiệp, cả phiên nếu theo ván) — dùng để vẽ bảng điểm + tính tổng.
const vanHienTai = phienDangGhi
  ? (hiepDangGhi ? layVanCuaHiep(hiepDangGhi.id, danhSachVan) : layVanCuaPhien(phienDangGhi.id, danhSachVan))
  : [];
const tongCongDon = hiepDangGhi ? tinhTongKetHiep(vanHienTai) : tinhTongKetPhien(vanHienTai);
```

Thêm vào JSX trả về, ngay sau khối `{!phienDangGhi && (...)}` (màn bắt đầu
ghi điểm ở Phase 2):

```jsx
{phienDangGhi && !hiepDangGhi?.tongKet && (
  <div className="khoi-luat">
    <div className="khoi-luat-tieu-de">
      {hiepDangGhi
        ? `Hiệp ${hiepDangGhi.soThuTu} — người chia ván tiếp theo: ${
            nguoiChiaChoVan(hiepDangGhi.nguoiChoi, vanHienTai.length + 1).nguoiChia
          }`
        : 'Bảng điểm'}
    </div>

    <div className="boc-bang-diem">
      <table className="bang-diem">
        <thead>
          <tr>
            <th>Ván</th>
            {phienDangGhi.nguoiChoi.map(ten => <th key={ten}>{ten}</th>)}
          </tr>
        </thead>
        <tbody>
          {vanHienTai.map((van, i) => (
            <tr key={van.id}>
              <td>{i + 1}</td>
              {phienDangGhi.nguoiChoi.map(ten => (
                <td key={ten} className={van.diem[ten] >= 0 ? 'diem-duong' : 'diem-am'}>
                  {van.diem[ten] > 0 ? '+' : ''}{van.diem[ten]}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td>{vanHienTai.length + 1}</td>
            {phienDangGhi.nguoiChoi.map(ten => (
              <td key={ten}>
                <input
                  type="number"
                  value={diemNhap[ten] ?? ''}
                  onChange={e => setDiemNhap(prev => ({ ...prev, [ten]: e.target.value }))}
                />
              </td>
            ))}
          </tr>
        </tbody>
        <tfoot>
          <tr className="hang-tong-diem">
            <td>Tổng</td>
            {phienDangGhi.nguoiChoi.map(ten => {
              const d = tongCongDon[ten] || 0;
              return (
                <td key={ten} className={d >= 0 ? 'diem-duong' : 'diem-am'}>
                  {d > 0 ? '+' : ''}{d}
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>

    <button className="nut-chon-van nut-chon-van-tiep" onClick={luuVan}>
      Lưu ván này
    </button>

    {!hiepDangGhi && (
      <button className="nut-chon-van" onClick={ketThucPhien} style={{ marginTop: 10 }}>
        Kết thúc phiên
      </button>
    )}
  </div>
)}
```

CSS thêm vào `App.css` (cạnh `.khoi-luat-tieu-de`):
```css
.boc-bang-diem {
  overflow-x: auto;
  margin-bottom: 12px;
}

.bang-diem {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.bang-diem th,
.bang-diem td {
  border: 1px solid rgba(240,192,64,0.25);
  padding: 6px 4px;
  text-align: center;
  white-space: nowrap;
}

.bang-diem th {
  background: rgba(240,192,64,0.12);
  color: #f0c040;
}

.bang-diem td:first-child,
.bang-diem th:first-child {
  color: rgba(255,255,255,0.6);
  font-weight: normal;
  width: 36px;
}

.bang-diem input[type="number"] {
  width: 48px;
  text-align: center;
  background: white;
  border: 1px solid rgba(0,0,0,0.2);
  border-radius: 4px;
  padding: 4px 2px;
}

.hang-tong-diem td {
  font-weight: bold;
  background: rgba(255,215,0,0.1);
  border-top: 2px solid rgba(240,192,64,0.4);
}
```

**Giải thích:**
- **Vì sao kiểm tra `tongDiemHopLe` trước khi lưu:** vì đây là NHẬP TAY
  (theo yêu cầu của Huy — phương án 1, sẽ đổi sang chụp ảnh nhận diện ở
  version sau) — con người dễ gõ nhầm số. Chặn lại NGAY khi tổng khác 0
  giúp Huy phát hiện lỗi gõ ngay lúc đó, thay vì phát hiện ra sai nhiều
  ván sau khi xem lại tổng kết.
- **`vanHienTai` là danh sách ĐÃ SẮP XẾP theo thời gian** (do
  `layVanCuaHiep`/`layVanCuaPhien` đã `.sort()` sẵn từ Phase 1) — chỉ số
  hàng `i + 1` khi `.map()` qua nó chính là đúng số thứ tự ván hiển thị,
  không cần tính toán gì thêm.
- **Hàng "Tổng" KHÔNG lưu riêng ở đâu cả** — mỗi lần render, tính LẠI từ
  đầu bằng `tinhTongKetHiep`/`tinhTongKetPhien` (đã viết và kiểm thử từ
  Phase 1) trên đúng `vanHienTai`. Vì `danhSachVan` cập nhật ngay sau
  `luuVan()`, hàng Tổng tự động đúng theo ván mới nhất mà không cần thêm
  state hay logic tính riêng — tận dụng lại NGUYÊN VẸN 2 hàm đã kiểm thử
  kỹ ở Phase 1.
- **`.boc-bang-diem { overflow-x: auto }`** — phòng trường hợp màn hình
  quá hẹp so với 5 cột, bảng có thể cuộn ngang riêng thay vì làm vỡ layout
  cả trang; theo chiều dọc bảng cứ phát triển tự nhiên theo số ván (đặc
  biệt quan trọng ở chế độ theo ván — không giới hạn 12 hàng).
- Nút "Kết thúc phiên" chỉ hiện khi `!hiepDangGhi` (tức chế độ theo ván)
  — vì chế độ theo hiệp đã có đúng 1 điểm dừng tự nhiên để kết thúc phiên
  (màn tổng kết hiệp, xem Phase 4), không cần thêm nút này ở màn nhập
  điểm nữa.

### Kiểm tra Phase 3

1. Bắt đầu 1 phiên "Theo hiệp" — thấy bảng điểm với header "Ván | [4 tên]"
   và 1 hàng nhập (Ván 1) + hàng "Tổng" rỗng bên dưới.
2. Nhập điểm ván 1 (tổng phải = 0) — bấm "Lưu ván này" — hàng vừa nhập
   CHUYỂN thành hàng chỉ-đọc hiển thị đúng số vừa lưu, bảng TỰ THÊM 1 hàng
   nhập mới (Ván 2), hàng "Tổng" cập nhật đúng theo ván 1.
3. Nhập tiếp ván 2, 3 — hàng "Tổng" phải CỘNG THÊM đúng theo từng ván,
   không phải thay thế số cũ; bảng có đúng 3 hàng đã lưu + 1 hàng đang
   nhập ở dưới cùng (trước hàng Tổng).
4. Cố tình nhập tổng khác 0 — thấy cảnh báo, KHÔNG thêm hàng mới, hàng
   "Tổng" KHÔNG đổi.
5. Bắt đầu thử 1 phiên khác "Theo ván" — tiêu đề chỉ ghi "Bảng điểm"
   (không nhắc hiệp), nhập vượt quá 12 ván vẫn được (không bị chặn), bảng
   tiếp tục thêm hàng bình thường, có nút "Kết thúc phiên" ngay dưới bảng.

Dừng lại ở đây. Xác nhận cả 5 điều trên đúng trước khi báo cáo và sang
Phase 4.

---

## Phase 4 — Tổng kết hiệp (đủ 12 ván) + hiệp tiếp theo / kết thúc phiên

Mục tiêu: khi vừa lưu xong ván thứ 12 của 1 hiệp, tự động hiện màn tổng
kết, cho chọn "Hiệp tiếp theo" (giữ nguyên tên/thứ tự, sửa được) hoặc
"Kết thúc phiên".

### Bước 1 — Phát hiện hiệp vừa đủ 12 ván ngay sau khi lưu

Sửa `luuVan()` (đã viết ở Phase 3) — thêm đoạn kiểm tra vào đúng chỗ đã
đánh dấu (thay dòng ghi chú `// (Phase 4 sẽ thêm...)` bằng đoạn thật):

```jsx
function luuVan() {
  // ... (toàn bộ nội dung đã viết ở Phase 3, giữ nguyên tới hết đoạn
  // lưu ván + reset ô nhập) ...

  if (hiepDangGhi) {
    const soVanCuaHiepSauKhiLuu = layVanCuaHiep(hiepDangGhi.id, danhSachVanMoi).length;
    if (soVanCuaHiepSauKhiLuu === 12) {
      const tongKet = tinhTongKetHiep(layVanCuaHiep(hiepDangGhi.id, danhSachVanMoi));
      const hiepDaCapNhat = { ...hiepDangGhi, tongKet };
      const danhSachHiepMoi = danhSachHiep.map(h => h.id === hiepDangGhi.id ? hiepDaCapNhat : h);
      setDanhSachHiep(danhSachHiepMoi);
      ghiDanhSach(KHOA_HIEP, danhSachHiepMoi);
      setHiepDangGhi(hiepDaCapNhat); // để màn tổng kết đọc được tongKet mới
    }
  }
}
```

### Bước 2 — Thêm hàm "Hiệp tiếp theo"

(`ketThucPhien` đã viết sẵn từ Phase 3, dùng lại được luôn — không cần
viết lại.)

```jsx
function hiepTiepTheo() {
  const hiepMoi = taoHiepMoi(phienDangGhi.id, hiepDangGhi.soThuTu + 1, phienDangGhi.nguoiChoi);
  const danhSachHiepMoi = [...danhSachHiep, hiepMoi];
  setDanhSachHiep(danhSachHiepMoi);
  ghiDanhSach(KHOA_HIEP, danhSachHiepMoi);
  setHiepDangGhi(hiepMoi);
}
```

**Giải thích:** `hiepTiepTheo()` dùng LẠI đúng `phienDangGhi.nguoiChoi`
(danh sách "mới nhất" ở cấp Phiên) — đây chính là cách hiện thực hóa yêu
cầu "hiệp sau giữ nguyên tên/thứ tự trừ phi có thay đổi": vì chưa có UI
sửa tên ở Phase này, mặc định LUÔN giữ nguyên; nếu Huy muốn, có thể thêm
sau này 1 form nhỏ cho sửa tên trước khi bấm "Hiệp tiếp theo".

### Bước 3 — Thêm màn hình tổng kết hiệp

Thêm vào JSX trả về, đặt TRƯỚC khối nhập điểm (Phase 3) — CHỈ hiện khi
hiệp vừa đủ 12 ván (`hiepDangGhi?.tongKet` đã có giá trị):

```jsx
{hiepDangGhi?.tongKet && (
  <div className="khoi-luat">
    <div className="khoi-luat-tieu-de">Tổng kết Hiệp {hiepDangGhi.soThuTu}</div>
    {Object.entries(hiepDangGhi.tongKet).map(([ten, d]) => (
      <p key={ten}>{ten}: <b className={d >= 0 ? 'diem-duong' : 'diem-am'}>{d > 0 ? '+' : ''}{d}</b></p>
    ))}
    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
      <button className="nut-chon-van nut-chon-van-tiep" onClick={hiepTiepTheo}>
        Hiệp tiếp theo
      </button>
      <button className="nut-chon-van" onClick={ketThucPhien}>
        Kết thúc phiên
      </button>
    </div>
  </div>
)}
```

(Điều kiện hiện khối nhập điểm ở Phase 3 — `{phienDangGhi && !hiepDangGhi?.tongKet && (...)}`
— đã tự động ẩn đi đúng lúc màn tổng kết này xuất hiện, không cần sửa gì
thêm ở đó.)

### Kiểm tra Phase 4

1. Nhập đủ 12 ván (chế độ theo hiệp) — ngay sau ván 12, màn nhập điểm
   (kèm điểm cộng dồn) biến mất, hiện màn "Tổng kết Hiệp 1" với đúng tổng
   từng người (phải khớp đúng con số điểm cộng dồn đã thấy ở ván 12).
2. Bấm "Hiệp tiếp theo" — quay lại màn nhập điểm ván 1, nhưng ghi "Hiệp
   2", vẫn đúng 4 tên cũ, điểm cộng dồn RESET về rỗng (vì hiệp mới chưa
   có ván nào).
3. Bấm "Kết thúc phiên" ở màn tổng kết — quay về màn bắt đầu ghi điểm
   (Phase 2: tên người chơi + 2 nút hành động). Console: phiên đó phải có
   `ketThuc` khác `null`.
4. Thử tình huống dở dang: đang nhập ván 5/12 của 1 hiệp, tải lại trang
   (F5) — quay lại đúng màn bắt đầu ghi điểm với ĐỦ 3 lựa chọn từ Phase 2
   ("Ghi tiếp Hiệp X đang dở" + "Ghi ván mới" + "Ghi hiệp mới"). Bấm "Ghi
   tiếp Hiệp X đang dở" — vào đúng lại ván 6 (không phải ván 1), điểm cộng
   dồn hiện đúng tổng 5 ván đã có.
5. Thử bấm "Ghi ván mới" (bỏ qua hiệp dở dang) ở tình huống trên — Console
   xác nhận phiên cũ có `ketThuc` khác `null` NGAY (dù hiệp cuối chưa đủ
   12 ván), và hiệp dở dang đó vẫn còn nguyên trong `mauBinhLichSuHiep`
   (không bị
   xóa, chỉ không `tongKet`).

Dừng lại ở đây. Xác nhận cả 5 điều trên đúng trước khi báo cáo và sang
Phase 5.

---

## Phase 5 — Gắn vào điều hướng trang chủ

Mục tiêu: nút "Ghi điểm" ở trang chủ (đang mờ "Sắp ra mắt" từ V5) giờ bấm
được, dẫn vào đúng `GhiDiem.jsx`.

### Bước 1 — Sửa `src/TrangChu.jsx`

Đổi nút "Ghi điểm" từ `disabled` sang bấm được:
```jsx
<button className="nut-dieu-huong" onClick={() => onDieuHuong('ghiDiem')}>
  📝 Ghi điểm
</button>
```

### Bước 2 — Sửa `src/App.jsx`

Xóa đoạn "tạm render `<GhiDiem />`" đã thêm tạm ở Phase 2 (nếu còn), thay
bằng đúng nhánh điều hướng — thêm vào cạnh nhánh `trang === 'luatChoi'`
đã có từ V5:

```jsx
{trang === 'ghiDiem' && (
  <>
    <button className="nut-ve-trang-chu" onClick={() => setTrang('trangChu')}>
      ← Trang chủ
    </button>
    <GhiDiem />
  </>
)}
```

(Import `GhiDiem` ở đầu `App.jsx` nếu chưa có.)

### Kiểm tra Phase 5

1. Trang chủ: nút "Ghi điểm" không còn mờ, bấm được.
2. Bấm vào — đúng vào trang Ghi điểm, có nút "← Trang chủ" để quay lại.
3. Luồng đầy đủ 1 lượt: Trang chủ → Ghi điểm → Bắt đầu phiên → nhập vài
   ván → xem lịch sử → Trang chủ — không lỗi, không mất dữ liệu.

**Bạn học được gì ở Phase 5:** đây là ví dụ cho thấy lợi ích của việc đã
CHUẨN BỊ SẴN khung điều hướng từ V5 (nút "Sắp ra mắt") — khi tới lúc xây
thật, chỉ cần đổi đúng 1 dòng (`disabled` → `onClick`) và thêm 1 nhánh
JSX nhỏ, không phải sửa lại cấu trúc điều hướng đã có.

---

## Hoàn thành V6 — báo cáo lại với Huy

1. Toàn bộ 5 Phase chạy đúng, không lỗi Console.
2. Ghi thử ít nhất 1 phiên đầy đủ (2 hiệp trở lên) để xác nhận "Hiệp tiếp
   theo" hoạt động đúng nhiều lần liên tiếp, không chỉ 1 lần.
3. Tắt/mở lại trình duyệt giữa chừng 1 phiên đang ghi dở — xác nhận dữ
   liệu không mất (đã lưu ngay sau mỗi ván, không đợi tới cuối phiên).
4. Console: kiểm tra lại `localStorage.getItem('mauBinhLichSuPhien')`,
   `'mauBinhLichSuHiep'`, `'mauBinhLichSuVan'` sau vài phiên/hiệp/ván —
   xác nhận dữ liệu đủ, đúng cấu trúc — đây chính là dữ liệu trang "Lịch
   sử" (version sau) sẽ đọc lại, nên cần chắc chắn nó đúng trước khi rời
   khỏi V6.
5. Ghi chú cho tương lai:
   - **Trang "Lịch sử"** (version sau): đọc lại dữ liệu đã lưu ở đây qua
     `lichSuChoi.js` (không cần đổi gì ở V6), CỘNG THÊM 1 nguồn dữ liệu
     mới cho lịch sử Chơi với AI (khác cấu trúc, sẽ thiết kế riêng khi
     tới lúc).
   - **Chụp ảnh nhận diện bài** (version sau nữa): chỉ cần thay cách TẠO
     RA object `diem` truyền vào `taoVanMoi()` ở Phase 3 — toàn bộ phần
     còn lại (Phiên/Hiệp/tổng kết) không cần đổi gì.
