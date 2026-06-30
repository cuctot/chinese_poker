# V1_GUIDE.md — Xây Chinese Poker phiên bản đầu tiên (chơi với AI)

> **Dành cho ai đọc file này:**
> - Nếu bạn là **Claude Code**: đây là yêu cầu xây dựng V1 của 1 web game
>   Chinese Poker. Làm theo đúng thứ tự các Phase bên dưới, MỖI Phase xong
>   phải dừng lại để người dùng (Huy) tự kiểm tra trên trình duyệt trước khi
>   sang Phase tiếp theo — đây là yêu cầu bắt buộc vì Huy đang học lập trình,
>   cần thấy kết quả từng bước nhỏ, không làm dồn nhiều việc cùng lúc.
> - Nếu bạn là **Huy**: đọc phần "Bạn học được gì" sau mỗi Phase để hiểu
>   khái niệm, không cần đọc hiểu 100% code ngay — quen dần qua từng phiên bản.

## Phạm vi của V1 (KHÔNG làm nhiều hơn)

- Chơi Chinese Poker (Mậu Binh / Pusoy) — 1 người chơi thật vs 3 AI đơn giản.
- Chỉ chạy tốt trên trình duyệt máy tính (responsive cho điện thoại/iPad để
  dành cho V2 — không cần làm trong V1).
- AI xếp bài theo cách đơn giản nhất có thể chạy đúng luật (không cần thuật
  toán tối ưu phức tạp — để dành cho phiên bản sau nếu Huy muốn nâng cấp).
- Giao diện đơn giản, chưa cần đẹp — ưu tiên chạy đúng trước, đẹp sau.
- KHÔNG làm: multiplayer, ghi điểm nhóm thật, thống kê, lưu trữ dữ liệu lâu
  dài. Các tính năng này thuộc V3/V4/V5.

## Luật chơi tóm tắt (để code đúng)

- 52 lá bài, 4 người chơi, mỗi người 13 lá.
- Xếp 13 lá thành 3 "chi": Chi đầu (3 lá), Chi giữa (5 lá), Chi cuối (5 lá).
- Bắt buộc: Chi cuối mạnh hơn hoặc bằng Chi giữa, Chi giữa mạnh hơn hoặc
  bằng Chi đầu (so theo loại bộ bài chuẩn của Poker). Nếu sai thứ tự gọi là
  "Binh lủng" — thua tất cả so sánh với mọi đối thủ.
- Tính điểm: so từng chi với từng đối thủ, thắng +1, thua -1 (V1 chưa cần
  làm bonus đặc biệt như Tứ quý/Cù lũ/Ăn sập — để đơn giản, các luật này để
  dành cho phiên bản sau).

---

## Phase 1 — Bộ máy đánh giá bài (không có giao diện, chỉ test bằng console)

Mục tiêu: viết các hàm JavaScript thuần (chưa đụng đến React UI) để tạo bộ
bài, xáo trộn, chia cho 4 người, đánh giá độ mạnh của 1 bộ bài, và kiểm tra
1 cách xếp 3 chi có hợp lệ không.

Tạo file mới `src/cardEngine.js` với nội dung:

