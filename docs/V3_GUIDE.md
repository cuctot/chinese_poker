# V3_GUIDE.md — Luật chơi đầy đủ, có thể tùy chỉnh (chia Phase, có giải thích)

> **File này THAY THẾ hoàn toàn** V3_GUIDE.md gốc và cả 6 file
> V3_PATCH.md → V3_PATCH6.md trước đó — không cần đọc các file đó nữa.
> Toàn bộ nội dung dưới đây là **trạng thái cuối cùng** sau khi đã gộp hết
> các lần chỉnh sửa, đã kiểm thử lại bằng Node.js (6000 ván ngẫu nhiên qua
> 3 bộ luật khác nhau, tổng điểm cả bàn luôn = 0).

> **Dành cho ai đọc file này:**
> - Nếu bạn là **Claude Code**: làm theo ĐÚNG THỨ TỰ 6 Phase bên dưới.
>   MỖI Phase xong phải DỪNG LẠI, báo cáo đã làm gì, và để Huy tự kiểm
>   tra theo checklist cuối Phase đó trước khi sang Phase tiếp theo —
>   không gộp nhiều Phase làm 1 lượt. Các đoạn "Giải thích" là tài liệu
>   cho Huy đọc, không phải việc cần làm thêm.
> - Nếu bạn là **Huy**: đọc phần "Giải thích" sau mỗi khối code để hiểu
>   đang làm gì trước khi Claude Code chạy, hoặc đọc lại sau khi đã chạy
>   xong để ôn lại.

## Tóm tắt luật chơi hiện tại (bản Chuẩn)

- 13 lá chia thành Chi Đầu (3 lá), Chi Giữa (5 lá), Chi Cuối (5 lá) — Cuối
  phải mạnh hơn hoặc bằng Giữa, Giữa phải mạnh hơn hoặc bằng Đầu.
- Điểm gốc mỗi chi thắng/thua: 1.
- Bộ đặc biệt THAY THẾ hoàn toàn điểm gốc (không cộng dồn):
  - Sám cô chi Đầu: **3** (Sám cô toàn Á: **12**)
  - Tứ quý chi Cuối: **4** (Tứ quý toàn Á: **16**)
  - Thùng phá sảnh chi Cuối: **5** (Thượng 10-J-Q-K-A: **10**, Hạ
    A-2-3-4-5: **7**)
  - Chi Giữa: **luôn tự động = 2× giá trị tương ứng ở Chi Cuối** (không
    khai báo riêng) → Tứ quý 8, Tứ quý A 32, Thùng phá sảnh thường 10,
    Thượng 20, Hạ 14.
- Ăn sập (thắng cả 3 chi trước 1 đối thủ): nhân đôi tổng điểm thực tế của
  3 chi đó.
- Sập làng (ăn sập TẤT CẢ đối thủ trong ván): nhân thêm 1 lần x2 nữa (tổng
  cộng x4 so với mức thường).
- Binh lủng (xếp sai thứ tự): thua trắng cả 3 chi, tính như bị ăn sập.
- Sảnh Hạ (A-2-3-4-5): mặc định mạnh thứ nhì (chỉ thua Sảnh/Thùng Thượng)
  — có tùy chọn đổi thành yếu nhất.
- Chi Á: mỗi người nhận thêm `1 × (số lá Á của mình − 1)` điểm, tính
  **1 LẦN cho cả ván** (không phải cộng dồn theo từng đối thủ) — độc lập
  với 3 chi trên. Với đúng 4 người chơi dùng trọn 1 bộ 52 lá, tổng điểm
  phần này trên cả bàn luôn = 0.
- Toàn bộ số trên đều chỉnh được trong tab "Luật chơi", có thể tải sẵn
  bộ "Tối giản" (không thưởng gì), lưu bộ tự chỉnh thành "luật riêng" có
  tên, và tải lại bất cứ lúc nào.

---

## Phase 1 — `src/ruleset.js` (tạo mới / ghi đè toàn bộ)

```js
// ruleset.js
// Nguồn sự thật duy nhất cho toàn bộ luật tính điểm Mậu Binh trong app.
// "chuan" là bộ luật mặc định — tổng hợp và đối chiếu khớp nhau giữa
// nhiều nguồn Mậu Binh online độc lập, đã hiệu chỉnh theo xác nhận của Huy.

export const RULESET_PRESETS = [
  {
    id: 'toi_gian',
    ten: 'Tối giản',
    moTa: 'Chỉ +1/-1 mỗi chi, không thưởng bài đặc biệt, không tính chi Á.',
    ruleset: {
      version: 6,
      pointsPerChi: { dau: 1, giua: 1, cuoi: 1 },
      bonusTheoLoai: { dau: {}, cuoi: {} },
      sapBonus: { enabled: true, multiplier: 2 },
      sapLangBonus: { enabled: true, multiplier: 2 },
      binhLungPenalty: { enabled: true, countAsSap: true },
      sanhHaYeuNhat: false,
      diemA: { enabled: false, diem: 0 },
    },
  },
  {
    id: 'chuan',
    ten: 'Chuẩn (phổ biến nhất)',
    moTa: 'Sám cô chi Đầu +3 (Sám A +12). Chi Cuối: Tứ quý +4 (Tứ quý A +16), Thùng phá sảnh +5 (Thượng +10, Hạ +7). Chi Giữa tự động = 2x Chi Cuối. Ăn sập x2, sập làng x2 nữa. Chi Á: 1 điểm/lá.',
    ruleset: {
      version: 6,
      pointsPerChi: { dau: 1, giua: 1, cuoi: 1 },
      bonusTheoLoai: {
        // key = "loai" (hoặc mã chi tiết) trả về từ cardEngine.js:
        //  - Chi Đầu (3 lá, danhGia3La): 0=Mậu thầu,1=Đôi,2=Sám cô,
        //    '2_A'=Sám cô toàn Á
        //  - Chi Cuối (5 lá, danhGia5La): 0=Mậu thầu,1=Đôi,2=Thú,3=Sám cô,
        //    4=Sảnh,5=Thùng,6=Cù lũ,7=Tứ quý,'7_A'=Tứ quý toàn Á,
        //    8=Thùng phá sảnh,'8_thuong'=Thượng (10-J-Q-K-A),
        //    '8_ha'=Hạ (A-2-3-4-5)
        // Chi Giữa KHÔNG khai báo ở đây — luôn tự động = 2x giá trị cuoi.
        dau: { 2: 3, '2_A': 12 },
        cuoi: { 7: 4, '7_A': 16, 8: 5, '8_thuong': 10, '8_ha': 7 },
      },
      sapBonus: { enabled: true, multiplier: 2 },
      sapLangBonus: { enabled: true, multiplier: 2 },
      binhLungPenalty: { enabled: true, countAsSap: true },
      sanhHaYeuNhat: false, // true = coi Sảnh Hạ là yếu nhất thay vì mạnh thứ nhì
      diemA: { enabled: true, diem: 1 }, // điểm mỗi lá Á chênh lệch so với đối thủ
    },
  },
];

export function timPreset(id) {
  return RULESET_PRESETS.find(p => p.id === id) || RULESET_PRESETS[1];
}

export function layRulesetTuPreset(id) {
  return JSON.parse(JSON.stringify(timPreset(id).ruleset));
}

export function isValidRuleset(obj) {
  if (!obj || typeof obj !== "object") return false;
  if (typeof obj.version !== "number") return false;
  if (!obj.pointsPerChi || typeof obj.pointsPerChi.dau !== "number") return false;
  if (!obj.bonusTheoLoai || typeof obj.bonusTheoLoai !== "object") return false;
  if (!obj.sapBonus || typeof obj.sapBonus.multiplier !== "number") return false;
  if (!obj.binhLungPenalty) return false;
  return true;
}
```

### Giải thích Phase 1

- **"Ruleset" là gì:** 1 object JavaScript chứa MỌI con số có thể thay
  đổi trong cách tính điểm — điểm gốc, bonus, hệ số nhân, các bật/tắt.
  Thay vì viết chết những con số này rải rác trong code tính điểm, ta gom
  hết vào 1 chỗ. Lợi ích: đổi luật chơi = đổi vài con số trong 1 object,
  không phải sửa logic ở nhiều nơi.
- **Vì sao là 1 MẢNG các preset, không phải 1 object duy nhất:** vì Huy
  muốn có nhiều bộ luật để chọn (Tối giản, Chuẩn, và sau này tự lưu thêm
  bộ riêng). Mỗi phần tử trong mảng có `id` (để tham chiếu), `ten`/`moTa`
  (hiển thị cho người dùng), và `ruleset` (nội dung thật).
- **Vì sao `bonusTheoLoai` dùng cả số (`2`, `7`, `8`) lẫn chuỗi có gạch
  dưới (`'2_A'`, `'8_thuong'`):** số là mã "loại bài" chuẩn (đã có từ V1,
  trả về từ hàm đánh giá bài). Chuỗi gạch dưới là các trường hợp ĐẶC BIỆT
  HƠN nằm bên trong 1 loại — ví dụ `7` là "Tứ quý bất kỳ", còn `'7_A'` là
  "Tứ quý CỤ THỂ gồm toàn lá Á". Trong JavaScript, key của object luôn tự
  động là chuỗi, nên việc trộn số và chuỗi-có-gạch-dưới làm key hoàn toàn
  hợp lệ — không cần lo về kiểu dữ liệu.
- **Vì sao KHÔNG có bảng `giua` trong `bonusTheoLoai`:** đây là chỗ đơn
  giản hóa quan trọng — thay vì bắt Huy nhập 2 lần (1 lần cho Chi Giữa, 1
  lần cho Chi Cuối), hệ thống CHỈ giữ 1 bảng gốc (Chi Cuối), còn Chi Giữa
  luôn được TÍNH TỰ ĐỘNG = 2 lần giá trị đó (logic này nằm ở File 2, hàm
  `diemMotChi`). Ít số phải nhớ hơn, không thể nhập lệch nhau.
- **`timPreset`/`layRulesetTuPreset`:** `timPreset` chỉ tìm và trả về
  đúng preset (có thể bị nhiều nơi khác cùng giữ tham chiếu tới nó nếu
  dùng trực tiếp — nguy hiểm vì sửa 1 chỗ ảnh hưởng chỗ khác).
  `layRulesetTuPreset` gọi thêm `JSON.parse(JSON.stringify(...))` để tạo
  ra 1 BẢN SAO ĐỘC LẬP — đây là kỹ thuật "deep clone" nhanh gọn trong
  JavaScript, dùng bất cứ khi nào cần chắc chắn sửa bản này không ảnh
  hưởng bản gốc.
- **`isValidRuleset`:** hàm "phòng thủ" — kiểm tra 1 dữ liệu đọc từ
  localStorage (bộ nhớ trình duyệt) có đúng cấu trúc mong đợi không,
  trước khi tin dùng nó. Nếu dữ liệu bị hỏng/thiếu (ví dụ do phiên bản
  cũ hơn lưu lại, thiếu field mới), hàm trả về `false` để code gọi nó có
  thể fallback về mặc định an toàn, tránh app bị lỗi khi mở lên.

### Kiểm tra Phase 1

Mở Console:
```js
import { RULESET_PRESETS, layRulesetTuPreset, isValidRuleset } from './ruleset.js'
console.log(RULESET_PRESETS.length); // phải = 2
console.log(layRulesetTuPreset('chuan')); // phải in đúng object luật Chuẩn
console.log(isValidRuleset({})); // phải in ra false
```

Dừng lại ở đây. Xác nhận cả 3 dòng in đúng trước khi báo cáo và sang
Phase 2.

---

