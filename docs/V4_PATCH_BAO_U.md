# V4_PATCH_BAO_U.md — Thêm nút "Báo Ù" thay cho tự động kiểm tra

> **Thay đổi luật:** thắng trắng KHÔNG còn tự động cho người chơi thật
> ("Bạn") nữa — phải chủ động bấm "Báo Ù" thì mới được kiểm tra. Không
> bấm thì coi như bình thường (dù bài có đủ điều kiện). Báo Ù sai bị phạt
> 1 mức cố định cho MỖI đối thủ. Vì đây là hành động quan trọng, bắt buộc
> xác nhận lại 1 lần trước khi kiểm tra thật.
>
> **Đối thủ AI vẫn tự động như V4 gốc** — không cần bấm nút gì, vì AI
> không "tự báo" được. Chỉ riêng người chơi thật thay đổi cách hoạt động.
>
> Đã kiểm thử bằng Node.js: 4 tình huống — Bạn đủ điều kiện nhưng không
> báo (không tự thắng), AI thắng trắng (vẫn tự động như cũ), Bạn báo Ù
> đúng (nhận đủ điểm), Bạn báo Ù sai (bị phạt đúng mức) — tất cả đều giữ
> tổng bàn = 0.

## Bước 1 — Sửa `src/cardEngine.js`

Tìm hàm `tinhDiemThangTrang` (thêm ở V4 gốc) — **giữ nguyên không xóa**
(vẫn hữu ích nếu sau này muốn bật lại chế độ tự động hoàn toàn), nhưng
tách phần lõi tính điểm ra thành 1 hàm dùng chung, rồi thêm 3 hàm mới bên
cạnh nó.

Thêm hàm `diemThangTrangMotNguoi` cần **export** ra (trước đây không có
`export`, giờ thêm vào vì các hàm mới cần dùng lại):

```js
// Điểm 1 người nhận được từ MỖI đối thủ nếu thắng trắng bằng loại "loai"
export function diemThangTrangMotNguoi(ruleset, loai) {
  if (ruleset.thangTrang.dungMucSapLang) {
    const co3Chi = ruleset.pointsPerChi.dau + ruleset.pointsPerChi.giua + ruleset.pointsPerChi.cuoi;
    const heSoSap = ruleset.sapBonus.enabled ? ruleset.sapBonus.multiplier : 1;
    const heSoSapLang = ruleset.sapLangBonus?.enabled === false ? 1 : (ruleset.sapLangBonus?.multiplier ?? 2);
    return co3Chi * heSoSap * heSoSapLang;
  }
  return ruleset.thangTrang.diem[loai];
}
```

Thêm hàm phụ trợ dùng chung (tách phần lõi của `tinhDiemThangTrang` cũ ra):

```js
// Tính điểm từ 1 mảng "ketQuaLoai" đã biết sẵn (mỗi phần tử là mã loại
// thắng trắng của người tương ứng, hoặc null nếu người đó không thắng
// trắng). Dùng chung cho cả 3 tình huống: AI tự động, Bạn báo Ù đúng.
function tinhDiemTuKetQuaLoai(nguoiChoi, ruleset, ketQuaLoai) {
  const diem = {};
  const dienGiaiTheoDoiThu = {};
  nguoiChoi.forEach(p => { diem[p.ten] = 0; dienGiaiTheoDoiThu[p.ten] = []; });

  for (let i = 0; i < nguoiChoi.length; i++) {
    for (let j = i + 1; j < nguoiChoi.length; j++) {
      const loaiI = ketQuaLoai[i], loaiJ = ketQuaLoai[j];
      if (!loaiI && !loaiJ) continue;
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

Thêm 3 hàm mới, đặt ngay sau `tinhDiemTuKetQuaLoai`:

```js
// Tự động kiểm tra thắng trắng CHỈ CHO 3 ĐỐI THỦ AI — người chơi tên
// "Bạn" KHÔNG được tự động kiểm tra nữa (dù bài họ có đủ điều kiện), họ
// phải chủ động bấm "Báo Ù" (xem tinhDiemBaoUDung/tinhDiemBaoUSai).
export function tinhDiemThangTrangAI(nguoiChoi, ruleset) {
  if (!ruleset.thangTrang || ruleset.thangTrang.enabled === false) return null;
  const ketQuaLoai = nguoiChoi.map(p => p.ten === 'Bạn' ? null : kiemTraThangTrang(p.ca13La));
  if (!ketQuaLoai.some(l => l !== null)) return null;
  return tinhDiemTuKetQuaLoai(nguoiChoi, ruleset, ketQuaLoai);
}

