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
    clientPort: 443
  },
  cors: true
}
})

// // vite.config.js — local dev friendly
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     host: '0.0.0.0',   // accept LAN if you want to test from another device
//     port: 5173,
//     hmr: {
//       protocol: 'ws',    // plain ws on local dev
//       host: 'localhost', // or your machine IP if testing from other device
//       port: 5173,        // match vite dev server port
//       clientPort: 5173
//     },
//     cors: true
//   }
// })