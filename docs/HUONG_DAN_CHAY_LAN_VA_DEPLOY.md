# Hướng dẫn: Chạy trên LAN & Deploy miễn phí lên Cloudflare Pages

Ứng dụng này là **React + Vite**, thuần client-side (không có backend/server, không có
WebSocket) — nên chạy LAN và deploy đều rất đơn giản: chỉ cần build ra file tĩnh
(HTML/CSS/JS) rồi phục vụ file đó ở đâu cũng được.

---

## 1. Chạy local (chỉ máy mình)

```bash
npm install     # chỉ cần chạy lần đầu, hoặc khi package.json đổi
npm run dev
```

Mở trình duyệt tại địa chỉ hiện ra, mặc định:

```
http://localhost:5183
```

## 2. Chạy trên mạng LAN (điện thoại / máy khác truy cập được)

`vite.config.js` đã cấu hình sẵn `host: true` và `port: 5183` (`strictPort: true`), nghĩa
là dev server lắng nghe trên mọi network interface chứ không chỉ `localhost`. Bạn không
cần sửa gì thêm.

```bash
npm run dev
```

Terminal sẽ in ra dạng:

```
  ➜  Local:   http://localhost:5183/
  ➜  Network: http://192.168.1.xxx:5183/
```

- Lấy dòng **Network** đó, gõ vào trình duyệt của điện thoại/laptop khác **đang cùng
  Wi-Fi/mạng LAN** với máy đang chạy `npm run dev`.
- Nếu dòng Network không hiện ra, hoặc máy khác không kết nối được, kiểm tra:
  1. **Firewall macOS**: System Settings → Network → Firewall → cho phép Node/Terminal
     nhận kết nối đến (hoặc tạm tắt firewall để test).
  2. Cả hai thiết bị phải **cùng mạng Wi-Fi** (không phải mạng khách/guest network bị
     cô lập thiết bị với nhau).
  3. Nếu vẫn không được, kiểm tra IP máy bằng `ipconfig getifaddr en0` (Wi-Fi) hoặc
     `en1`/`en0` tùy máy, rồi tự gõ `http://<IP>:5183`.

> Cổng `5183` cố định (`strictPort: true`) — nếu cổng đó đang bị chiếm, Vite sẽ báo lỗi
> thay vì tự đổi cổng khác. Đóng tiến trình cũ hoặc đổi `port` trong `vite.config.js`
> nếu cần.

## 3. Build bản production (test trước khi deploy)

```bash
npm run build      # tạo ra thư mục dist/
npm run preview    # phục vụ thử bản build, cũng nghe trên LAN (host: true, port 5183)
```

`npm run preview` dùng đúng file đã build (giống môi trường thật) thay vì code chưa
build của `npm run dev` — nên dùng bước này để kiểm tra lần cuối trước khi deploy.

---

## 4. Deploy miễn phí lên Cloudflare Pages

Vì app không có backend, Cloudflare Pages (free tier) là lựa chọn hợp lý: build free,
băng thông free không giới hạn, có domain `*.pages.dev` miễn phí, tự có HTTPS.

Có 2 cách — chọn 1 trong 2:

### Cách A — Deploy trực tiếp bằng CLI (nhanh nhất để test, không cần GitHub)

```bash
npm run build
npx wrangler pages deploy dist --project-name=chinese-poker
```

- Lần đầu chạy, `wrangler` sẽ mở trình duyệt để bạn đăng nhập/đăng ký tài khoản
  Cloudflare (miễn phí).
- Sau khi deploy xong, terminal in ra link dạng:
  `https://chinese-poker.pages.dev` (hoặc `https://<hash>.chinese-poker.pages.dev` cho
  mỗi lần deploy).
- Muốn cập nhật bản mới: build lại rồi chạy lại đúng lệnh `wrangler pages deploy dist
  ...` ở trên — không cần cấu hình gì thêm.

Đây là cách nhanh nhất để gửi link cho bạn bè test online, không cần đưa code lên
GitHub trước.

### Cách B — Kết nối GitHub để tự động deploy mỗi lần push

Phù hợp nếu bạn muốn mỗi lần `git push` là tự động build & deploy.

1. Đẩy code lên một repo GitHub (repo hiện tại chưa có remote — cần tạo repo trên
   GitHub rồi `git remote add origin ...` và `git push`).
2. Vào [Cloudflare dashboard](https://dash.cloudflare.com) → **Workers & Pages** →
   **Create application** → tab **Pages** → **Connect to Git**.
3. Chọn repo `chinese-poker`, cấu hình build:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Bấm **Save and Deploy**. Từ lần sau, mỗi lần push lên nhánh chính, Cloudflare tự
   build và deploy lại, có cả preview URL riêng cho mỗi PR/branch khác.

### Lưu ý chung

- Không cần file `_redirects` vì app không dùng client-side router (không có
  `react-router` hay tương tự) — chỉ có 1 trang `index.html` duy nhất.
- Muốn gắn domain riêng: vào project trên Cloudflare Pages → **Custom domains** →
  thêm domain đã quản lý qua Cloudflare (miễn phí, tự có HTTPS).
- Cả 2 cách đều hoàn toàn miễn phí ở quy mô test/demo cá nhân (Cloudflare Pages free
  tier: 500 builds/tháng cho Git integration, không giới hạn cho deploy qua CLI/direct
  upload, băng thông không giới hạn).
