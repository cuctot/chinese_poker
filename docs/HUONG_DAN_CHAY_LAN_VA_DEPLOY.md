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

## 4. Deploy miễn phí lên Cloudflare Workers

App dùng `@cloudflare/vite-plugin` (xem `vite.config.js` + `wrangler.jsonc`), nên đích
deploy thực tế là **Cloudflare Workers** (static assets), KHÔNG phải Cloudflare Pages —
đây là sản phẩm mới hơn của Cloudflare, cũng có free tier, domain miễn phí dạng
`*.workers.dev`, tự có HTTPS.

Có 2 cách — dùng song song cũng được:

### Cách A — Deploy trực tiếp bằng CLI

```bash
npm run deploy
```

Lệnh này chạy `vite build` rồi `wrangler deploy`. Lần đầu chạy, `wrangler` sẽ mở trình
duyệt để bạn đăng nhập/đăng ký tài khoản Cloudflare (miễn phí) — dùng `npx wrangler
login` nếu cần đăng nhập lại. Deploy xong terminal in ra link dạng:
`https://chinese-poker.<subdomain>.workers.dev`.

Đây là cách nhanh nhất để đẩy 1 bản thủ công (ví dụ test nhanh trước khi push code).

### Cách B — Kết nối GitHub để tự động deploy mỗi lần push (đã bật)

Repo `cuctot/chinese_poker` đã được connect với Cloudflare Workers Builds, theo dõi
nhánh **`develop`** — mỗi lần `git push` lên `develop`, Cloudflare tự build
(`npm run build`) và deploy lại, không cần chạy `npm run deploy` thủ công.

Muốn đổi nhánh theo dõi hoặc ngắt kết nối: vào [Cloudflare
dashboard](https://dash.cloudflare.com) → **Workers & Pages** → Worker `chinese-poker` →
**Settings** → mục **Build**.

### Lưu ý chung

- Không cần file `_redirects` vì app không dùng client-side router (không có
  `react-router` hay tương tự) — chỉ có 1 trang `index.html` duy nhất. `wrangler.jsonc`
  đã cấu hình `assets.not_found_handling: "single-page-application"` để xử lý việc này.
- Muốn gắn domain riêng: vào Worker trên dashboard → **Settings** → **Domains &
  Routes** → thêm domain đã quản lý qua Cloudflare (miễn phí, tự có HTTPS).
- Cả 2 cách đều miễn phí ở quy mô test/demo cá nhân (Cloudflare Workers free tier: 100k
  requests/ngày, băng thông static assets không tính vào giới hạn đó).
- Kiểm tra lịch sử deploy (thủ công lẫn tự động): `npx wrangler deployments list --name
  chinese-poker`.
