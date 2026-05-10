import pino from "pino"

const level = (process.env.LOG_LEVEL as pino.Level | undefined) ?? "info"
const pretty = process.env.NODE_ENV !== "production"

export const logger = pino({
  level: level,
  ...(pretty
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
            messageFormat: "[{tag}] {msg}",
            ignore: "pid,hostname,tag",
          },
        },
      }
    : {}),
})

export const createLogger = (tag: string) => logger.child({ tag })
