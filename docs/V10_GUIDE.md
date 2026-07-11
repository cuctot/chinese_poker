# V10_GUIDE.md — Dọn dẹp giao diện: Chơi với AI, Lịch sử, Luật chơi

> **Dành cho ai đọc file này:**
> - Nếu bạn là **Claude Code**: làm theo ĐÚNG THỨ TỰ 3 Phase bên dưới.
>   MỖI Phase xong phải DỪNG LẠI, báo cáo đã làm gì, để Huy tự kiểm tra
>   trước khi sang Phase tiếp theo. Đây là bản dọn dẹp UI — nếu tên hàm/
>   biến/class cụ thể trong hướng dẫn không khớp 100% với code thật hiện
>   tại (có thể đã đổi qua nhiều lần sửa lỗi ở V9), hãy áp dụng ĐÚNG Ý ĐỒ
>   mô tả vào code thật, không copy máy móc nếu tên không khớp.
> - Nếu bạn là **Huy**: đọc phần "Giải thích" sau mỗi khối.

## Phạm vi V10 — dọn dẹp, không đổi luật/thuật toán

1. **Chơi với AI**: bỏ dấu "?" lưng bài chưa mở; nút "Chấp nhận gợi ý";
   tính thêm điểm bài gợi ý để so sánh khi xác nhận; banner "Hết hiệp" to
   hơn.
2. **Lịch sử**: đổi tên tab "Bài thật" → "Ghi điểm"; phân trang 10 hiệp/
   trang (mới nhất trên, nút << >> lật trang); sửa lỗi hiện `NaN:NaN
   NaN/NaN`; định dạng dòng Ván rõ ràng hơn (Ván/Hiệp/giờ/ngày).
3. **Luật chơi**: mỗi thông số 1 dòng, nhãn trái/số phải; ẩn các loại bài
   không có bonus (Mậu thầu→Sảnh, Thùng) khỏi bảng Chi Cuối; bỏ chữ
   nghiêng (italic) ở tên loại đặc biệt; thêm bonus Cù lũ = 2.

---

## Phase 1 — Chơi với AI

### 1a. Bỏ dấu "?" trên lưng bài chưa mở

Tìm trong `TheBaiDon.jsx` (hoặc file liên quan tới hiển thị mặt sau lá
bài) đoạn đang in ký tự `"?"` làm nội dung lưng bài — xóa hẳn ký tự đó,
chỉ giữ lại nền màu trơn (không chữ) cho lưng bài. Nếu không tìm thấy chỗ
nào hiện dấu "?" (có thể đã được dọn ở lần sửa lỗi trước), bỏ qua mục
này, không cần thêm gì.

### 1b. Nút "Chấp nhận gợi ý"

Sau khi bấm "Gợi ý" (đã có từ V9, kết quả lưu ở `ketQuaGoiY`), thêm 1 nút
để ÁP DỤNG THẲNG cách xếp gợi ý vào bài đang xếp — thay vì Huy phải tự
kéo-thả lại từng lá theo đúng gợi ý:

```jsx
function chapNhanGoiY() {
  if (!ketQuaGoiY) return;
  // Ghép 3 chi gợi ý lại thành đúng thứ tự mảng phẳng oCacChi đang dùng
  // (0-2 = Đầu, 3-7 = Giữa, 8-12 = Cuối) — thay thế TOÀN BỘ vị trí hiện
  // tại bằng đúng cách xếp gợi ý.
  setOCacChi([...ketQuaGoiY.chiDau, ...ketQuaGoiY.chiGiua, ...ketQuaGoiY.chiCuoi]);
}
```

Thêm nút vào ngay dưới khối hiển thị kết quả gợi ý:
```jsx
{ketQuaGoiY && (
  <div className="khoi-luat">
    <div className="khoi-luat-tieu-de">
      Gợi ý (tỷ lệ thắng ước tính: {(ketQuaGoiY.tyLeThang * 100).toFixed(0)}%)
    </div>
    <HangBai danhSachLa={ketQuaGoiY.chiDau} />
    <HangBai danhSachLa={ketQuaGoiY.chiGiua} />
    <HangBai danhSachLa={ketQuaGoiY.chiCuoi} />
    <button className="nut-choi" onClick={chapNhanGoiY} style={{ marginTop: 8 }}>
      Chấp nhận gợi ý
    </button>
  </div>
)}
```

**Giải thích:** vì `oCacChi` (mảng 13 lá theo đúng vị trí đang xếp) và
`ketQuaGoiY.{chiDau,chiGiua,chiCuoi}` đều dùng CHUNG kiểu dữ liệu lá bài
(`{rank, suit}`), việc "chấp nhận gợi ý" chỉ đơn giản là NỐI 3 mảng đó
lại đúng thứ tự rồi gán thẳng vào state đang xếp — không cần thuật toán
gì thêm, tái dùng đúng cấu trúc dữ liệu đã có.

### 1c. Tính điểm bài gợi ý để so sánh lúc xác nhận

Mục tiêu: sau khi bấm "Xác nhận bài", NGOÀI kết quả chính thức, còn hiện
thêm "nếu dùng đúng gợi ý thì được bao nhiêu điểm" — để Huy so sánh xem
gợi ý có thực sự tốt hơn cách tự xếp hay không.

Thêm state lưu LẠI gợi ý gần nhất TRƯỚC khi xác nhận (vì `ketQuaGoiY` có
thể bị xóa/đổi sau đó):
```jsx
const [goiYLucXacNhan, setGoiYLucXacNhan] = useState(null);
```