## Phase 2 — `src/cardEngine.js` (giữ nguyên phần V1: `taoBoBai`, `xaoBai`,
`chiaBai`, `danhGia5La`, `danhGia3La`, `soSanh` — chỉ khác cách đánh số
`rank`; và `sapXepDeHienThi` từ V2_PATCH. XÓA hàm `tinhDiem` cũ, thay toàn
bộ phần dưới đây vào cuối file)

```js
// cardEngine.js
// rank: 2-14 tương ứng 2,3,4,5,6,7,8,9,10,J,Q,K,A (14 = Át, mạnh nhất)
// suit: 0-3 tương ứng 4 chất, chỉ để phân biệt 4 lá cùng rank

export function taoBoBai() {
  const boBai = [];
  for (let rank = 2; rank <= 14; rank++) {
    for (let suit = 0; suit < 4; suit++) {
      boBai.push({ rank, suit });
    }
  }
  return boBai;
}

export function xaoBai(boBai) {
  const ketQua = [...boBai];
  for (let i = ketQua.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ketQua[i], ketQua[j]] = [ketQua[j], ketQua[i]];
  }
  return ketQua;
}

export function chiaBai() {
  const bai = xaoBai(taoBoBai());
  return [bai.slice(0, 13), bai.slice(13, 26), bai.slice(26, 39), bai.slice(39, 52)];
}
```

### Giải thích: `taoBoBai`, `xaoBai`, `chiaBai`

- **Rank tự nhiên (2-14):** trước đây rank đánh số 0-12 (0=2, 12=A), phải
  tự quy đổi trong đầu khi đọc code. Giờ `rank` chính là giá trị thật —
  thấy `rank: 14` là biết ngay đó là Á, không cần tính toán gì.
- `taoBoBai` chỉ đơn giản là 2 vòng lặp lồng nhau: 13 rank × 4 chất = 52
  lá — đúng 1 bộ bài Tây tiêu chuẩn.
- `xaoBai` dùng thuật toán xáo bài Fisher-Yates (đi từ cuối mảng về đầu,
  mỗi bước đổi chỗ phần tử hiện tại với 1 phần tử ngẫu nhiên đứng TRƯỚC
  hoặc BẰNG nó) — đây là thuật toán xáo trộn chuẩn, đảm bảo mọi thứ tự
  đều có xác suất xảy ra bằng nhau (không thiên vị).
- `chiaBai` chia 52 lá đã xáo thành 4 phần 13 lá bằng `slice` — người 1
  nhận lá 0-12, người 2 nhận 13-25, v.v.

```js
// Đánh giá độ mạnh 1 bộ 5 lá. loai: 0=Mậu thầu,1=Đôi,2=Thú,3=Sám cô,
// 4=Sảnh,5=Thùng,6=Cù lũ,7=Tứ quý,8=Thùng phá sảnh
export function danhGia5La(laBai) {
  const ranks = laBai.map(l => l.rank).sort((a, b) => b - a);
  const suits = laBai.map(l => l.suit);
  const laThung = new Set(suits).size === 1;
  let laSanh = ranks[0] - ranks[4] === 4 && new Set(ranks).size === 5;
  if (JSON.stringify(ranks) === JSON.stringify([14, 5, 4, 3, 2])) laSanh = true; // A-2-3-4-5

  const demSoLuong = {};
  ranks.forEach(r => { demSoLuong[r] = (demSoLuong[r] || 0) + 1; });
  const cacSoLuong = Object.values(demSoLuong).sort((a, b) => b - a);

  if (laSanh && laThung) return { loai: 8, diem: ranks };
  if (cacSoLuong[0] === 4) return { loai: 7, diem: ranks };
  if (cacSoLuong[0] === 3 && cacSoLuong[1] === 2) return { loai: 6, diem: ranks };
  if (laThung) return { loai: 5, diem: ranks };
  if (laSanh) return { loai: 4, diem: ranks };
  if (cacSoLuong[0] === 3) return { loai: 3, diem: ranks };
  if (cacSoLuong[0] === 2 && cacSoLuong[1] === 2) return { loai: 2, diem: ranks };
  if (cacSoLuong[0] === 2) return { loai: 1, diem: ranks };
  return { loai: 0, diem: ranks };
}

// Đánh giá độ mạnh 1 bộ 3 lá (chi Đầu): 0=Mậu thầu, 1=Đôi, 2=Sám cô
export function danhGia3La(laBai) {
  const ranks = laBai.map(l => l.rank).sort((a, b) => b - a);
  const demSoLuong = {};
  ranks.forEach(r => { demSoLuong[r] = (demSoLuong[r] || 0) + 1; });
  const cacSoLuong = Object.values(demSoLuong).sort((a, b) => b - a);
  if (cacSoLuong[0] === 3) return { loai: 2, diem: ranks };
  if (cacSoLuong[0] === 2) return { loai: 1, diem: ranks };
  return { loai: 0, diem: ranks };
}

// So sánh 2 kết quả đánh giá: 1 nếu a mạnh hơn, -1 nếu b mạnh hơn, 0 hòa
export function soSanh(a, b) {
  if (a.loai !== b.loai) return a.loai > b.loai ? 1 : -1;
  for (let i = 0; i < Math.min(a.diem.length, b.diem.length); i++) {
    if (a.diem[i] !== b.diem[i]) return a.diem[i] > b.diem[i] ? 1 : -1;
  }
  return 0;
}

// Sắp xếp 1 danh sách lá theo cao->thấp, dùng để hiển thị SAU khi xác nhận
export function sapXepDeHienThi(danhSachLa) {
  return [...danhSachLa].sort((a, b) => b.rank - a.rank);
}
```

### Giải thích: `danhGia5La`, `danhGia3La`, `soSanh`, `sapXepDeHienThi`

- **Kết quả đánh giá luôn có 2 phần — `loai` và `diem`:** `loai` là 1 số
  cho biết ĐẲNG CẤP của bộ bài (số càng lớn càng mạnh — Tứ quý mạnh hơn
  Sảnh, v.v). `diem` là mảng các rank đã sắp xếp giảm dần, dùng để phân
  định thắng-thua khi 2 bộ bài CÙNG đẳng cấp (ví dụ 2 người cùng có Sảnh,
  ai sảnh cao hơn thắng).
- **Cách nhận diện từng loại** dựa trên 2 câu hỏi: "có phải 5 lá cùng
  chất không" (`laThung`) và "có phải 5 rank liên tiếp không" (`laSanh`,
  kiểm tra bằng `ranks[0] - ranks[4] === 4` — nếu 5 số liên tiếp, số lớn
  nhất trừ số nhỏ nhất luôn = 4). Trường hợp đặc biệt A-2-3-4-5 (Á đóng
  vai "1", không phải "14") được bắt riêng bằng cách so sánh trực tiếp với
  mảng `[14,5,4,3,2]` (thứ tự sort giảm dần thật của bộ này).
  `demSoLuong`/`cacSoLuong` đếm xem có bao nhiêu lá cùng rank (để phát
  hiện Đôi, Sám cô, Cù lũ, Tứ quý) — dùng chung 1 kỹ thuật đếm-rồi-sort
  cho cả 3La và 5La.
- **`soSanh` so `loai` trước, `diem` sau:** đúng logic bài Tây — đẳng cấp
  cao hơn LUÔN thắng bất kể rank cụ thể (Sảnh 2-3-4-5-6 luôn thua Thú dù
  rank thấp); chỉ khi 2 bên CÙNG đẳng cấp mới cần so tiếp từng rank.
- **`sapXepDeHienThi`:** chỉ dùng để hiển thị đẹp mắt sau khi xác nhận bài
  (đã có từ bản vá V2) — không liên quan gì đến việc tính điểm hay so
  sánh mạnh yếu.

```js
// Điều chỉnh RIÊNG mảng diem dùng để SO SÁNH mạnh yếu (không đụng bản gốc
// dùng để tra bảng thưởng) cho Sảnh/Thùng phá sảnh Hạ (A-2-3-4-5), theo
// ruleset.sanhHaYeuNhat.
function dieuChinhSoSanhSanhHa(danhGia, ruleset) {
  const laSanhHa = (danhGia.loai === 4 || danhGia.loai === 8)
    && JSON.stringify(danhGia.diem) === JSON.stringify([14, 5, 4, 3, 2]);
  if (!laSanhHa) return danhGia;
  if (ruleset?.sanhHaYeuNhat) {
    // Coi Á là rank 1 (nhỏ nhất thật sự) -> [5,4,3,2,1], tự động yếu hơn
    // MỌI sảnh khác, kể cả 2-3-4-5-6 ([6,5,4,3,2]).
    return { ...danhGia, diem: [5, 4, 3, 2, 1] };
  }
  return danhGia; // mặc định: giữ [14,5,4,3,2] -> tự nhiên mạnh thứ nhì
}
```

### Giải thích: `dieuChinhSoSanhSanhHa`

Đây là ví dụ về **tách riêng "sự thật khách quan" khỏi "luật do người chơi
đặt ra"**. `danhGia5La` luôn trả về đúng 1 sự thật không đổi ("đây là bộ
gì, gồm rank nào") — hàm này KHÔNG được sửa để "biết" về luật chơi, vì nó
phải luôn đúng bất kể ai đang chơi luật gì. Việc "Sảnh Hạ nên mạnh hay
yếu" lại phụ thuộc vào lựa chọn của Huy (`ruleset.sanhHaYeuNhat`), nên
được xử lý ở 1 hàm RIÊNG, chỉ dùng khi cần SO SÁNH — không đụng vào bản
gốc dùng để tra thưởng. Nhờ rank tự nhiên (Á=14), khi coi Sảnh Hạ là yếu
nhất chỉ cần đổi vị trí của Á từ 14 xuống 1 trong mảng so sánh — rất trực
quan.

```js
// Kiểm tra cách xếp 3 chi có hợp lệ không (cuối >= giữa >= đầu).
// ruleset là tùy chọn — nếu không truyền (vd trong aiEngine.js), coi như
// sanhHaYeuNhat = false (mặc định).
export function xepBaiHopLe(chiDau, chiGiua, chiCuoi, ruleset) {
  const dDau = danhGia3La(chiDau), dGiua = danhGia5La(chiGiua), dCuoi = danhGia5La(chiCuoi);
  const sGiua = dieuChinhSoSanhSanhHa(dGiua, ruleset);
  const sCuoi = dieuChinhSoSanhSanhHa(dCuoi, ruleset);
  if (soSanh(sCuoi, sGiua) < 0) return false;
  const loaiDauTren5 = dDau.loai === 2 ? 3 : dDau.loai;
  return dGiua.loai >= loaiDauTren5;
}
```

### Giải thích: `xepBaiHopLe`

Luật bắt buộc: Chi Cuối phải mạnh hơn hoặc bằng Chi Giữa (`soSanh(sCuoi,
sGiua) < 0` nghĩa là Cuối yếu hơn Giữa → sai luật → `false`). Đoạn
`loaiDauTren5` là 1 mẹo nhỏ để so sánh Chi Đầu (thang 3 lá, loai 0-2) với
Chi Giữa (thang 5 lá, loai 0-8) trên CÙNG 1 thang đo: Sám cô ở Chi Đầu
(loai=2 theo thang 3 lá) được quy đổi tương đương "Sám cô" ở thang 5 lá
(loai=3) để so sánh công bằng — nếu không quy đổi, số `2` (Sám cô, thang 3
lá) sẽ bị so nhầm với số `2` (Thú, thang 5 lá) ở Chi Giữa.

