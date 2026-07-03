# V4_GUIDE.md — Luật thắng trắng (Ù)

> **Dành cho ai đọc file này:**
> - Nếu bạn là **Claude Code**: làm theo ĐÚNG THỨ TỰ 5 Phase bên dưới.
>   MỖI Phase xong phải DỪNG LẠI, báo cáo đã làm gì, và để Huy tự kiểm
>   tra theo checklist cuối Phase đó trước khi sang Phase tiếp theo.
> - Nếu bạn là **Huy**: đọc phần "Bạn học được gì" sau mỗi Phase. Toàn bộ
>   logic tính toán (Phase 1) đã được kiểm thử bằng Node.js trước khi đưa
>   vào tài liệu — công thức tổ hợp chính xác cho 4/7 loại, mô phỏng 1
>   triệu lần cho 3 loại còn lại, và toàn bộ logic tính điểm (1 người
>   thắng trắng, nhiều người cùng thắng trắng, không ai thắng trắng) đều
>   giữ đúng tổng bàn = 0.

## Phạm vi V4

Thêm 7 loại thắng trắng (Ù ngay, không cần so từng chi), tích hợp vào
luồng chơi (kiểm tra ngay sau khi chia bài, trước màn hình xếp bài), và
thêm cấu hình vào tab Luật chơi.

| # | Tên | Điều kiện (trên 13 lá) | Chi thưởng/đối thủ | Xác suất |
|---|---|---|---|---|
| 1 | Rồng cuốn | 13 lá cùng 1 chất | 24 | ~1/158,7 tỷ |
| 2 | Sảnh rồng | Đủ 13 rank khác nhau, không đồng chất | 12 | ~1/9.462 |
| 3 | Năm đôi 1 sám | 1 sám (bộ ba) + 5 đôi | 6 | ~1/1.983 |
| 4 | Lục phé bôn | 6 đôi + 1 lá lẻ | 6 | ~1/283 |
| 5 | Năm đôi thông | 5 rank liên tiếp đều có đôi trở lên | 6 | ~1/1.344 |
| 6 | Ba thùng | Tồn tại cách chia 3+5+5 mỗi nhóm đồng chất | 6 | ~1/112 |
| 7 | Ba sảnh | Tồn tại cách chia 3+5+5 mỗi nhóm liên tiếp | 6 | ~1/503 |

Kiểm tra theo ĐÚNG thứ tự 1→7 ở trên, khớp loại nào trước tính loại đó
(xử lý các trường hợp hiếm khi 1 bộ bài vô tình khớp nhiều loại cùng lúc).
Nếu có từ 2 người thắng trắng trở lên trong cùng 1 ván, mỗi cặp đối đầu
đều áp dụng đúng luật trên — người thắng trắng nhận đúng mức của loại
mình từ TỪNG đối thủ (kể cả đối thủ đó cũng đang thắng trắng bằng loại
khác, khi đó 2 bên trừ qua trừ lại theo đúng mức của mỗi bên).

Có 1 tùy chọn: tính theo đúng bảng mức cố định trên (mặc định), HOẶC tính
điều chỉnh theo mức "Ăn sập làng" hiện có — `(điểm gốc Đầu+Giữa+Cuối) ×
hệ số Ăn sập × hệ số Sập làng`.

---

## Phase 1 — 7 hàm nhận diện + tính điểm thắng trắng (`src/cardEngine.js`)

Mục tiêu: có đủ logic phát hiện 7 loại thắng trắng và tính điểm cho
chúng, kiểm tra bằng Console trước khi đụng gì tới giao diện.

### Bước 1 — Thêm vào cuối `src/cardEngine.js`

```js
// ==================== LUẬT THẮNG TRẮNG (V4) ====================

function demSoLuongTheoRank(ca13La) {
  const dem = {};
  ca13La.forEach(l => { dem[l.rank] = (dem[l.rank] || 0) + 1; });
  return dem;
}
```

**Giải thích `demSoLuongTheoRank`:** hàm dùng chung cho 4 trong 7 loại
thắng trắng bên dưới (Năm đôi 1 sám, Lục phé bôn, Năm đôi thông, và gián
tiếp cả Sảnh rồng) — vì cả 4 loại đó đều dựa trên việc "rank nào xuất
hiện mấy lần trong 13 lá". Tách thành 1 hàm riêng để không phải viết lại
đoạn đếm này 4 lần.

```js
// 1. Rồng cuốn: 13 lá cùng 1 chất (tự động đủ 13 rank khác nhau, vì mỗi
// chất trong bộ bài chỉ có đúng 13 lá duy nhất, không lá nào trùng rank).
function laRongCuon(ca13La) {
  return new Set(ca13La.map(l => l.suit)).size === 1;
}
```

**Giải thích `laRongCuon`:** chỉ cần kiểm tra "có bao nhiêu chất khác
nhau xuất hiện trong 13 lá" (`new Set(...).size`) — nếu chỉ có 1 chất
duy nhất, KHÔNG CẦN kiểm tra thêm gì về rank, vì 1 bộ bài chỉ có đúng 13
lá cho mỗi chất (đúng 13 rank khác nhau, không lá nào trùng) — nên "13
lá cùng 1 chất" và "13 lá cùng 1 chất, đủ 13 rank" là MỘT, không cần
kiểm tra kép.

```js
// 2. Sảnh rồng: đủ 13 rank khác nhau (không đôi nào) NHƯNG không đồng
// chất toàn bộ (đồng chất thì đã là Rồng cuốn, mạnh hơn, kiểm tra trước).
function laSanhRong(ca13La) {
  const rankSet = new Set(ca13La.map(l => l.rank));
  const suitSet = new Set(ca13La.map(l => l.suit));
  return rankSet.size === 13 && suitSet.size > 1;
}
```