Trong `xacNhanBai()`, ngay ĐẦU hàm (trước khi tính điểm thật), chụp lại
gợi ý hiện có (nếu có) và tính thử điểm với gợi ý đó THAY THẾ bài của
Bạn, giữ nguyên bài 3 đối thủ:
```jsx
function xacNhanBai() {
  if (ketQuaGoiY) {
    const nguoiChoiVoiGoiY = [
      { ten: 'Bạn', chiDau: ketQuaGoiY.chiDau, chiGiua: ketQuaGoiY.chiGiua, chiCuoi: ketQuaGoiY.chiCuoi },
      { ten: tenDoiThu[0], ...baiDoiThu[0] },
      { ten: tenDoiThu[1], ...baiDoiThu[1] },
      { ten: tenDoiThu[2], ...baiDoiThu[2] },
    ];
    setGoiYLucXacNhan({
      diem: tinhDiem(nguoiChoiVoiGoiY, ruleset).diem['Bạn'],
      tyLeThang: ketQuaGoiY.tyLeThang,
    });
  } else {
    setGoiYLucXacNhan(null);
  }

  // ... phần còn lại của xacNhanBai() giữ nguyên y hệt (tính điểm THẬT,
  // ghi log, v.v.) ...
}
```

Hiện so sánh ở khối kết quả:
```jsx
{goiYLucXacNhan && (
  <p className="ghi-chu-luat">
    Nếu dùng gợi ý: {goiYLucXacNhan.diem > 0 ? '+' : ''}{goiYLucXacNhan.diem} điểm
    (so với thực tế {ketQuaDiem.diem['Bạn'] > 0 ? '+' : ''}{ketQuaDiem.diem['Bạn']})
  </p>
)}
```

**Giải thích:** đây là phép so sánh "phản thực" (counterfactual) — tính
thử 1 kịch bản KHÔNG XẢY RA (nếu đã chọn gợi ý) dựa trên đúng bài THẬT
của 3 đối thủ đã cố định — tái dùng đúng `tinhDiem` đã có, chỉ đổi input
là bài của Bạn. Vì tính TRƯỚC khi gọi phần ghi log/thắng trắng chính thức
(không đụng gì tới luồng tính điểm THẬT), việc thêm phép so sánh này
không ảnh hưởng gì tới kết quả ván đang chơi.

### 1d. Banner "Hết hiệp" to hơn

Tìm CSS của khối tổng kết hiệp (tiêu đề "Tổng kết Hiệp X") — tăng cỡ chữ
và độ nổi bật:

```css
.khoi-luat-tieu-de.tieu-de-het-hiep {
  font-size: 20px;
  padding: 8px 0;
  text-align: center;
}
```

Thêm class `tieu-de-het-hiep` vào đúng dòng tiêu đề "Tổng kết Hiệp {X}"
(cả ở `App.jsx` lẫn `GhiDiem.jsx`, vì cả 2 đều có màn tổng kết hiệp
tương tự).

### Kiểm tra Phase 1

1. Không còn dấu "?" nào ở lưng bài (nếu trước đó có).
2. Bấm "Gợi ý" rồi bấm "Chấp nhận gợi ý" — bài đang xếp đổi đúng thành
   cách gợi ý, không cần tự kéo tay.
3. Xác nhận bài sau khi đã xem gợi ý — thấy dòng so sánh "Nếu dùng gợi ý:
   ±X điểm (so với thực tế ±Y)".
4. Xác nhận bài KHÔNG bấm gợi ý trước đó — không hiện dòng so sánh (vì
   không có gì để so).
5. Hết hiệp (đủ 12 ván) — tiêu đề "Tổng kết Hiệp" rõ ràng to hơn hẳn các
   chữ khác trên màn hình.

Dừng lại ở đây. Xác nhận cả 5 điều trên đúng trước khi báo cáo và sang
Phase 2.

---

## Phase 2 — Lịch sử

### 2a. Đổi tên tab "Bài thật" → "Ghi điểm"

Trong `LichSu.jsx`, đổi nhãn nút tab (chỉ đổi CHỮ hiển thị, giữ nguyên
`tabDangXem === 'thatNgoai'` và mọi logic bên trong không đổi gì):
```jsx
<button className={tabDangXem === 'thatNgoai' ? 'nut-tab nut-tab-dang-chon' : 'nut-tab'}
        onClick={() => { setTabDangXem('thatNgoai'); ... }}>Ghi điểm</button>
```

### 2b. Sửa lỗi hiển thị thời gian `NaN:NaN NaN/NaN`

**Nguyên nhân khả dĩ:** hàm định dạng thời gian hiện tại (vd
`dinhDangGioNgay` hoặc tương tự) có thể đang tự tách `getHours()`/
`getMinutes()`/`getDate()`/`getMonth()` từ 1 `Date` KHÔNG HỢP LỆ (tạo từ
`new Date(undefined)` hoặc 1 giá trị timestamp bị thiếu/sai) — các hàm đó
trả về `NaN` khi gọi trên `Date` không hợp lệ, in ra đúng chuỗi lỗi Huy
thấy.

**Sửa:** thêm 1 hàm định dạng thời gian AN TOÀN, dùng THAY THẾ ở MỌI chỗ
đang hiện thời gian trong `LichSu.jsx`:

```jsx
function dinhDangThoiGianAnToan(timestamp) {
  if (!timestamp || Number.isNaN(timestamp)) return '—';
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return '—';
  const gio = String(d.getHours()).padStart(2, '0');
  const phut = String(d.getMinutes()).padStart(2, '0');
  const ngay = String(d.getDate()).padStart(2, '0');
  const thang = String(d.getMonth() + 1).padStart(2, '0');
  return `${gio}:${phut} ${ngay}/${thang}`;
}
```

Tìm mọi chỗ đang tự tính giờ/ngày thủ công (hoặc gọi `toLocaleString`/
`toLocaleTimeString`) để hiện thời gian Hiệp/Ván trong `LichSu.jsx`, thay
bằng gọi hàm này — đảm bảo LUÔN hiện `—` thay vì `NaN` nếu dữ liệu thiếu/
lỗi, thay vì để lộ lỗi ra màn hình.

**Giải thích:** `Number.isNaN(d.getTime())` là cách CHUẨN để kiểm tra 1
`Date` có hợp lệ hay không trong JavaScript (`Date` không hợp lệ luôn có
`getTime()` trả về `NaN`) — kiểm tra TRƯỚC khi tách giờ/phút/ngày/tháng,
tránh việc format tiếp tục chạy trên dữ liệu hỏng rồi in ra `NaN` từng
phần riêng lẻ.

### 2c. Phân trang 10 hiệp/trang, mới nhất lên trên

