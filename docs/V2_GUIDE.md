# V2_GUIDE.md — Làm đẹp giao diện + chạy mượt trên điện thoại/iPad + kéo-thả

> **Dành cho ai đọc file này:**
> - Nếu bạn là **Claude Code**: đây là yêu cầu xây dựng V2, tiếp nối từ V1 đã
>   hoàn thành (5 Phase: cardEngine.js, Card.jsx, xếp bài bằng bấm-chọn, AI,
>   tính điểm). Làm theo đúng thứ tự Phase bên dưới, MỖI Phase xong phải DỪNG
>   LẠI để Huy tự kiểm tra trên trình duyệt (cả máy tính lẫn điện thoại nếu
>   có thể) trước khi sang Phase tiếp theo.
> - Nếu bạn là **Huy**: đọc phần "Bạn học được gì" sau mỗi Phase để hiểu khái
>   niệm mới.

## Phạm vi của V2

- Làm đẹp giao diện bằng CSS thuần (viết tay trong file .css, KHÔNG dùng
  Tailwind hay thư viện UI nào khác — quyết định đã chốt với Huy).
- Responsive: giao diện hiển thị tốt cả trên điện thoại, iPad, và máy tính.
- Đổi cách xếp bài từ "bấm chọn chi rồi bấm lá" (V1) sang kéo-thả bằng ngón
  tay/chuột — cùng 1 đoạn code chạy đúng trên cả 2 kiểu thiết bị.
- KHÔNG làm trong V2: multiplayer, ghi điểm nhóm thật, thống kê, animation
  phức tạp (confetti, âm thanh...) — để dành phiên bản sau.

## Kỹ thuật cốt lõi của V2: Pointer Events

Đây là phần quan trọng nhất cần Claude Code hiểu trước khi code: có 2 cách
để làm "kéo-thả" trên web, và chỉ 1 cách hoạt động đúng trên cả chuột lẫn
cảm ứng:

| Cách | Hoạt động trên chuột | Hoạt động trên cảm ứng (điện thoại/iPad) |
|---|---|---|
| HTML5 Drag and Drop API (draggable, onDragStart...) | Có | Không — đây là giới hạn đã biết của trình duyệt |
| Pointer Events (onPointerDown, onPointerMove, onPointerUp) | Có | Có — API được thiết kế để hợp nhất chuột, cảm ứng và bút cảm ứng |

V2 dùng Pointer Events, không dùng HTML5 Drag and Drop, để đảm bảo đúng yêu
cầu "chạy trên điện thoại, iPad và máy tính" của Huy.

### Cơ chế hoạt động (giải thích trước khi code)

1. onPointerDown (đặt ngón tay/click chuột xuống 1 lá bài): bắt đầu kéo,
   ghi nhớ "đang kéo lá nào" cùng tọa độ hiện tại.
2. onPointerMove (di chuyển ngón tay/chuột, lắng nghe trên toàn trang): cập
   nhật tọa độ, làm hình ảnh lá bài "bay theo" ngón tay/chuột.
3. onPointerUp (nhấc ngón tay/thả chuột): kiểm tra tọa độ thả đang nằm
   trong vùng nào (Chi Đầu/Giữa/Cuối/Bài trên tay) bằng cách so sánh với vị
   trí thực tế của từng vùng trên màn hình, rồi cập nhật state tương ứng.

---

## Phase 1 — Tách CSS ra file riêng, làm đẹp lá bài

Mục tiêu: chuyển từ style viết trực tiếp trong JSX (cách V1 làm) sang 1
file .css riêng — đây là cách làm chuẩn khi giao diện phức tạp hơn.

Tạo file `src/App.css`:

```css
* {
  box-sizing: border-box;
}

.trang {
  font-family: -apple-system, sans-serif;
  background: linear-gradient(160deg, #0f2027, #1a3a2a);
  min-height: 100vh;
  padding: 16px;
  color: white;
}

.trang h1 {
  text-align: center;
  color: #f0c040;
  margin-bottom: 16px;
}

.vung-chi {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,215,0,0.2);
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 12px;
  min-height: 90px;
}

.vung-tieu-de {
  font-size: 13px;
  font-weight: bold;
  color: #f0c040;
  margin-bottom: 6px;
}

.vung-noi-dung {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.la-bai {
  width: 48px;
  height: 66px;
  background: white;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4px;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 2px 4px rgba(0,0,0,0.4);
  font-weight: bold;
  flex-shrink: 0;
}

.la-bai-goc {
  font-size: 13px;
}

.la-bai-giua {
  text-align: center;
  font-size: 18px;
}

.thong-bao-hop-le {
  color: #4ade80;
  font-weight: bold;
  font-size: 18px;
  text-align: center;
}

.thong-bao-loi {
  color: #f87171;
  font-weight: bold;
  font-size: 18px;
  text-align: center;
}

.nut-xac-nhan {
  display: block;
  margin: 12px auto;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: bold;
  background: linear-gradient(135deg, #d4a017, #f0c040);
  color: #1a2010;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

.ket-qua {
  background: rgba(255,215,0,0.08);
  border-radius: 10px;
  padding: 12px;
  margin: 12px 0;
}

.diem-duong { color: #4ade80; }
.diem-am { color: #f87171; }
```

