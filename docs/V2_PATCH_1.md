# V2_PATCH.md — Xếp bài theo vị trí kéo-thả (tăng độ khó) + AI hiện theo 3 chi

> **Bối cảnh**: bản vá này thay thế hoàn toàn ý tưởng "tự động sắp xếp lá
> bài theo thứ tự cao-thấp" của phiên bản trước — vì Huy nhận thấy tự động
> sắp xếp làm giảm độ khó của trò chơi (mất đi yếu tố người chơi phải tự
> quan sát và xếp bài). Thiết kế mới: 13 lá nằm sẵn ngay trong 3 khung Chi
> Đầu/Giữa/Cuối theo thứ tự ngẫu nhiên lúc chia (không có khung "bài trên
> tay" riêng nữa) — người chơi tự kéo 2 lá để hoán đổi vị trí cho nhau,
> đây là thao tác duy nhất trong suốt quá trình xếp bài. Chỉ sau khi bấm
> "Xác nhận", bài mới được tự động sắp xếp lại đẹp mắt để xem kết quả.
> Bài AI vẫn hiển thị tách 3 hàng riêng (Đầu/Giữa/Cuối), đã sắp xếp sẵn —
> giữ nguyên từ bản vá trước.

## Thay đổi thiết kế cốt lõi so với V2 gốc

| | V2 gốc | Bản vá này |
|---|---|---|
| Cấu trúc dữ liệu | Object viTri (mỗi lá ánh xạ tới tên 1 trong 4 vùng: tay/dau/giua/cuoi) | 1 mảng 13 phần tử duy nhất, vị trí trong mảng = vị trí ô cố định |
| Khung "bài trên tay" | Có, riêng biệt | Không còn — 13 lá nằm thẳng trong 3 khung Đầu/Giữa/Cuối ngay từ đầu |
| Thao tác kéo-thả | Kéo từ tay vào 1 vùng (thêm vào cuối danh sách vùng đó) | Kéo lá A thả vào lá B, A và B hoán đổi vị trí cho nhau |
| Thứ tự hiển thị lúc đang xếp | Tự động sort theo rank | Giữ nguyên đúng vị trí người chơi đã sắp đặt, không tự sort |
| Thứ tự hiển thị sau khi Xác nhận | (không áp dụng) | Tự động sort theo rank để xem kết quả đẹp mắt |

---

## Bước 1 — Viết lại hoàn toàn src/App.jsx

Thay toàn bộ nội dung file `src/App.jsx` bằng đoạn sau:

```jsx
import { useState, useRef } from 'react'
import './App.css'
import { chiaBai, xepBaiHopLe, tinhDiem, sapXepDeHienThi } from './cardEngine.js'
import { aiXepBai } from './aiEngine.js'
import Card from './Card.jsx'

// 13 ô cố định: index 0-2 = Chi Đầu, 3-7 = Chi Giữa, 8-12 = Chi Cuối
const BAT_DAU = { dau: 0, giua: 3, cuoi: 8 };

function App() {
  const [tatCaBai] = useState(() => chiaBai());
  const boBaiCuaToi = tatCaBai[0];

  // 1 mảng DUY NHẤT, 13 phần tử. Vị trí trong mảng CHÍNH LÀ vị trí ô của
  // lá đó trong 3 chi — không còn khái niệm "bài trên tay" tách riêng.
  // Giá trị khởi tạo giữ nguyên thứ tự ngẫu nhiên do chiaBai() tạo ra.
  const [oCacChi, setOCacChi] = useState(() => [...boBaiCuaToi]);

  const [dragging, setDragging] = useState(null); // { tuIndex, laBai, x, y }
  const refsO = useRef([]); // 13 ref, mỗi ref ứng với đúng 1 ô (theo index 0-12)

  const [baiDoiThu] = useState(() => [
    aiXepBai(tatCaBai[1]),
    aiXepBai(tatCaBai[2]),
    aiXepBai(tatCaBai[3]),
  ]);

  const [daXacNhan, setDaXacNhan] = useState(false);
  const [ketQuaDiem, setKetQuaDiem] = useState(null);

  // Dữ liệu GỐC theo đúng vị trí ô (dùng để kiểm tra hợp lệ, tính điểm,
  // và xác định chính xác index khi kéo-thả)
  const chiDauGoc = oCacChi.slice(0, 3);
  const chiGiuaGoc = oCacChi.slice(3, 8);
  const chiCuoiGoc = oCacChi.slice(8, 13);
  const hopLe = xepBaiHopLe(chiDauGoc, chiGiuaGoc, chiCuoiGoc);

  function onPointerDownLa(e, tuIndex) {
    e.target.setPointerCapture(e.pointerId);
    setDragging({ tuIndex, laBai: oCacChi[tuIndex], x: e.clientX, y: e.clientY });
  }

  function onPointerMove(e) {
    if (!dragging) return;
    setDragging(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
  }

  function isInside(rect, x, y) {
    return rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function onPointerUp(e) {
    if (!dragging) return;
    const x = e.clientX, y = e.clientY;

    // Tìm xem đang thả vào đúng Ô nào trong 13 ô, bằng cách so tọa độ thả
    // với vị trí thật của từng ô trên màn hình
    let denIndex = -1;
    for (let i = 0; i < 13; i++) {
      const rect = refsO.current[i]?.getBoundingClientRect();
      if (isInside(rect, x, y)) { denIndex = i; break; }
    }

    if (denIndex !== -1 && denIndex !== dragging.tuIndex) {
      // HOÁN ĐỔI: lá ở ô đích và lá đang kéo đổi chỗ cho nhau — đây là
      // thao tác DUY NHẤT của trò chơi, không có khái niệm "thêm vào" hay
      // "ô trống" vì luôn có sẵn đúng 13/13 lá ngay từ đầu.
      setOCacChi(prev => {
        const moi = [...prev];
        [moi[dragging.tuIndex], moi[denIndex]] = [moi[denIndex], moi[dragging.tuIndex]];
        return moi;
      });
    }
    setDragging(null);
  }

  function xacNhanBai() {
    const nguoiChoi = [
      { ten: 'Bạn', chiDau: chiDauGoc, chiGiua: chiGiuaGoc, chiCuoi: chiCuoiGoc },
      { ten: 'Đối thủ 1', ...baiDoiThu[0] },
      { ten: 'Đối thủ 2', ...baiDoiThu[1] },
      { ten: 'Đối thủ 3', ...baiDoiThu[2] },
    ];
    setKetQuaDiem(tinhDiem(nguoiChoi));
    setDaXacNhan(true);
  }

  // Vẽ 1 vùng TRONG LÚC ĐANG XẾP (cho phép kéo-thả): hiển thị ĐÚNG theo
  // vị trí ô gốc trong oCacChi, KHÔNG sort — để mỗi lá luôn gắn đúng với
  // index thật của nó, đảm bảo kéo-thả luôn chính xác tuyệt đối.
  function renderVungDangXep(nhan, danhSachGoc, chiSoBatDau) {
    return (
      <div className="vung-chi">
        <div className="vung-tieu-de">{nhan}</div>
        <div className="vung-noi-dung">
          {danhSachGoc.map((l, i) => {
            const indexToanCuc = chiSoBatDau + i;
            return (
              <div
                key={indexToanCuc}
                ref={el => { refsO.current[indexToanCuc] = el; }}
                style={{ opacity: dragging?.tuIndex === indexToanCuc ? 0.25 : 1 }}
              >
                <Card laBai={l} onPointerDown={(e) => onPointerDownLa(e, indexToanCuc)} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Vẽ 1 vùng SAU KHI ĐÃ XÁC NHẬN (chỉ xem, không kéo được nữa): tự sắp
  // xếp lại theo thứ tự cao-thấp cho đẹp mắt. Vì không còn tương tác kéo,
  // không cần gắn index gốc ở đây — tách hẳn thành hàm riêng để tránh
  // nhầm lẫn với renderVungDangXep ở trên (2 trạng thái khác nhau hoàn
  // toàn, không nên dùng chung 1 hàm).
  function renderVungChiXem(nhan, danhSachGoc) {
    const daSort = sapXepDeHienThi(danhSachGoc);
    return (
      <div className="vung-chi">
        <div className="vung-tieu-de">{nhan}</div>
        <div className="vung-noi-dung">
          {daSort.map(l => (
            <Card key={`${l.rank}-${l.suit}`} laBai={l} onPointerDown={() => {}} />
          ))}
        </div>
      </div>
    );
  }

  // Hiện bài 1 đối thủ AI theo 3 hàng riêng (Đầu/Giữa/Cuối), đã sắp xếp,
  // không cho kéo (giữ nguyên từ bản vá trước)
  function renderBaiDoiThu(doiThu, idx) {
    return (
      <div key={idx} className="khoi-doi-thu">
        <div className="ten-doi-thu">Đối thủ {idx + 1}</div>
        {[
          { nhan: 'Đầu', ds: sapXepDeHienThi(doiThu.chiDau) },
          { nhan: 'Giữa', ds: sapXepDeHienThi(doiThu.chiGiua) },
          { nhan: 'Cuối', ds: sapXepDeHienThi(doiThu.chiCuoi) },
        ].map(({ nhan, ds }) => (
          <div key={nhan} className="vung-chi vung-chi-doi-thu">
            <div className="vung-tieu-de">{nhan}</div>
            <div className="vung-noi-dung">
              {ds.map(l => (
                <Card key={`${l.rank}-${l.suit}`} laBai={l} onPointerDown={() => {}} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="trang" style={{ touchAction: 'none' }}
         onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
      <h1>Chinese Poker</h1>

      {!daXacNhan && (
        <p style={{ textAlign: 'center', opacity: 0.7, fontSize: 13 }}>
          Kéo 2 lá để đổi chỗ cho nhau, sắp xếp theo ý bạn
        </p>
      )}

      {daXacNhan ? (
        <>
          {renderVungChiXem('Chi Đầu (3 lá)', chiDauGoc)}
          {renderVungChiXem('Chi Giữa (5 lá)', chiGiuaGoc)}
          {renderVungChiXem('Chi Cuối (5 lá)', chiCuoiGoc)}
        </>
      ) : (
        <>
          {renderVungDangXep('Chi Đầu (3 lá)', chiDauGoc, BAT_DAU.dau)}
          {renderVungDangXep('Chi Giữa (5 lá)', chiGiuaGoc, BAT_DAU.giua)}
          {renderVungDangXep('Chi Cuối (5 lá)', chiCuoiGoc, BAT_DAU.cuoi)}
        </>
      )}

      <p className={hopLe ? 'thong-bao-hop-le' : 'thong-bao-loi'}>
        {hopLe ? 'Hợp lệ — sẵn sàng!' : 'Binh lủng!'}
      </p>

      {!daXacNhan && (
        <button className="nut-xac-nhan" onClick={xacNhanBai}>Xác nhận bài</button>
      )}

      {daXacNhan && ketQuaDiem && (
        <div className="ket-qua">
          <h2>Kết quả</h2>
          {Object.entries(ketQuaDiem).map(([ten, d]) => (
            <p key={ten}>{ten}: <b className={d >= 0 ? 'diem-duong' : 'diem-am'}>{d > 0 ? '+' : ''}{d}</b></p>
          ))}
        </div>
      )}

      {dragging && (
        <div className="la-bai-dang-keo" style={{ left: dragging.x - 28, top: dragging.y - 38 }}>
          <Card laBai={dragging.laBai} onPointerDown={() => {}} />
        </div>
      )}

      <hr />
      <h2>Bài của 3 đối thủ (AI đã xếp)</h2>
      {baiDoiThu.map((doiThu, idx) => renderBaiDoiThu(doiThu, idx))}
    </div>
  )
}

export default App
```

Bạn học được gì ở Bước 1:
- Thay đổi cấu trúc dữ liệu để đơn giản hóa logic: chuyển từ object viTri
  (ánh xạ lá tới tên vùng) sang 1 mảng duy nhất (vị trí trong mảng = vị
  trí ô). Đây là ví dụ thực tế về việc chọn đúng cấu trúc dữ liệu giúp code
  dễ viết hơn nhiều — với yêu cầu "swap theo vị trí cụ thể", 1 mảng phẳng
  đơn giản hơn hẳn so với việc quản lý nhiều mảng riêng.
- useRef([]) cho nhiều phần tử: khác với trước đây mỗi useRef ứng với 1
  phần tử DOM duy nhất, ở đây refsO là 1 mảng chứa nhiều tham chiếu — mỗi
  lần React vẽ 1 lá bài, dòng ref={el => { refsO.current[indexToanCuc] =
  el; }} sẽ tự ghi tham chiếu DOM thật vào đúng vị trí tương ứng trong
  mảng refsO.current.
- Tách 2 hàm render cho 2 trạng thái khác nhau (renderVungDangXep và
  renderVungChiXem): dù 2 hàm này nhìn tương tự nhau, việc tách riêng giúp
  code rõ ràng — tránh tình huống dễ nhầm lẫn nếu cố dùng chung 1 hàm cho
  cả 2 mục đích khác nhau (đang sửa được so với chỉ xem).

## Bước 2 — Thêm hàm sắp xếp vào src/cardEngine.js

Thêm vào cuối file `src/cardEngine.js`:

```js
// Sắp xếp 1 danh sách lá bài theo thứ tự CAO -> THẤP, dùng để hiển thị
// SAU KHI đã xác nhận bài (không dùng trong lúc đang xếp, vì lúc đó thứ
// tự hiển thị phải đúng theo vị trí người chơi tự sắp xếp).
export function sapXepDeHienThi(danhSachLa) {
  return [...danhSachLa].sort((a, b) => b.rank - a.rank);
}
```

## Bước 3 — Thêm CSS cho khối hiển thị đối thủ

Nếu chưa có từ bản vá trước, thêm vào cuối `src/App.css`:

```css
.khoi-doi-thu {
  background: rgba(0,0,0,0.2);
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 12px;
}

.ten-doi-thu {
  font-weight: bold;
  color: #f0c040;
  margin-bottom: 8px;
}

.vung-chi-doi-thu {
  margin-bottom: 6px;
  min-height: auto;
}
```

---

## Kiểm tra sau khi sửa

Lưu tất cả các file, kiểm tra trên trình duyệt:

1. Mới vào ván: thấy ngay 13 lá nằm sẵn trong 3 khung Đầu (3 lá), Giữa (5
   lá), Cuối (5 lá) — không còn khung "bài trên tay" nào nữa.
2. Kéo 1 lá ở Chi Đầu thả vào 1 lá khác cũng đang ở Chi Đầu: 2 lá đó đổi
   chỗ cho nhau ngay lập tức.
3. Kéo 1 lá ở Chi Đầu thả vào 1 lá đang ở Chi Giữa: 2 lá đổi chỗ cho nhau
   — lá từ Đầu chuyển sang Giữa, lá từ Giữa chuyển ngược về Đầu. Số lượng
   lá mỗi chi luôn giữ nguyên (Đầu vẫn đúng 3, Giữa vẫn đúng 5...).
4. Trong lúc đang xếp (chưa bấm Xác nhận): thứ tự các lá trong mỗi chi
   đúng theo vị trí bạn vừa kéo-thả, không tự động nhảy về thứ tự cao-
   thấp.
5. Bấm "Xác nhận bài": ngay lúc này, cả 3 chi của bạn tự động sắp xếp lại
   theo thứ tự cao-thấp để xem kết quả đẹp mắt — không kéo được nữa.
6. Phần "Bài của 3 đối thủ": vẫn hiện 3 hàng riêng (Đầu/Giữa/Cuối) cho mỗi
   đối thủ, đã sắp xếp sẵn (giữ nguyên từ bản vá trước).

Nếu cả 6 điều trên đều đúng, bản vá đã hoàn thành — có thể tiếp tục sang
V3 (ghi điểm nhóm chơi thật).
