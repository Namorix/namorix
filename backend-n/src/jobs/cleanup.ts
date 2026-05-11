import cron from "node-cron"
import { cleanupExpiredTokens } from "../services/auth.service"
import { createLogger } from "@namorix/backend-core"

const logger = createLogger("cleanup")

export async function startCleanupJob() {
  await cleanupExpiredTokens()

  // Run on 03:00AM
  cron.schedule("0 3 * * *", async () => {
    logger.info("Cleanup expired tokens")
    await cleanupExpiredTokens()
  })
}
