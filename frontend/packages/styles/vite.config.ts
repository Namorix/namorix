import { BuildEnvironmentOptions, defineConfig } from "vite"
import { resolve } from "node:path"

export default defineConfig(() => {
  const build: BuildEnvironmentOptions = {
    outDir: "../../public/themes",
    emptyOutDir: false,
    cssMinify: false,
    rolldownOptions: {
      input: {
        "default/theme": resolve(__dirname, "src/themes/default/index.scss"),
        "dark/theme": resolve(__dirname, "src/themes/dark/index.scss"),
      },
      output: {
        assetFileNames: "[name].css",
      },
    },
  }

  return {
    build,
  }
})
