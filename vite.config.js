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
  },
  preview: {
    host: true,
  },
})