Thêm state trang hiện tại, áp dụng SAU KHI đã lọc theo tab + sắp xếp mới
nhất lên trên (đã có sẵn từ V8/V9: `.reverse()`):

```jsx
const SO_HIEP_MOI_TRANG = 10;
const [trangHienTai, setTrangHienTai] = useState(0);

const hiepDaSapXep = [...hiepDungTab].sort((a, b) => b.soThuTu - a.soThuTu); // mới nhất trước
const tongSoTrang = Math.max(1, Math.ceil(hiepDaSapXep.length / SO_HIEP_MOI_TRANG));
const hiepTrangHienTai = hiepDaSapXep.slice(
  trangHienTai * SO_HIEP_MOI_TRANG,
  (trangHienTai + 1) * SO_HIEP_MOI_TRANG
);
```

(Đổi tab thì reset về trang đầu — thêm `setTrangHienTai(0)` vào 2 nút
chuyển tab đã có.)

Nhóm bảng theo roster (`nhomHiepThanhBang`, đã có từ V9) CHỈ chạy trên
`hiepTrangHienTai` (không phải toàn bộ `hiepDungTab`):
```jsx
const cacBang = nhomHiepThanhBang(hiepTrangHienTai);
```

Thêm nút lật trang, đặt CUỐI danh sách bảng:
```jsx
<div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 12 }}>
  <button className="nut-choi" disabled={trangHienTai === 0}
          onClick={() => setTrangHienTai(t => t - 1)}>&lt;&lt;</button>
  <span style={{ alignSelf: 'center' }}>Trang {trangHienTai + 1}/{tongSoTrang}</span>
  <button className="nut-choi" disabled={trangHienTai >= tongSoTrang - 1}
          onClick={() => setTrangHienTai(t => t + 1)}>&gt;&gt;</button>
</div>
```

**Giải thích:** phân trang CHỈ áp dụng ở tầng Hiệp (không phải Ván bên
trong) — mỗi trang tối đa 10 Hiệp, có thể thuộc nhiều "bảng" (nhóm theo
roster) khác nhau. Vì `nhomHiepThanhBang` chỉ chạy trên đúng 10 hiệp của
trang hiện tại, 1 nhóm roster dài có thể bị "cắt" giữa 2 trang (1 phần ở
trang này, phần còn lại ở trang sau) — đây là đánh đổi CHẤP NHẬN ĐƯỢC của
việc phân trang, không phải lỗi.

### 2d. Định dạng dòng Ván: "Ván ... Hiệp ... giờ... ngày..."

Sửa dòng hiển thị mỗi Ván (trong bảng con khi mở rộng 1 Hiệp) theo đúng
thứ tự: số Ván (trong hiệp) → số Hiệp (để biết Ván này thuộc Hiệp nào dù
đang xem trong bảng con) → giờ → ngày:

```jsx
<p key={van.id} style={{ fontSize: 13 }}>
  Ván {van.soThuTuTrongHiep} — Hiệp #{hiep.soThuTu} —{' '}
  {dinhDangThoiGianAnToan(van.thoiGian)}
  {' — '}
  {Object.entries(van.diem).map(([t, d]) => `${t} ${d > 0 ? '+' : ''}${d}`).join(', ')}
</p>
```

**Giải thích:** dùng LẠI đúng hàm `dinhDangThoiGianAnToan` (Bước 2b) —
`dinhDangThoiGianAnToan` đã trả về ĐÚNG dạng "giờ:phút ngày/tháng" trong
1 lệnh gọi, không cần tách riêng "giờ..." và "ngày..." thành 2 hàm khác
nhau.

### Kiểm tra Phase 2

1. Tab đổi tên đúng "Ghi điểm" (không còn "Bài thật").
2. Có trên 10 hiệp (bất kỳ nguồn nào) — chỉ hiện 10 hiệp/trang, có nút
   << >>, bấm chuyển trang đúng, disable đúng lúc ở trang đầu/cuối.
3. Không còn thấy `NaN:NaN NaN/NaN` ở bất kỳ đâu trong Lịch sử — kể cả
   với dữ liệu cũ/thiếu (nếu có).
4. Dòng Ván hiện đúng thứ tự "Ván X — Hiệp #Y — giờ:phút ngày/tháng —
   điểm".

Dừng lại ở đây. Xác nhận cả 4 điều trên đúng trước khi báo cáo và sang
Phase 3.

---

## Phase 3 — Luật chơi

### 3a. Mỗi thông số 1 dòng, nhãn trái/số phải — thống nhất toàn trang

Kiểm tra lại TOÀN BỘ các khối trong `LuatChoi.jsx` (Điểm gốc, Bonus Chi
Đầu/Cuối, Ăn sập, Sập làng, Chi Á...) — đảm bảo MỌI dòng có 1 nhãn + 1 ô
nhập đều dùng chung 1 kiểu bố cục:

```css
.dong-thong-so {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.dong-thong-so > span:first-child {
  text-align: left;
}
.dong-thong-so input[type="number"] {
  text-align: right;
}
```

Đổi mọi `<label>`/`<div>` đang bọc 1 dòng "tên thông số + ô nhập" sang
dùng chung class `dong-thong-so` (thay vì mỗi khối tự có class riêng như
`.dong-bonus`, `.dong-diem-goc label`... hiện đang có nhiều kiểu khác
nhau).

**Giải thích:** đây là việc CHUẨN HÓA — không đổi Ý NGHĨA của bất kỳ ô
nào, chỉ gộp nhiều class CSS đang làm việc TƯƠNG TỰ nhau (căn 2 đầu 1
dòng) về DÙNG CHUNG 1 class duy nhất, để mọi dòng thông số trong tab Luật
chơi có hình thức đồng nhất tuyệt đối — không còn t/h lệch canh giữa các
khối.

### 3b. Chi Giữa: bỏ hẳn cơ chế "tự động ×2" — chuyển thành bảng độc lập
giống hệt Chi Đầu/Chi Cuối

