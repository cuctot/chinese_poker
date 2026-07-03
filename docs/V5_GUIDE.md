# V5_GUIDE.md — Trang chủ, điều hướng, và lưu/tiếp tục ván đang chơi

> **Dành cho ai đọc file này:**
> - Nếu bạn là **Claude Code**: làm theo ĐÚNG THỨ TỰ 3 Phase bên dưới.
>   MỖI Phase xong phải DỪNG LẠI, báo cáo kết quả, giải thích đã làm gì,
>   và để Huy tự kiểm tra trong trình duyệt trước khi sang Phase tiếp
>   theo — không gộp nhiều Phase làm 1 lượt.
> - Nếu bạn là **Huy**: đọc phần "Bạn học được gì" sau mỗi Phase.

## Phạm vi V5

- **Trang chủ**: biểu tượng + tên game + danh sách nút điều hướng tới:
  Chơi với AI, Chơi với bạn bè, Ghi điểm, Thống kê, Luật chơi. Các trang
  CHƯA XÂY (Chơi với bạn bè, Ghi điểm, Thống kê) hiện nút mờ "Sắp ra mắt",
  không bấm được.
- **Mục "Chơi với AI"**: trước khi vào màn chơi, có 1 màn hình chọn
  **"Chơi tiếp"** (nếu có ván đang lưu dở) hoặc **"Ván mới"**.
- **Trong màn chơi chính**: luôn có nút **"Dừng chơi"** — bấm vào sẽ lưu
  lại đúng trạng thái hiện tại (kể cả đang xếp bài dở, chưa xác nhận) và
  quay về trang chủ. Lần sau vào lại "Chơi với AI", chọn "Chơi tiếp" sẽ
  khôi phục lại y hệt trạng thái đã dừng.
- KHÔNG làm trong V5: nội dung thật của "Chơi với bạn bè", "Ghi điểm",
  "Thống kê" (để dành các version sau, theo đúng lộ trình đã thống nhất).

---

## Phase 1 — Trang chủ + khung điều hướng (chưa đụng gì tới logic chơi bài)

Mục tiêu: có 1 trang chủ làm cổng vào, điều hướng được tới "Chơi với AI"
(vào thẳng màn chơi bài y hệt hiện tại, chưa có màn chọn ván) và "Luật
chơi". 3 mục còn lại chỉ hiện nút mờ, chưa bấm được.

### Bước 1 — Tạo file mới `src/TrangChu.jsx`

```jsx
// TrangChu.jsx
// Trang chủ: biểu tượng + tên game + điều hướng. Không giữ state gì —
// chỉ nhận 1 hàm onDieuHuong(tenTrang) để báo lên App.jsx khi người chơi
// bấm 1 nút điều hướng.

function TrangChu({ onDieuHuong }) {
  return (
    <div className="trang-chu">
      <div className="logo-game">
        <svg viewBox="0 0 100 100" width="90" height="90">
          <rect x="15" y="30" width="35" height="50" rx="6" fill="#1a2010" stroke="#f0c040" strokeWidth="3" transform="rotate(-8 32 55)" />
          <rect x="35" y="25" width="35" height="50" rx="6" fill="#232b16" stroke="#f0c040" strokeWidth="3" />
          <rect x="55" y="30" width="35" height="50" rx="6" fill="#1a2010" stroke="#f0c040" strokeWidth="3" transform="rotate(8 68 55)" />
          <circle cx="52" cy="50" r="6" fill="#f0c040" />
        </svg>
      </div>
      <h1 className="ten-game">Mậu Binh</h1>

      <div className="danh-sach-dieu-huong">
        <button className="nut-dieu-huong" onClick={() => onDieuHuong('choiAI')}>
          🎮 Chơi với AI
        </button>
        <button className="nut-dieu-huong nut-sap-ra-mat" disabled>
          👥 Chơi với bạn bè <span className="nhan-sap-ra-mat">Sắp ra mắt</span>
        </button>
        <button className="nut-dieu-huong nut-sap-ra-mat" disabled>
          📝 Ghi điểm <span className="nhan-sap-ra-mat">Sắp ra mắt</span>
        </button>
        <button className="nut-dieu-huong nut-sap-ra-mat" disabled>
          📊 Thống kê <span className="nhan-sap-ra-mat">Sắp ra mắt</span>
        </button>
        <button className="nut-dieu-huong" onClick={() => onDieuHuong('luatChoi')}>
          📖 Luật chơi
        </button>
      </div>
    </div>
  );
}

export default TrangChu;
```

