import eslint from "@eslint/js"
import { defineConfig, globalIgnores } from "eslint/config"
import tslint from "typescript-eslint"

export default defineConfig(
  globalIgnores(["lib", "node_modules", "pnpm-lock.yaml"]),
  { linterOptions: { reportUnusedDisableDirectives: "error" } },
  {
    extends: [
      eslint.configs.recommended,
      tslint.configs.strictTypeChecked,
      tslint.configs.stylisticTypeChecked,
    ],
    files: ["**/*.{js,ts}"],
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ["*.config.*s"] },
      },
    },
  },
)
