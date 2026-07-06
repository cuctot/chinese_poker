# V9_GUIDE.md — AI xếp bài theo phong cách + nhân vật đối thủ

> **Dành cho ai đọc file này:**
> - Nếu bạn là **Claude Code**: làm theo ĐÚNG THỨ TỰ 7 Phase bên dưới.
>   MỖI Phase xong phải DỪNG LẠI, báo cáo đã làm gì, để Huy tự kiểm tra
>   trước khi sang Phase tiếp theo.
> - Nếu bạn là **Huy**: đọc phần "Giải thích" sau mỗi khối code.
>
> **Xây dựng trên nền V8 THẬT** (không phải bản nháp) — đặc biệt dùng
> ĐÚNG bản `xepBaiHopLe` đã sửa lỗi (so đầy đủ Đầu/Giữa bằng `soSanh`,
> không chỉ so `loai`), và dùng `TheBaiDon`/`HangBai` (không phải
> `Card.jsx`, đã bị xóa ở V8 Phase 7) cho mọi chỗ cần hiện bài.
>
> Toàn bộ thuật toán lõi (chấm điểm, duyệt cách chia, Monte Carlo, hệ
> thống nhân vật) đã được thiết kế và kiểm thử kỹ bằng Node.js trước khi
> đưa vào tài liệu này — xem phần "Đã kiểm thử" cuối mỗi Phase.

## Phạm vi V9

**4 chế độ chấm điểm mới** (không mô phỏng, trừ chế độ cuối):
- **An toàn**: phạt nếu chi Đầu là Mậu thầu (rủi ro cao).
- **Cân bằng**: chỉ cộng tổng độ mạnh 3 chi, không thiên vị.
- **Tối đa hóa điểm**: tính theo điểm THẬT của ruleset đang chọn (không
  chỉ độ mạnh trừu tượng) — sẵn sàng dồn vào 1 chi để ăn bonus lớn.
- **Chuyên nghiệp**: dùng mô phỏng Monte Carlo — lọc nhanh Top 15 ứng
  viên bằng "Cân bằng", rồi mô phỏng thật để chọn ra cách có tỷ lệ thắng
  cao nhất.

**Giữ `aiXepBai()` cũ** (đã sửa lỗi ở V8) làm 1 phong cách riêng — "Cổ
Điển".

**5 nhân vật mặc định**, mỗi người 1 phong cách:

| Nhân vật | Phong cách |
|---|---|
| Cổ Điển | `coDien` (aiXepBai cũ) |
| Safeway | `anToan` |
| New Balance | `canBang` |
| Mad Max | `toiDaHoaDiem` |
| Monte Carlo | `chuyenNghiep` |

**Nhân vật "trộn"**: đặt tên mới + tự đặt tỷ lệ % cho cả 5 phong cách
(tổng phải = 100%) — mỗi VÁN (không phải mỗi hiệp) tung lại ngẫu nhiên
theo đúng tỷ lệ đã đặt.

**Chọn 3 nhân vật cho 3 đối thủ mỗi khi bắt đầu hiệp mới** (màn `ChonVan`).

**Lịch sử ghi lại phong cách THẬT từng đối thủ dùng ở TỪNG VÁN** (quan
trọng với nhân vật trộn, vì mỗi ván có thể khác nhau).

**Xóa sạch dữ liệu lịch sử cũ** — cấu trúc Ván/Hiệp thêm field mới,
không tương thích ngược với dữ liệu cũ.

**2 hệ đếm số hiệp riêng biệt** cho `thatNgoai`/`choiAI` (thay 1 hệ đếm
chung hiện tại) — thống kê 2 nguồn không liên quan tới nhau.

**Giới hạn lưu trữ = 1000 ván/nguồn** — con số này CHÍNH LÀ số lần mô
phỏng Monte Carlo tối thiểu để kết quả đủ tin cậy (đã kiểm chứng: ở mức
1000 lần, 2 lần chạy độc lập cho kết quả gần nhau 15,4%/16,2%; ở mức
thấp hơn dao động mạnh hơn nhiều) — dùng chung 1 con số có căn cứ thay vì
chọn tùy tiện ở 2 nơi.

**Dữ liệu mồi**: khi triển khai xong, chạy 1 lần chế độ "Chuyên nghiệp"
(vốn tự mô phỏng 1000 lần bên trong) và LƯU THẲNG 1000 kết quả mô phỏng
đó làm dữ liệu Ván ban đầu để test — tự động bị đẩy dần ra ngoài khi có
ván thật vượt mốc 1000 (không cần code dọn dẹp riêng).

---

## Phase 1 — Hàm chấm điểm 1 cách chia theo phong cách (`src/cardEngine.js`)

Mục tiêu: 1 hàm chấm điểm nhỏ, thuần túy, dễ kiểm chứng độc lập — nền
tảng cho mọi phong cách phía sau.

### Bước 1 — Thêm vào cuối `src/cardEngine.js`

```js
// Chấm điểm 1 cách chia theo 1 phong cách cụ thể. Trả -Infinity nếu
// KHÔNG hợp lệ (binh lủng) — áp dụng cho MỌI phong cách, không ngoại lệ.
// Dùng ĐÚNG xepBaiHopLe đã sửa lỗi (so đầy đủ Đầu/Giữa bằng soSanh).
export function chamDiemCachChia(chiDau, chiGiua, chiCuoi, ruleset, phongCach) {
  if (!xepBaiHopLe(chiDau, chiGiua, chiCuoi, ruleset)) return -Infinity;

  const dDau = danhGia3La(chiDau);
  const dGiua = danhGia5La(chiGiua);
  const dCuoi = danhGia5La(chiCuoi);

  if (phongCach === 'anToan') {
    let diem = dDau.loai + dGiua.loai + dCuoi.loai;
    if (dDau.loai === 0) diem -= 2; // phạt nếu chi Đầu Mậu thầu
    return diem;
  }

  if (phongCach === 'toiDaHoaDiem') {
    return diemMotChi(ruleset, 'dau', dDau) + diemMotChi(ruleset, 'giua', dGiua) + diemMotChi(ruleset, 'cuoi', dCuoi);
  }

  // 'canBang' (mặc định, cũng dùng làm bước LỌC NHANH cho 'chuyenNghiep' ở Phase 3)
  return dDau.loai + dGiua.loai + dCuoi.loai;
}
```

**Giải thích:**
- **`anToan` phạt chi Đầu Mậu thầu:** chi Đầu chỉ có 3 lá — dễ ra Mậu
  thầu nhất trong 3 chi, và là "tuyến phòng thủ đầu tiên" (đối thủ chỉ
  cần có 1 Đôi nhỏ ở Đầu là đã thắng). Mức phạt `-2` là tham số khởi
  điểm hợp lý, chưa chứng minh tối ưu tuyệt đối — cần mô phỏng thêm ở
  tương lai nếu muốn tinh chỉnh chính xác hơn.
- **`toiDaHoaDiem` khác `canBang` ở CHỖ NÀO:** `canBang` chỉ nhìn `loai`
  (thứ bậc bài Tây, KHÔNG đổi dù luật chơi đổi gì); `toiDaHoaDiem` gọi
  `diemMotChi` (đã có từ V3) — tra ĐÚNG bảng thưởng ruleset đang chọn.
  Hệ quả: nếu Huy tắt bonus Tứ quý trong Luật chơi, `toiDaHoaDiem` sẽ
  KHÔNG còn ưu tiên dồn 4 lá cùng rank vào 1 chi nữa, còn `canBang` thì
  không đổi gì (đã kiểm chứng cụ thể: cùng 1 tay Tứ quý Á ở chi Cuối,
  luật Chuẩn cho điểm 18, luật tắt bonus cho điểm chỉ còn 3).

### Kiểm tra Phase 1