### Bước 2 — Sửa `src/App.jsx`: thay `tab` bằng `trang`

Thêm import:
```jsx
import TrangChu from './TrangChu.jsx'
```

Đổi state điều hướng — xóa dòng `const [tab, setTab] = useState('choi');`
cũ (đã có từ V3), thay bằng:
```jsx
const [trang, setTrang] = useState('trangChu'); // 'trangChu' | 'choiAI' | 'luatChoi'

function dieuHuong(trangMoi) {
  setTrang(trangMoi);
}
```

Sửa phần JSX trả về — bỏ khối `<div className="chuyen-tab">` (2 nút
Chơi bài/Luật chơi cũ), thay toàn bộ phần rẽ nhánh theo `tab` bằng rẽ
nhánh theo `trang`:

```jsx
return (
  <div className="trang" style={{ touchAction: 'none' }}
       onPointerMove={onPointerMove} onPointerUp={onPointerUp}>

    {trang === 'trangChu' && (
      <TrangChu onDieuHuong={dieuHuong} />
    )}

    {trang === 'luatChoi' && (
      <>
        <button className="nut-ve-trang-chu" onClick={() => setTrang('trangChu')}>
          ← Trang chủ
        </button>
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
      </>
    )}

    {trang === 'choiAI' && (
      <>
        <h1>Chinese Poker</h1>
        {/* ...TOÀN BỘ nội dung màn chơi bài hiện có, giữ nguyên y hệt
            (thông báo kéo-thả, renderVungDangXep/renderVungChiXem, thông
            báo hợp lệ/binh lủng, nút xác nhận, kết quả điểm, lá đang kéo,
            khối "Bài của 3 đối thủ")... */}
      </>
    )}
  </div>
)
```

**Lưu ý:** khối `{daXacNhan && ketQuaDiem && (...)}` (hiển thị kết quả)
NẰM BÊN TRONG nhánh `trang === 'choiAI'` ở trên — không tách riêng.

### Bước 3 — Thêm CSS cho trang chủ

Thêm vào cuối `src/App.css`:

```css
.trang-chu {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 40px;
  max-width: 400px;
  margin: 0 auto;
}

.logo-game {
  margin-bottom: 12px;
}

.ten-game {
  font-size: 32px;
  color: #f0c040;
  margin-bottom: 32px;
  letter-spacing: 2px;
}

.danh-sach-dieu-huong {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.nut-dieu-huong {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(240,192,64,0.3);
  background: rgba(255,255,255,0.06);
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  text-align: left;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nut-dieu-huong:not(.nut-sap-ra-mat):hover {
  background: rgba(240,192,64,0.12);
  border-color: #f0c040;
}

.nut-sap-ra-mat {
  opacity: 0.4;
  cursor: not-allowed;
}

.nhan-sap-ra-mat {
  font-size: 10px;
  font-weight: normal;
  background: rgba(255,255,255,0.15);
  padding: 2px 8px;
  border-radius: 10px;
}

.nut-ve-trang-chu {
  display: block;
  margin-bottom: 12px;
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.2);
  background: transparent;
  color: white;
  font-size: 13px;
  cursor: pointer;
}
```

### Kiểm tra Phase 1

1. Mở app: thấy trang chủ với biểu tượng + "Mậu Binh" + 5 nút, 3 nút mờ
   không bấm được ("Sắp ra mắt").
