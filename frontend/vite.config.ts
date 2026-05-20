import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5174,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://192.168.31.150:5000",
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            const realIp =
              req.headers["x-real-ip"] || req.headers["x-forwarded-for"]

            // Chỉ forward nếu đã có sẵn từ upstream (NPM), không tự tạo
            if (realIp) {
              proxyReq.setHeader("x-forwarded-for", realIp)
              proxyReq.setHeader("x-real-ip", realIp)
            }
          })
        },
      },
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    react(),
    // {
    //   name: "theme-hmr",
    //   handleHotUpdate({ file, server }) {
    //     if (file.includes("public/themes"))
    //       server.ws.send({ type: "full-reload" })
    //   },
    // },
  ],
})