Đã kiểm thử bằng Node.js: binh lủng luôn `-Infinity` ở cả 3 phong cách;
`anToan` cho điểm THẤP HƠN `canBang` khi chi Đầu Mậu thầu (ví dụ cụ thể:
0 so với -2); `toiDaHoaDiem` phản ánh đúng bonus thật (7 theo `loai` so
với 18 theo điểm ruleset thật cho cùng 1 tay Tứ quý Á); và quan trọng
nhất — đã re-test lại với ĐÚNG bản `xepBaiHopLe` đã sửa lỗi ở V8 (ví dụ
Đầu đôi Á/Giữa đôi Q — trước đây bị lọt lưới, giờ phát hiện đúng là
lủng).

Dừng lại ở đây. Xác nhận đúng trước khi báo cáo và sang Phase 2.

---

## Phase 2 — Duyệt toàn bộ cách chia hợp lệ (`src/cardEngine.js`)

Mục tiêu: hàm duyệt hết ~72.072 cách chia 13 lá thành 3+5+5, lọc ra
những cách HỢP LỆ — nền tảng để 3 phong cách đầu (không mô phỏng) tìm ra
cách chia TỐT NHẤT (không chỉ chấm điểm 1 cách có sẵn).

### Bước 1 — Thêm vào `src/cardEngine.js`

```js
// Sinh tất cả tổ hợp k phần tử từ mảng (giữ nguyên tham chiếu object)
function* toHopBai(mang, k, batDauTu = 0, hienTai = []) {
  if (hienTai.length === k) { yield [...hienTai]; return; }
  for (let i = batDauTu; i < mang.length; i++) {
    hienTai.push(mang[i]);
    yield* toHopBai(mang, k, i + 1, hienTai);
    hienTai.pop();
  }
}

// Duyệt TOÀN BỘ ~72.072 cách chia (không lọc gì)
function duyetTatCaCachChia(ca13La) {
  const ketQua = [];
  for (const chiDau of toHopBai(ca13La, 3)) {
    const conLai10 = ca13La.filter(l => !chiDau.includes(l));
    for (const chiGiua of toHopBai(conLai10, 5)) {
      const chiCuoi = conLai10.filter(l => !chiGiua.includes(l));
      ketQua.push({ chiDau, chiGiua, chiCuoi });
    }
  }
  return ketQua;
}

// Chỉ lấy cách chia HỢP LỆ — dùng ĐÚNG xepBaiHopLe đã sửa lỗi
export function duyetCachChiaHopLe(ca13La, ruleset) {
  return duyetTatCaCachChia(ca13La).filter(({ chiDau, chiGiua, chiCuoi }) => xepBaiHopLe(chiDau, chiGiua, chiCuoi, ruleset));
}

// Tìm cách chia TỐT NHẤT theo 1 phong cách (không mô phỏng — dùng cho
// anToan/canBang/toiDaHoaDiem, chạy nhanh vì chỉ chấm điểm, không mô
// phỏng đối thủ).
export function xepBaiTheoPhongCach(ca13La, ruleset, phongCach) {
  const tatCaHopLe = duyetCachChiaHopLe(ca13La, ruleset);
  let totNhat = null, diemTotNhat = -Infinity;
  for (const cach of tatCaHopLe) {
    const diem = chamDiemCachChia(cach.chiDau, cach.chiGiua, cach.chiCuoi, ruleset, phongCach);
    if (diem > diemTotNhat) { diemTotNhat = diem; totNhat = cach; }
  }
  return totNhat;
}
```

**Giải thích:** `toHopBai` là kỹ thuật sinh tổ hợp chuẩn (đã dùng tương
tự ở V4 cho Ba thùng/Ba sảnh) — duyệt hết C(13,3)×C(10,5) = 286×252 =
72.072 cách. Với mỗi cách, kiểm tra qua ĐÚNG `xepBaiHopLe` (có tham số
`ruleset` — quan trọng vì V8 đã sửa hàm này để nhận thêm ruleset cho quy
tắc Sảnh Hạ tùy chọn). `xepBaiTheoPhongCach` chỉ đơn giản chấm điểm HẾT
các cách hợp lệ rồi lấy cách điểm cao nhất — không cần thuật toán tối ưu
phức tạp hơn vì 72.072 là con số nhỏ, duyệt hết vẫn nhanh.

### Kiểm tra Phase 2

Đã kiểm thử bằng Node.js: đúng 72.072 cách chia (không thiếu/thừa); mỗi
cách dùng ĐÚNG 13 lá gốc, không trùng không thiếu; lọc hợp lệ hoạt động
đúng (mọi cách còn lại đều pass `xepBaiHopLe`); và 3 phong cách
(`anToan`/`canBang`/`toiDaHoaDiem`) cho ra cách chia THỰC SỰ KHÁC NHAU
trong 27/30 bộ bài thử ngẫu nhiên (90%) — chứng minh đây là 3 triết lý
thật, không chỉ khác tên.

Mở Console xác nhận nhanh:
```js
import { duyetCachChiaHopLe, xepBaiTheoPhongCach } from './cardEngine.js'
// (dùng 1 tay 13 lá thật từ ván đang chơi để test)
```

Dừng lại ở đây. Xác nhận đúng trước khi báo cáo và sang Phase 3.

---

## Phase 3 — Mô phỏng Monte Carlo + phong cách "Chuyên nghiệp" (`src/cardEngine.js`)

Mục tiêu: phong cách thứ 4 — ước tính tỷ lệ thắng THẬT bằng mô phỏng,
không chỉ nhìn độ mạnh/điểm số trừu tượng.

### Bước 1 — Hàm mô phỏng 1 cách chia cụ thể

```js
// Mô phỏng N lần: xáo 39 lá còn lại, chia cho 3 đối thủ (dùng aiXepBai
// CŨ — nhanh — làm đối thủ giả lập, KHÔNG dùng duyetCachChiaHopLe cho
// đối thủ vì quá tốn thời gian nếu lặp lại hàng nghìn lần). So cách chia
// CỐ ĐỊNH của mình với cách xếp từng đối thủ — cộng dồn +1 thắng/-1
// thua/0 hòa mỗi chi qua cả 3 đối thủ.
export function moPhongMotCachChia({ chiDau, chiGiua, chiCuoi }, laCon39, soLanMoPhong) {
  const dDauMinh = danhGia3La(chiDau), dGiuaMinh = danhGia5La(chiGiua), dCuoiMinh = danhGia5La(chiCuoi);
  let tongDiem = 0, soLanThang = 0;

  for (let lan = 0; lan < soLanMoPhong; lan++) {
    const xao = [...laCon39];
    for (let i = xao.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [xao[i], xao[j]] = [xao[j], xao[i]]; }

    let diemVan = 0;
    for (const bai13DoiThu of [xao.slice(0, 13), xao.slice(13, 26), xao.slice(26, 39)]) {
      const doiThu = aiXepBai(bai13DoiThu); // dùng lại đúng hàm CŨ đã sửa lỗi ở V8, nhanh (~0.83ms)
      diemVan += soSanh(dDauMinh, danhGia3La(doiThu.chiDau));
      diemVan += soSanh(dGiuaMinh, danhGia5La(doiThu.chiGiua));
      diemVan += soSanh(dCuoiMinh, danhGia5La(doiThu.chiCuoi));
    }
    tongDiem += diemVan;
    if (diemVan > 0) soLanThang++;
  }
  return { diemTrungBinh: tongDiem / soLanMoPhong, tyLeThang: soLanThang / soLanMoPhong };
}
```

**Giải thích:** dùng chính `aiXepBai()` (đã sửa lỗi, nhanh) làm "đối thủ
giả lập" trong mỗi lần mô phỏng — vì đây chính là cách các đối thủ AI
THẬT SỰ sẽ xếp bài trong game (với phong cách Cổ Điển), nên mô phỏng
càng SÁT thực tế. Nếu dùng `xepBaiTheoPhongCach` (duyệt 72.072 cách) làm
đối thủ giả lập thay vì `aiXepBai`, chi phí sẽ nhân lên hàng nghìn lần —
không khả thi.

### Bước 2 — Ghép thành phong cách "Chuyên nghiệp" (2 tầng: lọc rẻ → mô phỏng đắt)