Sửa `src/Card.jsx` — bỏ toàn bộ style inline trừ màu sắc, dùng className
thay thế:

```jsx
const TEN_RANK = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const KY_HIEU_CHAT = ['♠', '♥', '♦', '♣'];
const MAU_CHAT = ['#1a1a1a', '#d32f2f', '#e65100', '#1a1a1a'];

function Card({ laBai, onClick }) {
  const ten = TEN_RANK[laBai.rank];
  const kyHieu = KY_HIEU_CHAT[laBai.suit];
  const mau = MAU_CHAT[laBai.suit];

  return (
    <div className="la-bai" onClick={onClick} style={{ color: mau }}>
      <div className="la-bai-goc">{ten}{kyHieu}</div>
      <div className="la-bai-giua">{kyHieu}</div>
    </div>
  );
}

export default Card;
```

Lưu ý: dòng style với màu sắc vẫn còn vì màu (đỏ/đen/cam) đổi theo TỪNG lá
bài cụ thể — CSS không "biết" trước lá nào màu gì, nên phần này vẫn cần
JavaScript tính toán. Các thuộc tính KHÔNG đổi theo từng lá (kích thước, bo
góc, khoảng cách...) thì chuyển hết vào CSS. Nguyên tắc: style cố định vào
file CSS, style phụ thuộc dữ liệu vẫn để trong JSX.

Sửa đầu file `src/App.jsx`, thêm dòng:
```jsx
import './App.css'
```

Sau đó thay toàn bộ style inline còn lại trong App.jsx (tiêu đề, khung chi,
thông báo, nút...) bằng className tương ứng đã viết trong App.css
(vung-chi, vung-tieu-de, vung-noi-dung, thong-bao-hop-le, thong-bao-loi,
nut-xac-nhan, ket-qua, diem-duong, diem-am).

Bạn học được gì ở Phase 1: phân biệt 2 cách viết CSS trong React — style
inline (viết trực tiếp, ưu tiên khi giá trị phụ thuộc dữ liệu) và className
(style đặt sẵn trong file .css, ưu tiên khi giao diện không đổi). Phần lớn
dự án thực tế dùng className là chính, style inline chỉ cho trường hợp đặc
biệt.

Dừng lại ở đây. Huy kiểm tra: giao diện có đổi đẹp hơn (nền gradient, lá
bài bo góc có bóng đổ, nút vàng...) không, và chức năng xếp bài (bấm chọn)
vẫn hoạt động như V1 không (Phase này không đổi logic, chỉ đổi hình thức).

---

## Phase 2 — Responsive: chạy tốt trên điện thoại và iPad

Mục tiêu: kiểm tra và chỉnh giao diện hiển thị hợp lý ở nhiều kích thước
màn hình khác nhau.

Cách kiểm tra responsive ngay trên máy tính (không cần điện thoại thật): mở
Chrome, bấm F12 mở DevTools, bấm icon hình điện thoại/máy tính bảng ở góc
trên trái DevTools (hoặc Cmd+Shift+M) — đây gọi là chế độ Device Toolbar,
giả lập màn hình điện thoại/iPad ngay trên máy tính.

Thêm vào cuối `src/App.css`:

```css
/* Mặc định (điện thoại dọc): lá bài nhỏ gọn, đã đặt ở trên */

/* Màn hình rộng hơn (iPad, máy tính): lá bài to hơn, giới hạn chiều rộng
   tổng thể để không bị dàn quá rộng trên màn hình lớn */
@media (min-width: 700px) {
  .la-bai {
    width: 58px;
    height: 80px;
  }
  .la-bai-giua {
    font-size: 22px;
  }
  .trang {
    max-width: 700px;
    margin: 0 auto;
  }
}
```

