import { Application, Router } from "express"
import { AuthController } from "./auth"
import { registerController } from "@namorix/backend-core"

export function applyRoutes(app: Application) {
  const apiRouter = Router()
  registerController(apiRouter, AuthController)
  app.use(apiRouter)
}
