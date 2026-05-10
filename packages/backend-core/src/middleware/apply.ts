import express from "express"
import cors from "cors"
import helmet from "helmet"
import cookieParser from "cookie-parser"
import { rateLimit } from "express-rate-limit"
import { handleJsonError } from "./json-error"
import type { Application } from "express"
import type { MiddlewareConfig } from "./types"
import { defaultMiddlewareConfig } from "./types"
import { setCsrf, validateCsrf } from "./csrf"

export function createMiddleware(config: MiddlewareConfig) {
  const cfg = { ...defaultMiddlewareConfig, ...config }

  return (app: Application) => {
    if (cfg.trustProxy) {
      app.set("trust proxy", true)
    }

    if (cfg.helmetEnabled) {
      app.use(helmet())
    }

    app.use(cors({ origin: cfg.corsOrigin, credentials: true }))
    app.use(
      rateLimit({
        windowMs: cfg.rateLimitWindow,
        max: cfg.rateLimitMax,
        standardHeaders: true,
        legacyHeaders: false,
        validate: {
          trustProxy: !cfg.dev,
        },
        message: {
          error: "Too many requests, please slow down",
        },
      }),
    )
    app.use(cookieParser())

    if (cfg.csrfMode === "double-submit") {
      app.use(setCsrf(cfg.secureCookie ?? false))
      app.use(validateCsrf)
    }

    app.use(express.json({ limit: cfg.jsonBodyLimit }))
    app.use(handleJsonError)
  }
}