// Người chơi CHỦ ĐỘNG báo Ù — kiểm tra THẬT bài của "Bạn". Trả về null
// nếu bài KHÔNG đủ điều kiện (App.jsx khi đó phải gọi tinhDiemBaoUSai
// thay vì hàm này).
export function tinhDiemBaoUDung(nguoiChoi, ruleset) {
  const ketQuaLoai = nguoiChoi.map(p => p.ten === 'Bạn' ? kiemTraThangTrang(p.ca13La) : null);
  if (!ketQuaLoai[0]) return null;
  return tinhDiemTuKetQuaLoai(nguoiChoi, ruleset, ketQuaLoai);
}

// Người chơi báo Ù nhưng SAI (bài không đủ điều kiện) — phạt 1 mức cố
// định (ruleset.thangTrang.phatBaoUSai) cho MỖI đối thủ.
export function tinhDiemBaoUSai(nguoiChoi, ruleset) {
  const mucPhat = ruleset.thangTrang?.phatBaoUSai ?? 6;
  const diem = {};
  const dienGiaiTheoDoiThu = {};
  nguoiChoi.forEach(p => { diem[p.ten] = 0; dienGiaiTheoDoiThu[p.ten] = []; });

  nguoiChoi.forEach(doiThu => {
    if (doiThu.ten === 'Bạn') return;
    diem['Bạn'] -= mucPhat;
    diem[doiThu.ten] += mucPhat;
    const dg = [`Bạn báo Ù nhưng SAI (bài không đủ điều kiện thắng trắng) → phạt ${mucPhat} cho ${doiThu.ten}`];
    dienGiaiTheoDoiThu['Bạn'].push({ doiThu: doiThu.ten, dienGiai: dg, diemNhanDuoc: -mucPhat });
    dienGiaiTheoDoiThu[doiThu.ten].push({ doiThu: 'Bạn', dienGiai: dg, diemNhanDuoc: mucPhat });
  });

  return { diem, dienGiaiTheoDoiThu };
}
```

**Giải thích:**
- `tinhDiemTuKetQuaLoai` là phần LÕI dùng chung — nhận sẵn "ai thắng trắng
  bằng loại gì" (`ketQuaLoai`) rồi tính điểm, KHÔNG tự đi kiểm tra bài của
  ai cả. Việc "kiểm tra ai thắng trắng" được tách RIÊNG ra 3 hàm gọi nó
  (`tinhDiemThangTrangAI` chỉ kiểm tra AI, `tinhDiemBaoUDung` chỉ kiểm
  tra "Bạn"), để có thể LOẠI TRỪ CHỦ ĐỘNG người chơi thật khỏi vòng kiểm
  tra tự động.
- `tinhDiemBaoUSai` không dùng `tinhDiemTuKetQuaLoai` (vì người báo sai
  không có `loai` nào cả) — viết riêng 1 vòng lặp đơn giản: với mỗi đối
  thủ, người báo sai bị trừ đúng mức phạt, đối thủ đó được cộng — tổng
  luôn = 0 vì đây vẫn là phép trừ/cộng đối xứng theo từng cặp, giống mọi
  chỗ khác trong app.

### Kiểm tra Bước 1

Mở Console, thử với 1 bộ bài Sảnh rồng tự tạo cho "Bạn":
```js
console.log(tinhDiemThangTrangAI(nguoiChoi, ruleset)); // phải là null (Bạn không tự động thắng)
console.log(tinhDiemBaoUDung(nguoiChoi, ruleset).diem); // phải thấy Bạn +36 (12 x 3 đối thủ)
```

---

## Bước 2 — Thêm `phatBaoUSai` vào `src/ruleset.js`

Thêm field `phatBaoUSai` vào `thangTrang` của cả 2 preset:

```js
// Trong preset "toi_gian" VÀ "chuan", sửa field thangTrang thành:
thangTrang: {
  enabled: true, // (toi_gian vẫn để false như cũ nếu Huy muốn giữ nguyên)
  dungMucSapLang: false,
  phatBaoUSai: 6, // mức phạt cho MỖI đối thủ nếu báo Ù sai
  diem: { rongCuon: 24, sanhRong: 12, namDoiMotSam: 6, lucPheBon: 6, namDoiThong: 6, baThung: 6, baSanh: 6 },
},
```

**Giải thích:** mức phạt mặc định 6 — trùng với mức "cơ bản nhất" trong 7
loại thắng trắng (5/7 loại đều là 6), hợp lý làm mức phạt tham chiếu vì
không có "loại" cụ thể nào để tra bảng khi báo sai. Có thể chỉnh số này
riêng trong tab Luật chơi (Bước 4).

---

## Bước 3 — Sửa `src/App.jsx`: nút "Báo Ù" + xác nhận 2 lần

Đổi import:
```jsx
import { chiaBai, xepBaiHopLe, tinhDiem, tinhDiemThangTrangAI, tinhDiemBaoUDung, tinhDiemBaoUSai, sapXepDeHienThi } from './cardEngine.js'
```

Đổi tên biến `ketQuaThangTrang` (V4 gốc) thành gọi hàm mới
`tinhDiemThangTrangAI` (chỉ AI tự động):

```jsx
const [ketQuaThangTrang] = useState(() => {
  const nguoiChoiThangTrang = [
    { ten: 'Bạn', ca13La: tatCaBai[0] },
    { ten: 'Đối thủ 1', ca13La: tatCaBai[1] },
    { ten: 'Đối thủ 2', ca13La: tatCaBai[2] },
    { ten: 'Đối thủ 3', ca13La: tatCaBai[3] },
  ];
  return tinhDiemThangTrangAI(nguoiChoiThangTrang, ruleset); // <-- đổi tên hàm
});
```

Thêm state cho hộp thoại xác nhận Báo Ù (cạnh các `useState` khác):
```jsx
const [dangXacNhanBaoU, setDangXacNhanBaoU] = useState(false);
```

Thêm 3 hàm xử lý (cạnh `xacNhanBai` đã có):
```jsx
function moHopThoaiBaoU() {
  setDangXacNhanBaoU(true);
}