2. Bấm "Chơi với AI" — vào thẳng màn chơi bài y hệt trước giờ (chưa có
   màn chọn ván, đó là việc của Phase 3).
3. Bấm "Luật chơi" — vào đúng tab Luật chơi cũ, có nút "← Trang chủ" ở
   đầu để quay lại.
4. Từ màn chơi bài (Chơi với AI), tạm thời CHƯA có cách quay lại trang
   chủ (bình thường — Phase 2 sẽ thêm nút "Dừng chơi" làm việc đó).

**Bạn học được gì ở Phase 1:** đây là ví dụ mở rộng của kỹ thuật "chuyển
tab bằng state" đã học ở V3 (khi đó chỉ có 2 giá trị `'choi'`/`'luat'`) —
giờ mở rộng thành nhiều giá trị hơn (`'trangChu'`/`'choiAI'`/`'luatChoi'`)
nhưng nguyên lý y hệt: 1 biến state + so sánh bằng `===` để quyết định vẽ
nhánh nào. Việc tách `TrangChu` thành 1 component riêng (không viết thẳng
trong `App.jsx`) giữ cho `App.jsx` đỡ phình to, và là bước chuẩn bị tốt
cho việc sau này tách tiếp các trang khác (Ghi điểm, Thống kê) thành từng
file riêng khi tới lượt xây chúng.

Dừng lại ở đây. Xác nhận cả 4 điều trên đúng trước khi báo cáo và sang
Phase 2.

---

## Phase 2 — Lưu trạng thái ván đang chơi + nút "Dừng chơi"

Mục tiêu: bấm "Dừng chơi" bất cứ lúc nào (kể cả đang xếp bài dở, chưa xác
nhận) sẽ lưu lại đúng trạng thái đó và quay về trang chủ.

### Bước 1 — Thêm hàm lưu/đọc "ván đang chơi" vào `src/App.jsx`

Thêm hằng số + hàm (đặt ngoài component `App`, cạnh các hàm đọc dữ liệu
khác đã có từ V3):

```jsx
const KHOA_LUU_VAN_DANG_CHOI = 'mauBinhVanDangChoi';

function docVanDangChoi() {
  try {
    const raw = localStorage.getItem(KHOA_LUU_VAN_DANG_CHOI);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function luuVanDangChoi(trangThai) {
  localStorage.setItem(KHOA_LUU_VAN_DANG_CHOI, JSON.stringify(trangThai));
}

function xoaVanDangChoi() {
  localStorage.removeItem(KHOA_LUU_VAN_DANG_CHOI);
}
```

### Bước 2 — Đọc ván đã lưu (nếu có) NGAY LÚC MỞ APP

Thêm dòng này TRƯỚC MỌI state khác liên quan tới bài (`tatCaBai`,
`oCacChi`...):

```jsx
const [vanDaLuu] = useState(() => docVanDangChoi()); // đọc đúng 1 lần lúc mở app
```

### Bước 3 — Sửa các state ván chơi để KHỞI TẠO từ `vanDaLuu` nếu có

Đây là thay đổi quan trọng nhất — mỗi state liên quan tới ván chơi hiện
tại giờ phải "hỏi" `vanDaLuu` trước, chỉ tạo mới (chia bài mới) nếu không
có gì được lưu:

```jsx
const [tatCaBai] = useState(() => vanDaLuu ? vanDaLuu.tatCaBai : chiaBai());
const boBaiCuaToi = tatCaBai[0];
const [oCacChi, setOCacChi] = useState(() => vanDaLuu ? vanDaLuu.oCacChi : [...boBaiCuaToi]);

const [baiDoiThu] = useState(() => vanDaLuu ? vanDaLuu.baiDoiThu : [
  aiXepBai(tatCaBai[1]),
  aiXepBai(tatCaBai[2]),
  aiXepBai(tatCaBai[3]),
]);

// Thắng trắng: nếu đang khôi phục ván đã lưu, dùng lại đúng kết quả đã
// tính lúc chia bài trước đó — KHÔNG tính lại (bài đã cố định từ lúc đó).
const [ketQuaThangTrang] = useState(() => {
  if (vanDaLuu) return vanDaLuu.ketQuaThangTrang ?? null;
  const nguoiChoiThangTrang = [
    { ten: 'Bạn', ca13La: tatCaBai[0] },
    { ten: 'Đối thủ 1', ca13La: tatCaBai[1] },
    { ten: 'Đối thủ 2', ca13La: tatCaBai[2] },
    { ten: 'Đối thủ 3', ca13La: tatCaBai[3] },
  ];
  return tinhDiemThangTrang(nguoiChoiThangTrang, ruleset);
});

const [daXacNhan, setDaXacNhan] = useState(() => vanDaLuu ? vanDaLuu.daXacNhan : (ketQuaThangTrang !== null));
const [ketQuaDiem, setKetQuaDiem] = useState(() => vanDaLuu ? vanDaLuu.ketQuaDiem : ketQuaThangTrang);
```

> **Lưu ý về thứ tự:** `ruleset` (từ `trangThaiLuat`, đã có từ V3) phải
> được khai báo TRƯỚC đoạn này. Nếu file hiện tại có thứ tự khác, di
> chuyển khối đọc `trangThaiLuat` lên trên.

### Bước 4 — Thêm hàm "Dừng chơi"

Thêm hàm này trong component `App` (cạnh `xacNhanBai` đã có):

```jsx
function dungChoi() {
  luuVanDangChoi({
    tatCaBai, oCacChi, baiDoiThu, ketQuaThangTrang, daXacNhan, ketQuaDiem,
  });
  setTrang('trangChu');
}
```

### Bước 5 — Thêm nút "Dừng chơi" vào màn chơi bài

Trong nhánh `trang === 'choiAI'` (đã tạo ở Phase 1), thêm nút này NGAY
SAU `<h1>Chinese Poker</h1>`:

```jsx
<button className="nut-dung-choi" onClick={dungChoi}>⏸ Dừng chơi</button>
```

(Xóa nút "← Trang chủ" đơn giản nếu Phase 1 đã lỡ thêm tạm thời vào nhánh
này — giờ thay hẳn bằng "Dừng chơi" có lưu trạng thái.)

### Bước 6 — Thêm CSS

Thêm vào cuối `src/App.css`:

```css
.nut-dung-choi {
  display: block;
  margin: 0 auto 12px;
  padding: 8px 18px;
  border-radius: 8px;
  border: 1px solid rgba(248,113,113,0.4);
  background: transparent;
  color: #f87171;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
}
```

### Kiểm tra Phase 2

1. Vào "Chơi với AI", kéo vài lá đổi chỗ (CHƯA bấm Xác nhận), bấm "Dừng
   chơi" — quay về trang chủ ngay.
2. Mở Console, gõ `localStorage.getItem('mauBinhVanDangChoi')` — phải
   thấy dữ liệu JSON chứa đúng vị trí các lá vừa kéo.
3. Tắt hẳn trình duyệt (không chỉ tắt tab), mở lại app — Console vẫn còn
   dữ liệu đó (localStorage bền qua việc đóng trình duyệt).
4. **Tạm thời** (vì Phase 3 chưa làm) bấm lại "Chơi với AI" — phải thấy
   ĐÚNG lại vị trí các lá đã kéo trước khi dừng (vì `vanDaLuu` đã có sẵn
   nên state khởi tạo đúng theo nó). Đây chính là bằng chứng phần lưu/đọc
   hoạt động đúng — dù chưa có màn hình chọn "Chơi tiếp/Ván mới" đẹp mắt.
5. Thử dừng chơi SAU KHI đã xác nhận bài (đã thấy kết quả điểm) — vào lại
   phải thấy nguyên kết quả đó, không bị tính lại.