**Giải thích `laSanhRong`:** đếm số RANK khác nhau (`rankSet.size`) —
nếu đủ 13 (nghĩa là không có 2 lá nào trùng rank), đó là "Sảnh rồng".
Điều kiện `suitSet.size > 1` (có từ 2 chất trở lên) để loại trừ trường
hợp đã là Rồng cuốn — 2 hàm này LOẠI TRỪ LẪN NHAU, không bao giờ cùng
đúng 1 lúc.

```js
// 3. Năm đôi 1 sám: đúng 1 rank xuất hiện 3 lần (sám), đúng 5 rank khác
// xuất hiện 2 lần (đôi), không rank nào khác xuất hiện (tổng 3+5x2=13).
function laNamDoiMotSam(ca13La) {
  const soLuong = Object.values(demSoLuongTheoRank(ca13La)).sort((a, b) => b - a);
  return soLuong.length === 6 && soLuong[0] === 3 && soLuong.slice(1).every(x => x === 2);
}
```

**Giải thích `laNamDoiMotSam`:** `demSoLuongTheoRank` trả về 1 object
kiểu `{ rank: soLuong }` — ví dụ `{ 5: 3, 6: 2, 7: 2, ... }`. Lấy hết các
GIÁ TRỊ (bỏ qua rank cụ thể là gì, chỉ quan tâm "có bao nhiêu lá") rồi
sắp giảm dần. Nếu đúng có 6 rank được dùng tới (`length === 6`), phần tử
đầu tiên (lớn nhất sau khi sort) là 3 (bộ sám), 5 phần tử còn lại đều là
2 (đôi) — khớp đúng công thức 3 + 5×2 = 13.

```js
// 4. Lục phé bôn: đúng 6 rank xuất hiện 2 lần (đôi), đúng 1 rank xuất
// hiện 1 lần (lẻ), không rank nào khác (tổng 6x2+1=13).
function laLucPheBon(ca13La) {
  const soLuong = Object.values(demSoLuongTheoRank(ca13La)).sort((a, b) => b - a);
  return soLuong.length === 7 && soLuong.slice(0, 6).every(x => x === 2) && soLuong[6] === 1;
}
```

**Giải thích `laLucPheBon`:** cùng kỹ thuật với hàm trên, chỉ khác mẫu số
— 7 rank được dùng, 6 rank đầu (sau sort) đều là đôi (2), rank cuối cùng
là lẻ (1) — khớp công thức 6×2 + 1 = 13.

```js
// 5. Năm đôi thông: tồn tại 5 rank LIÊN TIẾP mà mỗi rank đều có ít nhất 1
// đôi (2 lá trở lên) — 3 lá còn lại không ràng buộc gì thêm.
function laNamDoiThong(ca13La) {
  const dem = demSoLuongTheoRank(ca13La);
  for (let r = 2; r <= 10; r++) {
    let du = true;
    for (let k = 0; k < 5; k++) {
      if ((dem[r + k] || 0) < 2) { du = false; break; }
    }
    if (du) return true;
  }
  return false;
}
```