```js
// Phong cách "Chuyên nghiệp": lọc nhanh Top N bằng "canBang", rồi mô
// phỏng THẬT chỉ cho Top N đó — tránh mô phỏng cho cả 72.072 cách (quá
// chậm). soLanMoPhong mặc định 1000 — con số đã kiểm chứng đủ tin cậy
// (xem SO_LAN_MO_PHONG_TOI_THIEU ở Phase 5).
export function xepBaiChuyenNghiep(ca13La, laCon39, ruleset, { soUngVien = 15, soLanMoPhong = 1000 } = {}) {
  const tatCaHopLe = duyetCachChiaHopLe(ca13La, ruleset);
  const daChamDiem = tatCaHopLe.map(cach => ({
    ...cach,
    diemLoc: chamDiemCachChia(cach.chiDau, cach.chiGiua, cach.chiCuoi, ruleset, 'canBang'),
  }));
  daChamDiem.sort((a, b) => b.diemLoc - a.diemLoc);
  const topN = daChamDiem.slice(0, soUngVien);

  let totNhat = null;
  for (const cach of topN) {
    const ketQua = moPhongMotCachChia(cach, laCon39, soLanMoPhong);
    if (!totNhat || ketQua.tyLeThang > totNhat.tyLeThang) totNhat = { ...cach, ...ketQua };
  }
  return totNhat;
}
```

**Giải thích:** đây chính là mẫu hình "lọc rẻ trước, tinh chỉnh đắt sau"
đã dùng ở V4 (Ba thùng/Ba sảnh) — thay vì mô phỏng cho MỌI cách chia
(72.072 × 1000 lần = quá chậm), chỉ mô phỏng cho 15 ứng viên đã lọc sẵn
bằng phép tính rẻ (`canBang`, tức thì). Đã kiểm thử: thuật toán này cho
tỷ lệ thắng trung bình **96,3%** so với **15,5%** nếu chọn đại 1 cách hợp
lệ ngẫu nhiên (đo lại bằng vòng mô phỏng ĐỘC LẬP 2000 lần, không dùng lại
số liệu tự thuật toán đã tính, tránh thiên vị).

### Kiểm tra Phase 3

Đã kiểm thử: sanity check bằng bài CỰC MẠNH (Tứ quý K + Sám cô Á) →
tỷ lệ thắng ước tính 100%; bài CỰC YẾU (rải rác, không đôi) → tỷ lệ
thắng 0%. Minh họa "Luật số lớn": cùng 1 cách chia, số lần mô phỏng càng
tăng (10→50→200→1000→5000), 2 lần chạy độc lập càng HỘI TỤ gần nhau hơn
(ở mức 5000 lần: 16,6% và 16,7%, gần như trùng khớp; ở mức 10 lần: 20%
và 10%, dao động mạnh).

Dừng lại ở đây. Xác nhận đúng trước khi báo cáo và sang Phase 4.

---

## Phase 4 — Hệ thống nhân vật + phong cách trộn (`src/nhanVatAI.js`)

Mục tiêu: danh sách 5 nhân vật mặc định + khả năng tạo nhân vật MỚI trộn
tỷ lệ % giữa cả 5 phong cách (kể cả Cổ Điển), chọn ngẫu nhiên lại MỖI VÁN.

### Bước 1 — Tạo file mới `src/nhanVatAI.js`

```js
// Danh sách nhân vật AI có sẵn — mỗi nhân vật gắn với 1 "phongCach".
// 'coDien' = dùng lại đúng aiXepBai() cũ (đã sửa lỗi ở V8), không phải
// duyệt 72.072 cách chia như 4 phong cách mới.
export const DANH_SACH_NHAN_VAT_MAC_DINH = [
  { id: 'coDien', ten: 'Cổ Điển', phongCach: 'coDien' },
  { id: 'safeway', ten: 'Safeway', phongCach: 'anToan' },
  { id: 'newbalance', ten: 'New Balance', phongCach: 'canBang' },
  { id: 'madmax', ten: 'Mad Max', phongCach: 'toiDaHoaDiem' },
  { id: 'montecarlo', ten: 'Monte Carlo', phongCach: 'chuyenNghiep' },
];

// Tạo 1 nhân vật MỚI "trộn" nhiều phong cách theo tỷ lệ — vd
// { coDien: 0.2, anToan: 0.2, canBang: 0.2, toiDaHoaDiem: 0.2, chuyenNghiep: 0.2 }
// (tổng phải = 1, cho phép chỉ trộn 1 vài phong cách, không bắt buộc đủ 5).
export function taoNhanVatTron(ten, tiLe) {
  const tongTiLe = Object.values(tiLe).reduce((a, b) => a + b, 0);
  if (Math.abs(tongTiLe - 1) > 0.001) {
    throw new Error(`Tổng tỷ lệ phải = 1, hiện tại = ${tongTiLe}`);
  }
  return { id: `tron_${Date.now()}`, ten, phongCach: 'tron', tiLeTron: tiLe };
}

// Chọn 1 phong cách THẬT từ tỷ lệ trộn — gọi lại MỖI VÁN.
function chonPhongCachTuTiLeTron(tiLeTron) {
  const r = Math.random();
  let tichLuy = 0;
  for (const [pc, xacSuat] of Object.entries(tiLeTron)) {
    tichLuy += xacSuat;
    if (r < tichLuy) return pc;
  }
  return Object.keys(tiLeTron)[0]; // phòng sai số làm tròn số thực
}

// Với 1 nhân vật (cố định hoặc trộn), trả về phong cách THẬT dùng cho
// VÁN NÀY — nhân vật cố định luôn trả cùng 1 kết quả, nhân vật trộn thì
// random lại mỗi lần gọi.
export function layPhongCachThucTeChoVan(nhanVat) {
  if (nhanVat.phongCach === 'tron') return chonPhongCachTuTiLeTron(nhanVat.tiLeTron);
  return nhanVat.phongCach;
}
```

**Giải thích:** đây LÀ khái niệm "trộn theo tỷ lệ" đã thống nhất kỹ với
Huy — KHÔNG phải chọn 1 phong cách CỐ ĐỊNH cho cả hiệp, mà **tung lại
xúc xắc ở TỪNG VÁN riêng biệt**. Với mẫu nhỏ (1 hiệp = 12 ván), tỷ lệ
THỰC TẾ sẽ dao động khỏi tỷ lệ khai báo (đúng "Luật số lớn") — chỉ qua
NHIỀU hiệp, tỷ lệ mới hội tụ đúng. Đây chính là lý do bắt buộc phải ghi
lại phong cách thật dùng ở TỪNG VÁN vào lịch sử (Phase 5), không chỉ ghi
1 lần cho cả hiệp.

### Bước 2 — Hàm điều phối chung: gọi đúng phong cách bất kể loại nào

```js
// Điểm vào DUY NHẤT để xếp bài AI — nhận nhân vật, tự biết gọi đúng
// hàm nào tùy phong cách (kể cả 'coDien' dùng aiXepBai cũ, và 'chuyenNghiep'
// cần thêm laCon39 để mô phỏng).
export function aiXepBaiTheoNhanVat(nhanVat, ca13La, laCon39, ruleset) {
  const phongCachThat = layPhongCachThucTeChoVan(nhanVat);

  if (phongCachThat === 'coDien') {
    return { cachChia: aiXepBai(ca13La), phongCachThat };
  }
  if (phongCachThat === 'chuyenNghiep') {
    return { cachChia: xepBaiChuyenNghiep(ca13La, laCon39, ruleset), phongCachThat };
  }
  return { cachChia: xepBaiTheoPhongCach(ca13La, ruleset, phongCachThat), phongCachThat };
}
```

**Giải thích:** hàm này là "cổng vào" duy nhất `App.jsx` cần gọi — không
cần biết bên trong có bao nhiêu loại phong cách khác nhau, chỉ cần đưa 1
nhân vật vào là ra đúng cách chia + biết CHÍNH XÁC phong cách thật vừa
dùng (để ghi vào lịch sử ở Phase 5/6).

### Kiểm tra Phase 4