**Bạn học được gì ở Phase 2:**
- **`useState(() => vanDaLuu ? A : B)`** là khuôn mẫu "khởi tạo có điều
  kiện" — hàm bên trong `useState` chỉ chạy ĐÚNG 1 LẦN lúc component vừa
  mount, nên đây là chỗ duy nhất và đúng đắn để quyết định "bắt đầu từ dữ
  liệu cũ hay tạo mới", không thể làm việc này ở đâu khác trong component
  (nếu làm trong thân hàm bình thường, mỗi lần re-render sẽ chạy lại,
  vô tình ghi đè state đang có).
- **Gom nhiều state rời rạc thành 1 object để lưu 1 lần** (`luuVanDangChoi({tatCaBai, oCacChi, ...})`):
  đây là cách thực tế để "chụp ảnh" toàn bộ trạng thái hiện tại của 1 tính
  năng phức tạp (ở đây là cả ván bài) thành 1 khối dữ liệu duy nhất, dễ
  lưu/đọc lại nguyên vẹn — thay vì phải lưu/đọc từng mảnh nhỏ lẻ tẻ.
- **Vì sao lưu CẢ khi đã xác nhận (đã có kết quả)**: để "Dừng chơi" luôn
  có hành vi nhất quán, không cần người dùng nhớ "chỉ dừng được lúc chưa
  xong" — bấm lúc nào cũng lưu đúng lúc đó, đơn giản hóa cách hiểu của
  người dùng về nút này.

Dừng lại ở đây. Xác nhận cả 5 điều trên đúng trước khi báo cáo và sang
Phase 3.

---

## Phase 3 — Màn hình chọn "Chơi tiếp" hoặc "Ván mới"

Mục tiêu: thay vì vào thẳng màn chơi bài (hoặc tự động khôi phục ngầm như
Phase 2 tạm thời làm), giờ luôn hỏi rõ ràng trước.

### Bước 1 — Tạo file mới `src/ChonVan.jsx`

```jsx
// ChonVan.jsx
// Màn hình chọn giữa "Chơi tiếp" ván đang lưu dở, hoặc bắt đầu "Ván mới".

function ChonVan({ coVanDaLuu, onChonTiep, onChonMoi }) {
  return (
    <div className="trang-chon-van">
      <h2>Chơi với AI</h2>

      {coVanDaLuu && (
        <button className="nut-chon-van nut-chon-van-tiep" onClick={onChonTiep}>
          ▶ Chơi tiếp ván đang dở
        </button>
      )}

      <button className="nut-chon-van" onClick={onChonMoi}>
        🆕 Bắt đầu ván mới
      </button>

      {coVanDaLuu && (
        <p className="ghi-chu-canh-bao-van-moi">
          Bắt đầu ván mới sẽ XÓA ván đang lưu, không thể khôi phục lại.
        </p>
      )}
    </div>
  );
}

export default ChonVan;
```

### Bước 2 — Sửa `src/App.jsx`: thêm state `daChonVan` + 2 hàm xử lý

Thêm import:
```jsx
import ChonVan from './ChonVan.jsx'
```

Thêm state (cạnh `trang`):
```jsx
const [daChonVan, setDaChonVan] = useState(false);
```

Sửa hàm `dungChoi()` — thêm dòng reset `daChonVan` để lần sau vào lại
"Chơi với AI" luôn phải chọn lại từ đầu:
```jsx
function dungChoi() {
  luuVanDangChoi({
    tatCaBai, oCacChi, baiDoiThu, ketQuaThangTrang, daXacNhan, ketQuaDiem,
  });
  setTrang('trangChu');
  setDaChonVan(false);
}
```

