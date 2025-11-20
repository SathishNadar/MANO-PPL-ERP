// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // accept network requests (and custom Host headers)
    port: 5173,
    hmr: {
      // helpful if you want HMR to work when accessing via domain
      host: "erp.mano.co.in",
    }
  }
});