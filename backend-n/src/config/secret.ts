import { join } from "path"
import { DATA_PATH } from "./types"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { createLogger } from "@namorix/backend-core"
import { randomBytes } from "crypto"

const SECRET_FILEPATH = join(DATA_PATH, ".secret")
const logger = createLogger("secret")

export function getJwtSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET

  if (existsSync(SECRET_FILEPATH)) {
    return readFileSync(SECRET_FILEPATH, "utf-8").trim()
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET not set and no .secrets file found")
  }

  const secret = randomBytes(32).toString("hex")
  mkdirSync(DATA_PATH, { recursive: true })
  writeFileSync(SECRET_FILEPATH, secret, { mode: 0o666 })
  logger.warn(`Generate JWT secret at ${SECRET_FILEPATH}`)
  return secret
}