Thêm 2 hàm xử lý lựa chọn:
```jsx
function chonChoiTiep() {
  // vanDaLuu đã có sẵn từ lúc mount app (Phase 2), toàn bộ state ván chơi
  // đã khởi tạo đúng theo nó rồi — chỉ cần "mở khóa" màn chơi ra xem.
  setDaChonVan(true);
}

function chonVanMoi() {
  xoaVanDangChoi();
  // Toàn bộ state ván chơi (tatCaBai, oCacChi...) đã được khởi tạo 1 LẦN
  // DUY NHẤT lúc mount bằng useState(() => ...) — không có cách "chia lại
  // bài mới" cho các state đó nữa giữa chừng. Cách đơn giản và chắc chắn
  // nhất: tải lại toàn bộ trang — component mount lại từ đầu, lúc đó
  // không còn thấy ván đã lưu (vừa xóa xong) nên tự chia bài hoàn toàn
  // mới, không lẫn gì với ván cũ.
  window.location.reload();
}
```

### Bước 3 — Sửa phần JSX rẽ nhánh cho `trang === 'choiAI'`

```jsx
{trang === 'choiAI' && !daChonVan && (
  <ChonVan
    coVanDaLuu={!!vanDaLuu}
    onChonTiep={chonChoiTiep}
    onChonMoi={chonVanMoi}
  />
)}

{trang === 'choiAI' && daChonVan && (
  <>
    <h1>Chinese Poker</h1>
    <button className="nut-dung-choi" onClick={dungChoi}>⏸ Dừng chơi</button>
    {/* ...toàn bộ nội dung màn chơi bài, giữ nguyên y hệt Phase 1-2... */}
  </>
)}
```

### Bước 4 — Thêm CSS

Thêm vào cuối `src/App.css`:

```css
.trang-chon-van {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 60px;
  max-width: 360px;
  margin: 0 auto;
  text-align: center;
}

.nut-chon-van {
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.06);
  color: white;
}

.nut-chon-van-tiep {
  background: linear-gradient(135deg, #d4a017, #f0c040);
  color: #1a2010;
  border-color: transparent;
}

.ghi-chu-canh-bao-van-moi {
  font-size: 12px;
  color: #f87171;
  margin-top: 4px;
}
```

### Kiểm tra Phase 3

1. Chưa từng dừng chơi ván nào (localStorage trống) — bấm "Chơi với AI"
   từ trang chủ: chỉ thấy nút "Bắt đầu ván mới" (không có "Chơi tiếp", vì
   `coVanDaLuu` là `false`).
2. Bấm "Bắt đầu ván mới" — vào màn chơi, chia bài mới bình thường.
3. Kéo vài lá, bấm "Dừng chơi" — về trang chủ.
4. Bấm lại "Chơi với AI" — giờ thấy CẢ 2 nút: "Chơi tiếp ván đang dở" và
   "Bắt đầu ván mới" (kèm dòng cảnh báo xóa ván cũ).
5. Bấm "Chơi tiếp" — vào đúng lại màn chơi với vị trí các lá y hệt lúc
   dừng.
6. Quay lại trang chủ (dừng chơi lần nữa), bấm "Chơi với AI", lần này bấm
   "Bắt đầu ván mới" — trang tự tải lại, vào ván hoàn toàn mới, không còn
   dấu vết ván cũ (Console: `localStorage.getItem('mauBinhVanDangChoi')`
   phải trả về `null`).

**Bạn học được gì ở Phase 3:**
- **`daChonVan` là "cổng chắn" giữa 2 màn hình con của cùng 1 `trang`**:
  đây là ví dụ về việc 1 "trang" lớn (`'choiAI'`) có thể tự chia thành
  nhiều "màn hình con" nhỏ hơn bằng 1 biến state phụ, không cần thêm giá
  trị mới cho `trang` — giữ cho khái niệm `trang` (điều hướng cấp cao)
  tách biệt khỏi khái niệm "đã chọn xong ván chưa" (trạng thái cục bộ bên
  trong 1 trang).