```js
// Phân loại CHI TIẾT hơn "loai" — tách các trường hợp đặc biệt:
// '2_A' = Sám cô toàn Á (chỉ ở Chi Đầu), '7_A' = Tứ quý toàn Á (chỉ ở Chi
// Giữa/Cuối), '8_thuong' = Thùng phá sảnh Thượng, '8_ha' = Thùng phá sảnh
// Hạ. Cần biết tenChi vì "loai" số 2 có nghĩa khác nhau ở thang 3 lá
// (Sám cô) và 5 lá (Thú).
function maLoaiChiTiet(danhGia, tenChi) {
  if (tenChi === 'dau' && danhGia.loai === 2 && danhGia.diem[0] === 14) return '2_A';
  if (tenChi !== 'dau' && danhGia.loai === 7) {
    const dem = {};
    danhGia.diem.forEach(r => { dem[r] = (dem[r] || 0) + 1; });
    const rankBo4 = Number(Object.keys(dem).find(r => dem[r] === 4));
    if (rankBo4 === 14) return '7_A';
  }
  if (danhGia.loai === 8) {
    const r = JSON.stringify(danhGia.diem);
    if (r === JSON.stringify([14, 13, 12, 11, 10])) return '8_thuong';
    if (r === JSON.stringify([14, 5, 4, 3, 2])) return '8_ha';
  }
  return String(danhGia.loai);
}
```

### Giải thích: `maLoaiChiTiet`

Hàm này trả về 1 "mã" (chuỗi) dùng để TRA BẢNG THƯỞNG trong `ruleset` —
khác với `loai` (chỉ dùng để so mạnh-yếu). Phần khó nhất: `loai` là 1 con
số dùng CHUNG cho 2 thang đo khác nhau (3 lá và 5 lá) nên có thể mang 2 ý
nghĩa khác hẳn nhau — `loai=2` là "Sám cô" ở Chi Đầu nhưng là "Thú" (2
đôi) ở Chi Giữa/Cuối. Vì vậy hàm bắt buộc phải nhận thêm `tenChi` để biết
đang xét ở thang nào, tránh nhận nhầm 1 cặp đôi ở Chi Giữa thành "Sám cô".
Với Tứ quý, phải tìm ĐÚNG rank nào xuất hiện 4 lần (không phải nhìn đại
`diem[0]`, vì lá "dư" đi kèm 4 lá giống nhau có thể cao HOẶC thấp hơn bộ
4 lá đó).

```js
// Điểm 1 chi: nếu loại bài THẮNG có trong bảng bonus, giá trị đó THAY THẾ
// hoàn toàn điểm gốc (không cộng dồn). Chi Giữa không lưu bonus riêng —
// luôn = 2 x giá trị hiệu lực ở Chi Cuối cho cùng loại bài.
function diemMotChi(ruleset, tenChi, danhGiaBenThang) {
  const goc = ruleset.pointsPerChi[tenChi];
  const ma = maLoaiChiTiet(danhGiaBenThang, tenChi);

  if (tenChi === 'giua') {
    const bangCuoi = ruleset.bonusTheoLoai.cuoi || {};
    if (Object.prototype.hasOwnProperty.call(bangCuoi, ma)) return bangCuoi[ma] * 2;
    return goc;
  }
  const bang = ruleset.bonusTheoLoai[tenChi] || {};
  if (Object.prototype.hasOwnProperty.call(bang, ma)) return bang[ma];
  return goc;
}
```

### Giải thích: `diemMotChi`

2 điều quan trọng cần hiểu:
1. **"Thay thế" chứ không "cộng dồn":** nếu bộ bài thắng nằm trong bảng
   bonus (ví dụ Tứ quý = 4), điểm chi đó là ĐÚNG 4 — không phải 1 (điểm
   gốc) + 4 = 5. Đây là lý do dùng
   `Object.prototype.hasOwnProperty.call(bang, ma)` thay vì cách viết tắt
   quen thuộc `bang[ma] || 0` — vì `|| 0` không phân biệt được "không có
   trong bảng" với "có trong bảng nhưng giá trị đúng là 0". Dùng
   `hasOwnProperty` để chắc chắn: có khai báo → dùng đúng số đó (thay
   thế); không khai báo → mới rơi về điểm gốc.
2. **Chi Giữa luôn nhân đôi Chi Cuối:** khi `tenChi === 'giua'`, hàm
   KHÔNG tra bảng riêng của Giữa (vì không tồn tại) — nó tra bảng của
   `cuoi` rồi nhân 2. Đây chính là chỗ hiện thực hóa quy tắc đơn giản hóa
   đã bàn ở File 1.

```js
// Đếm số lá Á (rank 14) trong toàn bộ 13 lá của 1 người chơi
function demSoLaA(nguoiChoi) {
  return [...nguoiChoi.chiDau, ...nguoiChoi.chiGiua, ...nguoiChoi.chiCuoi]
    .filter(l => l.rank === 14).length;
}

// Giống diemMotChi nhưng trả thêm "ma" (mã loại bài) — dùng để hiển thị
// giải trình cách tính cho người chơi xem, không đổi kết quả tính điểm.
function diemMotChiChiTiet(ruleset, tenChi, danhGiaBenThang) {
  const goc = ruleset.pointsPerChi[tenChi];
  const ma = maLoaiChiTiet(danhGiaBenThang, tenChi);
  if (tenChi === 'giua') {
    const bangCuoi = ruleset.bonusTheoLoai.cuoi || {};
    if (Object.prototype.hasOwnProperty.call(bangCuoi, ma)) return { diem: bangCuoi[ma] * 2, ma };
    return { diem: goc, ma };
  }
  const bang = ruleset.bonusTheoLoai[tenChi] || {};
  if (Object.prototype.hasOwnProperty.call(bang, ma)) return { diem: bang[ma], ma };
  return { diem: goc, ma };
}

// Tên tiếng Việt hiển thị cho mỗi mã loại bài — dùng riêng cho giải trình
const TEN_LOAI_3_LA_GT = { '0': 'Mậu thầu', '1': 'Đôi', '2': 'Sám cô', '2_A': 'Sám cô toàn Á' };
const TEN_LOAI_5_LA_GT = {
  '0': 'Mậu thầu', '1': 'Đôi', '2': 'Thú', '3': 'Sám cô', '4': 'Sảnh', '5': 'Thùng',
  '6': 'Cù lũ', '7': 'Tứ quý', '7_A': 'Tứ quý toàn Á', '8': 'Thùng phá sảnh',
  '8_thuong': 'Thùng phá sảnh Thượng', '8_ha': 'Thùng phá sảnh Hạ',
};
function tenLoaiChiTiet(tenChi, ma) {
  return (tenChi === 'dau' ? TEN_LOAI_3_LA_GT : TEN_LOAI_5_LA_GT)[ma] || ma;
}
```

### Giải thích: `demSoLaA`, `diemMotChiChiTiet`, `tenLoaiChiTiet`

`demSoLaA` gộp cả 3 chi (`...chiDau, ...chiGiua, ...chiCuoi` — toán tử
`...` "trải" từng phần tử của 3 mảng thành 1 mảng 13 lá), rồi lọc ra
những lá có `rank === 14` (Á) và đếm số lượng — dùng cho chi Á bên dưới.
`diemMotChiChiTiet`/`tenLoaiChiTiet` là bản "nói nhiều hơn" của
`diemMotChi` — thay vì chỉ trả về 1 con số, trả thêm mã loại bài (`ma`) và
có hàm dịch mã đó ra tên tiếng Việt dễ đọc, phục vụ RIÊNG cho việc hiển
thị giải trình cho người chơi xem — không ảnh hưởng gì tới việc tính điểm
thật (2 hàm hoàn toàn tách biệt, `diemMotChi` gốc vẫn dùng y hệt như cũ).

```js
// So 3 chi giữa 2 người chơi theo ruleset hiện thời (KHÔNG gồm chi Á —
// chi Á được tính riêng, 1 lần cho mỗi người, ở tinhDiem() bên dưới).
// Trả về { diemA, diemB, aSap, bSap, dienGiai } — diemA/diemB là điểm 2
// bên nhận từ riêng cặp này (luôn diemA === -diemB); aSap/bSap cho biết
// cặp này có phải ăn sập không (dùng để tinhDiem() phát hiện "sập làng");
// dienGiai là mảng các dòng mô tả bằng tiếng Việt, dùng để hiển thị cho
// người chơi kiểm tra lại cách tính.
function soBai2Nguoi(ruleset, a, b) {
  const dDauA = danhGia3La(a.chiDau), dDauB = danhGia3La(b.chiDau);
  const dGiuaA = danhGia5La(a.chiGiua), dGiuaB = danhGia5La(b.chiGiua);
  const dCuoiA = danhGia5La(a.chiCuoi), dCuoiB = danhGia5La(b.chiCuoi);

  const sGiuaA = dieuChinhSoSanhSanhHa(dGiuaA, ruleset);
  const sGiuaB = dieuChinhSoSanhSanhHa(dGiuaB, ruleset);
  const sCuoiA = dieuChinhSoSanhSanhHa(dCuoiA, ruleset);
  const sCuoiB = dieuChinhSoSanhSanhHa(dCuoiB, ruleset);

  const aHopLe = xepBaiHopLe(a.chiDau, a.chiGiua, a.chiCuoi, ruleset);
  const bHopLe = xepBaiHopLe(b.chiDau, b.chiGiua, b.chiCuoi, ruleset);

  let diemA, diemB, aSap, bSap;
  const dienGiai = [];

  if (ruleset.binhLungPenalty.enabled && aHopLe !== bHopLe) {
    const benLung = aHopLe ? b : a;
    const benHopLe = aHopLe ? a : b;
    const kqDau = diemMotChiChiTiet(ruleset, 'dau', danhGia3La(benHopLe.chiDau));
    const kqGiua = diemMotChiChiTiet(ruleset, 'giua', danhGia5La(benHopLe.chiGiua));
    const kqCuoi = diemMotChiChiTiet(ruleset, 'cuoi', danhGia5La(benHopLe.chiCuoi));
    const tong = kqDau.diem + kqGiua.diem + kqCuoi.diem;
    const coNhanSap = ruleset.binhLungPenalty.countAsSap && ruleset.sapBonus.enabled;
    const daNhan = coNhanSap ? tong * ruleset.sapBonus.multiplier : tong;
    const diemHopLe = benHopLe === a ? daNhan : -daNhan;
    diemA = diemHopLe; diemB = -diemHopLe;
    aSap = benHopLe === a; bSap = benHopLe === b;

    dienGiai.push(`${benLung === a ? 'Bạn' : 'Đối thủ'} xếp bài KHÔNG HỢP LỆ (binh lủng) → thua trắng cả 3 chi.`);
    dienGiai.push(
      `Bên hợp lệ tính theo bài thật: Đầu(${tenLoaiChiTiet('dau', kqDau.ma)})=${kqDau.diem}, ` +
      `Giữa(${tenLoaiChiTiet('giua', kqGiua.ma)})=${kqGiua.diem}, Cuối(${tenLoaiChiTiet('cuoi', kqCuoi.ma)})=${kqCuoi.diem}` +
      ` → tổng ${tong}` + (coNhanSap ? ` × ${ruleset.sapBonus.multiplier} (tính như ăn sập) = ${daNhan}` : '')
    );
  } else {
    const soDau = soSanh(dDauA, dDauB);
    const soGiua = soSanh(sGiuaA, sGiuaB);
    const soCuoi = soSanh(sCuoiA, sCuoiB);

    const kqDau = diemMotChiChiTiet(ruleset, 'dau', soDau > 0 ? dDauA : dDauB);
    const kqGiua = diemMotChiChiTiet(ruleset, 'giua', soGiua > 0 ? dGiuaA : dGiuaB);
    const kqCuoi = diemMotChiChiTiet(ruleset, 'cuoi', soCuoi > 0 ? dCuoiA : dCuoiB);

    const vDau = soDau === 0 ? 0 : kqDau.diem;
    const vGiua = soGiua === 0 ? 0 : kqGiua.diem;
    const vCuoi = soCuoi === 0 ? 0 : kqCuoi.diem;

    diemA = (soDau > 0 ? vDau : soDau < 0 ? -vDau : 0)
          + (soGiua > 0 ? vGiua : soGiua < 0 ? -vGiua : 0)
          + (soCuoi > 0 ? vCuoi : soCuoi < 0 ? -vCuoi : 0);

    dienGiai.push(
      soDau === 0 ? 'Chi Đầu: hòa (0)' : `Chi Đầu: ${soDau > 0 ? 'Bạn' : 'Đối thủ'} thắng bằng ${tenLoaiChiTiet('dau', kqDau.ma)} → ${soDau > 0 ? '+' : '-'}${vDau}`,
      soGiua === 0 ? 'Chi Giữa: hòa (0)' : `Chi Giữa: ${soGiua > 0 ? 'Bạn' : 'Đối thủ'} thắng bằng ${tenLoaiChiTiet('giua', kqGiua.ma)} → ${soGiua > 0 ? '+' : '-'}${vGiua}`,
      soCuoi === 0 ? 'Chi Cuối: hòa (0)' : `Chi Cuối: ${soCuoi > 0 ? 'Bạn' : 'Đối thủ'} thắng bằng ${tenLoaiChiTiet('cuoi', kqCuoi.ma)} → ${soCuoi > 0 ? '+' : '-'}${vCuoi}`,
      `Cộng 3 chi: ${diemA >= 0 ? '+' : ''}${diemA}`
    );

    aSap = soDau > 0 && soGiua > 0 && soCuoi > 0;
    bSap = soDau < 0 && soGiua < 0 && soCuoi < 0;
    if (ruleset.sapBonus.enabled && (aSap || bSap)) {
      const truoc = diemA;
      diemA *= ruleset.sapBonus.multiplier;
      dienGiai.push(`${aSap ? 'Bạn' : 'Đối thủ'} thắng cả 3 chi (ăn sập) → ${truoc} × ${ruleset.sapBonus.multiplier} = ${diemA}`);
    }
    diemB = -diemA;
  }

  return { diemA, diemB, aSap, bSap, dienGiai };
}
```