**Giải thích `laNamDoiThong`:** khác với 2 hàm trên (không dùng
`.sort()`), hàm này cần biết CHÍNH XÁC rank nào liền kề rank nào, nên
phải duyệt qua từng "cửa sổ" 5 rank liên tiếp có thể có (bắt đầu từ rank
2 tới rank 10, vì 10+4=14=Á là rank cao nhất) — với mỗi cửa sổ, kiểm tra
CẢ 5 rank trong đó đều có ít nhất 2 lá (`dem[r+k] || 0) < 2` — nếu có 1
rank nào không đủ đôi, cửa sổ đó trượt (`du = false`), thử cửa sổ tiếp
theo. Chỉ cần 1 cửa sổ thỏa mãn là đủ (`return true` ngay).

```js
// 6. Ba thùng: TỒN TẠI 1 cách chia 13 lá thành 3+5+5 sao cho MỖI nhóm
// đồng chất (không cần 3 nhóm cùng 1 chất với nhau). Vì các lá bên trong
// 1 chất hoàn toàn hoán đổi được cho nhau (không ảnh hưởng tính đồng
// chất), chỉ cần kiểm tra SỐ LƯỢNG lá mỗi chất có đủ hay không.
function coBaThung(ca13La) {
  const demChat = [0, 0, 0, 0];
  ca13La.forEach(l => { demChat[l.suit]++; });
  for (let sA = 0; sA < 4; sA++) {
    for (let sB = 0; sB < 4; sB++) {
      for (let sC = 0; sC < 4; sC++) {
        const can = [0, 0, 0, 0];
        can[sA] += 3; can[sB] += 5; can[sC] += 5;
        if (can.every((c, i) => demChat[i] >= c)) return true;
      }
    }
  }
  return false;
}
```

**Giải thích `coBaThung`:** đây là hàm đầu tiên trong 7 hàm KHÔNG chỉ
đếm/so sánh đơn thuần, mà phải TÌM KIẾM xem có tồn tại 1 cách chia hợp lệ
hay không. Ý tưởng: đặt tên "chi Đầu dùng chất nào" (`sA`), "chi Giữa
dùng chất nào" (`sB`), "chi Cuối dùng chất nào" (`sC`) — vì chỉ có 4 chất
(0-3), có tối đa 4×4×4 = 64 cách gán khả thi, duyệt hết cả 64 cách này
(3 vòng lặp lồng nhau) là đủ nhanh. Với mỗi cách gán, tính xem cần bao
nhiêu lá ở mỗi chất (`can`) — ví dụ nếu `sA` và `sB` VÔ TÌNH TRÙNG NHAU
(cùng 1 chất được dùng cho cả chi Đầu và chi Giữa), `can` ở chất đó sẽ tự
động cộng dồn thành 3+5=8, đòi hỏi chất đó phải có ĐỦ 8 lá — code không
cần xử lý riêng trường hợp trùng chất, phép cộng `can[sA] += 3;
can[sB] += 5;` đã tự động xử lý đúng. Nếu số lá THẬT có ở mỗi chất
(`demChat`) đáp ứng đủ nhu cầu (`can`) cho ít nhất 1 trong 64 cách gán,
hàm trả về `true`.

```js
// 7. Ba sảnh: TỒN TẠI 1 cách chia 13 lá thành 3+5+5 sao cho MỖI nhóm là
// 1 dãy rank liên tiếp (không cần đồng chất). Duyệt hết các "cửa sổ"
// liên tiếp khả thi cho từng nhóm (11 cửa sổ 3-lá, 10 cửa sổ 5-lá), với
// MỖI tổ hợp 3 cửa sổ, đếm xem cần bao nhiêu lá ở mỗi rank (1 rank có thể
// bị đòi hỏi bởi NHIỀU cửa sổ nếu các cửa sổ chồng lấn rank).
function coBaSanh(ca13La) {
  const dem = demSoLuongTheoRank(ca13La);
  const capDau = [];
  for (let r = 2; r <= 12; r++) capDau.push([r, r + 1, r + 2]);
  const capGiuaCuoi = [];
  for (let r = 2; r <= 10; r++) capGiuaCuoi.push([r, r + 1, r + 2, r + 3, r + 4]);

  for (const d of capDau) {
    for (const g of capGiuaCuoi) {
      for (const c of capGiuaCuoi) {
        const canDem = {};
        [...d, ...g, ...c].forEach(r => { canDem[r] = (canDem[r] || 0) + 1; });
        const du = Object.entries(canDem).every(([r, soCan]) => (dem[r] || 0) >= soCan);
        if (du) return true;
      }
    }
  }
  return false;
}
```

**Giải thích `coBaSanh`:** cùng tinh thần "tìm kiếm" như `coBaThung`,
nhưng phức tạp hơn vì phải xét CỬA SỔ RANK LIÊN TIẾP thay vì chỉ đếm chất.
`capDau` là danh sách 11 cửa sổ 3-rank-liên-tiếp có thể có cho Chi Đầu
(bắt đầu từ rank 2 tới rank 12, vì 12+2=14=Á); `capGiuaCuoi` là danh sách
10 cửa sổ 5-rank-liên-tiếp (dùng chung cho cả Chi Giữa lẫn Chi Cuối, vì
cả 2 đều 5 lá). Duyệt hết 11×10×10 = 1.100 tổ hợp (3 cửa sổ chọn 1 cho
mỗi chi) — với mỗi tổ hợp, gộp cả 13 rank cần dùng lại rồi ĐẾM xem 1 rank
bị đòi hỏi mấy lần (`canDem`) — quan trọng: nếu 2 cửa sổ chồng lấn nhau ở
1 rank nào đó (ví dụ Chi Đầu dùng rank 5 và Chi Giữa CŨNG dùng rank 5),
`canDem[5]` sẽ là 2 — nghĩa là cần CÓ ÍT NHẤT 2 lá rank 5 (khác chất
nhau) trong tay mới đủ đáp ứng cả 2 cửa sổ cùng lúc. Kiểm tra
`(dem[r] || 0) >= soCan` cho từng rank để xác nhận có đủ lá thật hay
không.

```js
const TEN_THANG_TRANG = {
  rongCuon: 'Rồng cuốn', sanhRong: 'Sảnh rồng', namDoiMotSam: 'Năm đôi 1 sám',
  lucPheBon: 'Lục phé bôn', namDoiThong: 'Năm đôi thông', baThung: 'Ba thùng', baSanh: 'Ba sảnh',
};

const THU_TU_UU_TIEN_THANG_TRANG = [
  { ma: 'rongCuon', kiemTra: laRongCuon },
  { ma: 'sanhRong', kiemTra: laSanhRong },
  { ma: 'namDoiMotSam', kiemTra: laNamDoiMotSam },
  { ma: 'lucPheBon', kiemTra: laLucPheBon },
  { ma: 'namDoiThong', kiemTra: laNamDoiThong },
  { ma: 'baThung', kiemTra: coBaThung },
  { ma: 'baSanh', kiemTra: coBaSanh },
];

// Trả về mã loại thắng trắng (vd 'sanhRong'), hoặc null nếu không có
export function kiemTraThangTrang(ca13La) {
  for (const { ma, kiemTra } of THU_TU_UU_TIEN_THANG_TRANG) {
    if (kiemTra(ca13La)) return ma;
  }
  return null;
}
```

**Giải thích `THU_TU_UU_TIEN_THANG_TRANG` + `kiemTraThangTrang`:** thay
vì gọi rời rạc 7 hàm ở nơi khác trong code, gom chúng vào 1 MẢNG có thứ
tự (đúng thứ tự 1→7 trong bảng tóm tắt) — mỗi phần tử là 1 cặp "mã loại"
+ "hàm kiểm tra". `kiemTraThangTrang` duyệt qua mảng này THEO ĐÚNG THỨ
TỰ, hễ hàm nào trả về `true` là dừng lại NGAY (`return ma`), không kiểm
tra tiếp các loại còn lại — đây chính là cách xử lý "nếu 1 bộ bài vô tình
khớp nhiều loại cùng lúc, tính theo loại đứng trước trong danh sách".

```js
// Điểm 1 người nhận được từ MỖI đối thủ nếu thắng trắng bằng loại "loai"
function diemThangTrangMotNguoi(ruleset, loai) {
  if (ruleset.thangTrang.dungMucSapLang) {
    const co3Chi = ruleset.pointsPerChi.dau + ruleset.pointsPerChi.giua + ruleset.pointsPerChi.cuoi;
    const heSoSap = ruleset.sapBonus.enabled ? ruleset.sapBonus.multiplier : 1;
    const heSoSapLang = ruleset.sapLangBonus?.enabled === false ? 1 : (ruleset.sapLangBonus?.multiplier ?? 2);
    return co3Chi * heSoSap * heSoSapLang;
  }
  return ruleset.thangTrang.diem[loai];
}
```

**Giải thích `diemThangTrangMotNguoi`:** đây là nơi hiện thực hóa tùy
chọn "tính theo mức cố định hay theo mức Ăn sập làng" mà Huy yêu cầu. Nếu
bật `dungMucSapLang`, công thức KHÔNG quan tâm loại thắng trắng cụ thể là
gì — chỉ tính `(điểm gốc 3 chi cộng lại) × hệ số ăn sập × hệ số sập làng`
(coi như thắng trắng tương đương "ăn sập làng" ở mức cơ bản nhất). Nếu
tắt, tra thẳng bảng `ruleset.thangTrang.diem[loai]` đã cấu hình sẵn.

```js
// Tính điểm thắng trắng cho cả ván. nguoiChoi = [{ ten, ca13La }] — dùng
// 13 lá GỐC (chưa xếp 3 chi). Trả về null nếu KHÔNG AI thắng trắng (để
// App.jsx biết cần chuyển qua luồng xếp bài bình thường); trả về
// { diem, dienGiaiTheoDoiThu, ketQuaLoai } nếu có ít nhất 1 người thắng
// trắng — cùng dạng dữ liệu với tinhDiem() thường để tái dùng UI hiển thị
// kết quả đã có.
export function tinhDiemThangTrang(nguoiChoi, ruleset) {
  if (!ruleset.thangTrang || ruleset.thangTrang.enabled === false) return null;
  const ketQuaLoai = nguoiChoi.map(p => kiemTraThangTrang(p.ca13La));
  const coAiThangTrang = ketQuaLoai.some(l => l !== null);
  if (!coAiThangTrang) return null;

  const diem = {};
  const dienGiaiTheoDoiThu = {};
  nguoiChoi.forEach(p => { diem[p.ten] = 0; dienGiaiTheoDoiThu[p.ten] = []; });

  for (let i = 0; i < nguoiChoi.length; i++) {
    for (let j = i + 1; j < nguoiChoi.length; j++) {
      const loaiI = ketQuaLoai[i], loaiJ = ketQuaLoai[j];
      if (!loaiI && !loaiJ) continue; // cả 2 đều không thắng trắng -> cặp này để luồng bình thường xử lý (không xảy ra thực tế vì nếu có 1 ai thắng trắng thì CẢ VÁN chuyển hẳn sang chế độ thắng trắng — xem Phase 3)

      let dA = 0;
      const dg = [];
      if (loaiI) {
        const v = diemThangTrangMotNguoi(ruleset, loaiI);
        dA += v;
        dg.push(`${nguoiChoi[i].ten} thắng trắng bằng "${TEN_THANG_TRANG[loaiI]}" → +${v}`);
      }
      if (loaiJ) {
        const v = diemThangTrangMotNguoi(ruleset, loaiJ);
        dA -= v;
        dg.push(`${nguoiChoi[j].ten} thắng trắng bằng "${TEN_THANG_TRANG[loaiJ]}" → +${v} cho ${nguoiChoi[j].ten}`);
      }
      diem[nguoiChoi[i].ten] += dA;
      diem[nguoiChoi[j].ten] -= dA;
      dienGiaiTheoDoiThu[nguoiChoi[i].ten].push({ doiThu: nguoiChoi[j].ten, dienGiai: dg, diemNhanDuoc: dA });
      dienGiaiTheoDoiThu[nguoiChoi[j].ten].push({ doiThu: nguoiChoi[i].ten, dienGiai: dg, diemNhanDuoc: -dA });
    }
  }

  return { diem, dienGiaiTheoDoiThu, ketQuaLoai };
}
```

**Giải thích `tinhDiemThangTrang`:**
- Hàm CHỦ ĐỘNG trả về `null` sớm ở 2 chỗ: nếu tính năng bị tắt trong luật
  (`enabled === false`), hoặc nếu kiểm tra hết cả 4 người mà không ai
  thắng trắng (`coAiThangTrang` là `false`). Giá trị `null` này chính là
  "tín hiệu" để `App.jsx` (Phase 3) biết cần chuyển qua luồng xếp bài
  bình thường như từ trước tới giờ.
- Duyệt qua TỪNG CẶP người chơi (giống hệt kỹ thuật đã dùng ở `tinhDiem`
  bình thường từ V3 — vòng lặp `i`, `j` với `j` bắt đầu từ `i+1`, không
  lặp lại cặp nào 2 lần). Với mỗi cặp: nếu người `i` thắng trắng, họ được
  CỘNG đúng mức của họ (`dA += v`); nếu người `j` cũng thắng trắng (trường
  hợp hiếm 2 người cùng lúc), người `i` bị TRỪ đúng mức của người `j`
  (`dA -= v`) — 2 lệnh cộng/trừ này áp dụng ĐỘC LẬP, nên nếu chỉ 1 trong 2
  người thắng trắng, chỉ có 1 trong 2 lệnh chạy; nếu CẢ 2 cùng thắng
  trắng, cả 2 lệnh đều chạy, kết quả tự động là HIỆU của 2 mức điểm — đây
  chính là cách xử lý "trừ qua trừ lại theo đúng mức của mỗi bên" mà Huy
  yêu cầu, không cần viết riêng 1 nhánh `if` xử lý trường hợp "cả 2 cùng
  thắng trắng".
- `dienGiaiTheoDoiThu` được gom theo đúng cấu trúc đã dùng ở tính năng
  giải trình từ V3 (`{ doiThu, dienGiai: [...], diemNhanDuoc }`) — để màn
  hình kết quả (Phase 3) có thể TÁI SỬ DỤNG nguyên UI hiển thị giải trình
  đã có, không cần viết UI mới riêng cho trường hợp thắng trắng.

### Kiểm tra Phase 1

Mở Console (hoặc chạy thử trong Node.js nếu quen), thử với 1 bộ bài tự
tạo, ví dụ:
```js
// Giả lập 1 bộ 13 lá cùng chất 0 (Rồng cuốn)
const bai = [];
for (let r = 2; r <= 14; r++) bai.push({ rank: r, suit: 0 });
console.log(kiemTraThangTrang(bai)); // phải in ra 'rongCuon'
```
Thử thêm với 1 bộ bài "bình thường" (không đặc biệt) — phải in ra `null`.

**Bạn học được gì ở Phase 1:** đây là ví dụ rõ ràng của việc **tách 2 loại
bài toán khác nhau** trong cùng 1 nhóm chức năng — 5 loại đầu (Rồng cuốn,
Sảnh rồng, Năm đôi 1 sám, Lục phé bôn, Năm đôi thông) chỉ cần ĐẾM VÀ SO
SÁNH (không cần "tìm kiếm" gì cả, biết ngay đúng/sai chỉ bằng vài phép
đếm); 2 loại cuối (Ba thùng, Ba sảnh) cần THUẬT TOÁN TÌM KIẾM (duyệt hết
các khả năng chia bài có thể, xem có ít nhất 1 cách thỏa mãn hay không).
Khi 1 bài toán không thể trả lời được chỉ bằng đếm/so sánh đơn thuần —
đó là dấu hiệu cần chuyển sang tư duy "duyệt hết các khả năng" (thường
gọi là brute-force hoặc tìm kiếm vét cạn), miễn là số khả năng đủ nhỏ để
máy tính duyệt nhanh (ở đây tối đa 1.100 tổ hợp, chưa tới 1 mili-giây).

Dừng lại ở đây. Xác nhận Console in đúng kết quả trước khi báo cáo và
sang Phase 2.

---

## Phase 2 — Cấu hình thắng trắng trong `src/ruleset.js`

Mục tiêu: 2 preset "Tối giản" và "Chuẩn" có đủ cấu hình cho thắng trắng.

### Bước 1 — Thêm field `thangTrang` vào preset "toi_gian"

```js
thangTrang: {
  enabled: false, // Tối giản: tắt hẳn thắng trắng
  dungMucSapLang: false,
  diem: { rongCuon: 24, sanhRong: 12, namDoiMotSam: 6, lucPheBon: 6, namDoiThong: 6, baThung: 6, baSanh: 6 },
},
```

### Bước 2 — Thêm field `thangTrang` vào preset "chuan"

```js
thangTrang: {
  enabled: true,
  dungMucSapLang: false, // false = dùng đúng mức "diem" bên dưới; true = tính như ăn sập làng
  diem: {
    rongCuon: 24, sanhRong: 12, namDoiMotSam: 6,
    lucPheBon: 6, namDoiThong: 6, baThung: 6, baSanh: 6,
  },
},
```

**Giải thích:** giống cách đã làm với mọi tính năng khác từ V3 (chi Á,
sập làng, Sảnh Hạ...) — bản "Tối giản" luôn TẮT tính năng mới để giữ đúng
tinh thần "không thưởng gì đặc biệt", còn bản "Chuẩn" bật sẵn với đúng
bảng điểm đã thống nhất. `diem` vẫn khai báo đầy đủ 7 giá trị ở CẢ 2
preset (kể cả khi `enabled: false`) — để nếu Huy bật lại thắng trắng cho
bản Tối giản qua tab Luật chơi, đã có sẵn số hợp lý thay vì phải nhập lại
từ đầu.

### Kiểm tra Phase 2

Mở Console:
```js
import { layRulesetTuPreset } from './ruleset.js'
console.log(layRulesetTuPreset('chuan').thangTrang);
```
Phải thấy đúng object với `enabled: true` và đủ 7 giá trị trong `diem`.

**Bạn học được gì ở Phase 2:** đây là ví dụ về việc thêm 1 tính năng mới
vào hệ thống ruleset đã có sẵn — chỉ cần thêm ĐÚNG 1 field mới vào cả 2
preset, không cần sửa gì ở cấu trúc chung (`RULESET_PRESETS`,
`layRulesetTuPreset`, `isValidRuleset`...) vì những hàm đó đã được thiết
kế đủ tổng quát từ V3 để "không quan tâm bên trong ruleset có field gì,
chỉ cần đó là 1 object hợp lệ".

Dừng lại ở đây. Xác nhận Console in đúng trước khi báo cáo và sang
Phase 3.

---

## Phase 3 — Tích hợp vào luồng chơi (`src/App.jsx`)

Mục tiêu: ngay khi chia bài xong, nếu có ai thắng trắng, bỏ qua thẳng
màn hình xếp bài, hiện kết quả kèm banner thông báo.

### Bước 1 — Thêm import

```jsx
import { chiaBai, xepBaiHopLe, tinhDiem, tinhDiemThangTrang, sapXepDeHienThi } from './cardEngine.js'
```

### Bước 2 — Kiểm tra thắng trắng ngay sau khi chia bài

Thêm ngay SAU dòng `const [tatCaBai] = useState(() => chiaBai());`
(trước mọi state khác liên quan tới xếp bài):

```jsx
// Kiểm tra thắng trắng NGAY SAU khi chia bài, chỉ tính 1 lần duy nhất khi
// vào ván (dùng useState + hàm khởi tạo, không phải useEffect, để có kết
// quả NGAY LẦN VẼ ĐẦU TIÊN — tránh việc màn hình xếp bài kịp hiện ra rồi
// mới biến mất nếu dùng useEffect).
const [ketQuaThangTrang] = useState(() => {
  const nguoiChoiThangTrang = [
    { ten: 'Bạn', ca13La: tatCaBai[0] },
    { ten: 'Đối thủ 1', ca13La: tatCaBai[1] },
    { ten: 'Đối thủ 2', ca13La: tatCaBai[2] },
    { ten: 'Đối thủ 3', ca13La: tatCaBai[3] },
  ];
  return tinhDiemThangTrang(nguoiChoiThangTrang, ruleset);
});
```

**Giải thích:** đây là điểm mấu chốt khiến cả tính năng hoạt động đúng —
dùng `useState(() => ...)` (hàm khởi tạo) thay vì `useEffect`. Nếu dùng
`useEffect`, React sẽ VẼ MÀN HÌNH TRƯỚC (hiện màn hình xếp bài như bình
thường), rồi MỚI chạy `useEffect` sau đó — người chơi sẽ thấy màn hình
xếp bài chớp lên 1 chút rồi mới biến mất nếu có thắng trắng, gây giật
hình khó chịu. Dùng `useState(() => ...)` đảm bảo giá trị đã có SẴN ngay
từ lần vẽ đầu tiên, không có khoảnh khắc "vẽ sai rồi sửa lại".

> **Lưu ý về thứ tự khai báo:** `ruleset` (lấy từ `trangThaiLuat`) phải
> được khai báo TRƯỚC dòng này. Nếu trong file hiện tại thứ tự các
> `useState` không như vậy, di chuyển khối đọc `trangThaiLuat` lên trước
> khối này.

### Bước 3 — Khởi tạo sẵn `daXacNhan`/`ketQuaDiem` theo kết quả thắng trắng

Sửa 2 dòng `useState` sau — thay vì bắt đầu từ `false`/`null` như trước,
giờ khởi tạo LUÔN SẴN theo `ketQuaThangTrang`:

```jsx
const [daXacNhan, setDaXacNhan] = useState(() => ketQuaThangTrang !== null);
const [ketQuaDiem, setKetQuaDiem] = useState(() => ketQuaThangTrang);
```

**Giải thích:** đây là "cú hích" khiến toàn bộ giao diện TỰ ĐỘNG bỏ qua
màn hình xếp bài mà không cần sửa gì thêm. Nhánh JSX
`{!daXacNhan ? (màn hình xếp bài) : (màn hình kết quả)}` đã tồn tại sẵn
từ V2 — nó chỉ quan tâm `daXacNhan` là `true` hay `false`, không quan tâm
`true` đó tới từ đâu (từ việc người chơi bấm "Xác nhận bài" như bình
thường, hay từ việc vừa phát hiện thắng trắng ngay lúc mở app). Đây là ví
dụ về lợi ích của việc thiết kế UI theo state — thêm 1 "con đường" mới
dẫn tới cùng 1 trạng thái có sẵn, thay vì phải thêm hẳn 1 nhánh hiển thị
mới.

### Bước 4 — Thêm banner thông báo thắng trắng

Thêm hằng số tên hiển thị (đặt ở đầu file, ngoài component, cạnh
`BAT_DAU`):
```jsx
const TEN_THANG_TRANG_HIEN_THI = {
  rongCuon: 'Rồng cuốn', sanhRong: 'Sảnh rồng', namDoiMotSam: 'Năm đôi 1 sám',
  lucPheBon: 'Lục phé bôn', namDoiThong: 'Năm đôi thông', baThung: 'Ba thùng', baSanh: 'Ba sảnh',
};
```

Trong khối hiển thị "Kết quả" (đã có từ V3), thêm banner này ngay TRƯỚC
dòng `<h2>Kết quả</h2>` (bên trong khối `{daXacNhan && ketQuaDiem && (...)}`):

```jsx
{ketQuaThangTrang && (
  <div className="banner-thang-trang">
    🎉 Ù ngay! {ketQuaThangTrang.ketQuaLoai
      .map((loai, i) => loai ? `${['Bạn','Đối thủ 1','Đối thủ 2','Đối thủ 3'][i]}: ${TEN_THANG_TRANG_HIEN_THI[loai]}` : null)
      .filter(Boolean)
      .join(' — ')}
  </div>
)}
```

**Giải thích:** `ketQuaThangTrang.ketQuaLoai` là 1 mảng 4 phần tử (đúng
thứ tự Bạn/Đối thủ 1/2/3), mỗi phần tử là mã loại thắng trắng của người
đó (hoặc `null` nếu người đó không thắng trắng). Đoạn
`.map(...).filter(Boolean)` biến mảng 4 phần tử (có thể có `null` xen
kẽ) thành DANH SÁCH CHỈ CÒN những dòng text có nội dung thật (loại bỏ
hết `null`) — `filter(Boolean)` là 1 mẹo ngắn gọn quen thuộc trong
JavaScript để lọc bỏ mọi giá trị "falsy" (`null`, `undefined`, `''`,
`0`...) ra khỏi mảng.

Toàn bộ phần còn lại của `App.jsx` (màn hình xếp bài, nút "Xác nhận bài",
`xacNhanBai()`...) **giữ nguyên không đổi**.

### Kiểm tra Phase 3

1. Tạm sửa `chiaBai()` trả về 1 bộ bài cố định có thắng trắng (để test dễ
   dàng, xóa lại sau khi test xong) — mở app, phải bỏ qua thẳng màn hình
   xếp bài, hiện ngay banner vàng ghi rõ ai thắng trắng bằng loại gì.
2. Trả `chiaBai()` về bình thường — app chơi như cũ, không còn banner.

**Bạn học được gì ở Phase 3:** phần quan trọng nhất của Phase này là hiểu
được SỰ KHÁC NHAU giữa `useState(() => ...)` và `useEffect` khi cần 1 giá
trị SẴN CÓ ngay từ lần vẽ đầu tiên — đây là 1 lỗi rất dễ mắc phải khi mới
học React (dùng `useEffect` cho mọi việc "cần tính toán lúc mount"), trong
khi nhiều trường hợp `useState` với hàm khởi tạo mới là lựa chọn đúng.

Dừng lại ở đây. Xác nhận cả 2 điều trên đúng trước khi báo cáo và sang
Phase 4.

---

## Phase 4 — Sắp xếp lại tab Luật chơi (`src/LuatChoi.jsx`)

Mục tiêu: thêm khối cấu hình thắng trắng vào tab Luật chơi, đúng vị trí
Huy yêu cầu — VÀ đổi vị trí khối "Bonus Chi Đầu" đang có từ trước.

### Bước 1 — Thêm hằng số tên hiển thị

Đặt cạnh `TEN_LOAI_3_LA`, `TEN_LOAI_5_LA` ở đầu file:

```jsx
const TEN_THANG_TRANG = [
  { ma: 'rongCuon', ten: 'Rồng cuốn (13 lá cùng chất)' },
  { ma: 'sanhRong', ten: 'Sảnh rồng (đủ 13 rank, khác chất)' },
  { ma: 'namDoiMotSam', ten: 'Năm đôi 1 sám' },
  { ma: 'lucPheBon', ten: 'Lục phé bôn (6 đôi)' },
  { ma: 'namDoiThong', ten: 'Năm đôi thông' },
  { ma: 'baThung', ten: 'Ba thùng' },
  { ma: 'baSanh', ten: 'Ba sảnh' },
];
```

### Bước 2 — Sắp lại thứ tự các khối trong JSX trả về

Thứ tự MỚI (so với V3, chỉ đổi vị trí khối "Bonus Chi Đầu" + thêm khối
mới, còn lại giữ nguyên):

```
1. Chọn bộ luật có sẵn        (giữ nguyên vị trí)
2. Điểm gốc mỗi chi thắng/thua (giữ nguyên vị trí)
3. Các trường hợp thắng trắng  <-- MỚI, chèn ở đây
4. Bonus — Chi Cuối            (giữ nguyên vị trí)
5. Chi Giữa (tự động = 2x Cuối) (giữ nguyên vị trí)
6. Bonus — Chi Đầu             <-- CHUYỂN XUỐNG ĐÂY (trước đây đứng ngay sau "Điểm gốc")
7. Ăn sập / Sập làng / Binh lủng / Sảnh Hạ / Chi Á / Reset (giữ nguyên)
```

**Giải thích lý do đổi thứ tự:** khối "Bonus Chi Cuối" và "Chi Giữa (tự
động)" LUÔN đi liền nhau về mặt ý nghĩa (Chi Giữa = 2× Chi Cuối, người
đọc cần thấy 2 khối này sát nhau để hiểu mối liên hệ) — nếu chen khối
"Bonus Chi Đầu" vào giữa như cũ, mạch đọc bị ngắt quãng. Đưa "Bonus Chi
Đầu" xuống sau cùng 2 khối liên quan tới nhau đó giúp mạch đọc liền mạch
hơn: Điểm gốc → Thắng trắng (áp dụng cho toàn bộ 13 lá, đọc trước khi
đi vào chi tiết từng chi) → Chi Cuối + Chi Giữa (đi cùng nhau) → Chi Đầu
(còn lại) → các luật phụ khác.