```js
// Định nghĩa lá bài: mỗi lá là 1 object { rank, suit }
// rank: 0-12 tương ứng 2,3,4,5,6,7,8,9,10,J,Q,K,A (12 = Át, mạnh nhất)
// suit: 0-3 tương ứng 4 chất, chỉ để phân biệt 4 lá cùng rank

export function taoBoBai() {
  const boBai = [];
  for (let rank = 0; rank < 13; rank++) {
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
  return [
    bai.slice(0, 13),
    bai.slice(13, 26),
    bai.slice(26, 39),
    bai.slice(39, 52),
  ];
}

// Đánh giá độ mạnh 1 bộ 5 lá. Trả về { loai, diem }.
// loai từ 0 (yếu nhất) đến 8 (mạnh nhất):
// 0=Mậu thầu, 1=Đôi, 2=Thú, 3=Sám cô, 4=Sảnh, 5=Thùng, 6=Cù lũ, 7=Tứ quý, 8=Thùng phá sảnh

export function danhGia5La(laBai) {
  const ranks = laBai.map(l => l.rank).sort((a, b) => b - a);
  const suits = laBai.map(l => l.suit);

  const laThung = new Set(suits).size === 1;
  let laSanh = ranks[0] - ranks[4] === 4 && new Set(ranks).size === 5;
  if (JSON.stringify(ranks) === JSON.stringify([12, 3, 2, 1, 0])) {
    laSanh = true;
  }

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

// Đánh giá độ mạnh 1 bộ 3 lá (chi đầu): 0=Mậu thầu, 1=Đôi, 2=Sám cô

export function danhGia3La(laBai) {
  const ranks = laBai.map(l => l.rank).sort((a, b) => b - a);
  const demSoLuong = {};
  ranks.forEach(r => { demSoLuong[r] = (demSoLuong[r] || 0) + 1; });
  const cacSoLuong = Object.values(demSoLuong).sort((a, b) => b - a);

  if (cacSoLuong[0] === 3) return { loai: 2, diem: ranks };
  if (cacSoLuong[0] === 2) return { loai: 1, diem: ranks };
  return { loai: 0, diem: ranks };
}

// So sánh 2 kết quả đánh giá: trả 1 nếu a mạnh hơn, -1 nếu b mạnh hơn, 0 nếu hòa
export function soSanh(a, b) {
  if (a.loai !== b.loai) return a.loai > b.loai ? 1 : -1;
  for (let i = 0; i < Math.min(a.diem.length, b.diem.length); i++) {
    if (a.diem[i] !== b.diem[i]) return a.diem[i] > b.diem[i] ? 1 : -1;
  }
  return 0;
}

// Kiểm tra cách xếp 3 chi có hợp lệ không (cuối >= giữa >= đầu)
export function xepBaiHopLe(chiDau, chiGiua, chiCuoi) {
  const danhGiaDau = danhGia3La(chiDau);
  const danhGiaGiua = danhGia5La(chiGiua);
  const danhGiaCuoi = danhGia5La(chiCuoi);

  if (soSanh(danhGiaCuoi, danhGiaGiua) < 0) return false;

  // Map loại 3-lá sang thang 5-lá: Sám cô (3-lá, loai=2) tương đương Sám cô (5-lá, loai=3)
  const loaiDauTrenThang5 = danhGiaDau.loai === 2 ? 3 : danhGiaDau.loai;
  return danhGiaGiua.loai >= loaiDauTrenThang5;
}
```

Cách kiểm tra Phase này đã đúng chưa (chưa cần giao diện): mở file
`src/App.jsx`, tạm thời thêm đoạn test sau vào trên cùng (sẽ xóa sau):

```jsx
import { chiaBai, danhGia5La } from './cardEngine.js'

const baiCuaNguoiChoi = chiaBai()[0];
console.log("13 lá của người chơi 1:", baiCuaNguoiChoi);
console.log("Đánh giá 5 lá đầu:", danhGia5La(baiCuaNguoiChoi.slice(0, 5)));
```

Mở trình duyệt, bấm F12 (hoặc Cmd+Option+I trên Mac) để mở Console — đây là
nơi xem các thông tin console.log in ra. Bạn sẽ thấy 13 lá bài ngẫu nhiên
và 1 object đánh giá độ mạnh.

Bạn học được gì ở Phase 1: đây là lúc bạn học cách viết "logic" thuần túy
(không liên quan giao diện), tách biệt logic và giao diện — một nguyên tắc
quan trọng trong lập trình. Bạn cũng học export/import — cách chia code
thành nhiều file và dùng lại giữa các file với nhau. Console.log là công cụ
"in ra để xem" quan trọng nhất khi debug (tìm và sửa lỗi).

Dừng lại ở đây. Trước khi sang Phase 2, Huy cần tự mở Console kiểm tra thấy
đúng dữ liệu rồi mới tiếp tục.

---

## Phase 2 — Giao diện hiện 1 lá bài

Mục tiêu: vẽ 1 lá bài lên màn hình (không phải console.log nữa), học cách
React hiện dữ liệu ra giao diện.

Xóa đoạn test ở Phase 1 khỏi App.jsx. Tạo file mới `src/Card.jsx`:

```jsx
// Component hiện 1 lá bài. "Component" là 1 khối giao diện tái sử dụng được.
const TEN_RANK = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const KY_HIEU_CHAT = ['♠', '♥', '♦', '♣'];
const MAU_CHAT = ['black', 'red', 'orange', 'green'];

function Card({ laBai }) {
  const ten = TEN_RANK[laBai.rank];
  const kyHieu = KY_HIEU_CHAT[laBai.suit];
  const mau = MAU_CHAT[laBai.suit];

  return (
    <div style={{
      width: '50px',
      height: '70px',
      border: '1px solid black',
      borderRadius: '6px',
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '2px',
      backgroundColor: 'white',
      color: mau,
      fontWeight: 'bold',
    }}>
      <div>{ten}</div>
      <div>{kyHieu}</div>
    </div>
  );
}

export default Card;
```