function huyBaoU() {
  setDangXacNhanBaoU(false);
}

function xacNhanBaoU() {
  setDangXacNhanBaoU(false);
  const nguoiChoiThangTrang = [
    { ten: 'Bạn', ca13La: chiDauGoc.concat(chiGiuaGoc, chiCuoiGoc) },
    { ten: 'Đối thủ 1', ...baiDoiThu[0] },
    { ten: 'Đối thủ 2', ...baiDoiThu[1] },
    { ten: 'Đối thủ 3', ...baiDoiThu[2] },
  ];
  const ketQuaDung = tinhDiemBaoUDung(nguoiChoiThangTrang, ruleset);
  if (ketQuaDung) {
    setKetQuaDiem(ketQuaDung);
  } else {
    setKetQuaDiem(tinhDiemBaoUSai(nguoiChoiThangTrang, ruleset));
  }
  setDaXacNhan(true);
}
```

**Giải thích:**
- `chiDauGoc.concat(chiGiuaGoc, chiCuoiGoc)` ghép lại đúng 13 lá GỐC của
  "Bạn" (bất kể đang xếp dở dang thế nào) — vì `kiemTraThangTrang` chỉ
  quan tâm "có đủ 13 lá này không", KHÔNG quan tâm đang được xếp vào chi
  nào, nên dùng lại 3 biến `chiDauGoc/chiGiuaGoc/chiCuoiGoc` đã có sẵn từ
  V2 là đủ, không cần thêm state mới nào.
- `xacNhanBaoU` thử `tinhDiemBaoUDung` trước — nếu bài THẬT SỰ đủ điều
  kiện, hàm trả về kết quả có điểm; nếu không (`null`), coi như báo sai,
  chuyển sang `tinhDiemBaoUSai` để tính phạt. Cả 2 trường hợp đều kết
  thúc ván ngay (`setDaXacNhan(true)`), đúng tinh thần "báo Ù là hành
  động dứt điểm, không thể rút lại".

Thêm nút "Báo Ù" vào màn hình đang xếp bài — đặt cạnh nút "Xác nhận bài"
đã có, chỉ hiện khi CHƯA xác nhận (`!daXacNhan`):

```jsx
{!daXacNhan && (
  <button className="nut-bao-u" onClick={moHopThoaiBaoU}>📣 Báo Ù</button>
)}
```

Thêm hộp thoại xác nhận (đặt ở cuối JSX trả về, trước thẻ đóng `</div>`
cuối cùng — hiện đè lên mọi thứ khi `dangXacNhanBaoU` là `true`):

```jsx
{dangXacNhanBaoU && (
  <div className="lop-phu-xac-nhan">
    <div className="hop-xac-nhan-bao-u">
      <p>Bạn có CHẮC CHẮN muốn Báo Ù?</p>
      <p className="canh-bao-bao-u">
        Nếu bài của bạn KHÔNG đủ điều kiện thắng trắng, bạn sẽ bị phạt{' '}
        {ruleset.thangTrang?.phatBaoUSai ?? 6} điểm cho MỖI đối thủ.
      </p>
      <div className="dong-nut-xac-nhan-bao-u">
        <button className="nut-huy-bao-u" onClick={huyBaoU}>Hủy, xếp bài tiếp</button>
        <button className="nut-xac-nhan-bao-u" onClick={xacNhanBaoU}>Chắc chắn, Báo Ù!</button>
      </div>
    </div>
  </div>
)}
```

**Giải thích:** đây là ví dụ về mẫu "modal xác nhận" (confirm dialog) —
1 lớp phủ (`lop-phu-xac-nhan`) che kín màn hình, bên trong là hộp nhỏ với
2 lựa chọn rõ ràng. Chỉ hiện khi `dangXacNhanBaoU` là `true`, và render
NGAY TRONG cùng component (không cần thư viện modal riêng) — vì đây chỉ
là 1 khối `<div>` phủ lên trên bằng CSS `position: fixed` (thêm ở Bước 4).

---

## Bước 4 — Thêm CSS

Thêm vào cuối `src/App.css`:

```css
.nut-bao-u {
  display: block;
  margin: 0 auto 12px;
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #d4a017, #f0c040);
  color: #1a2010;
  font-weight: bold;
  font-size: 14px;
  cursor: pointer;
}