Thêm khối MỚI (thắng trắng), đặt ngay sau khối "Điểm gốc mỗi chi":

```jsx
<div className="khoi-luat">
  <div className="khoi-luat-tieu-de">Các trường hợp thắng trắng</div>
  <label className="dong-checkbox">
    <input
      type="checkbox"
      checked={ruleset.thangTrang?.enabled !== false}
      onChange={e => suaRuleset(r => {
        if (!r.thangTrang) r.thangTrang = { enabled: true, dungMucSapLang: false, diem: {} };
        r.thangTrang.enabled = e.target.checked;
      })}
    />
    Bật luật thắng trắng (Ù ngay, không cần so từng chi)
  </label>
  <label className="dong-checkbox">
    <input
      type="checkbox"
      checked={!!ruleset.thangTrang?.dungMucSapLang}
      onChange={e => suaRuleset(r => { r.thangTrang.dungMucSapLang = e.target.checked; })}
    />
    Tính theo mức Ăn sập làng (thay vì dùng bảng điểm cố định bên dưới)
  </label>
  <div className="bang-bonus">
    {TEN_THANG_TRANG.map(({ ma, ten }) => (
      <div key={ma} className="dong-bonus">
        <span>{ten}</span>
        <input
          type="number"
          value={ruleset.thangTrang?.diem?.[ma] ?? 0}
          disabled={!!ruleset.thangTrang?.dungMucSapLang}
          onChange={e => suaRuleset(r => {
            if (!r.thangTrang.diem) r.thangTrang.diem = {};
            r.thangTrang.diem[ma] = Number(e.target.value) || 0;
          })}
        />
      </div>
    ))}
  </div>
</div>
```

