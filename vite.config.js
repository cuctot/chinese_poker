import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // host: true để lắng nghe trên mọi network interface (0.0.0.0), không
  // chỉ localhost — cho phép điện thoại/máy khác trong CÙNG mạng LAN truy
  // cập vào bằng địa chỉ IP hiện ra ở dòng "Network" khi chạy `npm run dev`.
  server: {
    host: true,
    port: 5183,
    strictPort: true, // báo lỗi nếu 5183 đang bị chiếm, thay vì tự đổi sang port khác
    // Vite mặc định chặn Host header lạ (chỉ tin IP) để chống DNS-rebinding.
    // Cho phép truy cập qua hostname .local (Bonjour/mDNS) từ máy khác trong LAN.
    allowedHosts: ['.local'],
  },
  preview: {
    host: true,
    port: 5183,
    strictPort: true,
    allowedHosts: ['.local'],
  },
})
