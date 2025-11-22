// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
  host: '0.0.0.0',
  port: 5173,
  hmr: {
    protocol: 'wss',
    host: 'erp.mano.co.in',
    port: 443,
    clientPort: 443
  },
  cors: true
}
})