- **`window.location.reload()` như 1 giải pháp "reset sạch"**: không phải
  lúc nào cũng cần viết logic phức tạp để "xóa và khởi tạo lại" nhiều
  state cùng lúc — đôi khi tải lại cả trang (component mount lại từ đầu,
  mọi `useState(() => ...)` chạy lại từ đầu) là cách đơn giản, ít lỗi
  nhất, đặc biệt hợp lý ở đây vì đằng nào cũng đang "bắt đầu lại từ đầu".
- **Vì sao đọc `vanDaLuu` ngay lúc mở app (Phase 2) thay vì đợi tới lúc
  bấm "Chơi với AI"**: vì các state ván chơi (`tatCaBai`, `oCacChi`...)
  chỉ khởi tạo được ĐÚNG 1 LẦN lúc mount — nếu đợi tới lúc người dùng bấm
  điều hướng mới đọc, đã quá muộn để dùng nó khởi tạo state (state đã
  được tạo trước đó rồi, dựa theo lúc app vừa mở). Đây là lý do thiết kế
  ở Phase 2 đọc `vanDaLuu` sớm hơn cả khi thực sự cần dùng tới nó.

Hoàn thành V5! Giờ app đã có trang chủ, điều hướng nhiều trang, và có thể
dừng/tiếp tục ván chơi bất cứ lúc nào mà không mất dữ liệu.

---

## Bổ sung sau V5 — Nút "Chơi ván mới" + định nghĩa lại "ván đang dở"

Sau khi xong 3 Phase gốc, Huy yêu cầu thêm 2 việc dựa trên trải nghiệm chơi
thực tế. Cả 2 đều sửa trong `src/App.jsx` (+ CSS trong `src/App.css`),
không cần file mới.

### Bổ sung 1 — Nút "Chơi ván mới" ngay cạnh "Dừng chơi"

Trước đây, muốn chơi ván tiếp theo sau khi đã có kết quả, phải bấm "Dừng
chơi" → về trang chủ → "Chơi với AI" → "Bắt đầu ván mới" — vòng vèo. Giờ
thêm 1 nút tắt ngay tại màn kết quả, tái dùng đúng logic `chonVanMoi()`
đã có sẵn từ Phase 3 (chia bài mới + reset toàn bộ state ván chơi), chỉ
khác là KHÔNG rời khỏi màn chơi.

Thêm biến xác định ván đã kết thúc (đặt cạnh `hopLe`):
```jsx
const vanDaKetThuc = !!(ketQuaThangTrang || (daXacNhan && ketQuaDiem));
```

Bọc nút "Dừng chơi" trong 1 hàng, thêm nút mới chỉ hiện khi `vanDaKetThuc`:
```jsx
<div className="hang-nut-dieu-khien">
  <button className="nut-dung-choi" onClick={dungChoi}>⏸ Dừng chơi</button>
  {vanDaKetThuc && (
    <button className="nut-choi-tiep" onClick={chonVanMoi}>🆕 Chơi ván mới</button>
  )}
</div>
```

CSS thêm vào `App.css`:
```css
.hang-nut-dieu-khien {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 12px;
}

.nut-choi-tiep {
  display: block;
  margin: 0;
  padding: 8px 18px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: linear-gradient(135deg, #d4a017, #f0c040);
  color: #1a2010;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
}
```

### Bổ sung 2 — "Ván đang dở" chỉ tính khi CHƯA xác nhận bài

Vấn đề: bản Phase 2/3 gốc lưu "ván đang dở" MỖI LẦN bấm "Dừng chơi", kể cả
khi ván đó đã xác nhận bài xong (đã có kết quả) hoặc đã thắng trắng ngay
từ đầu. Hệ quả: "Chơi tiếp ván đang dở" có thể mở lại 1 ván đã KẾT THÚC —
vô nghĩa, vì không còn gì để "chơi tiếp".

Định nghĩa lại rõ ràng: **ván đang dở** = chưa bấm "Xác nhận bài" (và
không phải thắng trắng). **Kết thúc** = đã xác nhận bài, hoặc thắng trắng
ngay từ lúc chia. Ván đã kết thúc thì "Dừng chơi" không lưu gì để chơi
tiếp nữa.

