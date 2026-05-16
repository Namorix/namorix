import { defineConfig } from "vite"
import { resolve } from "node:path"

export default defineConfig(() => {
  return {
    build: {
      outDir: "../../public/themes",
      emptyOutDir: false,
      rolldownOptions: {
        input: {
          "default/theme": resolve(__dirname, "src/themes/default/index.scss"),
          "dark/theme": resolve(__dirname, "src/themes/dark/index.scss"),
        },
        output: {
          assetFileNames: "[name].css",
        },
      },
    },
  }
})
