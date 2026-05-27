import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { readFileSync } from "node:fs"

const pkg = "./package.json"
const corePkg = "./packages/core/package.json"
const stylesPkg = "./packages/styles/package.json"
const uiPkg = "./packages/ui/package.json"

const backendCore = "../backend/src/Namorix.Core/Directory.Build.props"
const backendServer = "../backend/src/Namorix.Server/Namorix.Server.csproj"
const matchVersion = (xml: string) =>
  xml.match(/<Version>(.*?)<\/Version>/)?.[1]

const getFrontendVersionJSON = (path: string): string =>
  JSON.stringify(JSON.parse(readFileSync(path, "utf-8")).version) ?? "0.0.0"

const getBackendVersionXML = (path: string): string =>
  JSON.stringify(matchVersion(readFileSync(path, "utf-8"))) ?? "0.0.0"

export default defineConfig({
  define: {
    __APP_VERSION__: getFrontendVersionJSON(pkg),
    __CORE_VERSION__: getFrontendVersionJSON(corePkg),
    __STYLES_VERSION__: getFrontendVersionJSON(stylesPkg),
    __UI_VERSION__: getFrontendVersionJSON(uiPkg),

    __BACKEND_CORE_VERSION__: getBackendVersionXML(backendCore),
    __BACKEND_SERVER_VERSION__: getBackendVersionXML(backendServer),
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