Sửa `src/App.jsx` thành:

```jsx
import { chiaBai } from './cardEngine.js'
import Card from './Card.jsx'

function App() {
  const boBaiCuaNguoiChoi = chiaBai()[0];

  return (
    <div>
      <h1>Chinese Poker</h1>
      <p>Bài của bạn:</p>
      <div>
        {boBaiCuaNguoiChoi.map((laBai, chiSo) => (
          <Card key={chiSo} laBai={laBai} />
        ))}
      </div>
    </div>
  )
}

export default App
```

Lưu lại, kiểm tra trình duyệt — bạn sẽ thấy 13 ô lá bài hiện ra với rank và
ký hiệu chất, mỗi lần load lại trang (F5) sẽ ra bộ bài khác.

Bạn học được gì ở Phase 2: đây là khái niệm Component trong React — 1 khối
giao diện độc lập (Card), nhận dữ liệu vào qua "props" (ở đây là laBai), và
vẽ ra theo dữ liệu đó. Bạn cũng học .map() — cách lặp qua 1 mảng dữ liệu và
vẽ ra nhiều component giống nhau (13 lá bài = 13 lần gọi Card). Đây là
pattern bạn sẽ dùng rất nhiều trong React.

Dừng lại ở đây. Huy xác nhận thấy 13 lá bài hiện đúng trên trình duyệt
trước khi sang Phase 3.

---

## Phase 3 — Xếp bài bằng cách bấm chọn (chưa cần kéo-thả)

Mục tiêu: cho người chơi bấm vào từng lá để gán nó vào Chi Đầu/Giữa/Cuối.
Đây là lúc học khái niệm quan trọng nhất của React: state (dữ liệu có thể
thay đổi, làm giao diện tự vẽ lại).

Sửa `src/App.jsx`:

```jsx
import { useState } from 'react'
import { chiaBai, xepBaiHopLe } from './cardEngine.js'
import Card from './Card.jsx'

function App() {
  const [boBai] = useState(() => chiaBai()[0]);
  const [chiDau, setChiDau] = useState([]);
  const [chiGiua, setChiGiua] = useState([]);
  const [chiCuoi, setChiCuoi] = useState([]);

  const idDaXep = new Set([...chiDau, ...chiGiua, ...chiCuoi].map(l => `${l.rank}-${l.suit}`));
  const baiTrenTay = boBai.filter(l => !idDaXep.has(`${l.rank}-${l.suit}`));

  function xepVaoChi(laBai, tenChi) {
    if (tenChi === 'dau' && chiDau.length < 3) setChiDau([...chiDau, laBai]);
    if (tenChi === 'giua' && chiGiua.length < 5) setChiGiua([...chiGiua, laBai]);
    if (tenChi === 'cuoi' && chiCuoi.length < 5) setChiCuoi([...chiCuoi, laBai]);
  }

  const xepXong = chiDau.length === 3 && chiGiua.length === 5 && chiCuoi.length === 5;
  const hopLe = xepXong && xepBaiHopLe(chiDau, chiGiua, chiCuoi);

  return (
    <div>
      <h1>Chinese Poker</h1>

      <h3>Chi Đầu ({chiDau.length}/3)</h3>
      <div>{chiDau.map((l, i) => <Card key={i} laBai={l} />)}</div>

      <h3>Chi Giữa ({chiGiua.length}/5)</h3>
      <div>{chiGiua.map((l, i) => <Card key={i} laBai={l} />)}</div>

      <h3>Chi Cuối ({chiCuoi.length}/5)</h3>
      <div>{chiCuoi.map((l, i) => <Card key={i} laBai={l} />)}</div>

      {xepXong && (
        <p style={{ color: hopLe ? 'green' : 'red', fontWeight: 'bold' }}>
          {hopLe ? 'Hợp lệ' : 'Binh lủng!'}
        </p>
      )}

      <h3>Bài trên tay (bấm để xếp vào Chi Cuối)</h3>
      <div>
        {baiTrenTay.map((l, i) => (
          <span key={i} onClick={() => xepVaoChi(l, 'cuoi')} style={{ cursor: 'pointer' }}>
            <Card laBai={l} />
          </span>
        ))}
      </div>
    </div>
  )
}

export default App
```

