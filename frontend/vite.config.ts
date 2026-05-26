import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { readFileSync } from "node:fs"

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"))
const corePkg = JSON.parse(
  readFileSync("./packages/core/package.json", "utf-8"),
)
const stylesPkg = JSON.parse(
  readFileSync("./packages/styles/package.json", "utf-8"),
)
const uiPkg = JSON.parse(readFileSync("./packages/ui/package.json", "utf-8"))

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __CORE_VERSION__: JSON.stringify(corePkg.version),
    __STYLES_VERSION__: JSON.stringify(stylesPkg.version),
    __UI_VERSION__: JSON.stringify(uiPkg.version),
  },
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
      "/hubs": {
        target: "http://192.168.31.150:5000",
        changeOrigin: true,
        ws: true,
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