.lop-phu-xac-nhan {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.hop-xac-nhan-bao-u {
  background: #232b16;
  border: 1px solid #f0c040;
  border-radius: 12px;
  padding: 20px;
  max-width: 320px;
  text-align: center;
}

.canh-bao-bao-u {
  font-size: 13px;
  color: #f87171;
  margin: 10px 0 16px;
}

.dong-nut-xac-nhan-bao-u {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.nut-huy-bao-u {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.3);
  background: transparent;
  color: white;
  cursor: pointer;
}

.nut-xac-nhan-bao-u {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: #f87171;
  color: white;
  font-weight: bold;
  cursor: pointer;
}
```

**Giải thích:** `position: fixed; inset: 0;` là cách CSS hiện đại để phủ
1 phần tử kín toàn bộ màn hình (`inset: 0` tương đương viết cả 4 thuộc
tính `top/right/bottom/left: 0`), `z-index: 100` đảm bảo lớp phủ này LUÔN
nằm TRÊN mọi thứ khác trên trang, không bị các phần tử khác đè lên. Nút
"Chắc chắn, Báo Ù!" cố tình dùng màu đỏ (`#f87171`, khác hẳn tông vàng
quen thuộc của app) — màu đỏ theo quy ước phổ biến để nhấn mạnh đây là
hành động CÓ RỦI RO, cần cân nhắc kỹ trước khi bấm.