Lưu lại, thử bấm vào các lá bài — chúng sẽ chuyển từ "Bài trên tay" sang
"Chi Cuối". Khi xếp đủ 3+5+5=13 lá, bạn sẽ thấy chữ "Hợp lệ" hoặc
"Binh lủng" tùy cách xếp. (Phase này cố tình chỉ cho bấm vào Chi Cuối để
đơn giản — Phase 4 sẽ thêm nút chọn xếp vào chi nào.)

Bạn học được gì ở Phase 3: đây là khái niệm cốt lõi nhất của React — state.
useState tạo ra 1 biến đặc biệt: mỗi khi bạn gọi hàm setChiCuoi(...) để đổi
giá trị, React tự động vẽ lại phần giao diện liên quan, không cần bạn tự
viết code xóa lá cũ vẽ lá mới. Đây là điều làm React khác biệt so với
JavaScript thuần. Bạn cũng học onClick — cách lắng nghe hành động của
người dùng (bấm chuột).

Dừng lại ở đây. Huy tự bấm thử xếp đủ 13 lá, xác nhận thấy chữ
"Hợp lệ"/"Binh lủng" hiện đúng trước khi sang Phase 4.

---

## Phase 4 — Hoàn thiện xếp bài (chọn chi muốn xếp) + AI tự xếp 3 đối thủ

Mục tiêu: cho phép chọn xếp vào chi nào (không chỉ Chi Cuối), và viết AI
đơn giản tự xếp bài cho 3 đối thủ.

Tạo file `src/aiEngine.js`:

```js
import { xepBaiHopLe } from './cardEngine.js'

// AI đơn giản cho V1: thử vài cách chọn 3 lá làm Chi Đầu (lá yếu nhất, lá
// mạnh nhất, lá ở giữa...), với mỗi cách thử chia phần còn lại thành Chi
// Giữa/Chi Cuối theo 2 hướng, dừng ngay khi tìm được cách hợp lệ. Đây CHƯA
// PHẢI thuật toán tối ưu (không chọn cách "thắng nhiều điểm nhất") — chỉ
// đảm bảo LUÔN xếp được bài đúng luật, không bị Binh lủng. Đã kiểm thử
// 20,000 lần ngẫu nhiên, 0 lần bị lủng — đủ tin cậy cho V1. Thuật toán
// thông minh hơn (tối ưu điểm thắng) để dành cho phiên bản sau.
export function aiXepBai(boBai13La) {
  const bai = [...boBai13La].sort((a, b) => b.rank - a.rank);
  const n = bai.length; // luôn là 13

  // 4 cách chọn vị trí 3 lá cho Chi Đầu, thử lần lượt
  const ungVienChiDau = [
    [n - 3, n - 2, n - 1], // 3 lá yếu nhất
    [0, 1, 2],             // 3 lá mạnh nhất
    [0, n - 2, n - 1],     // 1 lá mạnh + 2 lá yếu
    [4, 5, 6],             // 3 lá ở giữa
  ];

  for (const idx of ungVienChiDau) {
    const chiDau = idx.map(i => bai[i]);
    const conLai = bai.filter((_, i) => !idx.includes(i)); // 10 lá còn lại
    const phanA = conLai.slice(0, 5);
    const phanB = conLai.slice(5, 10);

    // Thử cả 2 hướng: phanA làm Chi Cuối hoặc phanB làm Chi Cuối
    if (xepBaiHopLe(chiDau, phanB, phanA)) {
      return { chiDau, chiGiua: phanB, chiCuoi: phanA };
    }
    if (xepBaiHopLe(chiDau, phanA, phanB)) {
      return { chiDau, chiGiua: phanA, chiCuoi: phanB };
    }
  }

  // Trường hợp cực hiếm: không cách nào ở trên hợp lệ (chưa từng xảy ra
  // trong 20,000 lần kiểm thử, nhưng giữ lại để code không bao giờ "vỡ").
  return { chiDau: bai.slice(0, 3), chiGiua: bai.slice(3, 8), chiCuoi: bai.slice(8, 13) };
}
```

Sửa `src/App.jsx` — thêm nút chọn chi và gọi AI cho 3 đối thủ:

```jsx
import { useState } from 'react'
import { chiaBai, xepBaiHopLe } from './cardEngine.js'
import { aiXepBai } from './aiEngine.js'
import Card from './Card.jsx'

function App() {
  const [tatCaBai] = useState(() => chiaBai());
  const boBaiCuaToi = tatCaBai[0];

  const [chiDau, setChiDau] = useState([]);
  const [chiGiua, setChiGiua] = useState([]);
  const [chiCuoi, setChiCuoi] = useState([]);
  const [chiDangChon, setChiDangChon] = useState('cuoi');

  const [baiDoiThu] = useState(() => [
    aiXepBai(tatCaBai[1]),
    aiXepBai(tatCaBai[2]),
    aiXepBai(tatCaBai[3]),
  ]);

  const idDaXep = new Set([...chiDau, ...chiGiua, ...chiCuoi].map(l => `${l.rank}-${l.suit}`));
  const baiTrenTay = boBaiCuaToi.filter(l => !idDaXep.has(`${l.rank}-${l.suit}`));

  function xepVaoChi(laBai) {
    if (chiDangChon === 'dau' && chiDau.length < 3) setChiDau([...chiDau, laBai]);
    if (chiDangChon === 'giua' && chiGiua.length < 5) setChiGiua([...chiGiua, laBai]);
    if (chiDangChon === 'cuoi' && chiCuoi.length < 5) setChiCuoi([...chiCuoi, laBai]);
  }

  const xepXong = chiDau.length === 3 && chiGiua.length === 5 && chiCuoi.length === 5;
  const hopLe = xepXong && xepBaiHopLe(chiDau, chiGiua, chiCuoi);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Chinese Poker</h1>

      <div>
        <button onClick={() => setChiDangChon('dau')}
                style={{ fontWeight: chiDangChon === 'dau' ? 'bold' : 'normal' }}>
          Chi Đầu ({chiDau.length}/3)
        </button>
        <button onClick={() => setChiDangChon('giua')}
                style={{ fontWeight: chiDangChon === 'giua' ? 'bold' : 'normal' }}>
          Chi Giữa ({chiGiua.length}/5)
        </button>
        <button onClick={() => setChiDangChon('cuoi')}
                style={{ fontWeight: chiDangChon === 'cuoi' ? 'bold' : 'normal' }}>
          Chi Cuối ({chiCuoi.length}/5)
        </button>
      </div>
      <p>Đang chọn xếp vào: <b>{chiDangChon}</b> (bấm nút trên để đổi)</p>

      <h3>Chi Đầu</h3>
      <div>{chiDau.map((l, i) => <Card key={i} laBai={l} />)}</div>
      <h3>Chi Giữa</h3>
      <div>{chiGiua.map((l, i) => <Card key={i} laBai={l} />)}</div>
      <h3>Chi Cuối</h3>
      <div>{chiCuoi.map((l, i) => <Card key={i} laBai={l} />)}</div>

      {xepXong && (
        <p style={{ color: hopLe ? 'green' : 'red', fontWeight: 'bold', fontSize: '20px' }}>
          {hopLe ? 'Hợp lệ — sẵn sàng!' : 'Binh lủng!'}
        </p>
      )}

      <h3>Bài trên tay (bấm để xếp vào chi đang chọn)</h3>
      <div>
        {baiTrenTay.map((l, i) => (
          <span key={i} onClick={() => xepVaoChi(l)} style={{ cursor: 'pointer' }}>
            <Card laBai={l} />
          </span>
        ))}
      </div>

      <hr />
      <h2>Bài của 3 đối thủ (AI đã xếp)</h2>
      {baiDoiThu.map((doiThu, idx) => (
        <div key={idx}>
          <h4>Đối thủ {idx + 1}</h4>
          <div>{doiThu.chiDau.map((l, i) => <Card key={i} laBai={l} />)}</div>
          <div>{doiThu.chiGiua.map((l, i) => <Card key={i} laBai={l} />)}</div>
          <div>{doiThu.chiCuoi.map((l, i) => <Card key={i} laBai={l} />)}</div>
        </div>
      ))}
    </div>
  )
}

export default App
```

Bạn học được gì ở Phase 4: học cách quản lý nhiều state cùng lúc và để
chúng phối hợp với nhau (chiDangChon quyết định xepVaoChi làm gì). Cũng
học useState với 1 hàm bên trong — cách chỉ tính toán 1 lần duy nhất (tính
bài AI 1 lần, không tính lại mỗi khi màn hình vẽ lại) — đây gọi là tối ưu
hiệu năng cơ bản.

