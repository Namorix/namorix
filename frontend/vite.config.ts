import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://192.168.31.150:3000",
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            const ip = req.socket.remoteAddress
            if (ip) {
              proxyReq.setHeader("x-forwarded-for", ip)
            }
          })
        },
      },
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [react()],
})
