import { createLogger } from "@namorix/backend-core"
import express from "express"
import { database } from "./db"
import { applyMiddleware } from "./middleware"
import { applyRoutes } from "./routes"
import { config } from "./config"
import { initSettings } from "./services/settings.service"
import { startCleanupJob } from "./jobs/cleanup"

const logger = createLogger("main")
const app = express()

database.start()
applyMiddleware(app)
applyRoutes(app)

await initSettings()
await startCleanupJob()

app.listen(config.port, () => {
  logger.info(`Server running on port ${String(config.port)}`)
})
