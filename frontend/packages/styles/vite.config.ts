import { BuildEnvironmentOptions, defineConfig } from "vite"
import { resolve } from "node:path"

export default defineConfig(() => {
  const build: BuildEnvironmentOptions = {
    outDir: "../../public/themes",
    emptyOutDir: false,
    cssMinify: false,
    rolldownOptions: {
      input: {
        "light/theme": resolve(__dirname, "src/themes/light/index.scss"),
        "light/shell": resolve(__dirname, "src/themes/light/shell.scss"),
        "dark/theme": resolve(__dirname, "src/themes/dark/index.scss"),
        "dark/shell": resolve(__dirname, "src/themes/dark/shell.scss"),
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
