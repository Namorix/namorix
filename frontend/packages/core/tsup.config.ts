import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  external: [
    "react",
    "react-dom",
    "react-router-dom",
    "react-i18next",
    "i18next",
    "react-redux",
    "@microsoft/signalr",
  ],
})