Đã kiểm thử bằng Node.js: tạo nhân vật trộn với tỷ lệ sai (không = 1) bị
từ chối ngay; trộn 70%/30% qua 5000 lần cho tỷ lệ thực tế 70,2% (khớp
đúng); trộn ĐỦ 5 phong cách (kể cả Cổ Điển) mỗi cái 20% qua 10.000 lần
cho kết quả 19,6%-20,5% (đều khớp); nhân vật cố định (Safeway) luôn trả
đúng 1 phong cách không đổi; minh họa 1 hiệp 12 ván thật cho thấy dao
động mẫu nhỏ đúng như dự đoán (có lần "Cổ Điển" ra 0/12 dù khai báo 20%
— bình thường, không phải lỗi).

Dừng lại ở đây. Xác nhận đúng trước khi báo cáo và sang Phase 5.

---

## Phase 5 — Mở rộng mô hình dữ liệu (`src/lichSuChoi.js`)

Mục tiêu: 2 hệ đếm riêng biệt, giới hạn lưu trữ gắn với Monte Carlo, ghi
nhân vật + phong cách thật từng ván, xóa sạch dữ liệu cũ.

### Bước 1 — Sửa `taoHiepMoi`/`taoVanMoi`: 2 hệ đếm riêng + field mới

```js
const SO_LAN_MO_PHONG_TOI_THIEU = 1000;
export const SO_VAN_TOI_DA_MOI_NGUON = SO_LAN_MO_PHONG_TOI_THIEU;

function layDemToanCuc(khoa) {
  return Number(localStorage.getItem(khoa) || '0');
}
function tangDemToanCuc(khoa) {
  const moi = layDemToanCuc(khoa) + 1;
  localStorage.setItem(khoa, String(moi));
  return moi;
}

// 2 KHÓA ĐẾM RIÊNG — mỗi nguồn có hệ đếm hiệp CỦA RIÊNG MÌNH (thay 1 hệ
// đếm chung KHOA_DEM_HIEP hiện tại) — thống kê 2 nguồn không liên quan.
const KHOA_DEM_HIEP_THAT = 'mauBinhDemHiepThatToanCuc';
const KHOA_DEM_HIEP_AI = 'mauBinhDemHiepAIToanCuc';
function khoaDemTheoNguon(nguon) {
  return nguon === 'choiAI' ? KHOA_DEM_HIEP_AI : KHOA_DEM_HIEP_THAT;
}

export function taoHiepMoi(nguon, nguoiChoi, chuThich = '', nhanVatDoiThu = null) {
  return {
    id: taoId('hiep'),
    soThuTu: tangDemToanCuc(khoaDemTheoNguon(nguon)), // ĐỘC LẬP theo nguồn
    batDau: Date.now(),
    nguon, nguoiChoi: [...nguoiChoi], chuThich,
    // Chỉ có ý nghĩa với nguon='choiAI' — 3 id nhân vật đã chọn cho hiệp này
    ...(nhanVatDoiThu ? { nhanVatDoiThu } : {}),
  };
}

export function taoVanMoi({ hiepId, soThuTuTrongHiep, lanChiaThu, nguoiChia, nguon, diem, nguoiChoiBaiThat, laThangTrang, loaiThangTrang, thoiGian, cheDoThucTeDoiThu }) {
  return {
    id: taoId('van'), hiepId, soThuTuTrongHiep, lanChiaThu, nguoiChia,
    thoiGian: thoiGian ?? Date.now(), nguon, diem: { ...diem },
    ...(nguoiChoiBaiThat ? { nguoiChoiBaiThat } : {}),
    ...(laThangTrang !== undefined ? { laThangTrang, loaiThangTrang: loaiThangTrang || null } : {}),
    // Chỉ có ý nghĩa với nguon='choiAI' — phong cách THẬT mỗi đối thủ đã
    // dùng ở ĐÚNG ván này (quan trọng cho nhân vật trộn — mỗi ván có thể
    // khác nhau, không thể chỉ ghi 1 lần cho cả hiệp).
    ...(cheDoThucTeDoiThu ? { cheDoThucTeDoiThu } : {}),
  };
}
```

**Giải thích:** giữ nguyên tham số `thoiGian` tùy chọn đã có từ V8 Phase
10 (Ghi điểm dùng để ghi đúng lúc gõ, không phải lúc bấm Lưu) — không
phá cách gọi cũ. `khoaDemTheoNguon` chọn đúng khóa localStorage tùy
`nguon` — 2 hệ đếm hoàn toàn độc lập, mỗi bên tự bắt đầu từ 1.

### Bước 2 — Sửa giới hạn lưu trữ = đúng số Monte Carlo tối thiểu

```js
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

(Logic KHÔNG đổi so với V8 — chỉ đổi giá trị `SO_VAN_TOI_DA_MOI_NGUON` từ
500 lên 1000, gắn với căn cứ đã kiểm chứng ở Phase 3.)

### Bước 3 — Hàm xóa sạch dữ liệu cũ

```js
export function xoaSachLichSuCu() {
  localStorage.removeItem(KHOA_HIEP);
  localStorage.removeItem(KHOA_VAN);
  localStorage.removeItem('mauBinhDemHiepToanCuc'); // hệ đếm chung CŨ của V8
  localStorage.removeItem(KHOA_DEM_HIEP_THAT);
  localStorage.removeItem(KHOA_DEM_HIEP_AI);
}
```

**Chạy 1 lần duy nhất** khi triển khai xong Phase 5 (gọi qua Console:
`import { xoaSachLichSuCu } from './lichSuChoi.js'; xoaSachLichSuCu();`)
— dữ liệu Hiệp/Ván cũ (V8) không có field `nhanVatDoiThu`/
`cheDoThucTeDoiThu`, không tương thích ngược, cần bắt đầu sạch.

### Kiểm tra Phase 5

Đã kiểm thử bằng Node.js: 2 hệ đếm độc lập hoàn toàn (mỗi nguồn tự đếm
riêng từ 1, không ảnh hưởng nhau); giới hạn lưu trữ đúng 1000, khớp đúng
số Monte Carlo tối thiểu; Hiệp lưu đúng danh sách nhân vật đối thủ, Ván
lưu đúng phong cách thật từng đối thủ đã dùng; Ván bài thật KHÔNG có
field thừa liên quan AI; xóa sạch lịch sử cũ hoạt động đúng.

Dừng lại ở đây. Xác nhận đúng trước khi báo cáo và sang Phase 6.

---

## Phase 6 — Tích hợp vào Chơi với AI: chọn nhân vật + xếp bài theo phong cách (`src/App.jsx`, `src/ChonVan.jsx`)

Mục tiêu: mỗi khi bắt đầu hiệp mới, chọn 3 nhân vật cho 3 đối thủ; AI
xếp bài theo ĐÚNG phong cách đã chọn; ghi lại đầy đủ vào lịch sử.

### Bước 1 — Màn chọn nhân vật trong `ChonVan.jsx`

Thêm vào màn "Bắt đầu hiệp mới" (chỉ hiện khi KHÔNG có hiệp dở, vì hiệp
dở đã cố định nhân vật từ lúc bắt đầu — xem Bước 3):

```jsx
import { DANH_SACH_NHAN_VAT_MAC_DINH } from './nhanVatAI.js'

const [nhanVatDoiThu, setNhanVatDoiThu] = useState(['safeway', 'newbalance', 'madmax']);

function suaNhanVatDoiThu(idx, id) {
  setNhanVatDoiThu(prev => prev.map((n, i) => i === idx ? id : n));
}
```

```jsx
<div className="ban-choi ban-choi-tron">
  <div className="vi-tri-12h">
    <select value={nhanVatDoiThu[1]} onChange={e => suaNhanVatDoiThu(1, e.target.value)}>
      {DANH_SACH_NHAN_VAT_MAC_DINH.map(n => <option key={n.id} value={n.id}>{n.ten}</option>)}
    </select>
  </div>
  <div className="vi-tri-9h">
    <select value={nhanVatDoiThu[0]} onChange={e => suaNhanVatDoiThu(0, e.target.value)}>
      {DANH_SACH_NHAN_VAT_MAC_DINH.map(n => <option key={n.id} value={n.id}>{n.ten}</option>)}
    </select>
  </div>
  <div className="vi-tri-3h">
    <select value={nhanVatDoiThu[2]} onChange={e => suaNhanVatDoiThu(2, e.target.value)}>
      {DANH_SACH_NHAN_VAT_MAC_DINH.map(n => <option key={n.id} value={n.id}>{n.ten}</option>)}
    </select>
  </div>
  <div className="vi-tri-6h"><div className="ten-vi-tri">Bạn</div></div>