**Giải thích:** cấu trúc y hệt các khối bật/tắt + bảng số đã làm nhiều
lần từ V3 (`Ăn sập`, `Sập làng`, `Sảnh Hạ`...) — điểm đáng chú ý duy nhất
là `disabled={!!ruleset.thangTrang?.dungMucSapLang}` ở mỗi ô nhập điểm:
khi bật "Tính theo mức Ăn sập làng", các ô nhập điểm cố định bị VÔ HIỆU
HÓA (mờ đi, không sửa được) — vì lúc đó điểm không còn được lấy từ bảng
này nữa (tính theo công thức khác, xem lại `diemThangTrangMotNguoi` ở
Phase 1), sửa số ở đây cũng không có tác dụng gì, nên khóa lại để tránh
Huy tưởng nhầm là đang chỉnh được.

Toàn bộ khung sườn JSX sau khi sắp xếp lại:

```jsx
return (
  <div className="trang-luat-choi">
    {/* 1. Chọn bộ luật có sẵn — giữ nguyên y hệt, không đổi gì */}
    <div className="khoi-luat">{/* ... nội dung cũ ... */}</div>

    {/* 2. Điểm gốc mỗi chi thắng/thua — giữ nguyên y hệt */}
    <div className="khoi-luat">{/* ... nội dung cũ ... */}</div>

    {/* 3. MỚI — Các trường hợp thắng trắng (đã viết ở trên) */}
    <div className="khoi-luat">{/* ... */}</div>

    {/* 4. Bonus — Chi Cuối — giữ nguyên y hệt */}
    {veBangBonus('cuoi', 'Chi Cuối (5 lá) — nguồn gốc để tính Chi Giữa', TEN_LOAI_5_LA, [
      { ma: '7_A', ten: 'Tứ quý A (AAAA)' },
      { ma: '8_thuong', ten: 'Thùng phá sảnh Thượng (10-J-Q-K-A)' },
      { ma: '8_ha', ten: 'Thùng phá sảnh Hạ (A-2-3-4-5)' },
    ])}

    {/* 5. Chi Giữa (tự động) — giữ nguyên y hệt */}
    <div className="khoi-luat">{/* ... nội dung cũ ... */}</div>

    {/* 6. CHUYỂN XUỐNG ĐÂY — Bonus Chi Đầu */}
    {veBangBonus('dau', 'Chi Đầu (3 lá)', TEN_LOAI_3_LA, [
      { ma: '2_A', ten: 'Sám cô A (AAA)' },
    ])}

    {/* 7. Ăn sập / Sập làng / Binh lủng / Sảnh Hạ / Chi Á / nút Reset — giữ nguyên, đúng thứ tự cũ */}
  </div>
);
```

