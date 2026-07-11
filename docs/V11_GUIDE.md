# V11_GUIDE.md — Giới hạn thời gian xếp bài (Chơi với AI)

> **Dành cho ai đọc file này:**
> - Nếu bạn là **Claude Code**: làm theo ĐÚNG THỨ TỰ 3 Phase bên dưới.
>   MỖI Phase xong phải DỪNG LẠI, báo cáo đã làm gì, để Huy tự kiểm tra
>   trước khi sang Phase tiếp theo.
> - Nếu bạn là **Huy**: đọc phần "Giải thích" sau mỗi khối.

## Phạm vi V11

- Thêm cấu hình **thời gian xếp bài tối đa** (30-120 giây, chỉnh trong
  tab Luật chơi) — chỉ áp dụng cho "Chơi với AI" (không áp dụng cho Ghi
  điểm, vì đó là ghi lại bài THẬT đã chơi xong, không có khái niệm "đang
  xếp bài").
- Sau khi chia bài, đồng hồ tự động đếm ngược.
- Hết giờ → **tự động xác nhận** đúng cách xếp HIỆN TẠI (dù đã sửa hay
  chưa, dù hợp lệ hay binh lủng) — dùng lại NGUYÊN VẸN luồng "Xác nhận
  bài" đã có, không viết đường xử lý riêng.
- **Thêm 1 tùy chọn bật/tắt** tính năng này (không có trong yêu cầu gốc,
  nhưng hợp lý để ai không muốn áp lực thời gian vẫn chơi thoải mái) —
  nếu không cần, có thể bỏ qua Bước 2 của Phase 1.

---

## Phase 1 — Cấu hình trong Luật chơi (`src/ruleset.js`, `src/LuatChoi.jsx`)

### Bước 1 — Thêm field vào `ruleset.js`

```js
// Preset "toi_gian"
thoiGianXepBai: { batBuoc: false, giay: 60 }, // Tối giản: tắt mặc định

// Preset "chuan"
thoiGianXepBai: { batBuoc: true, giay: 60 }, // Chuẩn: bật, mặc định 60 giây
```

**Giải thích:** `giay` mặc định 60 — nằm giữa khoảng 30-120 Huy yêu cầu,
đủ thời gian xếp bình thường mà vẫn tạo áp lực nhẹ. `batBuoc` cho phép
tắt hẳn tính năng nếu Huy (hoặc sau này người khác dùng app) không muốn
bị giới hạn thời gian.

### Bước 2 — Thêm khối cấu hình trong `LuatChoi.jsx`

Đặt khối này cạnh các khối luật khác (vị trí gợi ý: sau khối "Chi Á"):

```jsx
<div className="khoi-luat">
  <div className="khoi-luat-tieu-de">Giới hạn thời gian xếp bài (Chơi với AI)</div>
  <label className="dong-checkbox">
    <input
      type="checkbox"
      checked={ruleset.thoiGianXepBai?.batBuoc ?? false}
      onChange={e => suaRuleset(r => {
        if (!r.thoiGianXepBai) r.thoiGianXepBai = { batBuoc: true, giay: 60 };
        r.thoiGianXepBai.batBuoc = e.target.checked;
      })}
    />
    Bật đếm ngược — hết giờ tự động xác nhận
  </label>
  <div className="dong-thong-so">
    <span>Thời gian mỗi ván (giây, từ 30 đến 120)</span>
    <input
      type="number" min={30} max={120}
      value={ruleset.thoiGianXepBai?.giay ?? 60}
      disabled={!ruleset.thoiGianXepBai?.batBuoc}
      onChange={e => suaRuleset(r => {
        const gtri = Math.max(30, Math.min(120, Number(e.target.value) || 60));
        if (!r.thoiGianXepBai) r.thoiGianXepBai = { batBuoc: true, giay: 60 };
        r.thoiGianXepBai.giay = gtri;
      })}
    />
  </div>
</div>
```

**Giải thích:** `Math.max(30, Math.min(120, ...))` là cách "kẹp" 1 giá
trị vào đúng khoảng cho phép — nếu Huy lỡ gõ 200 hoặc 10, số sẽ tự động
kéo về đúng 120 hoặc 30, không cần validate riêng/hiện lỗi. Ô nhập bị
`disabled` khi tính năng đang tắt — tránh Huy tưởng nhầm đã chỉnh được số
trong khi thực ra không có tác dụng gì.

### Kiểm tra Phase 1

1. Tab Luật chơi hiện đúng khối mới, đúng vị trí.
2. Gõ số ngoài khoảng 30-120 (vd 5 hoặc 999) — tự động kẹp về 30 hoặc
   120.
3. Tắt "Bật đếm ngược" — ô nhập số bị mờ, không sửa được.

Dừng lại ở đây. Xác nhận cả 3 điều trên đúng trước khi báo cáo và sang
Phase 2.

---

## Phase 2 — Đồng hồ đếm ngược + tự động xác nhận (`src/App.jsx`)

### Bước 1 — Thêm state đếm ngược

Đặt cạnh các state khác của màn chơi:
```jsx
const [giayConLai, setGiayConLai] = useState(() => ruleset.thoiGianXepBai?.giay ?? 60);
```

### Bước 2 — Đếm ngược mỗi giây, tự động xác nhận khi về 0

```jsx
useEffect(() => {
  if (daXacNhan) return; // đã xác nhận rồi (thắng trắng hoặc đã bấm tay) -> dừng đếm
  if (!ruleset.thoiGianXepBai?.batBuoc) return; // tính năng đang tắt
  if (dangXacNhanBaoU) return; // đang mở hộp thoại Báo Ù -> tạm dừng đếm, không ép xác nhận giữa chừng

  if (giayConLai <= 0) {
    xacNhanBai(); // hết giờ -> tự động xác nhận ĐÚNG cách xếp hiện tại
    return;
  }

  const timer = setTimeout(() => setGiayConLai(g => g - 1), 1000);
  return () => clearTimeout(timer);
}, [giayConLai, daXacNhan, dangXacNhanBaoU]);
```

**Giải thích:**
- **Vì sao dùng `setTimeout` lặp lại thay vì `setInterval`:** với
  `setTimeout` đặt lại mỗi lần trong `useEffect` (chạy lại mỗi khi
  `giayConLai` đổi), đồng hồ luôn đồng bộ CHÍNH XÁC với state React — nếu
  dùng `setInterval` cố định, dễ bị lệch nếu component render lại nhiều
  lần không đều (interval cũ vẫn chạy song song với interval mới nếu
  không dọn dẹp cẩn thận).
- **`return () => clearTimeout(timer)`:** đây là hàm "dọn dẹp" của
  `useEffect` — chạy TRƯỚC khi effect chạy lại lần sau (hoặc khi
  component gỡ bỏ) — đảm bảo không có 2 bộ đếm chạy song song, chỉ luôn
  có ĐÚNG 1 timer tại một thời điểm.
- **Vì sao gọi THẲNG `xacNhanBai()`** (không viết hàm riêng cho "tự động
  xác nhận"): vì mục tiêu là "xử lý đúng như bấm tay, chỉ khác là ai bấm"
  — dùng chung nguyên hàm cũ đảm bảo TOÀN BỘ logic đã có (ghi log lịch
  sử, kiểm tra binh lủng, tính điểm...) chạy ĐÚNG Y HỆT, không có nguy cơ
  viết thiếu 1 bước nào đó nếu tách riêng.
- **Tạm dừng khi đang mở hộp thoại Báo Ù:** tránh tình huống khó xử —
  đồng hồ về 0 đúng lúc Huy đang cân nhắc "Báo Ù" hay không, tự động
  xác nhận NGAY LÚC ĐÓ có thể gây rối giao diện (2 hành động chồng lên
  nhau). Đếm ngược TIẾP TỤC ngay khi đóng hộp thoại (dù bấm "Hủy" hay
  xác nhận Báo Ù xong).

### Bước 3 — Hiển thị đồng hồ đếm ngược

Đặt ngay dưới dòng "Hiệp X — Ván Y/12" (đã có từ V8/V9), CHỈ hiện khi
CHƯA xác nhận VÀ tính năng đang bật:

```jsx
{!daXacNhan && ruleset.thoiGianXepBai?.batBuoc && (
  <div className={giayConLai <= 10 ? 'dem-nguoc dem-nguoc-canh-bao' : 'dem-nguoc'}>
    Còn {giayConLai} giây
  </div>
)}
```

### Bước 4 — Thêm CSS

```css
.dem-nguoc {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: #f0c040;
  margin-bottom: 8px;
}
.dem-nguoc-canh-bao {
  color: #f87171;
  animation: nhap-nhay-dem-nguoc 1s infinite;
}
@keyframes nhap-nhay-dem-nguoc {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

**Giải thích:** đổi màu + nhấp nháy khi còn ≤10 giây — tín hiệu thị giác
rõ ràng để Huy biết sắp hết giờ, không cần nhìn kỹ con số mới nhận ra.

### Kiểm tra Phase 2

1. Vào ván mới (tính năng đang bật) — thấy đồng hồ đếm ngược từ đúng số
   giây đã cấu hình, giảm dần mỗi giây.
2. Để đồng hồ chạy về 0 (không bấm gì) — ván tự động xác nhận đúng cách
   xếp đang có tại thời điểm đó (kể cả nếu đang binh lủng — xử thua đúng
   luật binh lủng như bình thường).
3. Mở hộp thoại "Báo Ù" đúng lúc gần hết giờ — đồng hồ tạm dừng đếm,
   không tự động xác nhận trong lúc hộp thoại đang mở.
4. Bấm "Xác nhận bài" bằng tay TRƯỚC khi hết giờ — đồng hồ dừng lại
   (biến mất khỏi màn hình vì `daXacNhan` đã `true`).
5. Tắt tính năng trong Luật chơi — vào ván mới, không thấy đồng hồ đâu
   cả, chơi bình thường không giới hạn thời gian.
6. Ván tiếp theo (bấm "Ván tiếp theo"/"Chơi tiếp") — đồng hồ RESET về
   đúng số giây cấu hình, không giữ lại số giây còn dư từ ván trước.

Dừng lại ở đây. Xác nhận cả 6 điều trên đúng trước khi báo cáo và sang
Phase 3.

---

## Phase 3 — Rà soát tương tác với các tính năng khác

Mục tiêu: đảm bảo đồng hồ đếm ngược không xung đột với các luồng đã có
(thắng trắng, Gợi ý, Chấp nhận gợi ý từ V10).

### Bước 1 — Xác nhận thắng trắng KHÔNG bị đồng hồ ảnh hưởng

Khi AI/Bạn thắng trắng tự động (V4), `daXacNhan` đã là `true` NGAY TỪ
ĐẦU (trước cả khi component vẽ lần đầu) — điều kiện `if (daXacNhan)
return;` trong Bước 2 (Phase 2) đã tự động chặn đồng hồ chạy trong
trường hợp này, không cần sửa gì thêm. Chỉ cần XÁC NHẬN lại bằng cách
chơi thử 1 ván thắng trắng (dựng bộ bài cố định như đã làm ở V4) — không
được thấy đồng hồ đếm ngược xuất hiện dù chỉ 1 khắc.

### Bước 2 — Bấm "Gợi ý" (V9) hoặc "Chấp nhận gợi ý" (V10) không bị đồng hồ làm gián đoạn

Vì tính toán "Gợi ý" chạy đồng bộ (block luồng chính trong ~1-2 giây),
đồng hồ đếm ngược tự nhiên "đứng yên" trong lúc đó (JavaScript đơn luồng
— `setTimeout` của đồng hồ không thể chạy xen giữa lúc đang tính gợi ý) —
không cần thêm logic tạm dừng nào. Xác nhận bằng cách bấm "Gợi ý" và
quan sát: đồng hồ có thể "giật" 1-2 giây (do thời gian tính toán) nhưng
không mất số liệu hay chạy sai sau đó.

### Bước 3 — Bấm "Chấp nhận gợi ý" không tự động xác nhận luôn

"Chấp nhận gợi ý" (V10) chỉ ĐỔI cách xếp (`oCacChi`) — KHÔNG tự gọi
`xacNhanBai()`. Đồng hồ vẫn tiếp tục đếm bình thường sau khi chấp nhận
gợi ý, Huy vẫn cần tự bấm "Xác nhận bài" (hoặc đợi hết giờ) như bình
thường — xác nhận hành vi này đúng như mong đợi (không có gì cần sửa,
chỉ cần kiểm tra lại).

### Kiểm tra Phase 3

1. Ván thắng trắng: không thấy đồng hồ đếm ngược.
2. Bấm "Gợi ý": đồng hồ không bị lỗi/nhảy số sai sau khi tính xong.
3. Bấm "Chấp nhận gợi ý": đồng hồ vẫn tiếp tục đếm, KHÔNG tự động xác
   nhận ngay lúc đó.

---

## Phase 4 — Bổ sung sau khi hoàn thành Phase 1-3 (ngoài phạm vi gốc)

Sau khi xong đếm ngược, Huy yêu cầu thêm 3 cải tiến nhỏ không liên quan
trực tiếp tới đồng hồ nhưng làm cùng đợt nên gộp chung vào bản V11 này
thay vì mở guide riêng.

### 4a. Ẩn bàn tròn preview ở màn ChonVan khi CHƯA có hiệp dở dang

**Vấn đề:** màn "Chơi với AI" luôn vẽ bàn tròn preview (Đối thủ 1/2/3 +
Bạn) dù chưa từng chơi hiệp nào — hiện toàn tên giả "Đối thủ 1/2/3" vô
nghĩa vì chưa có dữ liệu điểm gì để xem trước.

**Sửa** (`ChonVan.jsx`): bọc khối `.ban-choi.ban-choi-preview` (hiển thị
vị trí + điểm hiệp đang dở) trong điều kiện `{hiepDoDang && (...)}` —
chỉ vẽ khi thực sự có 1 hiệp dở dang để xem trước.

### 4b. Tên người chơi tự chọn — mặc định "Bạn" hoặc tên hiệp gần nhất

**Vấn đề:** người chơi luôn bị gán cứng tên "Bạn" trong toàn bộ hệ
thống tính điểm/lịch sử — không tự đặt tên riêng được.

**Sửa:**
- `cardEngine.js`: các hàm cần phân biệt "người chơi thật" (thắng trắng
  tự động của AI bỏ qua người chơi; Báo Ù chỉ áp dụng cho người chơi)
  đổi từ so sánh chuỗi `p.ten === 'Bạn'` sang so theo VỊ TRÍ — người
  chơi LUÔN là phần tử `index 0` của mảng `nguoiChoi`, tên gì cũng được.
  `tinhDiemBaoUSai` cũng đổi theo, dùng `nguoiChoi[0].ten` làm tên phạt
  thay vì hardcode `'Bạn'`. Phần diễn giải cách tính điểm
  (`soBai2Nguoi`) đổi từ hardcode "Bạn"/"Đối thủ" sang dùng thẳng
  `a.ten`/`b.ten` — vừa hết phụ thuộc chuỗi cố định, vừa sửa luôn 1 lỗi
  tiềm ẩn (diễn giải giữa 2 đối thủ AI với nhau trước đó vẫn ghi nhầm
  "Bạn"/"Đối thủ").
- `lichSuChoi.js`: thêm `layTenNguoiChoiGanNhat(danhSachHiep, nguon)` —
  tìm hiệp GẦN NHẤT (không cần dở dang) của 1 nguồn, trả về tên đã dùng
  ở vị trí người chơi, mặc định `'Bạn'` nếu chưa từng chơi.
- `App.jsx`: thêm biến `tenBan` (đọc từ `hiepAIHienTai.nguoiChoi[0]`,
  mặc định `'Bạn'`) thay cho MỌI literal `'Bạn'` dùng làm khóa dữ liệu
  (tính điểm, tra cứu lịch sử, hiển thị). `chonHiepMoi` nhận thêm tham
  số tên người chơi, validate rỗng thì rơi về `'Bạn'`.
- `ChonVan.jsx`: thêm ô nhập tên, đặt Ở ĐÚNG VỊ TRÍ 6H trong bàn tròn
  chọn nhân vật (cùng hàng với 3 dropdown đối thủ ở 12h/9h/3h) — điền
  sẵn `tenNguoiChoiMacDinh` (tính từ `layTenNguoiChoiGanNhat`). Tên chỉ
  áp dụng cho hiệp SẮP tạo, giống cách chọn nhân vật đối thủ — hiệp dở
  dang giữ nguyên tên đã cố định lúc tạo.

**Kiểm thử qua Playwright:** đặt tên "Huy Test" → tên hiện đúng ở bàn
chơi, điểm tích lũy tính đúng theo tên mới; quay lại màn chọn ván, cả ô
nhập lẫn preview bàn tròn hiệp dở dang đều hiển thị đúng tên đã đặt (kể
cả sau khi rời trang rồi quay lại — nhờ `layTenNguoiChoiGanNhat`).

### 4c. Lịch sử: Ván/Hiệp mới nhất luôn lên trên cùng

**Vấn đề:** các BẢNG (nhóm hiệp cùng roster) đã hiện bảng mới nhất
trước, nhưng bên TRONG mỗi bảng, các dòng Hiệp lại xếp CŨ trước (do
`nhomHiepThanhBang` cần duyệt tăng dần theo thời gian để gộp đúng roster
liên tiếp, và thứ tự đó bị giữ nguyên luôn khi vẽ). Tương tự, danh sách
Ván trong 1 Hiệp mở rộng cũng xếp Ván 1 trước Ván cuối.

**Sửa** (`LichSu.jsx`): sau khi `nhomHiepThanhBang` gộp bảng (vẫn cần
duyệt tăng dần để gộp đúng), đảo NGƯỢC cả thứ tự bảng lẫn thứ tự Hiệp
TRONG mỗi bảng (`.map(bang => ({ ...bang, hieps: [...bang.hieps].reverse() }))`)
trước khi vẽ. `renderBangVan` cũng đảo ngược `vanCuaHiep` (vốn luôn được
`layVanCuaHiep` trả về tăng dần theo thời gian — logic tính điểm khác
trong App.jsx vẫn cần thứ tự tăng dần đó nên KHÔNG đổi hàm dùng chung,
chỉ đảo tại nơi hiển thị).

**Kiểm thử qua Playwright:** dựng 2 Hiệp giả (2 Ván mỗi hiệp) qua
`localStorage`, xác nhận Hiệp mới hơn hiện trên, và trong Hiệp mở rộng,
Ván mới hơn hiện trên.

### Kiểm tra Phase 4

1. Vào "Chơi với AI" lần đầu (chưa từng chơi) — không thấy bàn tròn
   preview thừa, chỉ thấy phần chọn tên + nhân vật đối thủ.
2. Đặt tên riêng, chơi vài ván — tên hiện đúng khắp nơi (bàn chơi, giải
   trình cách tính điểm, Lịch sử).
3. Lịch sử: Hiệp/Ván mới nhất luôn ở trên cùng, cả khi thu gọn lẫn mở
   rộng 1 Hiệp.

---

## Hoàn thành V11 — báo cáo lại với Huy

1. Toàn bộ 3 Phase chạy đúng, không lỗi Console.
2. Chơi thử vài ván với các mức thời gian khác nhau (30s, 60s, 120s) —
   xác nhận đếm đúng, hết giờ tự động xác nhận đúng cách xếp hiện tại.
3. Phase 4 (tên người chơi, ẩn preview thừa, sắp xếp Lịch sử) chạy đúng
   như mục "Kiểm tra Phase 4" ở trên.
4. Ghi chú cho tương lai: nếu sau này muốn thêm "cảnh báo âm thanh" khi
   sắp hết giờ (ví dụ tiếng tích tắc), chỉ cần thêm vào đúng điều kiện
   `giayConLai <= 10` đã có sẵn ở Bước 3 (Phase 2), không cần thiết kế
   lại gì.