### Giải thích: `soBai2Nguoi` (hàm quan trọng nhất)

Hàm này tính điểm giữa ĐÚNG 2 người chơi — mọi thứ khác (nhiều người
chơi, sập làng) được xử lý ở tầng trên (`tinhDiem`). Đọc theo 4 khối:

1. **Đánh giá + điều chỉnh:** tính `loai`/`diem` gốc của cả 3 chi mỗi bên
   (`dDauA`, `dGiuaA`...), rồi tạo thêm bản ĐÃ ĐIỀU CHỈNH riêng cho việc
   so sánh (`sGiuaA`, `sCuoiA`...) — chỉ Chi Giữa/Cuối cần điều chỉnh vì
   chỉ đó mới có thể là Sảnh Hạ.
2. **Nhánh Binh lủng** (`if`): nếu 1 bên hợp lệ, bên kia không, bên lủng
   THUA THẲNG cả 3 chi — tính theo đúng loại bài THẬT của bên hợp lệ (dùng
   `diemMotChi`), không cần so từng chi với bên lủng nữa vì họ coi như đã
   phạm luật.
3. **Nhánh bình thường** (`else`): so từng chi 1, cộng dồn điểm 3 chi lại,
   rồi kiểm tra "có thắng cả 3 không" (`aThangCa3`/`bThangCa3`) để quyết
   định có nhân hệ số ăn sập hay không.

Hàm này CHƯA tính chi Á — chi Á không phải 1 khoản "so giữa 2 người" mà là
1 khoản CỘNG THẲNG cho từng người dựa trên chính lá bài của họ, nên được
tính ở tầng cao hơn (`tinhDiem`, chỉ chạy 1 lần cho mỗi người, không lặp
lại theo từng cặp — xem giải thích chi tiết bên dưới vì sao phải làm vậy).

Cả hàm LUÔN đảm bảo `diemB = -diemA` (hoặc tính đối xứng tương đương) ở
mọi bước — đây là nguyên tắc cốt lõi giữ cho **tổng điểm toàn bàn luôn
bằng 0** đối với 3 chi Đầu/Giữa/Cuối, sẽ giải thích kỹ hơn ở `tinhDiem`
bên dưới.

```js
// Tính điểm 1 ván, kèm giải trình chi tiết cách tính cho từng người, so
// với từng đối thủ — để hiển thị cho người chơi tự kiểm tra lại.
// Trả về { diem, dienGiaiTheoDoiThu }:
//   diem = { ten: tổng điểm } (tổng luôn = 0, với ĐÚNG 4 người chơi dùng
//     trọn 1 bộ 52 lá). Bao gồm "sập làng": ai ăn sập TẤT CẢ đối thủ được
//     nhân thêm 1 lần hệ số nữa (mặc định x2).
//   dienGiaiTheoDoiThu = { ten: [ { doiThu, dienGiai: [...], diemNhanDuoc } ] }
//     — mảng các dòng mô tả cách tính, so với từng đối thủ.
export function tinhDiem(nguoiChoi, ruleset) {
  const diem = {};
  const dienGiaiTheoDoiThu = {};
  nguoiChoi.forEach(p => { diem[p.ten] = 0; dienGiaiTheoDoiThu[p.ten] = []; });

  const ketQuaCap = [];
  for (let i = 0; i < nguoiChoi.length; i++) {
    for (let j = i + 1; j < nguoiChoi.length; j++) {
      ketQuaCap.push({ i, j, ...soBai2Nguoi(ruleset, nguoiChoi[i], nguoiChoi[j]) });
    }
  }

  const soDoiThu = nguoiChoi.length - 1;
  const demSap = nguoiChoi.map(() => 0);
  ketQuaCap.forEach(({ i, j, aSap, bSap }) => {
    if (aSap) demSap[i]++;
    if (bSap) demSap[j]++;
  });
  const heSoSapLang = ruleset.sapLangBonus?.enabled === false ? 1 : (ruleset.sapLangBonus?.multiplier ?? 2);
  const laSapLang = demSap.map(dem => soDoiThu > 0 && dem === soDoiThu);

  ketQuaCap.forEach(({ i, j, diemA, diemB, dienGiai }) => {
    let dA = diemA, dB = diemB;
    const ghiChuSapLang = [];
    if (laSapLang[i] || laSapLang[j]) {
      dA *= heSoSapLang; dB *= heSoSapLang;
      ghiChuSapLang.push(`${laSapLang[i] ? nguoiChoi[i].ten : nguoiChoi[j].ten} ăn sập TẤT CẢ đối thủ trong ván (sập làng) → nhân thêm × ${heSoSapLang}`);
    }
    diem[nguoiChoi[i].ten] += dA;
    diem[nguoiChoi[j].ten] += dB;

    dienGiaiTheoDoiThu[nguoiChoi[i].ten].push({ doiThu: nguoiChoi[j].ten, dienGiai: [...dienGiai, ...ghiChuSapLang], diemNhanDuoc: dA });
    dienGiaiTheoDoiThu[nguoiChoi[j].ten].push({ doiThu: nguoiChoi[i].ten, dienGiai: [...dienGiai, ...ghiChuSapLang], diemNhanDuoc: dB });
  });

  // Chi Á: cộng 1 LẦN cho mỗi người chơi — KHÔNG lặp lại theo từng cặp
  // đối thủ (khác hẳn cách tính 3 chi ở trên). Công thức:
  //   diem_nguoi_choi += a x (so_la_A_cua_ho - 1)
  // Với ĐÚNG 4 người chơi dùng trọn 1 bộ 52 lá (luôn có đúng 4 lá Á trong
  // ván), tổng cộng dồn của công thức này trên cả bàn luôn = 0 (chứng
  // minh: tổng của (đếm_i - 1) qua mọi người = (tổng đếm_i) - N = 4 - N,
  // bằng 0 đúng khi N = 4).
  const diemAConfig = ruleset.diemA;
  if (diemAConfig && diemAConfig.enabled !== false && diemAConfig.diem) {
    nguoiChoi.forEach(p => {
      const soLaA = demSoLaA(p);
      const congThem = diemAConfig.diem * (soLaA - 1);
      diem[p.ten] += congThem;
      dienGiaiTheoDoiThu[p.ten].push({
        doiThu: null,
        dienGiai: [`Chi Á: có ${soLaA} lá Á × ${diemAConfig.diem} - ${diemAConfig.diem} = ${congThem >= 0 ? '+' : ''}${congThem} (tính riêng, không theo từng đối thủ)`],
        diemNhanDuoc: congThem,
      });
    });
  }

  return { diem, dienGiaiTheoDoiThu };
}
```

### Giải thích: `tinhDiem` (vì sao tổng luôn bằng 0, cách phát hiện "sập làng", và giải trình)

- **Vì sao tổng luôn = 0:** với 4 người chơi, có `4×3/2 = 6` cặp so bài
  khác nhau (`i` từ 0-3, `j` từ `i+1` tới 3 — đây là cách vòng lặp lồng
  nhau chuẩn để duyệt hết mọi cặp KHÔNG lặp lại, ví dụ không tính cả (0,1)
  lẫn (1,0)). Với MỖI cặp, `soBai2Nguoi` luôn trả `diemB = -diemA` — cộng
  đúng số dương vào 1 người, đúng số âm tương ứng vào người kia. Cộng dồn
  6 cặp như vậy, tổng luôn tự động ra 0 — không cần kiểm tra hay chỉnh sửa
  gì thêm, đây là hệ quả tất yếu của việc luôn tính theo cặp đối xứng.
- **Phát hiện "sập làng":** sau khi có kết quả tất cả các cặp
  (`ketQuaCap`), đếm xem mỗi người đã "ăn sập" (`aSap`/`bSap` = true) BAO
  NHIÊU đối thủ (`demSap`). Nếu con số đó bằng ĐÚNG số đối thủ thật sự có
  trong ván (`soDoiThu = nguoiChoi.length - 1`), người đó được đánh dấu
  `laSapLang = true`.
- **Áp hệ số sập làng:** duyệt lại từng cặp lần 2, nếu MỘT TRONG HAI người
  của cặp đó đã "sập làng", nhân thêm hệ số (`heSoSapLang`) vào CẢ
  `dA` VÀ `dB` — nhân cả 2 cùng lúc, cùng 1 con số, nên tính đối xứng
  `dB = -dA` vẫn được giữ nguyên sau khi nhân, tổng bàn vẫn = 0.
- **`dienGiaiTheoDoiThu` — gom giải trình theo từng người:** mỗi khi xử lý
  xong 1 cặp, PUSH thêm 1 mục vào mảng giải trình của CẢ 2 người trong cặp
  đó (`dienGiaiTheoDoiThu[tenA].push(...)` và tương tự cho B) — vì cùng 1
  cặp so bài, cả 2 bên đều cần xem được (dù nội dung/góc nhìn khác nhau).
  Quan trọng: `dienGiai` trong mục được push CHÍNH LÀ mảng đã tính từ
  `soBai2Nguoi` (không tính toán lại riêng) — đảm bảo con số hiển thị
  LUÔN khớp con số thật đã dùng để cộng vào `diem`, không có nguy cơ 2 chỗ
  lệch nhau nếu sau này code tính điểm thay đổi.
- **Chi Á cũng được thêm vào giải trình** — nhưng với `doiThu: null` (đánh
  dấu đây không phải so với 1 đối thủ cụ thể, mà là khoản tính riêng cho
  cả ván), để giao diện biết cách hiển thị khác đi 1 chút (xem File 5).