(Nội dung CHI TIẾT bên trong mỗi khối "giữ nguyên y hệt" chính là những
gì đã có trong V3_GUIDE.md — chỉ ĐỔI VỊ TRÍ trong JSX, không đổi nội
dung bên trong.)

### Kiểm tra Phase 4

1. Tab Luật chơi: đúng thứ tự mới — "Các trường hợp thắng trắng" nằm
   ngay sau "Điểm gốc mỗi chi", "Bonus Chi Đầu" nằm SAU khối "Chi Giữa
   tự động" (không còn đứng ngay sau "Điểm gốc" như trước).
2. Tắt "Bật luật thắng trắng" — chơi thử (dùng lại bộ bài cố định đã sửa
   tạm ở Phase 3) — không còn bị Ù ngay nữa, vào bình thường màn xếp bài.
3. Bật lại, bật thêm "Tính theo mức Ăn sập làng" — 7 ô nhập điểm cố định
   bị mờ đi (disabled), không sửa được nữa.

**Bạn học được gì ở Phase 4:** đây là ví dụ rằng SẮP XẾP LẠI GIAO DIỆN
(đổi thứ tự các khối) không nhất thiết đụng vào phần logic bên trong mỗi
khối — chỉ cần đổi VỊ TRÍ các khối JSX trong hàm `return`, còn hàm
`veBangBonus`, `suaRuleset` và mọi logic xử lý khác giữ nguyên 100%. Tách
biệt "logic xử lý dữ liệu" khỏi "thứ tự trình bày" giúp việc sắp xếp lại
giao diện luôn an toàn, ít rủi ro gây lỗi.