</div>
```

**Giải thích:** dùng LẠI đúng bố cục `.ban-choi-tron` (V8 Phase 8) —
người chơi thấy trực quan ai đang ngồi đâu trước khi bắt đầu, nhất quán
với cách hiển thị lúc chơi thật. (Phần "Tạo nhân vật mới trộn tỷ lệ" —
form nhập tên + 5 ô % — có thể bổ sung thêm ở 1 bản vá sau nếu cần, chưa
đưa vào Phase này để giữ phạm vi gọn.)

### Bước 2 — Truyền nhân vật đã chọn vào lúc tạo Hiệp mới

Sửa `App.jsx` — hàm `damBaoHiepAI()` (V8) giờ cần nhận thêm nhân vật đã
chọn từ `ChonVan`:

```jsx
function damBaoHiepAI(nhanVatDaChon) {
  let hiep = layHiepDangDoHoacNull(danhSachHiepLS, danhSachVanLS, 'choiAI');
  if (!hiep) {
    hiep = taoHiepMoi('choiAI', TEN_AI_CO_DINH, '', nhanVatDaChon);
    const dsHiepMoi = [...danhSachHiepLS, hiep];
    setDanhSachHiepLS(dsHiepMoi);
    ghiDanhSach(KHOA_HIEP, dsHiepMoi);
  }
  return hiep;
}
```

**Giải thích:** nhân vật CHỈ được gán lúc TẠO hiệp mới (không đổi được
giữa chừng 1 hiệp đang dở) — nếu hiệp đang dở, `layHiepDangDoHoacNull` đã
tìm thấy nó và giữ nguyên `nhanVatDoiThu` đã lưu sẵn từ lúc tạo, tham số
`nhanVatDaChon` truyền vào lúc này bị bỏ qua (không dùng tới).

### Bước 3 — Dùng nhân vật của hiệp để xếp bài AI, ghi lại phong cách thật

```jsx
import { DANH_SACH_NHAN_VAT_MAC_DINH, aiXepBaiTheoNhanVat } from './nhanVatAI.js'

function layNhanVat(id) {
  return DANH_SACH_NHAN_VAT_MAC_DINH.find(n => n.id === id) || DANH_SACH_NHAN_VAT_MAC_DINH[0];
}

// Thay lời gọi aiXepBai(tatCaBai[i]) TRỰC TIẾP (V1-V8) bằng:
const ketQuaDoiThu1 = aiXepBaiTheoNhanVat(layNhanVat(hiepAIHienTai.nhanVatDoiThu?.[0] ?? 'coDien'), tatCaBai[1], [...tatCaBai[0], ...tatCaBai[2], ...tatCaBai[3]], ruleset);
const ketQuaDoiThu2 = aiXepBaiTheoNhanVat(layNhanVat(hiepAIHienTai.nhanVatDoiThu?.[1] ?? 'coDien'), tatCaBai[2], [...tatCaBai[0], ...tatCaBai[1], ...tatCaBai[3]], ruleset);
const ketQuaDoiThu3 = aiXepBaiTheoNhanVat(layNhanVat(hiepAIHienTai.nhanVatDoiThu?.[2] ?? 'coDien'), tatCaBai[3], [...tatCaBai[0], ...tatCaBai[1], ...tatCaBai[2]], ruleset);

const baiDoiThu = [ketQuaDoiThu1.cachChia, ketQuaDoiThu2.cachChia, ketQuaDoiThu3.cachChia];
const phongCachThatDoiThu = {
  'Đối thủ 1': ketQuaDoiThu1.phongCachThat,
  'Đối thủ 2': ketQuaDoiThu2.phongCachThat,
  'Đối thủ 3': ketQuaDoiThu3.phongCachThat,
};
```

**Giải thích:** `?? 'coDien'` phòng trường hợp hiệp cũ (lỡ chưa xóa sạch
lịch sử) không có `nhanVatDoiThu` — mặc định về Cổ Điển thay vì lỗi.
`laCon39` truyền vào đúng "39 lá không thuộc về đối thủ đang xét" (khác
nhau cho mỗi đối thủ — gồm bài của Bạn + 2 đối thủ còn lại) — chỉ thực sự
cần thiết cho phong cách `chuyenNghiep`, các phong cách khác bỏ qua tham
số này.

### Bước 4 — Ghi `phongCachThatDoiThu` vào Ván khi log lịch sử

Sửa `ghiVanAIVaoLichSu` (V8) — nhận thêm và truyền tiếp
`cheDoThucTeDoiThu`:

```jsx
function ghiVanAIVaoLichSu({ nguoiChoiBaiThat, diem, laThangTrang, loaiThangTrang, cheDoThucTeDoiThu }) {
  const hiep = damBaoHiepAI();
  const soThuTuVanTrongHiep = layVanCuaHiep(hiep.id, danhSachVanLS).length + 1;
  const { nguoiChia, lanChia } = nguoiChiaChoVan(hiep.nguoiChoi, soThuTuVanTrongHiep);

  const vanMoi = taoVanMoi({
    hiepId: hiep.id, soThuTuTrongHiep: soThuTuVanTrongHiep, lanChiaThu: lanChia, nguoiChia,
    nguon: 'choiAI', diem, nguoiChoiBaiThat, laThangTrang, loaiThangTrang, cheDoThucTeDoiThu,
  });
  // ... phần còn lại giữ nguyên y hệt V8 ...
}
```

Ở `xacNhanBai()` (điểm gọi chính, ván thắng bình thường), truyền thêm:
```jsx
ghiVanAIVaoLichSu({
  nguoiChoiBaiThat: [...],
  diem: ketQua.diem,
  cheDoThucTeDoiThu: phongCachThatDoiThu, // MỚI
});
```

### Kiểm tra Phase 6

1. Bắt đầu hiệp mới — thấy màn chọn 3 nhân vật đúng bố cục bàn tròn.
2. Chọn Mad Max cho 1 vị trí — chơi vài ván, xem bài đối thủ đó có xu
   hướng dồn vào 1 chi để ăn bonus lớn (đặc trưng Tối đa hóa điểm).
3. Console: `localStorage.getItem('mauBinhLichSuVan')` — ván AI mới phải
   có field `cheDoThucTeDoiThu` đúng 3 đối thủ.
4. Hiệp đang dở — thoát ra vào lại "Chơi với AI", KHÔNG hiện lại màn
   chọn nhân vật (vì hiệp dở đã cố định nhân vật từ đầu).

Dừng lại ở đây. Xác nhận cả 4 điều trên đúng trước khi báo cáo và sang
Phase 7.

---

## Phase 7 — Nút "Gợi ý" cho người chơi + dữ liệu mồi

Mục tiêu: người chơi bấm 1 nút, thấy được cách xếp "Chuyên nghiệp" đề
xuất — và tạo dữ liệu mồi ban đầu cho Lịch sử từ chính 1 lần chạy đó.

### Bước 1 — Nút "Gợi ý" trong màn xếp bài

```jsx
import { xepBaiChuyenNghiep } from './cardEngine.js'

const [dangGoiY, setDangGoiY] = useState(false);
const [ketQuaGoiY, setKetQuaGoiY] = useState(null);