- **Chi Á — vì sao tính khác hẳn 3 chi kia:** đây KHÔNG phải là "so sánh
  giữa 2 người" — nó là 1 khoản cộng/trừ dựa trên chính số lá Á của MỘT
  người, không cần biết đối thủ có gì. Nếu tính nó bên trong
  `soBai2Nguoi` (cộng dồn qua từng cặp đối thủ, như bản trước đây từng
  làm), 1 người sẽ bị/được tính LẶP LẠI nhiều lần — với 3 đối thủ, công
  thức bị cộng dồn 3 lần thay vì đúng 1 lần, gây sai số lớn. Cách đúng:
  tính đúng 1 lần cho MỖI người (`nguoiChoi.forEach`, không lồng vòng lặp
  cặp), cộng thẳng `a × (soLaA - 1)` vào tổng điểm của họ.
- **Vì sao vẫn giữ được tổng = 0 dù không tính theo cặp đối xứng:** vì cả
  bàn LUÔN dùng chung 1 bộ 52 lá (đúng 4 lá Á, không hơn không kém). Cộng
  `(đếm_i - 1)` cho từng người rồi cộng dồn lại, về mặt đại số bằng
  `(tổng đếm_i) - N` — mà `tổng đếm_i` (tổng số lá Á của mọi người cộng
  lại) LUÔN đúng bằng 4 (cả bộ chỉ có 4 lá Á, không lá nào bị bỏ sót hay
  dùng 2 lần), còn `N` (số người chơi) trong app này luôn cố định = 4. Vậy
  `4 - 4 = 0` — tổng luôn = 0, nhưng chỉ đúng KHI VÀ CHỈ KHI số người chơi
  luôn là 4 (đúng với thiết kế hiện tại của app: 1 người + 3 AI). Nếu sau
  này đổi số người chơi, công thức này cần tính lại.

> **Lưu ý cho `src/aiEngine.js`:** hàm `aiXepBai()` gọi `xepBaiHopLe()` mà
> không truyền `ruleset` — vẫn chạy đúng bình thường (tham số `ruleset` là
> tùy chọn, thiếu thì coi `sanhHaYeuNhat = false`, đúng hành vi mặc định).
> Không cần sửa gì trong `aiEngine.js`.

### Kiểm tra Phase 2

Phase này gộp rất nhiều luật (rank tự nhiên, Sảnh Hạ, Sám cô A/Tứ quý A,
Thượng/Hạ, sập làng, chi Á, giải trình) — nên kiểm tra kỹ hơn các Phase
khác. Mở Console và/hoặc chạy thử vài ván thật:

1. `taoBoBai()` phải trả về đúng 52 lá, `rank` từ 2 đến 14.
2. Dựng thử 1 ván có ai đó thắng bằng Sám cô A (chi Đầu) — điểm đúng 12
   (không phải 1+3=4 như Sám cô thường, cũng không phải 3).
3. Dựng thử 1 ván có Tứ quý toàn Á ở chi Cuối — điểm đúng 16; nếu Tứ quý
   toàn Á rơi vào chi Giữa — điểm đúng 32 (tự động gấp đôi).
4. Dựng thử Thùng phá sảnh Thượng (10-J-Q-K-A) và Hạ (A-2-3-4-5) ở chi
   Cuối — điểm đúng 10 và 7 (không phải 5 như thùng phá sảnh thường).
5. Ăn sập 1 đối thủ — điểm nhân đúng x2. Ăn sập LUÔN CẢ 3 đối thủ trong
   1 ván 4 người — điểm nhân thêm x2 nữa (tổng x4).
6. Qua Console, gọi `xepBaiHopLe` với `{ sanhHaYeuNhat: true }` cho 1 tay
   có Sảnh Hạ (A-2-3-4-5) và 1 tay có sảnh 2-3-4-5-6 — xác nhận Sảnh Hạ
   thua; gọi lại với `{ sanhHaYeuNhat: false }` (hoặc không truyền gì) —
   xác nhận Sảnh Hạ thắng. (Kiểm tra qua giao diện tab Luật chơi sẽ làm ở
   Phase 4, khi đã có UI cho tùy chọn này.)
7. Qua Console, gọi `tinhDiem(nguoiChoi, ruleset)` cho 1 ván thử, lấy kết
   quả `{ diem, dienGiaiTheoDoiThu }` — cộng tay các `diemNhanDuoc` trong
   `dienGiaiTheoDoiThu['Bạn']` phải ra ĐÚNG bằng `diem['Bạn']`. (Kiểm tra
   qua nút "Xem cách tính chi tiết" trên giao diện sẽ làm ở Phase 5, khi
   đã có UI hiển thị.)

Dừng lại ở đây. Xác nhận cả 7 điều trên đúng trước khi báo cáo và sang
Phase 3.

---

## Phase 3 — `src/Card.jsx` (sửa 1 dòng)

Đổi cách tra `TEN_RANK` — trừ đi 2 vì mảng vẫn bắt đầu từ chỉ số 0 trong
khi `rank` giờ bắt đầu từ 2:

```jsx
const ten = TEN_RANK[laBai.rank - 2]; // trước đây: TEN_RANK[laBai.rank]
```

### Giải thích Phase 3

Mảng `TEN_RANK` (ví dụ `['2','3',...,'A']`) luôn bắt đầu chỉ số 0 (đúng
quy tắc mảng trong JavaScript), nhưng giờ `rank` thật của lá bài bắt đầu
từ 2. Nếu tra thẳng `TEN_RANK[rank]` sẽ bị lệch 2 vị trí — ví dụ lá rank=2
(con 2) sẽ tra nhầm vào chỉ số 2 (là "4"). Trừ đi 2 trước khi tra để đưa
về đúng chỉ số mảng.

(`KY_HIEU_CHAT`, `MAU_CHAT` và toàn bộ phần còn lại của `Card.jsx` giữ
nguyên không đổi.)

### Kiểm tra Phase 3

Mở app (hoặc trang xem thử `Card.jsx` nếu có), xác nhận mọi lá bài hiện
đúng tên (2,3,...,10,J,Q,K,A) — không bị lệch số như "K" hiện thành "A"
hay ngược lại.

Dừng lại ở đây. Xác nhận đúng trước khi báo cáo và sang Phase 4.

---

## Phase 4 — `src/LuatChoi.jsx` (tạo mới / ghi đè toàn bộ)

```jsx
import { useState } from 'react'
import { RULESET_PRESETS } from './ruleset.js'

const TEN_LOAI_3_LA = ['Mậu thầu', 'Đôi', 'Sám cô'];
const TEN_LOAI_5_LA = ['Mậu thầu', 'Đôi', 'Thú', 'Sám cô', 'Sảnh', 'Thùng', 'Cù lũ', 'Tứ quý', 'Thùng phá sảnh'];

function LuatChoi({ presetId, daTuyChinh, ruleset, presetRieng, onChonPreset, onChange, onReset, onLuuPresetRieng, onXoaPresetRieng }) {
  const [tenMoi, setTenMoi] = useState('');

  function suaRuleset(hamSua) {
    const banSao = JSON.parse(JSON.stringify(ruleset));
    hamSua(banSao);
    onChange(banSao);
  }

  function suaDiemGoc(tenChi, giaTri) {
    suaRuleset(r => { r.pointsPerChi[tenChi] = Number(giaTri) || 0; });
  }

  function suaBonus(tenChi, loai, giaTri) {
    suaRuleset(r => {
      if (!r.bonusTheoLoai[tenChi]) r.bonusTheoLoai[tenChi] = {};
      r.bonusTheoLoai[tenChi][loai] = Number(giaTri) || 0;
    });
  }

  function veBangBonus(tenChi, nhan, danhSachTenLoai, dacBiet = []) {
    return (
      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Bonus theo loại bài — {nhan}</div>
        <div className="bang-bonus">
          {danhSachTenLoai.map((tenLoai, loai) => (
            <div key={loai} className="dong-bonus">
              <span>{tenLoai}</span>
              <input
                type="number"
                value={ruleset.bonusTheoLoai[tenChi]?.[loai] || 0}
                onChange={e => suaBonus(tenChi, loai, e.target.value)}
              />
            </div>
          ))}
          {dacBiet.map(({ ma, ten }) => (
            <div key={ma} className="dong-bonus dong-bonus-dac-biet">
              <span>{ten}</span>
              <input
                type="number"
                value={ruleset.bonusTheoLoai[tenChi]?.[ma] || 0}
                onChange={e => suaBonus(tenChi, ma, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const danhSachPreset = [...RULESET_PRESETS, ...presetRieng];
  const presetHienTai = danhSachPreset.find(p => p.id === presetId);

  return (
    <div className="trang-luat-choi">

      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Chọn bộ luật có sẵn</div>
        <div className="danh-sach-preset">
          {danhSachPreset.map(p => (
            <div key={p.id} className={p.id === presetId ? 'the-preset the-preset-dang-chon' : 'the-preset'}>
              <div className="the-preset-ten">{p.ten}{p.rieng && ' (riêng)'}</div>
              {p.moTa && <div className="the-preset-mo-ta">{p.moTa}</div>}
              <div className="the-preset-nut">
                <button onClick={() => onChonPreset(p.id)}>
                  {p.id === presetId ? 'Đang dùng' : 'Tải bộ luật này'}
                </button>
                {p.rieng && (
                  <button className="nut-xoa-preset" onClick={() => onXoaPresetRieng(p.id)}>Xóa</button>
                )}
              </div>
            </div>
          ))}
        </div>
        {daTuyChinh && (
          <p className="ghi-chu-tuy-chinh">
            Bạn đã chỉnh tay so với bộ "{presetHienTai?.ten}" gốc.
          </p>
        )}

        <div className="khoi-luu-rieng">
          <input
            type="text"
            placeholder="Đặt tên cho luật riêng của bạn..."
            value={tenMoi}
            onChange={e => setTenMoi(e.target.value)}
          />
          <button
            onClick={() => { onLuuPresetRieng(tenMoi); setTenMoi(''); }}
            disabled={!tenMoi.trim()}
          >
            Lưu thành luật riêng
          </button>
        </div>
      </div>

      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Điểm gốc mỗi chi thắng/thua</div>
        <div className="dong-diem-goc">
          {['dau', 'giua', 'cuoi'].map(tenChi => (
            <label key={tenChi}>
              {tenChi === 'dau' ? 'Chi Đầu' : tenChi === 'giua' ? 'Chi Giữa' : 'Chi Cuối'}
              <input
                type="number"
                value={ruleset.pointsPerChi[tenChi]}
                onChange={e => suaDiemGoc(tenChi, e.target.value)}
              />
            </label>
          ))}
        </div>
      </div>

      {veBangBonus('dau', 'Chi Đầu (3 lá)', TEN_LOAI_3_LA, [
        { ma: '2_A', ten: 'Sám cô A (AAA)' },
      ])}

      {veBangBonus('cuoi', 'Chi Cuối (5 lá) — nguồn gốc để tính Chi Giữa', TEN_LOAI_5_LA, [
        { ma: '7_A', ten: 'Tứ quý A (AAAA)' },
        { ma: '8_thuong', ten: 'Thùng phá sảnh Thượng (10-J-Q-K-A)' },
        { ma: '8_ha', ten: 'Thùng phá sảnh Hạ (A-2-3-4-5)' },
      ])}

      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Chi Giữa (5 lá) — tự động = 2 × Chi Cuối</div>
        <div className="bang-bonus">
          {['7', '7_A', '8', '8_thuong', '8_ha'].map(ma => {
            const tenHienThi = {
              '7': 'Tứ quý', '7_A': 'Tứ quý A',
              '8': 'Thùng phá sảnh (thường)',
              '8_thuong': 'Thùng phá sảnh Thượng', '8_ha': 'Thùng phá sảnh Hạ',
            }[ma];
            const giaTriCuoi = ruleset.bonusTheoLoai.cuoi?.[ma];
            if (giaTriCuoi === undefined) return null;
            return (
              <div key={ma} className="dong-bonus dong-bonus-chi-doc">
                <span>{tenHienThi}</span>
                <span>{giaTriCuoi * 2}</span>
              </div>
            );
          })}
        </div>
        <p className="ghi-chu-chi-giua">
          Sửa số ở bảng "Chi Cuối" bên trên — Chi Giữa sẽ tự cập nhật theo.
        </p>
      </div>

      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Ăn sập</div>
        <label className="dong-checkbox">
          <input
            type="checkbox"
            checked={ruleset.sapBonus.enabled}
            onChange={e => suaRuleset(r => { r.sapBonus.enabled = e.target.checked; })}
          />
          Bật thưởng ăn sập
        </label>
        <label>
          Hệ số nhân
          <input
            type="number"
            value={ruleset.sapBonus.multiplier}
            onChange={e => suaRuleset(r => { r.sapBonus.multiplier = Number(e.target.value) || 1; })}
          />
        </label>
      </div>

      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Sập làng</div>
        <label className="dong-checkbox">
          <input
            type="checkbox"
            checked={ruleset.sapLangBonus?.enabled !== false}
            onChange={e => suaRuleset(r => {
              if (!r.sapLangBonus) r.sapLangBonus = { enabled: true, multiplier: 2 };
              r.sapLangBonus.enabled = e.target.checked;
            })}
          />
          Bật thưởng khi ăn sập TẤT CẢ đối thủ trong ván
        </label>
        <label>
          Hệ số nhân thêm
          <input
            type="number"
            value={ruleset.sapLangBonus?.multiplier ?? 2}
            onChange={e => suaRuleset(r => {
              if (!r.sapLangBonus) r.sapLangBonus = { enabled: true, multiplier: 2 };
              r.sapLangBonus.multiplier = Number(e.target.value) || 1;
            })}
          />
        </label>
      </div>

      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Binh lủng</div>
        <label className="dong-checkbox">
          <input
            type="checkbox"
            checked={ruleset.binhLungPenalty.enabled}
            onChange={e => suaRuleset(r => { r.binhLungPenalty.enabled = e.target.checked; })}
          />
          Bật phạt binh lủng (thua trắng)
        </label>
        <label className="dong-checkbox">
          <input
            type="checkbox"
            checked={ruleset.binhLungPenalty.countAsSap}
            onChange={e => suaRuleset(r => { r.binhLungPenalty.countAsSap = e.target.checked; })}
          />
          Tính binh lủng như bị ăn sập (nhân hệ số ở trên)
        </label>
      </div>

      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Sảnh Hạ (A-2-3-4-5)</div>
        <label className="dong-checkbox">
          <input
            type="checkbox"
            checked={!!ruleset.sanhHaYeuNhat}
            onChange={e => suaRuleset(r => { r.sanhHaYeuNhat = e.target.checked; })}
          />
          Coi Sảnh Hạ là YẾU NHẤT trong các sảnh (mặc định: mạnh thứ nhì)
        </label>
        {ruleset.sanhHaYeuNhat && (
          <p className="ghi-chu-canh-bao">
            Đang bật: Sảnh Hạ giờ là yếu nhất, nhưng 2 ô "Thùng phá sảnh
            Thượng/Hạ" ở bảng Chi Cuối KHÔNG tự đổi. Nếu muốn nhất quán, tự
            sửa tay 2 ô đó về bằng với "Thùng phá sảnh (thường)".
          </p>
        )}
      </div>

      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Chi Á</div>
        <label className="dong-checkbox">
          <input
            type="checkbox"
            checked={ruleset.diemA?.enabled !== false}
            onChange={e => suaRuleset(r => {
              if (!r.diemA) r.diemA = { enabled: true, diem: 1 };
              r.diemA.enabled = e.target.checked;
            })}
          />
          Tính điểm theo số lá Á sở hữu
        </label>
        <label>
          Điểm mỗi lá Á thêm (so với đối thủ)
          <input
            type="number"
            value={ruleset.diemA?.diem ?? 1}
            onChange={e => suaRuleset(r => {
              if (!r.diemA) r.diemA = { enabled: true, diem: 1 };
              r.diemA.diem = Number(e.target.value) || 0;
            })}
          />
        </label>
      </div>

      <button className="nut-reset-luat" onClick={onReset}>
        Khôi phục về gốc của "{presetHienTai?.ten}"
      </button>
    </div>
  );
}

export default LuatChoi;
```