Dừng lại ở đây. Xác nhận cả 3 điều trên đúng trước khi báo cáo và sang
Phase 5.

---

## Phase 5 — CSS cho banner thắng trắng

Mục tiêu: banner "🎉 Ù ngay!" hiện nổi bật, dễ nhìn.

### Bước 1 — Thêm CSS

Thêm vào cuối `src/App.css`:

```css
.banner-thang-trang {
  background: linear-gradient(135deg, #d4a017, #f0c040);
  color: #1a2010;
  font-weight: bold;
  text-align: center;
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 12px;
  font-size: 14px;
}
```

**Giải thích:** dùng lại đúng bảng màu vàng-nâu (`#d4a017`, `#f0c040`)
đã dùng xuyên suốt app từ V3 (nút preset đang chọn, tiêu đề các khối luật)
để banner thắng trắng trông NHẤT QUÁN với phong cách chung, không bị lạc
tông màu — 1 nguyên tắc nhỏ nhưng quan trọng khi thêm giao diện mới vào 1
app đã có phong cách riêng.

### Kiểm tra Phase 5

Banner hiện đúng màu vàng nổi bật, chữ đen dễ đọc, không bị lệch layout
so với phần còn lại của màn hình kết quả.

---

## Bảng xác suất tham khảo (đã tính, không cần code gì thêm)