@media (min-width: 700px) nghĩa là: chỉ áp dụng các style bên trong dấu
ngoặc này khi màn hình rộng từ 700px trở lên. Đây gọi là media query —
cách CSS "hỏi" trình duyệt về kích thước màn hình hiện tại để quyết định
style nào áp dụng. Khái niệm Responsive Design chính là việc dùng nhiều
media query để giao diện tự thích ứng theo từng kích thước màn hình.

Cũng cần đảm bảo thẻ head trong index.html (file gốc, không phải trong
thư mục src) có dòng sau (Vite thường đã có sẵn, kiểm tra lại):

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

Dòng viewport này báo cho trình duyệt điện thoại biết: hiển thị trang web
đúng theo chiều rộng thật của màn hình điện thoại, đừng thu nhỏ lại giả vờ
là màn hình máy tính — thiếu dòng này, trang web sẽ hiện rất nhỏ và khó
dùng trên điện thoại dù CSS đã viết đúng.

Bạn học được gì ở Phase 2: khái niệm Responsive Design qua media query —
cách phổ biến nhất để 1 trang web tự biến hình phù hợp nhiều kích thước
màn hình, thay vì làm riêng nhiều phiên bản.

Dừng lại ở đây. Huy thử bật Device Toolbar (Cmd+Shift+M trong Chrome) chọn
vài loại thiết bị (iPhone, iPad) xem giao diện có hiển thị hợp lý không.
Nếu có điều kiện, mở thử bằng điện thoại thật (xem cách lấy địa chỉ mạng ở
ghi chú cuối file này).

---

## Phase 3 — Chuyển sang kéo-thả (Pointer Events)

Đây là Phase quan trọng và phức tạp nhất của V2. Có 1 thay đổi lớn trong
cách lưu trữ state: thay vì 3 mảng riêng (chiDau, chiGiua, chiCuoi) như V1,
chuyển sang 1 object duy nhất ghi nhớ "mỗi lá đang ở vùng nào" — cách này
giúp việc kéo 1 lá từ vùng này sang vùng khác đơn giản hơn nhiều (chỉ cần
đổi 1 giá trị, không cần xóa khỏi mảng cũ rồi thêm vào mảng mới).

Sửa toàn bộ `src/App.jsx`:

```jsx
import { useState, useRef } from 'react'
import './App.css'
import { chiaBai, xepBaiHopLe, tinhDiem } from './cardEngine.js'
import { aiXepBai } from './aiEngine.js'
import Card from './Card.jsx'

// Giới hạn số lá tối đa mỗi vùng
const GIOI_HAN = { dau: 3, giua: 5, cuoi: 5, tay: 13 };

function App() {
  const [tatCaBai] = useState(() => chiaBai());
  const boBaiCuaToi = tatCaBai[0];

  // Thay vì 3 mảng riêng, dùng 1 object: { "rank-suit": "tay"|"dau"|"giua"|"cuoi" }
  const [viTri, setViTri] = useState(() => {
    const obj = {};
    boBaiCuaToi.forEach(l => { obj[`${l.rank}-${l.suit}`] = 'tay'; });
    return obj;
  });

  // Lưu thông tin lá đang được kéo: id, dữ liệu lá, và tọa độ hiện tại
  const [dragging, setDragging] = useState(null);

  // "ref" để biết vị trí thật trên màn hình của từng vùng (dùng để kiểm
  // tra thả vào đâu). useRef không làm màn hình vẽ lại khi đổi giá trị —
  // khác với useState — vì ta chỉ cần nó để "đo đạc", không cần hiển thị.
  const refDau = useRef(null);
  const refGiua = useRef(null);
  const refCuoi = useRef(null);
  const refTay = useRef(null);
  const refVung = { dau: refDau, giua: refGiua, cuoi: refCuoi, tay: refTay };

  const [baiDoiThu] = useState(() => [
    aiXepBai(tatCaBai[1]),
    aiXepBai(tatCaBai[2]),
    aiXepBai(tatCaBai[3]),
  ]);

  const [daXacNhan, setDaXacNhan] = useState(false);
  const [ketQuaDiem, setKetQuaDiem] = useState(null);

  function laTrongVung(tenVung) {
    return boBaiCuaToi.filter(l => viTri[`${l.rank}-${l.suit}`] === tenVung);
  }

  const chiDau = laTrongVung('dau');
  const chiGiua = laTrongVung('giua');
  const chiCuoi = laTrongVung('cuoi');
  const baiTrenTay = laTrongVung('tay');

  // Bắt đầu kéo: ghi nhớ lá nào, tọa độ ban đầu
  function onPointerDownLa(e, laBai) {
    e.target.setPointerCapture(e.pointerId); // đảm bảo nhận đủ sự kiện kể cả khi kéo ra ngoài lá
    const id = `${laBai.rank}-${laBai.suit}`;
    setDragging({ id, laBai, x: e.clientX, y: e.clientY });
  }

  // Đang kéo: cập nhật tọa độ liên tục
  function onPointerMove(e) {
    if (!dragging) return;
    setDragging(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
  }

  function isInside(rect, x, y) {
    return rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  // Thả lá: kiểm tra đang thả vào vùng nào, cập nhật viTri nếu hợp lệ
  function onPointerUp(e) {
    if (!dragging) return;
    const x = e.clientX, y = e.clientY;

    const target = ['dau', 'giua', 'cuoi', 'tay'].find(ten => {
      const rect = refVung[ten].current?.getBoundingClientRect();
      return isInside(rect, x, y);
    });

    if (target) {
      const soLuong = laTrongVung(target).length;
      const dangOVung = viTri[dragging.id];
      // Cho phép thả nếu vùng đích còn chỗ, HOẶC lá đó vốn dĩ đã ở vùng này
      if (soLuong < GIOI_HAN[target] || dangOVung === target) {
        setViTri(prev => ({ ...prev, [dragging.id]: target }));
      }
    }
    setDragging(null);
  }

  const xepXong = chiDau.length === 3 && chiGiua.length === 5 && chiCuoi.length === 5;
  const hopLe = xepXong && xepBaiHopLe(chiDau, chiGiua, chiCuoi);

  function xacNhanBai() {
    const nguoiChoi = [
      { ten: 'Bạn', chiDau, chiGiua, chiCuoi },
      { ten: 'Đối thủ 1', ...baiDoiThu[0] },
      { ten: 'Đối thủ 2', ...baiDoiThu[1] },
      { ten: 'Đối thủ 3', ...baiDoiThu[2] },
    ];
    setKetQuaDiem(tinhDiem(nguoiChoi));
    setDaXacNhan(true);
  }

  // Hàm vẽ 1 vùng (Chi Đầu / Giữa / Cuối / Tay) — viết 1 lần, dùng lại 4 lần
  function renderVung(ten, nhan, danhSach, gioiHan, refDom) {
    return (
      <div ref={refDom} className="vung-chi">
        <div className="vung-tieu-de">{nhan} ({danhSach.length}/{gioiHan})</div>
        <div className="vung-noi-dung">
          {danhSach.map(l => (
            <div
              key={`${l.rank}-${l.suit}`}
              style={{ opacity: dragging?.id === `${l.rank}-${l.suit}` ? 0.25 : 1 }}
            >
              <Card laBai={l} onPointerDown={(e) => onPointerDownLa(e, l)} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    // touchAction: 'none' ngăn trình duyệt tự cuộn trang khi đang kéo lá
    // trên điện thoại — nếu thiếu dòng này, kéo lá sẽ bị lẫn với cuộn trang.
    <div className="trang" style={{ touchAction: 'none' }}
         onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
      <h1>Chinese Poker</h1>

      {renderVung('dau', 'Chi Đầu', chiDau, 3, refDau)}
      {renderVung('giua', 'Chi Giữa', chiGiua, 5, refGiua)}
      {renderVung('cuoi', 'Chi Cuối', chiCuoi, 5, refCuoi)}

      {xepXong && (
        <p className={hopLe ? 'thong-bao-hop-le' : 'thong-bao-loi'}>
          {hopLe ? 'Hợp lệ — sẵn sàng!' : 'Binh lủng!'}
        </p>
      )}

      {xepXong && !daXacNhan && (
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

      {renderVung('tay', 'Bài trên tay (kéo vào 1 trong 3 chi ở trên)', baiTrenTay, 13, refTay)}

      {/* Hình ảnh lá bài "bay theo" ngón tay/chuột trong lúc kéo */}
      {dragging && (
        <div className="la-bai-dang-keo" style={{ left: dragging.x - 28, top: dragging.y - 38 }}>
          <Card laBai={dragging.laBai} onPointerDown={() => {}} />
        </div>
      )}

      <hr />
      <h2>Bài của 3 đối thủ (AI đã xếp)</h2>
      {baiDoiThu.map((doiThu, idx) => (
        <div key={idx} className="vung-chi">
          <div className="vung-tieu-de">Đối thủ {idx + 1}</div>
          <div className="vung-noi-dung">
            {[...doiThu.chiDau, ...doiThu.chiGiua, ...doiThu.chiCuoi].map(l => (
              <Card key={`${l.rank}-${l.suit}`} laBai={l} onPointerDown={() => {}} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default App
```