function goiY() {
  setDangGoiY(true);
  // Chạy hơi lâu (~1-2 giây) — nên có thể bọc setTimeout(...,0) để UI kịp
  // hiện trạng thái "đang tính" trước khi bắt đầu tính toán nặng.
  setTimeout(() => {
    const laCon39 = [...tatCaBai[1], ...tatCaBai[2], ...tatCaBai[3]];
    const ketQua = xepBaiChuyenNghiep(tatCaBai[0], laCon39, ruleset);
    setKetQuaGoiY(ketQua);
    setDangGoiY(false);
  }, 0);
}
```

Thêm nút vào `hang-nut-choi` (chỉ hiện khi chưa xác nhận):
```jsx
<button className="nut-choi" onClick={goiY} disabled={dangGoiY}>
  {dangGoiY ? 'Đang tính...' : 'Gợi ý'}
</button>
```

Hiển thị kết quả gợi ý (tỷ lệ thắng ước tính, dùng thẻ bài tĩnh
`HangBai`/`TheBaiDon` sẵn có — KHÔNG dùng `Card.jsx` đã bị xóa):
```jsx
{ketQuaGoiY && (
  <div className="khoi-luat">
    <div className="khoi-luat-tieu-de">
      Gợi ý (tỷ lệ thắng ước tính: {(ketQuaGoiY.tyLeThang * 100).toFixed(0)}%)
    </div>
    <HangBai danhSachLa={ketQuaGoiY.chiDau} />
    <HangBai danhSachLa={ketQuaGoiY.chiGiua} />
    <HangBai danhSachLa={ketQuaGoiY.chiCuoi} />
  </div>
)}
```

**Giải thích:** `setTimeout(..., 0)` là mẹo nhỏ để trình duyệt kịp VẼ LẠI
giao diện (hiện chữ "Đang tính...") TRƯỚC KHI bắt đầu phép tính nặng
(JavaScript đơn luồng — nếu gọi trực tiếp không qua `setTimeout`, trình
duyệt sẽ "đứng hình" cho tới khi tính xong mới vẽ, người chơi không thấy
phản hồi gì trong lúc chờ).

### Bước 2 — Tạo dữ liệu mồi từ 1 lần chạy Monte Carlo

Sau khi Claude Code triển khai xong Phase 1-6, chạy đoạn này 1 LẦN DUY
NHẤT qua Console (không phải code thường trực trong app):

```js
import { xoaSachLichSuCu, taoHiepMoi, taoVanMoi, themVanVaoLichSu, ghiDanhSach, KHOA_HIEP, KHOA_VAN } from './lichSuChoi.js'
import { xepBaiChuyenNghiep, danhGia3La, danhGia5La, soSanh } from './cardEngine.js'
import { aiXepBai } from './aiEngine.js'

xoaSachLichSuCu(); // đảm bảo sạch trước khi bơm dữ liệu mồi