| Loại | Xác suất | Chi thưởng |
|---|---|---|
| Rồng cuốn | ~1/158.753.389.900 (chính xác) | 24 |
| Sảnh rồng | ~1/9.462 (chính xác) | 12 |
| Năm đôi 1 sám | ~1/1.983 (chính xác) | 6 |
| Lục phé bôn | ~1/283 (chính xác) | 6 |
| Năm đôi thông | ~1/1.344 (mô phỏng) | 6 |
| Ba thùng | ~1/112 (mô phỏng) | 6 |
| Ba sảnh | ~1/503 (mô phỏng) | 6 |

## Sau khi xong V4 — kiểm tra lại với Huy

1. Toàn bộ 5 Phase chạy đúng, không lỗi Console.
2. App vẫn chơi bình thường khi không ai thắng trắng (tỷ lệ áp đảo, đúng
   theo bảng xác suất trên — đừng ngạc nhiên nếu chơi hàng trăm ván không
   thấy thắng trắng lần nào, vì đúng là hiếm).
3. Xóa hẳn đoạn sửa tạm `chiaBai()` dùng để test (nếu còn sót) — xác nhận
   app chia bài ngẫu nhiên thật trở lại.
4. Có muốn sang V5 (đã có: trang chủ, điều hướng, lưu/tiếp tục ván) hay
   muốn tinh chỉnh thêm V4 trước?