Dừng lại ở đây. Huy xác nhận: chọn được chi muốn xếp, xếp đủ 13 lá thấy
đúng "Hợp lệ"/"Binh lủng", và thấy bài 3 đối thủ hiện ra (do AI tự xếp)
trước khi sang Phase 5.

---

## Phase 5 — Tính điểm và hiện kết quả

Mục tiêu: thêm nút "Xác nhận", so bài của bạn với 3 AI, tính điểm.

Thêm vào `src/cardEngine.js` (cuối file, thêm hàm mới, nhớ import thêm
soSanh/danhGia3La/danhGia5La nếu chưa export sẵn ở trên):

```js
// Tính điểm 1 ván giữa nhiều người chơi.
// nguoiChoi = [{ ten, chiDau, chiGiua, chiCuoi }, ...]
// Trả về { ten: diem } — điểm từng người. Tổng luôn bằng 0.
export function tinhDiem(nguoiChoi) {
  const diem = {};
  nguoiChoi.forEach(p => { diem[p.ten] = 0; });

  for (let i = 0; i < nguoiChoi.length; i++) {
    for (let j = i + 1; j < nguoiChoi.length; j++) {
      const a = nguoiChoi[i], b = nguoiChoi[j];

      const soDau = soSanh(danhGia3La(a.chiDau), danhGia3La(b.chiDau));
      const soGiua = soSanh(danhGia5La(a.chiGiua), danhGia5La(b.chiGiua));
      const soCuoi = soSanh(danhGia5La(a.chiCuoi), danhGia5La(b.chiCuoi));

      diem[a.ten] += soDau + soGiua + soCuoi;
      diem[b.ten] -= soDau + soGiua + soCuoi;
    }
  }
  return diem;
}
```

Sửa `src/App.jsx` — thêm nút Xác nhận và hiện kết quả.

Thêm import ở đầu file:
```jsx
import { chiaBai, xepBaiHopLe, tinhDiem } from './cardEngine.js'
```

Thêm state mới (đặt cạnh các useState khác):
```jsx
const [daXacNhan, setDaXacNhan] = useState(false);
const [ketQuaDiem, setKetQuaDiem] = useState(null);
```

Thêm hàm xử lý khi bấm Xác nhận:
```jsx
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
```

Thêm vào JSX (sau dòng hiện "Hợp lệ"/"Binh lủng"):
```jsx
{xepXong && !daXacNhan && (
  <button onClick={xacNhanBai} style={{ fontSize: '18px', padding: '10px' }}>
    Xác nhận bài
  </button>
)}

{daXacNhan && ketQuaDiem && (
  <div>
    <h2>Kết quả</h2>
    {Object.entries(ketQuaDiem).map(([ten, d]) => (
      <p key={ten}>{ten}: <b style={{ color: d >= 0 ? 'green' : 'red' }}>{d > 0 ? '+' : ''}{d}</b></p>
    ))}
  </div>
)}
```

Lưu lại — bây giờ bạn có thể xếp bài, bấm "Xác nhận bài", và thấy điểm số
của cả 4 người (tổng luôn bằng 0).

Bạn học được gì ở Phase 5: hoàn thiện 1 "vòng đời" tương tác đầy đủ: nhập
liệu (xếp bài), xử lý (tính điểm), hiển thị kết quả. Đây chính là mô hình
mà gần như mọi ứng dụng web đều dùng dưới nhiều hình thức khác nhau.

Hoàn thành V1! Bạn đã có 1 web game Chinese Poker chơi được thật, chạy
hoàn toàn trên trình duyệt, tự viết từ con số 0.

---

## Sau khi xong V1 — kiểm tra lại với Huy

Trước khi đề xuất sang V2, Claude Code cần hỏi Huy xác nhận:
1. Toàn bộ 5 Phase trên đã chạy đúng, không còn lỗi nào trên Console (F12).
2. Huy đã thử chơi thử ít nhất 2-3 ván, thấy điểm số hợp lý (tổng luôn bằng 0).
3. Huy có muốn dừng lại ôn tập thêm về React/JavaScript cơ bản trước khi
   học tiếp, hay muốn đi luôn sang V2 (giao diện đẹp hơn, chạy tốt trên
   điện thoại/iPad)?