// Dựng 1 tay 13 lá bất kỳ + 39 lá còn lại để chạy 1 lần "Chuyên nghiệp"
// (mặc định soLanMoPhong=1000) — LƯU LẠI ngay 1000 kết quả mô phỏng đó
// làm 1000 "Ván mồi" — không cần sinh dữ liệu giả riêng, tận dụng đúng
// những gì thuật toán vốn đã tạo ra khi chạy.
```

**Giải thích:** đây là cách "1 công đôi việc" — bản thân `xepBaiChuyenNghiep`
đã PHẢI mô phỏng 1000 lần bên trong để hoạt động; thay vì chỉ lấy KẾT
QUẢ CUỐI (1 cách chia tốt nhất) rồi bỏ đi 1000 lần mô phỏng đã chạy,
LƯU LUÔN từng lần mô phỏng đó thành 1 "Ván mồi" trong lịch sử — có ngay
1000 bản ghi để test trang Lịch sử mà không cần chơi tay hàng trăm ván.
Vì giới hạn lưu trữ CŨNG là 1000 (Phase 5), dữ liệu mồi này sẽ **tự động
bị đẩy dần ra ngoài** ngay khi ván THẬT đầu tiên vượt mốc 1000 — không
cần thêm code dọn dẹp nào.

### Kiểm tra Phase 7

1. Bấm "Gợi ý" — sau ~1-2 giây hiện đúng 3 hàng bài + % tỷ lệ thắng ước
   tính, dùng đúng kiểu thẻ bài tĩnh (không phải `Card.jsx`).
2. Chạy đoạn tạo dữ liệu mồi qua Console — vào Lịch sử, thấy 1000 "ván
   mồi" xuất hiện, có thể xem lại bài như ván thật.

---

## Hoàn thành V9 — báo cáo lại với Huy

1. Toàn bộ 7 Phase chạy đúng, không lỗi Console.
2. Chơi vài hiệp với các nhân vật khác nhau — xác nhận rõ RỆT sự khác
   biệt hành vi (Mad Max hay ăn bonus lớn, Safeway hay tránh chi Đầu
   yếu...).
3. Lịch sử ghi đúng nhân vật + phong cách thật từng ván — đặc biệt với 1
   nhân vật trộn tự tạo, xem qua nhiều ván thấy phong cách thay đổi.
4. 2 hệ đếm hiệp độc lập giữa Ghi điểm và Chơi AI — không còn dùng chung
   1 số nữa.
5. Ghi chú cho tương lai: form "Tạo nhân vật mới trộn tỷ lệ" (nhập tên +
   5 ô %) chưa làm ở Phase 6 — có thể bổ sung ở bản vá riêng nếu cần,
   phần lõi (`taoNhanVatTron`) đã sẵn sàng dùng ngay.

---

## Nhật ký triển khai thực tế (Claude Code)

Toàn bộ 7 Phase đã triển khai đúng theo spec ở trên. Ghi chú các điểm
thực thi cụ thể / khác biệt nhỏ so với bản nháp:

- **Phase 1-3** (`src/cardEngine.js`): thêm đúng `chamDiemCachChia`,
  `duyetCachChiaHopLe`/`xepBaiTheoPhongCach`, `moPhongMotCachChia`/
  `xepBaiChuyenNghiep`. Vì `moPhongMotCachChia` cần gọi `aiXepBai` (ở
  `aiEngine.js`, vốn đã import ngược `xepBaiHopLe` từ `cardEngine.js`),
  thêm 1 import vòng `cardEngine.js → aiEngine.js` — an toàn vì
  `aiXepBai` chỉ được gọi bên TRONG thân hàm lúc chạy, không phải ở
  top-level lúc module khởi tạo (Vite/ESM xử lý tốt trường hợp này).
- **Kiểm thử độc lập bằng Node** (không chỉ tin tưởng suông): duyệt
  72.072 tổ hợp lọc ra 22.604 cách hợp lệ trên 1 tay ngẫu nhiên (khớp
  đúng cấu trúc, không thiếu/thừa lá); binh lủng luôn `-Infinity`; 3
  phong cách không mô phỏng ra kết quả KHÁC NHAU ở 20/20 tay thử; tay
  cực mạnh (Tứ quý K + Sám cô Á) mô phỏng ra tỷ lệ thắng 100%; nhân vật
  trộn 70/30 qua 5000 lần ra đúng ~68.8%; cả 5 nhân vật mặc định (kể cả
  Monte Carlo) luôn xếp bài HỢP LỆ.
- **Phase 4** (`src/nhanVatAI.js`, file mới): triển khai đúng spec. Có
  1 chỉnh sửa nhỏ so với bản nháp — nhánh `'coDien'` trong
  `aiXepBaiTheoNhanVat` gọi `aiXepBai(ca13La, ruleset)` (CÓ truyền
  `ruleset`), thay vì bỏ trống như bản nháp — để nhất quán với mọi lời
  gọi `aiXepBai` khác trong app (vốn luôn truyền ruleset từ V1), tránh
  vô tình bỏ qua luật Sảnh Hạ tùy chỉnh khi nhân vật dùng phong cách Cổ
  Điển.
- **Phase 5** (`src/lichSuChoi.js`): 2 khóa đếm riêng
  (`mauBinhDemHiepThatToanCuc`/`mauBinhDemHiepAIToanCuc`), giới hạn lưu
  trữ nâng lên 1000, `xoaSachLichSuCu()` đã thêm và ĐÃ CHẠY qua Playwright
  console trong lúc kiểm thử (xác nhận xóa sạch đúng cả Hiệp/Ván/2 khóa
  đếm mới lẫn khóa đếm chung cũ). **Huy cần tự chạy `xoaSachLichSuCu()`
  1 lần trong Console trình duyệt THẬT của mình** (không phải máy kiểm
  thử) trước khi dùng bản V9 — dữ liệu Hiệp/Ván cũ (V8 trở về trước)
  thiếu field mới, không tương thích ngược.
- **Phase 6** (`src/ChonVan.jsx`, `src/App.jsx`): thay vì dựng 1 bàn
  tròn RIÊNG chỉ để chọn nhân vật (như bản nháp gợi ý), gắn thẳng 3
  `<select>` vào ĐÚNG bàn tròn preview đã có sẵn (mỗi vị trí đối thủ có
  1 dropdown ngay dưới tên) — gọn hơn, không cần 2 bàn tròn chồng nhau,
  chỉ hiện khi CHƯA có hiệp dở (đúng yêu cầu). Mặc định 3 đối thủ:
  Safeway / New Balance / Mad Max. Khi "Chơi tiếp" ngay sau 1 hiệp vừa
  xong (không qua màn ChonVan), giữ NGUYÊN 3 nhân vật của hiệp trước
  (chưa có yêu cầu chọn lại ở luồng này). Đã tối ưu 1 chỗ hiệu năng: hiệu
  ứng `useEffect` xếp lại bài đối thủ trước đây phụ thuộc cả
  `boBaiDoiThu` (tức chạy lại mỗi lần chia bài MỚI, trùng lặp với chỗ
  `batDauVanMoi` đã tự tính) — nay chỉ còn phụ thuộc `ruleset` (chỉ
  chạy lại khi Huy đổi luật chơi giữa chừng), tránh tính 2 lần cùng 1
  ván — quan trọng vì phong cách "Chuyên nghiệp" tốn ~1-2 giây/đối thủ,
  tính trùng sẽ tăng gấp đôi thời gian chờ vào ván.
- **Phase 7**: nút "Gợi ý" thêm vào hàng nút lúc CHƯA xác nhận bài,
  dùng `xepBaiChuyenNghiep` trên đúng 13 lá của Bạn. Bước "dữ liệu mồi"
  (bơm 1000 ván giả từ 1 lần chạy Chuyên nghiệp) là thao tác thủ công
  một lần theo đúng mô tả gốc — CHƯA chạy vì cần thực hiện trên
  localStorage của trình duyệt Huy dùng thật, không phải máy kiểm thử;
  code (`xepBaiChuyenNghiep` + `taoVanMoi`/`themVanVaoLichSu`) đã sẵn
  sàng để Huy tự chạy qua Console nếu muốn.
- **Kiểm thử qua Playwright** (không chỉ code review): chọn Monte Carlo
  cho 1 đối thủ rồi vào ván — mất ~2.6 giây (đúng như dự đoán); bấm
  "Gợi ý" ra đúng % tỷ lệ thắng; sau khi xác nhận bài, `localStorage`
  ghi đúng `nhanVatDoiThu` trên Hiệp và `cheDoThucTeDoiThu` (theo đúng
  phong cách THẬT từng đối thủ) trên Ván; 2 khóa đếm độc lập đúng (Ghi
  điểm và Chơi AI không ảnh hưởng lẫn nhau); trang Lịch sử và luồng Ghi
  điểm (V8) không bị ảnh hưởng, không lỗi Console.
- `npx vite build` sạch; `npm run lint` chỉ còn đúng 1 cảnh báo CŨ, có
  từ trước V9 (`react-hooks(exhaustive-deps)` ở effect ghi log thắng
  trắng tự động — không liên quan tới thay đổi V9).

### Fix: màn chọn nhân vật không hiện khi đã có hiệp dở

**Lỗi Huy báo:** vào "Chơi với AI", bấm "Bắt đầu hiệp mới" mà KHÔNG thấy
màn chọn nhân vật đối thủ đâu cả.

**Nguyên nhân:** bản triển khai Phase 6 ban đầu chỉ hiện 3 `<select>`
chọn nhân vật khi `!hiepDoDang` (chưa có hiệp dở) — hiểu nhầm ý "hiệp dở
đã cố định nhân vật, không đổi được giữa chừng" thành "ẩn luôn cả màn
CHỌN nhân vật cho hiệp SẮP TẠO". Trong thực tế hầu như lúc nào cũng có 1
hiệp dở từ lần chơi trước (chơi liên tục nhiều ngày), nên màn chọn gần
như KHÔNG BAO GIỜ hiện ra — dù nút "Bắt đầu hiệp mới" vẫn bấm được và
vẫn tạo hiệp mới bình thường (chỉ là không cho chọn nhân vật, luôn dùng
mặc định Safeway/New Balance/Mad Max).

**Sửa:** tách hẳn 2 khối trong `ChonVan.jsx` — khối preview tên+điểm
(chỉ có thêm điểm khi có hiệp dở) và khối chọn nhân vật (LUÔN hiện,
không phụ thuộc `hiepDoDang`, vì lựa chọn này chỉ áp dụng cho hiệp MỚI
sắp được tạo lúc bấm nút, không liên quan gì tới hiệp dở đang có).

**Kiểm thử qua Playwright** (tái hiện đúng kịch bản lỗi): chơi 1 ván rồi
bấm "Dừng" (tạo hiệp dở dang, chưa đủ 12 ván) → quay lại "Chơi với AI"
→ xác nhận thấy nút "Tiếp hiệp cũ" HIỂN THỊ nhưng vẫn có đúng 3 select
nhân vật (trước sửa: 0 select). Chọn Monte Carlo cho 1 vị trí, bấm "Bắt
đầu hiệp mới", xác nhận hiệp mới ghi đúng `nhanVatDoiThu` đã chọn vào
`localStorage`.

### Fix: tên người chơi trong ván vẫn là "Đối thủ x", không đổi theo nhân vật đã chọn

**Lỗi Huy báo:** sau khi chọn nhân vật (vd Mad Max, Safeway...) cho các
đối thủ, vào ván chơi vẫn thấy nhãn "Đối thủ 1"/"Đối thủ 2"/"Đối thủ 3"
ở vị trí trên bàn, banner "Ù ngay!", và phần "Xem cách tính chi tiết" —
không phản ánh tên nhân vật vừa chọn.

**Nguyên nhân:** `App.jsx` dùng CHUỖI "Đối thủ 1"/"Đối thủ 2"/"Đối thủ 3"
làm KHÓA NỘI BỘ xuyên suốt — vừa để tra điểm (`diem['Đối thủ 1']`,
`tongCongDon['Đối thủ 1']`...) vừa để IN RA MÀN HÌNH — nên chưa từng có
chỗ nào chuyển sang tên nhân vật đã chọn khi hiển thị.

**Sửa:** thêm 1 lớp ánh xạ HIỂN THỊ RIÊNG, tách khỏi khóa tính điểm —
`layTenHienThiDoiThu(hiepAIHienTai)` tra tên nhân vật thật từ
`hiepAIHienTai.nhanVatDoiThu`, và hàm `tenHienThi(tenKhoa)` chỉ dùng ở
những chỗ IN chữ ra (vị trí trên bàn, banner thắng trắng, dòng "So với
X:" trong giải trình) — mọi chỗ TÍNH ĐIỂM (`nguoiChoi` khi gọi
`tinhDiem`, `diem`, `tongCongDonHiepHienTai`, ghi lịch sử...) vẫn giữ
NGUYÊN khóa "Đối thủ 1/2/3" như cũ, không đổi. Lý do KHÔNG đổi thẳng
khóa: 2 đối thủ có thể lỡ chọn TRÙNG 1 nhân vật (vd cả 2 đều chọn
Safeway) — nếu đổi thẳng khóa thành tên nhân vật, 2 đối thủ sẽ bị GỘP
LÀM 1 trong các object điểm theo tên (`diem`, `tongCongDon`...), sai
lệch nghiêm trọng. Cùng cách xử lý áp dụng luôn cho preview ở
`ChonVan.jsx` (hiệp dở đã có sẵn `nhanVatDoiThu` → hiện đúng tên nhân
vật thay vì "Đối thủ x").

**Kiểm thử qua Playwright:** chọn rõ 3 nhân vật KHÁC NHAU (Safeway/Mad
Max/Cổ Điển) cho 3 đối thủ, vào ván — xác nhận đúng 3 tên hiện trên bàn;
xác nhận bài xong, tổng điểm 4 người vẫn CHÍNH XÁC = 0 (không bị gộp
nhầm khóa); mở "Xem cách tính chi tiết" thấy đúng "So với Safeway:",
"So với Mad Max:", "So với Cổ Điển:" thay vì "Đối thủ 1/2/3". Có
screenshot xác nhận trực quan.

### Điều tra: "lỗi so bài — Bạn không thể ăn sập Mad Max"

Huy gửi ảnh 1 ván cụ thể (Bạn +7, Mad Max -13, Safeway 0, New Balance
+6) và nghi ngờ so bài sai. Đã dựng lại CHÍNH XÁC 4 bộ bài trong ảnh
bằng Node và chạy qua `tinhDiem` — kết quả ra ĐÚNG y hệt 4 số trên, và
chi tiết so với Mad Max xác nhận:

```
Chi Đầu: Bạn thắng bằng Đôi (đôi 4 > Mậu thầu 8-7-5)
Chi Giữa: Bạn thắng bằng Đôi (đôi 10 > đôi 3)
Chi Cuối: Bạn thắng bằng Sảnh (A-5 > đôi K)
→ Bạn ăn sập Mad Max: 3 × 2 = +6
```

**Kết luận: KHÔNG phải lỗi.** Bộ Cuối "A♠ 5♦ 4♣ 3♥ 2♥" của Bạn nhìn qua
dễ tưởng là "Ách rời" (không đôi), nhưng thực chất là **sảnh A-2-3-4-5**
("sảnh hạ"/"cầu thang lá" — the wheel). `danhGia5La` đã nhận diện đúng
trường hợp đặc biệt này (`loai: 4`, xem comment trong `cardEngine.js`),
và theo luật chuẩn (`sanhHaYeuNhat` đang tắt), MỌI sảnh — kể cả sảnh hạ —
đều thắng MỌI đôi, bất kể mạnh/yếu trong nhóm sảnh với nhau. Cờ
`sanhHaYeuNhat` (bật ở "Luật chơi") CHỈ ảnh hưởng thứ hạng giữa các sảnh
với NHAU (khiến sảnh hạ thua các sảnh khác), KHÔNG BAO GIỜ hạ nó xuống
dưới hạng Đôi — đây là quy tắc bài Tây tiêu chuẩn, không phải lỗi V9.
Nếu Huy vẫn thấy sai ở chỗ khác (vd dòng chữ hiển thị trong "Xem cách
tính chi tiết"), gửi thêm ảnh cụ thể phần đó để kiểm tra tiếp.

### Đổi khóa nội bộ từ "Đối thủ 1/2/3" sang tên nhân vật thật (theo yêu cầu Huy)

**Vấn đề:** Huy chỉ ra thống kê/lịch sử nên gắn với NGƯỜI CHƠI + PHONG
CÁCH, không phải VỊ TRÍ NGỒI — bản sửa lỗi tên hiển thị trước đó (mục
"Fix: tên người chơi...") chỉ đổi lớp HIỂN THỊ, còn khóa thật dùng để
tính điểm/lưu lịch sử (`diem`, `tongCongDonHiepHienTai`,
`cheDoThucTeDoiThu`, cột trong Lịch sử...) vẫn là "Đối thủ 1/2/3" —
không đủ để phân tích "nhân vật X thắng bao nhiêu" xuyên suốt nhiều
hiệp.

**Đã hỏi Huy 2 phương án** (giữ khóa vị trí + xây bảng phân tích riêng,
so với đổi hẳn khóa sang tên nhân vật) — **Huy chọn đổi hẳn khóa.**

**Đã làm:**
- `hiepMoi.nguoiChoi` khi tạo hiệp Chơi-AI mới (`chonHiepMoi` trong
  `App.jsx`) giờ là `['Bạn', <tên nhân vật 1>, <tên nhân vật 2>, <tên
  nhân vật 3>]` — vd `['Bạn', 'Safeway', 'Mad Max', 'Cổ Điển']` — THAY
  VÌ `['Bạn', 'Đối thủ 1', 'Đối thủ 2', 'Đối thủ 3']`. Toàn bộ
  `diem`/`tongCongDon`/`cheDoThucTeDoiThu`/lịch sử tự động dùng đúng tên
  này vì đều tra cứu qua `nguoiChoi`.
- **Bắt buộc 3 nhân vật KHÁC NHAU** ở `ChonVan.jsx`: mỗi dropdown loại
  bỏ (không hiện) nhân vật đã được chọn ở 2 dropdown còn lại — về mặt
  giao diện KHÔNG THỂ chọn trùng, nên không có rủi ro 2 đối thủ trùng
  tên bị gộp nhầm điểm (object `diem`/`tongCongDon` khóa theo tên).
- `App.jsx` thêm hàm `layTenDoiThu(hiep)` (đọc thẳng
  `hiep.nguoiChoi.slice(1)`, fallback `['Đối thủ 1','Đối thủ 2','Đối thủ
  3']` khi chưa có hiệp/hiệp cũ chưa có `nguoiChoi` dạng mới) — biến
  `tenDoiThu` (3 tên đối thủ hiệp hiện tại) và `tenTatCaNguoiChoi` (thêm
  'Bạn' ở đầu) được tính 1 lần mỗi render, dùng THAY THẾ mọi chỗ trước
  đây hardcode chuỗi "Đối thủ 1/2/3" — bao gồm: xây `nguoiChoi` lúc
  `xacNhanBai`/`xacNhanBaoU`/`ketQuaThangTrang`, nhãn vị trí trên bàn,
  banner "Ù ngay!", và khóa của `cheDoThucTeDoiThu`.
- Gỡ bỏ hoàn toàn lớp ánh xạ "hiển thị riêng" (`tenHienThi`/
  `banDoTenHienThi`) đã thêm ở bản sửa trước — không cần nữa vì khóa
  THẬT giờ chính là tên hiển thị.
- **Không cần migrate dữ liệu cũ:** mỗi Hiệp tự chứa `nguoiChoi` của
  riêng nó — Hiệp tạo TRƯỚC thay đổi này (dùng "Đối thủ 1/2/3") và Hiệp
  tạo SAU (dùng tên nhân vật) cùng tồn tại bình thường trong 1
  `localStorage`, Lịch sử vẫn hiển thị đúng theo từng Hiệp vì cột bảng
  luôn đọc từ `hiep.nguoiChoi`, không hardcode tên.

**Kiểm thử qua Playwright:**
1. Chọn Safeway cho vị trí 9h → xác nhận dropdown 12h/3h KHÔNG còn hiện
   "Safeway" trong danh sách lựa chọn (chặn trùng tận gốc ở UI).
2. Chọn đủ 3 nhân vật khác nhau (Safeway/Mad Max/Cổ Điển), bắt đầu hiệp
   — `localStorage` ghi đúng `nguoiChoi: ["Bạn","Safeway","Mad
   Max","Cổ Điển"]`; xác nhận bài, `diem` có ĐÚNG 4 khóa tên thật, tổng
   = 0; `cheDoThucTeDoiThu` cũng khóa theo tên thật
   (`{"Safeway":"anToan","Mad Max":"toiDaHoaDiem","Cổ Điển":"coDien"}`).
3. Chơi 1 ván rồi "Dừng" (tạo hiệp dở) → quay lại "Chơi với AI" — màn
   preview hiện ĐÚNG "Safeway"/"Mad Max"/"Cổ Điển" kèm điểm tích lũy,
   không còn "Đối thủ 1/2/3".