Sửa lại `src/Card.jsx` — đổi từ onClick sang onPointerDown:

```jsx
const TEN_RANK = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const KY_HIEU_CHAT = ['♠', '♥', '♦', '♣'];
const MAU_CHAT = ['#1a1a1a', '#d32f2f', '#e65100', '#1a1a1a'];

function Card({ laBai, onPointerDown }) {
  const ten = TEN_RANK[laBai.rank];
  const kyHieu = KY_HIEU_CHAT[laBai.suit];
  const mau = MAU_CHAT[laBai.suit];

  return (
    <div className="la-bai" onPointerDown={onPointerDown} style={{ color: mau }}>
      <div className="la-bai-goc">{ten}{kyHieu}</div>
      <div className="la-bai-giua">{kyHieu}</div>
    </div>
  );
}

export default Card;
```

Thêm vào cuối `src/App.css`:

```css
.la-bai-dang-keo {
  position: fixed;
  pointer-events: none;
  z-index: 999;
  transform: scale(1.1);
}
```

Và thêm thuộc tính touch-action vào class .la-bai đã có (để ngăn cuộn
trang khi kéo lá trên điện thoại):

```css
.la-bai {
  /* ...các thuộc tính cũ giữ nguyên... */
  touch-action: none;
}
```

Bạn học được gì ở Phase 3:
- useRef: khác với useState, useRef tạo ra 1 "hộp lưu trữ" mà khi đổi giá
  trị bên trong, React không tự vẽ lại màn hình. Dùng khi bạn cần ghi nhớ
  1 thứ gì đó (ở đây là vị trí thật của các vùng trên màn hình) mà không
  cần nó kích hoạt vẽ lại.
- getBoundingClientRect(): hàm có sẵn của trình duyệt, trả về tọa độ và
  kích thước thật của 1 phần tử HTML trên màn hình — đây là cách "đo đạc"
  để biết đang thả vào đâu.
- Pointer Events (onPointerDown/Move/Up): bộ 3 sự kiện thống nhất chuột và
  cảm ứng, là nền tảng của toàn bộ cơ chế kéo-thả.
- setPointerCapture: đảm bảo dù ngón tay/chuột di chuyển rất nhanh ra khỏi
  phạm vi lá bài ban đầu, sự kiện move/up vẫn được nhận đúng — thiếu dòng
  này, kéo nhanh có thể bị "tuột" giữa chừng.

Dừng lại ở đây — Phase quan trọng nhất. Huy thử kéo-thả thật bằng chuột
trên máy tính trước, sau đó nếu có thể, mở bằng điện thoại/iPad thật để
test kéo bằng ngón tay (xem hướng dẫn lấy địa chỉ mạng bên dưới). Xác nhận:
- Kéo lá từ "Bài trên tay" vào đúng 1 trong 3 Chi.
- Kéo lá đã ở 1 Chi sang Chi khác (không cần thả về tay trước).
- Không thể thả thêm khi 1 Chi đã đủ số lá (Chi Đầu đủ 3, Giữa/Cuối đủ 5).
- Trên điện thoại: kéo lá không làm cuộn cả trang theo.

---

## Cách xem trang web bằng điện thoại thật (không bắt buộc nhưng nên thử)

Điện thoại và máy tính cần cùng kết nối 1 mạng WiFi. Trong Terminal (cửa sổ
đang chạy npm run dev), tìm dòng có chữ "Network" — nếu không thấy, dừng
server (Ctrl+C) rồi chạy lại bằng:

```bash
npm run dev -- --host
```

Lúc này sẽ hiện thêm 1 địa chỉ dạng http://192.168.x.x:5173 — gõ đúng địa
chỉ đó vào trình duyệt trên điện thoại (cùng mạng WiFi) để xem trang web
thật trên điện thoại.

---

## Sau khi xong V2 — kiểm tra lại với Huy

Trước khi đề xuất sang V3, Claude Code cần hỏi Huy xác nhận:
1. Giao diện đã đẹp hơn rõ rệt so với V1 (nền, lá bài, nút bấm).
2. Hiển thị hợp lý trên cả điện thoại/iPad (qua Device Toolbar hoặc máy
   thật) và máy tính.
3. Kéo-thả hoạt động mượt trên cả chuột và cảm ứng (nếu test được).
4. Huy có muốn tinh chỉnh thêm giao diện (màu sắc, animation nhẹ khi kéo)
   trước khi sang V3 (ghi điểm nhóm chơi thật) không?