---

## Kiểm tra sau khi vá

1. Chơi 1 ván bình thường KHÔNG bấm "Báo Ù" — dù bài có đủ điều kiện thắng
   trắng thật (khó tự tạo lúc test thường, nhưng nếu có thể set tạm bộ
   bài cố định để test), app KHÔNG tự động Ù — vẫn xếp bài, xác nhận bình
   thường.
2. Bấm "Báo Ù" — hiện đúng hộp thoại xác nhận, có cảnh báo mức phạt.
3. Bấm "Hủy, xếp bài tiếp" — quay lại xếp bài bình thường, không mất gì.
4. Dựng thử bộ bài THẬT SỰ đủ điều kiện (vd Sảnh rồng), bấm "Báo Ù" →
   "Chắc chắn" — kết thúc ván ngay, nhận đúng điểm theo loại thắng trắng.
5. Dựng thử bộ bài BÌNH THƯỜNG, bấm "Báo Ù" → "Chắc chắn" — kết thúc ván
   ngay, "Bạn" bị trừ đúng mức phạt cho MỖI đối thủ (mặc định 6/đối thủ,
   tổng -18 với 3 đối thủ), tổng bàn vẫn = 0.
6. AI vẫn thắng trắng tự động như trước (không cần "Bạn" làm gì) — dựng
   thử bộ bài đủ điều kiện cho 1 AI, xác nhận ván kết thúc ngay như V4
   gốc.

---

## Cập nhật thực tế khi triển khai (khác với mô tả gốc ở trên)

Bản mô tả gốc ở trên viết cho baseline V4 thuần (chưa có V5). Khi áp dụng
vào codebase thực tế (đã có V5 — trang chủ, Dừng chơi/Chơi tiếp, nút Chơi
ván mới), một vài chỗ được điều chỉnh cho khớp:

- `ketQuaThangTrang` trong `App.jsx` thực tế là 1 `useMemo` (không phải
  `useState`, do V5 đã đổi trước đó) — tính lại tự động khi
  `boBaiCuaToi`/`boBaiDoiThu`/`ruleset` đổi; chỉ cần đổi hàm bên trong từ
  `tinhDiemThangTrang` sang `tinhDiemThangTrangAI` là đủ, không cần đổi
  cấu trúc `useMemo` thành `useState`.
- Nút "Báo Ù" được đặt CẠNH "Xác nhận bài" trong 1 hàng flex mới
  (`.hang-nut-xep-bai`) thay vì đứng riêng 1 dòng như CSS gốc
  (`margin: 0 auto 12px` — đã đổi thành `margin: 0` khi ở trong hàng),
  để gọn màn hình hơn.
- Đã bổ sung thêm 1 ô nhập **"Mức phạt nếu Báo Ù sai (mỗi đối thủ)"** vào
  tab Luật chơi (`LuatChoi.jsx`, khối "Các trường hợp thắng trắng") — bản
  mô tả gốc ở Bước 2 có nhắc "có thể chỉnh số này trong tab Luật chơi"
  nhưng chưa có code JSX cho ô nhập đó, nên bổ sung cho khớp lời hứa.
- Đã kiểm thử cả bằng Node.js (đúng công thức, tổng bàn = 0 cho cả báo Ù
  đúng lẫn sai) VÀ bằng Playwright chạy thật trên trình duyệt (bấm nút,
  mở/hủy modal, kết quả hiển thị đúng, không lỗi Console) — không chỉ
  dừng ở kiểm thử logic thuần như checklist gốc đề xuất.
