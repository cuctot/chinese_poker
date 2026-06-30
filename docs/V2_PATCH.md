# V2_PATCH.md — Sắp xếp lá bài theo thứ tự + hiển thị bài AI theo 3 chi

> **Bối cảnh**: sau khi hoàn thành V2 (giao diện đẹp + kéo-thả), Huy phát
> hiện 2 thiếu sót: (1) lá bài trong mỗi chi không được sắp xếp theo thứ
> tự cao→thấp, (2) bài của 3 AI hiện gộp chung 13 lá thành 1 hàng, không
> tách thành 3 chi (Đầu/Giữa/Cuối) như bài của người chơi. Đây là bản vá
> cho V2 (không phải tính năng mới của V3) — vì đây là hoàn thiện đúng
> mục tiêu "giao diện đẹp, dễ nhìn" đã đặt ra từ đầu V2, không phải thêm
> chức năng mới.

## Giải thích nguyên nhân (để Huy hiểu trước khi sửa)

Trong V2 Phase 3, hàm lấy danh sách lá theo từng vùng là:
```jsx
function laTrongVung(tenVung) {
  return boBaiCuaToi.filter(l => viTri[`${l.rank}-${l.suit}`] === tenVung);
}
```
`.filter()` chỉ lọc ra những lá thuộc đúng vùng, giữ nguyên thứ tự lá xuất
hiện trong mảng `boBaiCuaToi` gốc (vốn đã bị xáo ngẫu nhiên bởi
`chiaBai()`). Không có bước nào sắp xếp lại theo rank — đây là lý do thứ
tự nhìn lộn xộn, không liên quan gì đến thời gian kéo hay vị trí thay thế
như Huy nghi ngờ, dù hiệu ứng nhìn thấy có vẻ giống vậy.

Phần hiển thị bài AI dùng đoạn code gộp cả 3 chi vào 1 mảng duy nhất rồi vẽ
chung 1 hàng:
```jsx
{[...doiThu.chiDau, ...doiThu.chiGiua, ...doiThu.chiCuoi].map(l => (...))}
```
Đây là thiếu sót khi viết tài liệu V2 — đáng lẽ phải tách 3 hàng riêng
giống cách hiển thị bài người chơi.

---

## Bước 1 — Thêm hàm sắp xếp vào cardEngine.js

Thêm vào cuối file `src/cardEngine.js`:

```js
// Sắp xếp 1 danh sách lá bài theo thứ tự CAO -> THẤP để hiển thị đẹp mắt.
// Lá cùng rank (ví dụ 1 đôi) sẽ tự động đứng cạnh nhau, vì JavaScript sort
// giữ nguyên thứ tự tương đối giữa các phần tử có giá trị so sánh bằng nhau.
export function sapXepDeHienThi(danhSachLa) {
  return [...danhSachLa].sort((a, b) => b.rank - a.rank);
}
```

Lưu ý dòng `[...danhSachLa]` (copy mảng trước khi sort) — nếu viết thẳng
`danhSachLa.sort(...)` mà không copy, hàm sort sẽ làm thay đổi luôn mảng
gốc truyền vào (gọi là "mutate" — sửa trực tiếp dữ liệu gốc). Trong React,
mutate trực tiếp dữ liệu là điều cần tránh tuyệt đối vì có thể gây lỗi khó
phát hiện (React không nhận biết được rằng dữ liệu đã đổi, dẫn đến màn
hình không tự vẽ lại đúng lúc cần). Đây là 1 nguyên tắc quan trọng cần nhớ
trong suốt quá trình học React.

## Bước 2 — Áp dụng sắp xếp khi lấy bài người chơi

Sửa lại hàm `laTrongVung` trong `src/App.jsx`:

```jsx
function laTrongVung(tenVung) {
  const ds = boBaiCuaToi.filter(l => viTri[`${l.rank}-${l.suit}`] === tenVung);
  return sapXepDeHienThi(ds);
}
```

Và thêm `sapXepDeHienThi` vào dòng import ở đầu file:
```jsx
import { chiaBai, xepBaiHopLe, tinhDiem, sapXepDeHienThi } from './cardEngine.js'
```

Chỉ cần sửa đúng 1 hàm này — vì chiDau, chiGiua, chiCuoi, baiTrenTay trong
App.jsx đều lấy giá trị từ laTrongVung(...), nên sửa 1 chỗ áp dụng cho cả 4
vùng cùng lúc. Đây là lợi ích của việc đã viết code theo kiểu "1 hàm dùng
lại nhiều lần" từ trước.

## Bước 3 — Tách hiển thị bài AI thành 3 hàng riêng (Đầu/Giữa/Cuối)

Thay đoạn hiển thị bài AI cũ ở cuối `src/App.jsx`:

```jsx
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
```

Bằng đoạn mới sau (thêm 1 hàm riêng renderBaiDoiThu, đặt phía trên hàm
return chính của component App, cạnh hàm renderVung đã có):

```jsx
// Hiện bài 1 đối thủ AI theo 3 hàng riêng (Đầu/Giữa/Cuối), đã sắp xếp,
// không cho kéo (onPointerDown rỗng vì bài AI không tương tác được)
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
```

Rồi sửa lại phần return chính, đoạn hiển thị danh sách đối thủ:

```jsx
<hr />
<h2>Bài của 3 đối thủ (AI đã xếp)</h2>
{baiDoiThu.map((doiThu, idx) => renderBaiDoiThu(doiThu, idx))}
```

Bạn học được gì ở Bước 3: đây là ví dụ về tái sử dụng pattern đã học —
renderBaiDoiThu dùng lại đúng ý tưởng của renderVung (1 hàm nhận dữ liệu,
trả về JSX để vẽ), chỉ khác là nó tự gọi 3 lần cho 3 chi bên trong, thay
vì được gọi 3 lần từ bên ngoài như renderVung. Khi gặp 1 đoạn UI lặp đi
lặp lại nhiều lần (ở đây là 3 đối thủ, mỗi đối thủ lại có 3 chi), tách
thành hàm riêng giúp code ngắn gọn và dễ sửa hơn nhiều so với viết lặp lại
từng đoạn JSX.

## Bước 4 — Thêm CSS cho khối hiển thị đối thủ

Thêm vào cuối `src/App.css`:

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

1. Bài trên tay: các lá hiện theo thứ tự từ cao (Át) đến thấp (2).
2. Kéo 1 lá bất kỳ vào Chi Đầu/Giữa/Cuối: ngay sau khi thả, lá đó tự
   "nhảy" vào đúng vị trí theo thứ tự cao-thấp trong hàng đó (không nằm ở
   cuối hàng theo thứ tự kéo vào).
3. Kéo thêm vài lá nữa, thử kéo không theo thứ tự (ví dụ kéo lá thấp vào
   trước, lá cao vào sau): xác nhận hàng vẫn luôn tự sắp xếp lại đúng, dù
   kéo theo thứ tự nào.
4. Cuộn xuống phần "Bài của 3 đối thủ": mỗi đối thủ giờ hiện 3 hàng riêng
   (Đầu/Giữa/Cuối), mỗi hàng đã sắp xếp theo thứ tự cao-thấp, giống hệt
   cách hiển thị bài của bạn.

Nếu cả 4 điều trên đều đúng, bản vá đã hoàn thành — có thể tiếp tục sang
V3 (ghi điểm nhóm chơi thật).