**Quan trọng — đơn giản hóa hơn nữa so với bản trước (bỏ luôn ý tưởng
"ngoại lệ chỉ cho Cù lũ"):** thay vì Chi Giữa tự động = 2× Chi Cuối (cơ
chế đã có từ V3), giờ **MỌI** bonus ở Chi Giữa đều là **số tuyệt đối độc
lập**, y hệt cách Chi Đầu/Chi Cuối đã làm — không còn phép nhân đôi nào
cả. Giá trị GỐC của preset "Chuẩn" giữ ĐÚNG BẰNG con số đang hiển thị
hiện tại (tức 2× giá trị Chi Cuối cũ) — chỉ đổi CÁCH LƯU TRỮ (từ "tính
ra" sang "ghi thẳng"), không đổi con số Huy đang thấy.

**Sửa `ruleset.js`** (preset "Chuẩn") — thêm bảng `giua` ĐẦY ĐỦ, seed
đúng bằng giá trị đang hiển thị hiện nay:
```js
bonusTheoLoai: {
  dau: { 2: 3, '2_A': 12 },
  giua: { 6: 2, 7: 8, '7_A': 32, 8: 10, '8_thuong': 20, '8_ha': 14 }, // MỚI — bảng ĐỘC LẬP đầy đủ, giá trị = đúng số đang hiện tại (2x Chi Cuối cũ)
  cuoi: { 7: 4, '7_A': 16, 8: 5, '8_thuong': 10, '8_ha': 7 }, // không đổi
},
```

**Sửa `diemMotChi` (`cardEngine.js`)** — vì Chi Giữa giờ là bảng độc lập
y hệt 2 chi kia, hàm ĐƠN GIẢN HÓA HẲN, không cần nhánh `if` riêng cho
'giua' nữa — đối xứng hoàn toàn cho cả 3 chi:
```js
function diemMotChi(ruleset, tenChi, danhGiaBenThang) {
  const goc = ruleset.pointsPerChi[tenChi];
  const ma = maLoaiChiTiet(danhGiaBenThang, tenChi);
  const bang = ruleset.bonusTheoLoai[tenChi] || {};
  if (Object.prototype.hasOwnProperty.call(bang, ma)) return bang[ma];
  return goc;
}
```

**Giải thích:** đã kiểm thử bằng Node.js — hàm giờ NGẮN HƠN bản trước
(không cần nhánh đặc biệt cho Chi Giữa), vì cả 3 chi giờ hoạt động theo
ĐÚNG 1 QUY TẮC DUY NHẤT: tra bảng riêng của chính chi đó, không có gì
"tự động suy ra" từ chi khác nữa. Đã xác nhận: mọi giá trị Chi Giữa (Cù
lũ=2, Tứ quý=8, Tứ quý A=32, Thượng=20, Hạ=14) khớp ĐÚNG với con số đang
hiển thị hiện tại; sửa Chi Cuối (thử đổi Tứ quý Cuối thành 100) KHÔNG còn
ảnh hưởng gì tới Chi Giữa nữa (vẫn giữ nguyên 8) — 2 chi hoàn toàn độc
lập với nhau từ nay.

### 3c. Sửa `LuatChoi.jsx`: Chi Giữa dùng `veBangBonus` như Chi Đầu/Cuối

Khối "Chi Giữa (tự động)" (chỉ hiển thị `<span>`, không sửa được) —
XÓA HẲN, thay bằng lời gọi `veBangBonus('giua', ...)` giống hệt cách gọi
cho Chi Đầu/Chi Cuối:

```jsx
{veBangBonus('giua', 'Chi Giữa (5 lá)', TEN_LOAI_5_LA.filter((_, loai) => LOAI_CO_THE_CO_BONUS_CHI_GIUA.includes(loai)), [
  { ma: '7_A', ten: 'Tứ quý A' },
  { ma: '8_thuong', ten: 'Thùng phá sảnh Thượng' },
  { ma: '8_ha', ten: 'Thùng phá sảnh Hạ' },
])}
```

```jsx
const LOAI_CO_THE_CO_BONUS_CHI_GIUA = [6, 7, 8]; // Cù lũ, Tứ quý, Thùng phá sảnh
```

**Giải thích:** Chi Giữa giờ ĐỐI XỬ Y HỆT Chi Đầu/Chi Cuối trong giao
diện — dùng chung đúng 1 hàm `veBangBonus` đã có sẵn, không cần viết
riêng khối hiển thị nào nữa. Đây là lợi ích trực tiếp của việc đơn giản
hóa mô hình dữ liệu ở Bước 3b — khi dữ liệu đối xứng, giao diện cũng tự
nhiên đối xứng theo, giảm hẳn lượng code cần viết riêng.

### 3d. Ẩn các loại bài không có bonus khỏi bảng Chi Cuối VÀ Chi Giữa

Áp dụng ĐÚNG NGUYÊN TẮC ẩn dòng thừa cho CẢ 2 bảng (Chi Cuối, Chi Giữa) —
chỉ hiện Cù lũ/Tứ quý/Thùng phá sảnh, ẩn Mậu thầu→Thùng:

```jsx
const LOAI_CO_THE_CO_BONUS_CHI_CUOI = [7, 8]; // Tứ quý, Thùng phá sảnh (Cù lũ KHÔNG có bonus ở Chi Cuối)
const LOAI_CO_THE_CO_BONUS_CHI_GIUA = [6, 7, 8]; // Cù lũ, Tứ quý, Thùng phá sảnh (Cù lũ CÓ bonus ở Chi Giữa)
```

(Cần sửa nhẹ bên trong `veBangBonus` nếu hàm hiện đang dùng chỉ số mảng
LÀM `loai` trực tiếp — cách an toàn nhất là giữ nguyên `TEN_LOAI_5_LA`
đầy đủ, chỉ thêm điều kiện SKIP rendering dòng nào không nằm trong danh
sách tương ứng NGAY TRONG vòng lặp `.map()` của `veBangBonus`, thay vì
lọc mảng trước khi truyền vào — tránh lệch chỉ số sau khi `.filter()`.)

**Giải thích:** khác biệt DUY NHẤT giữa 2 danh sách là Cù lũ (6) — CÓ ở
Chi Giữa, KHÔNG có ở Chi Cuối — đúng theo yêu cầu ban đầu.

### 3e. Bỏ chữ nghiêng (italic) ở tên loại đặc biệt

Sửa CSS:
```css
.dong-bonus-dac-biet span:first-child {
  font-style: normal; /* trước đây: italic */
  opacity: 0.9;
}
```

### 3f. Ẩn Mậu thầu và Đôi khỏi bảng Chi Đầu

Chi Đầu chỉ có bonus cho Sám cô (2)/Sám cô A — Mậu thầu (0) và Đôi (1)
KHÔNG BAO GIỜ có bonus, ẩn luôn cho gọn giống 2 bảng kia:

```jsx
const LOAI_CO_THE_CO_BONUS_CHI_DAU = [2]; // chỉ Sám cô

{veBangBonus('dau', 'Chi Đầu (3 lá)', TEN_LOAI_3_LA.filter((_, loai) => LOAI_CO_THE_CO_BONUS_CHI_DAU.includes(loai)), [
  { ma: '2_A', ten: 'Sám cô A' },
])}
```

(Áp dụng đúng cách "skip trong vòng lặp `.map()`" đã nêu ở 3d, không lọc
mảng trước, tránh lệch chỉ số.)

### Kiểm tra Phase 3

1. Mọi dòng thông số trong tab Luật chơi có bố cục ĐỒNG NHẤT (nhãn trái,
   số phải).
2. Bảng Chi Đầu chỉ còn Sám cô/Sám cô A — không còn Mậu thầu/Đôi.
3. Bảng Chi Cuối chỉ còn Tứ quý/Tứ quý A/Thùng phá sảnh/Thượng/Hạ —
   KHÔNG có Cù lũ (Cù lũ không có bonus ở Chi Cuối).
4. Bảng Chi Giữa (giờ SỬA ĐƯỢC, không còn chỉ hiển thị) chỉ còn Cù
   lũ/Tứ quý/Tứ quý A/Thùng phá sảnh/Thượng/Hạ — TẤT CẢ đều là ô nhập,
   không còn dòng nào "tự động"/chỉ đọc nữa.
5. Chữ "Tứ quý A", "Thùng phá sảnh Thượng/Hạ" không còn nghiêng.
6. Sửa Chi Cuối (vd đổi Tứ quý Cuối) — xác nhận Chi Giữa KHÔNG đổi theo
   nữa (2 bảng độc lập hoàn toàn).
7. Chơi thử 1 ván có Cù lũ ở Chi Cuối — điểm đúng bằng ĐIỂM GỐC (1,
   không bonus); Cù lũ ở Chi Giữa — điểm đúng bằng số đã nhập (mặc định
   2).

Dừng lại ở đây. Xác nhận cả 7 điều trên đúng trước khi báo cáo và sang
Phase 4.

---

## Phase 4 — Đổi nhãn "Ù" thành "Thắng trắng" trong toàn bộ giao diện

Mục tiêu: mọi CHỮ hiển thị cho người chơi thấy chữ "Ù" đổi thành "Thắng
trắng" — chỉ đổi CHỮ HIỂN THỊ, KHÔNG đổi tên hàm/biến/class CSS nội bộ
(ví dụ `xacNhanBaoU`, `.nut-bao-u`... giữ nguyên, vì đây là tên code nội
bộ, không phải giao diện).

### Bước 1 — Rà soát và đổi trong `App.jsx` (Chơi với AI)

Tìm mọi CHUỖI VĂN BẢN (không phải tên hàm/biến) có chữ "Ù", đổi thành
"Thắng trắng":

| Vị trí | Cũ | Mới |
|---|---|---|
| Nút báo | `"Báo Ù"` | `"Báo thắng trắng"` |
| Hộp xác nhận | `"Bạn có CHẮC CHẮN muốn Báo Ù?"` | `"Bạn có CHẮC CHẮN muốn báo thắng trắng?"` |
| Nút xác nhận trong hộp thoại | `"Chắc chắn, Báo Ù!"` | `"Chắc chắn, Báo thắng trắng!"` |
| Banner khi AI/Bạn thắng trắng | `` `🎉 Ù ngay! ...` `` | `` `🎉 Thắng trắng! ...` `` |
| Dòng ghi chú kết quả | `` `Ù bằng ${loaiThangTrang}` `` | `` `Thắng trắng bằng ${loaiThangTrang}` `` |

### Bước 2 — Rà soát và đổi trong `LichSu.jsx` (trang Lịch sử)

| Vị trí | Cũ | Mới |
|---|---|---|
| Nhãn trong danh sách ván | `van.laThangTrang && ' 🎉 Ù'` | `van.laThangTrang && ' 🎉 Thắng trắng'` |
| Tiêu đề màn chi tiết ván | `` `... Ù bằng ${loaiThangTrang}` `` | `` `... Thắng trắng bằng ${loaiThangTrang}` `` |

### Bước 3 — Rà soát các file còn lại

Tìm toàn bộ project (Ctrl+Shift+F trong VS Code, tìm chữ `"Ù"` trong các
file `.jsx`) để chắc chắn không sót chỗ nào khác đang hiện chữ này cho
người chơi thấy — CHỈ đổi nếu đó là VĂN BẢN HIỂN THỊ (nằm trong JSX giữa
dấu `<...>` hoặc trong chuỗi truyền vào thuộc tính hiển thị), KHÔNG đổi
nếu đó là tên hàm/biến/class (ví dụ `BaoU`, `bao-u`).

**Giải thích:** đây là lý do CHỈ đổi chuỗi hiển thị, không đổi tên hàm —
đổi tên hàm/biến là 1 việc RỦI RO HƠN NHIỀU (phải sửa ở MỌI nơi gọi hàm
đó, dễ sót/gõ sai tên ở 1 chỗ nào đó gây lỗi runtime khó phát hiện ngay);
trong khi đổi chữ hiển thị chỉ ảnh hưởng những gì người chơi NHÌN THẤY,
không ảnh hưởng gì tới cách chương trình chạy.

### Kiểm tra Phase 4

1. Dựng thử 1 ván thắng trắng (hoặc dùng lại cách test đã có từ V4) —
   toàn bộ chữ hiện ra đều là "Thắng trắng", không còn chữ "Ù" nào.
2. Thử báo thắng trắng sai — hộp thoại xác nhận + kết quả đều dùng đúng
   chữ mới.
3. Vào Lịch sử, xem 1 ván đã thắng trắng trước đó (nếu có dữ liệu cũ) —
   hiển thị đúng "Thắng trắng" thay vì "Ù".

---

## Hoàn thành V10 — báo cáo lại với Huy

1. Toàn bộ 4 Phase chạy đúng, không lỗi Console.
2. Rà lại 1 lượt toàn bộ giao diện (Chơi với AI, Lịch sử, Luật chơi) —
   xác nhận không còn dấu "?" thừa, không còn NaN, chữ nghiêng không cần
   thiết đã bỏ, bố cục đồng nhất, không còn chữ "Ù" nào (đã đổi hết thành
   "Thắng trắng").
3. Nếu còn phát hiện chi tiết nào chưa "chuẩn hóa" khi rà lại, ghi chú cụ
   thể (kèm ảnh chụp nếu có) để xử lý tiếp ở bản vá riêng — không cần
   gộp hết vào V10 này.

---

## Nhật ký triển khai thực tế (Claude Code)

Toàn bộ 4 Phase đã triển khai đúng theo spec ở trên. Ghi chú các điểm
thực thi cụ thể / khác biệt nhỏ so với bản nháp, kiểm thử bằng
Playwright (headless Chromium) qua từng Phase:

- **Phase 1** (`App.jsx`, `TheBaiDon.jsx`): bỏ hẳn `<div>` nội dung "?"
  ở lưng bài (chỉ còn nền trơn). Thêm `chapNhanGoiY()` + state
  `goiYLucXacNhan` — `xacNhanBai()` chụp lại gợi ý TRƯỚC khi tính điểm
  thật, tính thử điểm phản thực (giữ nguyên bài 3 đối thủ, thay bài
  "Bạn" bằng đúng gợi ý) để so sánh. Class `tieu-de-het-hiep` áp dụng ở
  cả `App.jsx` (đổi luôn dòng tiêu đề "Hết hiệp" ngắn thành "Tổng kết
  Hiệp {X}" cho khớp ý đồ) và `GhiDiem.jsx`.
- **Phase 2** (`LichSu.jsx`): tab đổi tên đúng yêu cầu. Hàm
  `dinhDangThoiGianAnToan` thay thế `dinhDangGioNgay` cũ (vốn không
  kiểm tra `Date` hỏng) ở MỌI chỗ hiện giờ, kể cả `toLocaleString` trong
  modal xem lại 1 ván. Phân trang 10 hiệp/trang implement đúng thứ tự:
  lọc theo tab → sắp xếp mới nhất trước → cắt trang → mới `nhomHiepThanhBang`
  (tự sắp xếp lại tăng dần bên trong, không xung đột). Cấu trúc thật của
  "dòng Ván" là 1 BẢNG (không phải đoạn văn `<p>` như bản nháp giả định)
  — áp dụng đúng Ý ĐỒ thay vì chép máy móc: thêm `<caption>Hiệp #Y</caption>`
  vào bảng con Ván để vẫn biết ván thuộc hiệp nào, giữ nguyên cấu trúc
  bảng đang hoạt động tốt.
- **Phase 3** (`ruleset.js`, `cardEngine.js`, `LuatChoi.jsx`): thêm
  `giua: { 6: 2, 7: 8, '7_A': 32, 8: 10, '8_thuong': 20, '8_ha': 14 }`
  vào preset "Chuẩn"; `diemMotChi`/`diemMotChiChiTiet` bỏ hẳn nhánh đặc
  biệt cho `'giua'`. **Phát hiện thêm lúc triển khai (không có trong bản
  nháp):** ruleset ĐÃ LƯU trong `localStorage` từ trước V10 hoàn toàn
  thiếu bảng `bonusTheoLoai.giua` (vì trước đây tính tự động, không lưu
  thành bảng riêng) — nếu không xử lý, mọi ruleset đã lưu (kể cả preset
  "Chuẩn" mặc định mà Huy đang dùng) sẽ ÂM THẦM mất hết bonus Chi Giữa
  (rơi về 1 điểm gốc) ngay khi mở app sau khi cập nhật. Đã thêm
  `damBaoBonusGiuaDayDu()` (`ruleset.js`) để backfill 1 lần lúc đọc lên
  (`docTrangThaiLuat`/`docPresetRieng` trong `App.jsx`), dùng ĐÚNG công
  thức cũ (2× Chi Cuối, Cù lũ mặc định = 2) — sau lần đọc đầu, ruleset
  có bảng `giua` độc lập hoàn toàn, không còn phụ thuộc gì vào `cuoi`
  nữa. `veBangBonus` (`LuatChoi.jsx`) thêm tham số `loaiChoPhep` — skip
  render NGAY TRONG `.map()` (không `.filter()` mảng trước) để tránh
  lệch chỉ số `loai`, đúng như bản nháp đã tự lưu ý ở mục 3d.
- **Phase 4**: rà toàn bộ `.jsx` bằng grep, chỉ đổi CHUỖI HIỂN THỊ (nút,
  hộp xác nhận, banner, dòng giải trình `tinhDiemBaoUSai` trong
  `cardEngine.js`, Lịch sử) — giữ nguyên mọi tên hàm/biến/class nội bộ
  (`xacNhanBaoU`, `.nut-bao-u`...). Còn đúng 1 câu liên quan chưa nằm
  trong bảng đối chiếu gốc: checkbox "Bật luật thắng trắng (Ù ngay...)"
  ở `LuatChoi.jsx` — đổi thành "(thắng ngay...)" để tránh lặp từ "thắng
  trắng" 2 lần trong cùng 1 câu.
- **Kiểm thử qua Playwright** (không chỉ code review) từng Phase: dựng
  lại đúng kịch bản qua trình duyệt headless, chụp ảnh màn hình xác nhận
  trực quan, và seed dữ liệu giả vào `localStorage` (qua `page.evaluate`)
  để test các trường hợp cần dữ liệu có sẵn (>10 hiệp cho phân trang,
  `Date` hỏng cho NaN, 1 ván thắng trắng cho Lịch sử...). `npx vite
  build` sạch sau mỗi Phase, không lỗi Console/trang trong mọi kịch bản
  test.

### Fix: "Ba sảnh" hiển thị sai (không xếp thành 3 sảnh)

**Lỗi Huy báo:** thắng trắng bằng "Ba sảnh" nhưng 3 chi hiển thị trên
bàn không xếp thành 3 dãy liên tiếp (Sảnh) — nhìn rời rạc, không chứng
minh được vì sao thắng.

**Nguyên nhân:** `xepBaiThangTrangDeXem` (`cardEngine.js`) chỉ có nhánh
xử lý riêng cho `baThung`/`rongCuon`/`sanhRong` — loại `baSanh` không
khớp nhánh nào nên rơi vào fallback CHUNG (gom lá theo rank giống
nhau đứng cạnh nhau), vốn chỉ hợp cho đôi/sám/thông, sai hoàn toàn cho
sảnh (sảnh cần rank LIÊN TIẾP KHÁC NHAU, không phải rank giống nhau).

**Sửa:** thêm hàm `timBaSanh()` — duyệt đúng không gian tổ hợp mà
`coBaSanh()` (hàm đã dùng để XÁC ĐỊNH loại thắng trắng) đã kiểm tra
thỏa mãn, nhưng CẮT LUÔN lá cụ thể cho từng chi thay vì chỉ trả về
true/false. Gọi hàm này ở nhánh `baSanh` mới trong
`xepBaiThangTrangDeXem`, đặt TRƯỚC fallback chung.

**Kiểm thử bằng Node.js:** dựng 1 tay 13 lá thật có Ba sảnh (Đầu 4-5-6,
Giữa 8-9-10-J-Q, Cuối 9-10-J-Q-K dùng khác chất để đủ số lá) — xác nhận
`kiemTraThangTrang` nhận diện đúng `baSanh`; `xepBaiThangTrangDeXem`
trả về Đầu/Giữa/Cuối đều là dãy rank liên tiếp thật (không phải gom
theo rank giống nhau); dùng đủ đúng 13 lá, không lá nào bị dùng 2 lần.

### Fix: tên "Đối thủ 1/2/3" cứng trong màn xem lại 1 ván (Lịch sử)

**Lỗi Huy báo:** cùng lỗi hard-code tên đã ghi nhận trước đó — màn xem
lại chi tiết 1 ván trong Lịch sử không hiện đúng tên người chơi.

**Nguyên nhân:** `renderVanAI` (`LichSu.jsx`) tra người chơi bằng CHUỖI
CỨNG `'Đối thủ 1'`/`'Đối thủ 2'`/`'Đối thủ 3'` để tìm trong
`van.nguoiChoiBaiThat` — chỉ đúng nếu hiệp đó tình cờ dùng tên chung
chung này; sai (tìm không thấy → lỗi `Cannot read properties of
undefined`) ngay khi hiệp dùng tên nhân vật thật (vd "Safeway").

**Sửa:** bỏ hẳn việc tra theo tên — `renderMotNguoi` nhận thẳng OBJECT
người chơi theo ĐÚNG VỊ TRÍ đã lưu trong `van.nguoiChoiBaiThat` (0 =
Bạn, 1/2/3 = 3 đối thủ theo đúng thứ tự lúc chia), khớp với quy ước bàn
tròn dùng chung toàn app (12h = vị trí 2, 9h = vị trí 1, 3h = vị trí 3).

**Kiểm thử qua Playwright:** seed 1 ván thắng trắng với tên nhân vật
KHÁC "Đối thủ 1/2/3" vào `localStorage`, mở lại trong Lịch sử — xác
nhận hiện đúng tên thật, không còn lỗi trang.

**Ghi chú riêng cho Huy:** tên "Đối thủ 1/2/3" xuất hiện ở MÀN ĐANG CHƠI
(không phải Lịch sử) nhiều khả năng là do 1 Hiệp CŨ (tạo từ trước khi
có tính năng chọn nhân vật AI, chưa dọn qua `xoaSachLichSuCu()`) —
không phải lỗi code, mà là dữ liệu cũ còn sót. Huy đã chọn xóa sạch
lịch sử cũ qua Console trình duyệt (xem lệnh đã gửi trong hội thoại).

### Fix: nút "Chấp nhận gợi ý" không cùng hàng với các nút khác

**Yêu cầu Huy:** đưa nút "Chấp nhận gợi ý" lên chung 1 hàng với "Gợi ý"
và các nút hành động khác, đảm bảo MỌI nút luôn nằm trong đúng 1 hàng.

**Sửa:** chuyển nút từ khối hiển thị kết quả gợi ý (`.khoi-luat` riêng
bên dưới) vào thẳng `.hang-nut-choi`, hiện ngay sau nút "Gợi ý" khi đã
có `ketQuaGoiY`. Đổi CSS `.hang-nut-choi` từ `flex-wrap: wrap` (bị xuống
dòng khi đủ 5 nút trên màn hẹp) sang `flex-wrap: nowrap` +
`overflow-x: auto` — đảm bảo LUÔN đúng 1 hàng ngang (cuộn được) bất kể
độ rộng màn hình, thay vì chỉ đúng 1 hàng khi màn đủ rộng.

**Kiểm thử qua Playwright:** đo tọa độ `boundingBox()` của cả 5 nút
(`Dừng`/`Gợi ý`/`Chấp nhận gợi ý`/`Xác nhận bài`/`Báo thắng trắng`) trên
viewport 500px — xác nhận cả 5 nút cùng 1 tọa độ `y` (đúng 1 hàng),
hàng tự cuộn ngang khi tổng bề rộng vượt khung màn hình.

### Fix: Mad Max (Tối đa hóa điểm) không gộp Đôi Á ở Chi Đầu dù có sẵn

**Lỗi Huy báo:** gửi ảnh 1 ván Mad Max — bài có 2 lá Á (1 ở Chi Đầu lẫn
Mậu thầu, 1 ở Chi Cuối cùng Tứ quý 7), nhưng thuật toán không gộp 2 lá
Á lại thành Đôi Á ở Chi Đầu dù hoàn toàn có thể (không ảnh hưởng gì tới
2 Tứ quý ở Giữa/Cuối).

**Nguyên nhân:** ruleset "Chuẩn" KHÔNG có bonus nào cho Đôi ở Chi Đầu —
bảng `bonusTheoLoai.dau` chỉ có 2 mục (Sám cô/Sám cô A). Dưới công thức
chấm điểm của phong cách `toiDaHoaDiem` (`diemMotChi` tra thẳng bảng
này), "Mậu thầu" và "Đôi" cho ĐÚNG CÙNG 1 điểm (đều = điểm gốc, không
bonus) — 2 cách xếp hòa điểm tuyệt đối. Vì `xepBaiTheoPhongCach` chỉ
nhận cách xếp mới khi điểm CAO HƠN (không phải `>=`), khi hòa nó giữ
nguyên cách xếp đầu tiên gặp trong ~72 nghìn tổ hợp — không có tiêu chí
nào phá hòa nghiêng về phía "chắc thắng hơn khi so bài thật".

**Sửa** (`cardEngine.js`, hàm `xepBaiTheoPhongCach`): thêm tiêu chí phụ
khi hòa TỔNG điểm — so `danhGia3La(chiDau)` bằng `soSanh` (đúng hàm đã
dùng để so bài thật giữa 2 người chơi), ưu tiên cách có Chi Đầu MẠNH
HƠN. Không đổi triết lý cốt lõi của Mad Max (vẫn ưu tiên dồn bonus ở
Giữa/Cuối trước), chỉ tránh bỏ phí 1 Đôi/Sám cô sẵn có khi không tốn gì
ở 2 chi kia.

**Kiểm thử bằng Node.js:** dựng lại chính xác 13 lá trong ảnh — xác
nhận thuật toán giờ chọn Chi Đầu = Đôi Á (trước đó là Mậu thầu), 2 Tứ
quý ở Giữa/Cuối giữ nguyên, kết quả vẫn hợp lệ và đủ đúng 13 lá. Chạy
30 tay ngẫu nhiên xác nhận không có tay nào lỗi/thiếu lá; so hiệu năng
trước/sau bằng `git stash` (30 tay: 8.741s trước, 8.735s sau) — không
có suy giảm.

**Làm rõ phạm vi ảnh hưởng (Huy hỏi lại vì thấy khó hiểu):** con số điểm
theo RULESET của Đôi và Mậu thầu ở Chi Đầu bằng nhau — nên nếu Mad Max
ĐÃ THẮNG Chi Đầu ở cả 2 cách xếp, tổng điểm ván đó không đổi. Nhưng bản
sửa vẫn có ý nghĩa THẬT trong thi đấu: Đôi Á thắng được NHIỀU đối thủ
hơn hẳn so với Mậu thầu (Đôi Á thắng mọi Mậu thầu + mọi đôi thấp hơn;
Mậu thầu chỉ thắng Mậu thầu yếu hơn) — nên có thể biến 1 kèo THUA Chi
Đầu (mất điểm, có thể còn làm hỏng "ăn sập" cả ván) thành THẮNG, tùy bài
đối thủ thật ở ván đó. Chưa có dữ liệu bài thật của 3 đối thủ trong ván
+34 cụ thể Huy gửi để tính lại chính xác — sẽ tính khi Huy cung cấp qua
Console trình duyệt (lệnh đã gửi trong hội thoại).

### Patch: giữ hiển thị bài gợi ý của AI khi so điểm (không chỉ số điểm)

**Yêu cầu Huy:** sau khi hỏi vì sao "Nếu dùng gợi ý" (-2) khác kết quả
chính thức (-5) — Huy xác nhận đã tự xếp bài khác với gợi ý (không bấm
"Chấp nhận gợi ý"), nên 2 số khác nhau là ĐÚNG, không phải lỗi. Nhân
tiện phát hiện: dòng so điểm ở Phase 1c (V10) chỉ hiện SỐ, không hiện
LẠI cách xếp gợi ý — không xem lại được AI đã gợi ý xếp thế nào. Yêu
cầu bổ sung giữ hiển thị bài gợi ý lúc so điểm.

**Ghi chú bối cảnh:** nút "Gợi ý" (AI xếp bài mẫu) có từ **V9 Phase 7**;
V10 Phase 1b thêm "Chấp nhận gợi ý"; V10 Phase 1c (bản gốc) chỉ thêm
DÒNG SỐ so sánh, chưa giữ lại hình ảnh bài gợi ý sau khi xác nhận.

**Sửa** (`App.jsx`):
- `goiYLucXacNhan` (chụp lúc gọi `xacNhanBai()`) giờ lưu THÊM
  `chiDau`/`chiGiua`/`chiCuoi` của gợi ý (không chỉ `diem`/`tyLeThang`) —
  tự chứa đủ dữ liệu để hiển thị lại, không phụ thuộc vòng đời của
  `ketQuaGoiY` (vốn chỉ hiện khi CHƯA xác nhận).
- Khối hiển thị sau khi xác nhận đổi từ 1 dòng `<p>` thành 1
  `.khoi-luat` đầy đủ: tiêu đề "Gợi ý lúc đó (tỷ lệ thắng ước tính:
  X%)" + 3 hàng `HangBai` (Đầu/Giữa/Cuối) + dòng so điểm như cũ — dùng
  lại đúng style/markup của khối gợi ý lúc CHƯA xác nhận (Phase 1b),
  chỉ đổi tiêu đề từ "Gợi ý" sang "Gợi ý lúc đó" cho rõ là đang xem LẠI.

**Kiểm thử qua Playwright:** bấm "Gợi ý" rồi xác nhận bằng CÁCH XẾP
KHÁC (không chấp nhận gợi ý) — sau khi xác nhận, khối "Gợi ý lúc đó"
hiện đủ 3 hàng bài + dòng so điểm, không lỗi Console.
