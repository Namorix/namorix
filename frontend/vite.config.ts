import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { readFileSync } from "node:fs"
import { federation } from "@module-federation/vite"

const isDev = process.env.NODE_ENV !== "production"

const pkg = "./package.json"
const corePkg = "./packages/core/package.json"
const stylesPkg = "./packages/styles/package.json"
const uiPkg = "./packages/ui/package.json"

const backendCore = "../backend/src/Namorix.Core/Namorix.Core.csproj"
const backendServer = "../backend/src/Namorix.Server/Namorix.Server.csproj"
const matchVersion = (xml: string) =>
  xml.match(/<Version>(.*?)<\/Version>/)?.[1]

const getFrontendVersionJSON = (path: string): string =>
  JSON.stringify(JSON.parse(readFileSync(path, "utf-8")).version) ?? "0.0.0"

const getBackendVersionXML = (path: string): string => {
  try {
    return JSON.stringify(matchVersion(readFileSync(path, "utf-8"))) ?? "0.0.0"
  } catch {
    return '"0.0.0"'
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: getFrontendVersionJSON(pkg),
    __CORE_VERSION__: getFrontendVersionJSON(corePkg),
    __STYLES_VERSION__: getFrontendVersionJSON(stylesPkg),
    __UI_VERSION__: getFrontendVersionJSON(uiPkg),

    __BACKEND_CORE_VERSION__: getBackendVersionXML(backendCore),
    __BACKEND_SERVER_VERSION__: getBackendVersionXML(backendServer),
  },
  cacheDir: ".vite",
  server: {
    host: "0.0.0.0",
    port: 5174,
    hmr: {
      host: "192.168.31.150",
      port: 5174,
    },
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
  // optimizeDeps: {
  //   include: ["@namorix/core", "@namorix/ui"],
  // },
  plugins: [
    react(),
    // federation({
    //   name: "namorix_shell",
    //   shared: isDev
    //     ? {}
    //     : {
    //         react: { singleton: true, requiredVersion: "^19.0.0" },
    //         "react-dom": { singleton: true, requiredVersion: "^19.0.0" },
    //         "@namorix/core": { singleton: true, requiredVersion: "^0.36.0" },
    //         "@namorix/ui": { singleton: true, requiredVersion: "^0.22.3" },
    //       },
    // }),
    federation({
      name: "namorix_shell",
      remotes: {},
      shared: isDev
        ? {}
        : ["react", "react-dom", "@namorix/core", "@namorix/ui"],
    }),
    // {
    //   name: "theme-hmr",
    //   handleHotUpdate({ file, server }) {
    //     if (file.includes("public/themes"))
    //       server.ws.send({ type: "full-reload" })
    //   },
    // },
  ],
})