Sửa `dungChoi()` — chỉ lưu khi ván CHƯA kết thúc:
```jsx
function dungChoi() {
  if (vanDaKetThuc) {
    // Ván đã xong — không còn gì để "chơi tiếp", xóa luôn dữ liệu tạm
    // (nếu có) để tránh "Chơi tiếp ván đang dở" mở lại nhầm 1 ván đã xong.
    xoaVanDangChoi();
    setCoVanDaLuu(false);
  } else {
    luuVanDangChoi({
      tatCaBai, oCacChi, baiDoiThu, ketQuaThangTrang, daXacNhan, ketQuaDiem,
    });
    setCoVanDaLuu(true);
  }
  setTrang('trangChu');
  setDaChonVan(false);
}
```

> **Lưu ý:** `coVanDaLuu` ở đây là 1 state RIÊNG (không phải suy ra trực
> tiếp từ `vanDaLuu`), vì `vanDaLuu` chỉ đọc đúng 1 lần lúc mount app —
> nếu dùng thẳng `!!vanDaLuu` để quyết định hiện nút "Chơi tiếp", nó sẽ
> KHÔNG cập nhật khi "Dừng chơi"/"Chơi ván mới" xảy ra giữa phiên (không
> tải lại trang). Khởi tạo `coVanDaLuu` bằng `vanDaLuu !== null` lúc mount,
> rồi tự đồng bộ tay trong `dungChoi()` và `chonVanMoi()`.

Phòng dữ liệu cũ (lưu từ trước khi có luật này) lỡ chứa 1 ván đã xong, lọc
luôn ở khâu đọc — sửa `docVanDangChoi()`:
```jsx
function docVanDangChoi() {
  try {
    const raw = localStorage.getItem(KHOA_LUU_VAN_DANG_CHOI);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || obj.daXacNhan || obj.ketQuaThangTrang) {
      localStorage.removeItem(KHOA_LUU_VAN_DANG_CHOI);
      return null;
    }
    return obj;
  } catch {
    return null;
  }
}
```

### Kiểm tra 2 bổ sung này

1. Xếp bài dở (chưa xác nhận), bấm "Dừng chơi" → vào lại "Chơi với AI"
   vẫn thấy "Chơi tiếp ván đang dở" và hoạt động đúng như Phase 3.
2. Xác nhận bài xong (đã thấy "Kết quả") — thấy CẢ 2 nút "Dừng chơi" và
   "Chơi ván mới" cạnh nhau.
3. Bấm "Chơi ván mới" ngay tại màn kết quả → ở lại màn chơi (KHÔNG bật về
   trang chủ), bài mới hoàn toàn, kết quả cũ biến mất.
4. Sau khi đã xác nhận bài xong, bấm "Dừng chơi" (thay vì "Chơi ván mới")
   → về trang chủ, `localStorage.getItem('mauBinhVanDangChoi')` phải là
   `null`, và bấm lại "Chơi với AI" chỉ còn thấy "Bắt đầu ván mới" (không
   còn "Chơi tiếp ván đang dở").

---

## Sau khi xong V5 — kiểm tra lại với Huy

1. Toàn bộ 3 Phase chạy đúng, không lỗi Console.
2. Luồng đầy đủ: Trang chủ → Chơi với AI → (Ván mới/Chơi tiếp) → chơi →
   Dừng chơi → Trang chủ → lặp lại — mượt mà, không mất dữ liệu ở bước
   nào.
3. Tab "Luật chơi" vẫn hoạt động y hệt trước, chỉ thêm nút quay về trang
   chủ.
4. Có muốn sang V6 (Ghi điểm cho bài thật ngoài đời) tiếp theo không, hay
   muốn tinh chỉnh thêm V5 trước (ví dụ thêm hoạt ảnh chuyển trang, đổi
   biểu tượng...)?