### Giải thích Phase 4

- **Component "được điều khiển" (controlled component):** `LuatChoi`
  KHÔNG có `useState` nào giữ chính `ruleset` — nó chỉ nhận `ruleset` hiện
  tại qua props (dữ liệu chảy TỪ TRÊN XUỐNG, từ `App.jsx`) và gọi
  `onChange`/`onChonPreset`/... để BÁO NGƯỢC lên khi có thay đổi (sự kiện
  chảy TỪ DƯỚI LÊN). Đây là mẫu hình cực phổ biến trong React: giữ "nguồn
  sự thật" (state thật) ở 1 nơi duy nhất (`App.jsx`), các component con
  chỉ hiển thị + báo sự kiện, không tự ý giữ bản sao riêng — tránh tình
  trạng 2 nơi có 2 phiên bản dữ liệu lệch nhau.
- **`suaRuleset` — khuôn mẫu "sao chép, sửa, báo lên":** mọi thay đổi
  (dù là sửa 1 số bonus hay bật 1 checkbox) đều đi qua `suaRuleset`: (1)
  tạo 1 bản sao độc lập của `ruleset` hiện tại (`JSON.parse(JSON.stringify(...))`),
  (2) chạy hàm `hamSua` do nơi gọi cung cấp để sửa TRÊN bản sao đó, (3)
  gọi `onChange` để báo bản đã sửa lên `App.jsx`. Không bao giờ sửa trực
  tiếp lên `ruleset` gốc (props trong React về nguyên tắc không nên bị
  sửa trực tiếp — đây gọi là "immutability", giúp React biết chính xác
  khi nào cần vẽ lại màn hình).
- **`veBangBonus` — 1 hàm vẽ dùng lại cho nhiều bảng khác nhau:** thay vì
  viết riêng code hiển thị cho bảng Chi Đầu, bảng Chi Cuối..., hàm này
  nhận tham số (`tenChi`, tên hiển thị, danh sách loại bài, danh sách đặc
  biệt) rồi tự vẽ đúng bảng tương ứng. Tham số `dacBiet` (mặc định mảng
  rỗng `[]`) cho phép thêm các dòng "ngoại lệ" như Sám cô A, Tứ quý A vào
  cuối bảng mà không cần sửa cấu trúc hàm.
- **Khối "Chi Giữa" chỉ HIỂN THỊ, không sửa được:** vì Chi Giữa được TÍNH
  TỰ ĐỘNG (đã giải thích ở Phase 2), khối này chỉ đọc `ruleset.bonusTheoLoai.cuoi`
  rồi nhân 2 để hiển thị — không có `<input>` nào ở đây, chỉ có `<span>`
  hiển thị số.
- **Ô lưu luật riêng dùng `disabled`:** nút "Lưu thành luật riêng" bị vô
  hiệu hóa (`disabled={!tenMoi.trim()}`) khi ô tên đang trống hoặc chỉ
  toàn khoảng trắng — cách đơn giản để ngăn lưu 1 preset không tên mà
  không cần hiện thông báo lỗi riêng.

### Kiểm tra Phase 4

Component này chưa gắn được vào app thật (đó là việc của Phase 5) — nếu
muốn xem thử ngay, có thể tạm render `<LuatChoi>` với dữ liệu giả trong 1
file test riêng. Nếu không, đọc lại code 1 lượt, xác nhận:
1. Đủ 2 preset dựng sẵn ("Tối giản", "Chuẩn") hiện trong danh sách.
2. Sửa số ở bảng Chi Cuối sẽ khiến khối Chi Giữa hiển thị tự nhân đôi
   (đọc lại logic, chưa cần chạy thật).
3. Việc kiểm tra ĐẦY ĐỦ, THẬT SỰ trên trình duyệt sẽ làm ở Phase 5, sau
   khi đã gắn `LuatChoi` vào `App.jsx`.

Dừng lại ở đây. Đọc lại đúng logic trước khi báo cáo và sang Phase 5.

---

## Phase 5 — `src/App.jsx` (sửa dựa trên bản V2_PATCH đã có)

Đổi import ở đầu file:
```jsx
import { useState, useRef, useEffect } from 'react'
import './App.css'
import { chiaBai, xepBaiHopLe, tinhDiem, sapXepDeHienThi } from './cardEngine.js'
import { aiXepBai } from './aiEngine.js'
import { RULESET_PRESETS, layRulesetTuPreset, isValidRuleset } from './ruleset.js'
import Card from './Card.jsx'
import LuatChoi from './LuatChoi.jsx'
```

Thêm các hằng số + hàm đọc dữ liệu (đặt ngoài component `App`, cạnh
`BAT_DAU` đã có):

```jsx
const KHOA_LUU_RULESET = 'mauBinhLuatChoi';
const KHOA_LUU_PRESET_RIENG = 'mauBinhLuatTuyChinh';

function docTrangThaiLuat() {
  try {
    const raw = localStorage.getItem(KHOA_LUU_RULESET);
    if (!raw) return { presetId: 'chuan', ruleset: layRulesetTuPreset('chuan'), daTuyChinh: false };
    const obj = JSON.parse(raw);
    if (obj && obj.presetId && isValidRuleset(obj.ruleset)) return obj;
    if (isValidRuleset(obj)) return { presetId: 'chuan', ruleset: obj, daTuyChinh: true };
    return { presetId: 'chuan', ruleset: layRulesetTuPreset('chuan'), daTuyChinh: false };
  } catch {
    return { presetId: 'chuan', ruleset: layRulesetTuPreset('chuan'), daTuyChinh: false };
  }
}

function docPresetRieng() {
  try {
    const raw = localStorage.getItem(KHOA_LUU_PRESET_RIENG);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr)
      ? arr.filter(p => p && p.id && p.ten && isValidRuleset(p.ruleset))
      : [];
  } catch {
    return [];
  }
}

function timPresetTrongDanhSach(id, danhSach) {
  return danhSach.find(p => p.id === id)
    || danhSach.find(p => p.id === 'chuan')
    || danhSach[0];
}
```

### Giải thích: các hàm đọc dữ liệu

- **`docTrangThaiLuat`:** đọc từ `localStorage` (bộ nhớ trình duyệt, tồn
  tại kể cả sau khi tắt trình duyệt). Có 3 lớp phòng thủ: (1) nếu chưa có
  gì lưu (`!raw`) → dùng mặc định "chuan"; (2) nếu dữ liệu ĐÚNG định dạng
  mới (có `presetId` đi kèm) → dùng luôn; (3) nếu dữ liệu là định dạng CŨ
  hơn (chỉ lưu thẳng `ruleset`, từ trước khi có hệ thống preset) → vẫn
  đọc được, gói lại thành định dạng mới, đánh dấu "đã chỉnh tay" để không
  mất dữ liệu Huy từng lưu. `try/catch` bọc ngoài để phòng trường hợp dữ
  liệu bị hỏng (JSON không hợp lệ) khiến `JSON.parse` báo lỗi — không có
  `try/catch` thì lỗi này sẽ làm sập cả trang ngay khi mở app.
- **`docPresetRieng`:** tương tự, đọc danh sách các luật riêng Huy đã lưu.
  `arr.filter(...)` lọc bỏ bất kỳ phần tử nào bị hỏng/thiếu field, phòng
  trường hợp 1 phần tử lỗi làm hỏng cả danh sách.
