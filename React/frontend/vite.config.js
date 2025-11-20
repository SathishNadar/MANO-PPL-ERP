import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // optional but recommended

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',    // accept LAN connections
    port: 5173,
    strictPort: false,
    // origin helps Vite generate correct absolute URLs for the client
    origin: 'https://erp.mano.co.in',
    hmr: {
      protocol: 'wss',         // client will use wss
      host: 'erp.mano.co.in',  // websocket endpoint host (nginx will proxy)
      port: 443,               // client connects to 443 (TLS) — nginx should accept wss on 443
      clientPort: 443
    },
    cors: true
  }
})