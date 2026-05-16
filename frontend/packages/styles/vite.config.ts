import { defineConfig } from "vite"
import { resolve } from "node:path"
import fs from "fs"

export default defineConfig({
  build: {
    outDir: "../../public/themes",
    emptyOutDir: false,
    rolldownOptions: {
      input: {
        "default/theme": resolve(__dirname, "src/themes/default/index.ts"),
        "dark/theme": resolve(__dirname, "src/themes/dark/index.ts"),
      },
      output: {
        assetFileNames: "[name].css",
      },
    },
  },
  plugins: [
    {
      name: "remove-js-output",
      async closeBundle() {
        const outDir = resolve(__dirname, "../../public/themes")
        if (!fs.existsSync(outDir)) {
          return
        }

        const removeJs = async (dir: string) => {
          const entries = fs.readdirSync(dir, { withFileTypes: true })
          for (const entry of entries) {
            const full = resolve(dir, entry.name)
            if (entry.isDirectory()) {
              await removeJs(full)
            } else if (entry.name.endsWith(".js")) {
              fs.rmSync(full)
            }
          }
        }
        await removeJs(outDir)
      },
    },
  ],
})