- **`timPresetTrongDanhSach`:** tìm 1 preset theo `id` trong 1 danh sách
  cho trước, có 2 lớp dự phòng nếu không tìm thấy — trước tiên thử về
  "chuan", nếu cũng không có (trường hợp cực hiếm) thì lấy phần tử đầu
  tiên trong danh sách. Không bao giờ trả về `undefined`.

Trong component `App`, thêm state (đặt cạnh các `useState` khác):

```jsx
const [tab, setTab] = useState('choi'); // 'choi' | 'luat'
const [hienGiaiTrinh, setHienGiaiTrinh] = useState(false);
const [trangThaiLuat, setTrangThaiLuat] = useState(() => docTrangThaiLuat());
const { presetId, ruleset, daTuyChinh } = trangThaiLuat;
const [presetRieng, setPresetRieng] = useState(() => docPresetRieng());
const tatCaPreset = [...RULESET_PRESETS, ...presetRieng];

useEffect(() => {
  localStorage.setItem(KHOA_LUU_RULESET, JSON.stringify(trangThaiLuat));
}, [trangThaiLuat]);

useEffect(() => {
  localStorage.setItem(KHOA_LUU_PRESET_RIENG, JSON.stringify(presetRieng));
}, [presetRieng]);

function chonPreset(id) {
  const p = timPresetTrongDanhSach(id, tatCaPreset);
  setTrangThaiLuat({ presetId: p.id, ruleset: JSON.parse(JSON.stringify(p.ruleset)), daTuyChinh: false });
}

function suaRulesetThuCong(rulesetMoi) {
  setTrangThaiLuat(prev => ({ ...prev, ruleset: rulesetMoi, daTuyChinh: true }));
}

function resetVeGocPreset() {
  const p = timPresetTrongDanhSach(trangThaiLuat.presetId, tatCaPreset);
  setTrangThaiLuat(prev => ({ ...prev, ruleset: JSON.parse(JSON.stringify(p.ruleset)), daTuyChinh: false }));
}

function luuThanhPresetRieng(ten) {
  const tenSach = ten.trim();
  if (!tenSach) return;
  const idMoi = 'tuy_' + Date.now();
  const presetMoi = { id: idMoi, ten: tenSach, rieng: true, ruleset: JSON.parse(JSON.stringify(ruleset)) };
  setPresetRieng(prev => [...prev, presetMoi]);
  setTrangThaiLuat({ presetId: idMoi, ruleset: presetMoi.ruleset, daTuyChinh: false });
}

function xoaPresetRieng(id) {
  setPresetRieng(prev => prev.filter(p => p.id !== id));
  if (trangThaiLuat.presetId === id) chonPreset('chuan');
}
```

### Giải thích: state và các hàm xử lý trong `App.jsx`

- **Vì sao gộp `presetId` + `ruleset` + `daTuyChinh` vào 1 state
  (`trangThaiLuat`) thay vì 3 `useState` riêng:** 3 giá trị này LUÔN cần
  thay đổi CÙNG LÚC với nhau (ví dụ chọn preset mới → cả 3 giá trị đổi
  đồng thời) — gộp vào 1 object giúp cập nhật 1 lần (`setTrangThaiLuat`),
  tránh nguy cơ 2 `useState` riêng bị cập nhật lệch nhịp nhau (ví dụ
  `ruleset` đã đổi nhưng `presetId` chưa kịp đổi theo).
- **`const { presetId, ruleset, daTuyChinh } = trangThaiLuat`:** cú pháp
  "destructuring" — tách các trường trong object `trangThaiLuat` ra thành
  3 biến riêng để code bên dưới gọn hơn (`ruleset` thay vì
  `trangThaiLuat.ruleset` mỗi lần dùng).
- **`useEffect(..., [trangThaiLuat])`:** chạy hàm bên trong MỖI KHI
  `trangThaiLuat` đổi giá trị — đây là cách chuẩn để "phản ứng" lại 1 thay
  đổi state bằng 1 hành động phụ (ở đây là ghi vào `localStorage`), tách
  biệt khỏi logic tính toán chính. Có 2 `useEffect` riêng cho 2 state khác
  nhau (`trangThaiLuat` và `presetRieng`) vì chúng lưu vào 2 khóa
  `localStorage` khác nhau.
- **`chonPreset`:** tìm đúng preset (kể cả preset riêng, nhờ tìm trong
  `tatCaPreset` — danh sách đã gộp cả 2 nguồn), rồi THAY TOÀN BỘ
  `trangThaiLuat` bằng dữ liệu preset đó, đặt `daTuyChinh: false` (vì vừa
  tải nguyên 1 bộ, chưa có gì bị chỉnh tay).
- **`suaRulesetThuCong`:** nhận 1 `ruleset` MỚI (đã được `LuatChoi.jsx`
  sửa sẵn), chỉ cập nhật đúng field `ruleset` trong `trangThaiLuat`
  (`...prev` giữ nguyên `presetId` cũ), và đặt `daTuyChinh: true`.
- **`resetVeGocPreset`:** khác với `chonPreset` (đổi SANG 1 preset khác),
  hàm này giữ NGUYÊN `presetId` hiện tại, chỉ đưa `ruleset` về ĐÚNG giá
  trị gốc của preset đó — dùng khi Huy bấm nút "Khôi phục" sau khi lỡ sửa
  tay 1 vài số.
- **`luuThanhPresetRieng`:** tạo 1 `id` mới bằng `Date.now()` (số mili-giây
  hiện tại — vì app chỉ chạy trên máy Huy, không có nhiều người tạo cùng
  lúc, dùng thời điểm hiện tại làm id là đủ đơn giản và gần như chắc chắn
  không trùng), thêm preset mới vào danh sách `presetRieng`, rồi CHUYỂN
  LUÔN sang dùng chính preset vừa lưu (không còn "đã chỉnh tay" nữa vì giờ
  nó CHÍNH LÀ 1 preset hoàn chỉnh).
- **`xoaPresetRieng`:** lọc bỏ đúng preset có `id` cần xóa khỏi danh sách;
  nếu preset vừa xóa ĐANG được dùng, tự động chuyển về "chuan" để tránh
  app bị treo ở 1 preset không còn tồn tại.

Sửa dòng tính `hopLe` (đang đọc `chiDauGoc/chiGiuaGoc/chiCuoiGoc` từ
`oCacChi`) — thêm `ruleset`:
```jsx
const hopLe = xepBaiHopLe(chiDauGoc, chiGiuaGoc, chiCuoiGoc, ruleset);
```

Sửa `xacNhanBai()` — dùng `ruleset` (từ `trangThaiLuat`) thay vì gọi trực
tiếp `tinhDiem` không truyền luật:
```jsx
function xacNhanBai() {
  const nguoiChoi = [
    { ten: 'Bạn', chiDau: chiDauGoc, chiGiua: chiGiuaGoc, chiCuoi: chiCuoiGoc },
    { ten: 'Đối thủ 1', ...baiDoiThu[0] },
    { ten: 'Đối thủ 2', ...baiDoiThu[1] },
    { ten: 'Đối thủ 3', ...baiDoiThu[2] },
  ];
  setKetQuaDiem(tinhDiem(nguoiChoi, ruleset));
  setDaXacNhan(true);
}
```

### Giải thích: 2 chỗ sửa nhỏ này

Cả `xepBaiHopLe` và `tinhDiem` giờ đều cần biết LUẬT HIỆN TẠI để hoạt
động đúng (Sảnh Hạ mạnh hay yếu, có bonus gì, có sập làng không...) — nên
2 chỗ gọi chúng trong `App.jsx` đều phải truyền thêm `ruleset` (biến đã có
sẵn từ việc destructure `trangThaiLuat` ở trên, không cần định nghĩa lại
gì thêm).

Sửa phần JSX trả về — thêm 2 nút chuyển tab ngay dưới `<h1>`, bọc toàn bộ
nội dung cũ của tab "Chơi bài" (mọi thứ đã có từ V2_PATCH: thông báo
kéo-thả, `renderVungDangXep`/`renderVungChiXem`, thông báo hợp lệ/binh
lủng, nút xác nhận, kết quả điểm, lá đang kéo, khối "Bài của 3 đối thủ")
vào nhánh `tab === 'choi'`:

```jsx
return (
  <div className="trang" style={{ touchAction: 'none' }}
       onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
    <h1>Chinese Poker</h1>

    <div className="chuyen-tab">
      <button className={tab === 'choi' ? 'nut-tab nut-tab-dang-chon' : 'nut-tab'}
              onClick={() => setTab('choi')}>Chơi bài</button>
      <button className={tab === 'luat' ? 'nut-tab nut-tab-dang-chon' : 'nut-tab'}
              onClick={() => setTab('luat')}>Luật chơi</button>
    </div>

    {tab === 'luat' ? (
      <LuatChoi
        presetId={presetId}
        daTuyChinh={daTuyChinh}
        ruleset={ruleset}
        presetRieng={presetRieng}
        onChonPreset={chonPreset}
        onChange={suaRulesetThuCong}
        onReset={resetVeGocPreset}
        onLuuPresetRieng={luuThanhPresetRieng}
        onXoaPresetRieng={xoaPresetRieng}
      />
    ) : (
      <>
        {/* ...TOÀN BỘ nội dung cũ của tab Chơi bài (từ V2_PATCH) giữ
            nguyên y hệt ở đây... */}
      </>
    )}
  </div>
)
```

### Giải thích: chuyển tab

`tab` chỉ là 1 chuỗi (`'choi'` hoặc `'luat'`) lưu trong state. Toán tử 3
ngôi `tab === 'luat' ? <LuatChoi .../> : (<>...</>)` quyết định vẽ nhánh
nào — không cần thư viện định tuyến (router) phức tạp cho 1 app nhỏ như
này, chỉ 1 biến state và 1 phép so sánh là đủ. Mọi prop mà `LuatChoi` cần
(đã liệt kê ở phần Giải thích Phase 4) đều được truyền vào ngay tại đây.

Trong khối hiển thị kết quả (bên trong nhánh `tab === 'choi'`), thêm dòng
ghi chú luật hiện tại VÀ nút "Xem cách tính chi tiết" — lưu ý `ketQuaDiem`
giờ là `{ diem, dienGiaiTheoDoiThu }` (đổi từ `tinhDiem` ở File 2), nên
mọi chỗ đọc điểm trực tiếp cần đổi thành `ketQuaDiem.diem`:

```jsx
{daXacNhan && ketQuaDiem && (
  <div className="ket-qua">
    <h2>Kết quả</h2>
    <p className="ghi-chu-luat">
      Tính theo luật "{tatCaPreset.find(p => p.id === presetId)?.ten}"
      {daTuyChinh ? ' (đã chỉnh tay)' : ''} — điểm gốc {ruleset.pointsPerChi.dau}/
      {ruleset.pointsPerChi.giua}/{ruleset.pointsPerChi.cuoi} (Đầu/Giữa/Cuối)
    </p>
    {Object.entries(ketQuaDiem.diem).map(([ten, d]) => (
      <p key={ten}>{ten}: <b className={d >= 0 ? 'diem-duong' : 'diem-am'}>{d > 0 ? '+' : ''}{d}</b></p>
    ))}

    <button className="nut-xem-giai-trinh" onClick={() => setHienGiaiTrinh(v => !v)}>
      {hienGiaiTrinh ? 'Ẩn cách tính chi tiết' : 'Xem cách tính chi tiết'}
    </button>

    {hienGiaiTrinh && (
      <div className="khoi-giai-trinh">
        <div className="giai-trinh-tieu-de">Cách tính điểm của Bạn:</div>
        {ketQuaDiem.dienGiaiTheoDoiThu['Bạn'].map((muc, idx) => (
          <div key={idx} className="dong-giai-trinh">
            <div className="giai-trinh-doi-thu">
              {muc.doiThu ? `So với ${muc.doiThu}:` : 'Chi Á (tính riêng cho cả ván):'}
            </div>
            {muc.dienGiai.map((dong, i) => (
              <div key={i} className="giai-trinh-chi-tiet">{dong}</div>
            ))}
            <div className="giai-trinh-ket">
              → {muc.diemNhanDuoc >= 0 ? '+' : ''}{muc.diemNhanDuoc} điểm
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}
```

### Giải thích: dòng ghi chú luật + nút "Xem cách tính chi tiết"

- **Dòng ghi chú luật:** chi tiết nhỏ nhưng quan trọng — khi 1 kết quả
  (điểm số) phụ thuộc vào 1 cấu hình có thể thay đổi (`ruleset`), luôn
  nên cho người chơi thấy RÕ kết quả đó tính theo cấu hình nào tại thời
  điểm đó — tránh nhầm lẫn "sao ván này tính khác ván trước" khi họ quên
  mất vừa đổi luật.
- **Nút "Xem cách tính chi tiết":** dùng `hienGiaiTrinh` (state boolean)
  để ẩn/hiện — mặc định ẨN để giao diện gọn, chỉ hiện khi Huy chủ động
  bấm xem (không làm rối màn hình kết quả với những ai không cần kiểm tra
  chi tiết mỗi ván).
- **Vì sao chỉ hiện giải trình của "Bạn"** (không hiện của cả 3 đối thủ):
  mục đích chính là để Huy tự kiểm tra XEM APP TÍNH CHO MÌNH CÓ ĐÚNG
  KHÔNG — không cần xem chi tiết cách tính hộ AI. (Dữ liệu giải trình của
  3 đối thủ vẫn có sẵn trong `ketQuaDiem.dienGiaiTheoDoiThu['Đối thủ 1']`
  v.v. nếu sau này muốn hiện thêm, chỉ cần lặp thêm.)
- **`muc.doiThu ? ... : ...`:** phân biệt 2 loại mục trong danh sách giải
  trình — mục có `doiThu` là kết quả so với 1 đối thủ cụ thể (Chi
  Đầu/Giữa/Cuối), mục có `doiThu: null` (chỉ có đúng 1 mục, ở cuối danh
  sách) là khoản chi Á tính chung cho cả ván.

### Kiểm tra Phase 5

Đây là Phase quan trọng nhất để test THẬT trên trình duyệt, vì mọi thứ từ
Phase 1-4 giờ đã được gắn kết lại với nhau:

1. App chạy không lỗi Console, chơi được 1 ván bình thường như trước.
2. Tab "Luật chơi" hiện đúng 2 bộ dựng sẵn (Tối giản, Chuẩn) + preset riêng
   nếu Huy đã từng lưu trước đó (đọc từ localStorage cũ, nếu có).
3. Sửa 1 số ở bảng Chi Cuối — số ở khối Chi Giữa bên dưới tự động gấp đôi.
4. Lưu 1 luật riêng có tên — xuất hiện trong danh sách, tải lại đúng, xóa
   được, sống sót qua việc tắt/mở lại trình duyệt.
5. Chơi thử vài ván có Sám cô A / Tứ quý A / Thùng phá sảnh Thượng-Hạ /
   nhiều lá Á / ăn sập / sập làng / binh lủng — điểm ra đúng theo bảng
   luật đang hiển thị trong tab Luật chơi.
6. Bật "Sảnh Hạ là yếu nhất" — thấy dòng cảnh báo, và hành vi so sánh đảo
   ngược đúng như mô tả (đây chính là phép thử THẬT trên giao diện cho
   điều đã kiểm tra qua Console ở Phase 2).
7. Sau khi xác nhận 1 ván, bấm "Xem cách tính chi tiết" — thấy rõ so với
   từng đối thủ, Chi Đầu/Giữa/Cuối ai thắng bằng gì, được bao nhiêu điểm,
   có ăn sập/sập làng/binh lủng không, và dòng chi Á riêng. Tự cộng tay
   các dòng "→ +X điểm" của "Bạn" lại phải ra ĐÚNG số điểm tổng đã hiện.

Dừng lại ở đây. Xác nhận cả 7 điều trên đúng trước khi báo cáo và sang
Phase 6.

---

## Phase 6 — Thêm vào cuối `src/App.css`

```css
.chuyen-tab {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 16px;
}

.nut-tab {
  padding: 8px 20px;
  border-radius: 8px;
  border: 1px solid rgba(240,192,64,0.3);
  background: rgba(255,255,255,0.06);
  color: white;
  font-weight: bold;
  cursor: pointer;
}

.nut-tab-dang-chon {
  background: linear-gradient(135deg, #d4a017, #f0c040);
  color: #1a2010;
  border-color: transparent;
}

.trang-luat-choi {
  max-width: 500px;
  margin: 0 auto;
}

.khoi-luat {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(240,192,64,0.2);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 12px;
}

.khoi-luat-tieu-de {
  font-weight: bold;
  color: #f0c040;
  margin-bottom: 8px;
}

.dong-diem-goc {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.dong-diem-goc label,
.khoi-luat label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

.dong-checkbox {
  flex-direction: row !important;
  align-items: center;
  gap: 8px !important;
  margin-bottom: 8px;
}

.bang-bonus {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dong-bonus {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.dong-bonus-dac-biet span:first-child {
  font-style: italic;
  opacity: 0.9;
}

.dong-bonus-chi-doc span:last-child {
  opacity: 0.7;
  font-style: italic;
}

.khoi-luat input[type="number"] {
  width: 60px;
  padding: 4px 6px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(0,0,0,0.3);
  color: white;
}

.nut-reset-luat {
  display: block;
  margin: 16px auto;
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid #f87171;
  background: transparent;
  color: #f87171;
  font-weight: bold;
  cursor: pointer;
}

.danh-sach-preset {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.the-preset {
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 10px;
  padding: 10px;
}

.the-preset-dang-chon {
  border-color: #f0c040;
  background: rgba(240,192,64,0.08);
}

.the-preset-ten {
  font-weight: bold;
  margin-bottom: 4px;
}

.the-preset-mo-ta {
  font-size: 12px;
  opacity: 0.75;
  margin-bottom: 8px;
}

.the-preset-nut {
  display: flex;
  gap: 8px;
}

.the-preset button {
  padding: 6px 14px;
  border-radius: 6px;
  border: none;
  background: linear-gradient(135deg, #d4a017, #f0c040);
  color: #1a2010;
  font-weight: bold;
  cursor: pointer;
}

.the-preset-dang-chon button {
  background: rgba(255,255,255,0.15);
  color: white;
  cursor: default;
}

.nut-xoa-preset {
  background: transparent !important;
  border: 1px solid #f87171 !important;
  color: #f87171 !important;
}

.ghi-chu-tuy-chinh {
  font-size: 12px;
  color: #f0c040;
  margin-top: 8px;
}

.ghi-chu-chi-giua {
  font-size: 11px;
  opacity: 0.6;
  margin-top: 8px;
}

.ghi-chu-canh-bao {
  font-size: 12px;
  color: #f0c040;
  margin-top: 8px;
}

.ghi-chu-luat {
  font-size: 11px;
  opacity: 0.6;
  margin-bottom: 8px;
}

.khoi-luu-rieng {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(255,255,255,0.15);
}

.khoi-luu-rieng input {
  flex: 1;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(0,0,0,0.3);
  color: white;
}

.khoi-luu-rieng button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nut-xem-giai-trinh {
  display: block;
  margin: 10px auto;
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid rgba(240,192,64,0.4);
  background: transparent;
  color: #f0c040;
  font-size: 12px;
  cursor: pointer;
}

.khoi-giai-trinh {
  margin-top: 12px;
  padding: 10px;
  border-radius: 8px;
  background: rgba(0,0,0,0.25);
  text-align: left;
}

.giai-trinh-tieu-de {
  font-weight: bold;
  color: #f0c040;
  margin-bottom: 8px;
  font-size: 13px;
}

.dong-giai-trinh {
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(255,255,255,0.12);
}

.dong-giai-trinh:last-child {
  border-bottom: none;
}

.giai-trinh-doi-thu {
  font-weight: bold;
  font-size: 12px;
  opacity: 0.85;
  margin-bottom: 3px;
}

.giai-trinh-chi-tiet {
  font-size: 12px;
  opacity: 0.75;
  padding-left: 8px;
}

.giai-trinh-ket {
  font-size: 12px;
  font-weight: bold;
  color: #f0c040;
  padding-left: 8px;
  margin-top: 2px;
}
```

### Giải thích Phase 6

Đây thuần túy là CSS trình bày (màu sắc, khoảng cách, bo góc) — không có
logic gì cần hiểu sâu, chỉ cần biết mỗi khối `class` tương ứng với đúng
phần tử nào trong `LuatChoi.jsx`/`App.jsx` (tên class được đặt trùng khớp
có chủ đích, ví dụ `.khoi-luat` styling cho mọi `<div className="khoi-luat">`).
Nếu muốn đổi màu/giao diện, đây là nơi duy nhất cần sửa — không đụng gì
tới logic tính điểm ở Phase 2.

### Kiểm tra Phase 6

Xem lại toàn bộ giao diện 1 lượt — màu sắc, khoảng cách, bo góc đúng như
mô tả, không có phần tử nào bị vỡ layout hay lệch màu so với phong cách
chung của app.

Dừng lại ở đây. Xác nhận đúng trước khi báo cáo hoàn thành V3.

---

## Đã kiểm thử bằng Node.js trước khi đưa vào tài liệu này

6000+ ván bài ngẫu nhiên qua nhiều bộ luật khác nhau (Chuẩn, Chuẩn với
Sảnh Hạ yếu nhất, Tối giản) — tổng điểm cả bàn luôn bằng 0 ở mọi trường
hợp. Toàn bộ mốc điểm cụ thể đã re-verify: Sám cô A chi Đầu = 12, Tứ quý A
chi Cuối = 16 / chi Giữa tự động = 32, Thùng phá sảnh Thượng/Hạ = 10/7 (chi
Cuối) và 20/14 (chi Giữa tự động), ăn sập x2, sập làng nhân thêm x2 nữa,
binh lủng xử đúng theo luật hiện thời. Chi Á: đã kiểm thử với đúng công
thức `a × (số lá Á − 1)` tính 1 lần/người (không theo từng cặp đối thủ) —
khớp chính xác với ví dụ số cụ thể đã xác nhận với Huy, và tổng dồn trên
cả bàn luôn = 0 khi đúng 4 người chơi dùng trọn 1 bộ bài. Tính năng giải
trình (`dienGiaiTheoDoiThu`): đã kiểm thử tổng các dòng `diemNhanDuoc`
trong giải trình của 1 người LUÔN khớp CHÍNH XÁC tuyệt đối với điểm tổng
thật của người đó — thử cả trường hợp cụ thể lẫn 2000 ván ngẫu nhiên.

## Hoàn thành V3 — báo cáo lại với Huy

Sau khi cả 6 Phase đều đã dừng lại kiểm tra và đúng, tổng kết lại với Huy:
đã xong toàn bộ luật chơi có thể tùy chỉnh (preset dựng sẵn + luật riêng),
bộ đặc biệt (Sám cô A, Tứ quý A, Thượng/Hạ), ăn sập/sập làng, Sảnh Hạ tùy
chọn, chi Á, và tính năng giải trình cách tính điểm — sẵn sàng để chuyển
sang V4 (luật thắng trắng) nếu Huy đồng ý.
