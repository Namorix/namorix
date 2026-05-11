import * as schema from "./schema"
import { NmxDataBase } from "@namorix/backend-core"
import { config } from "../config"

export const database = new NmxDataBase(schema)
  .setDataPath(config.dataDir)
  .setMigrationsFolder("migrations")

export const getDB = () => database.db
export * from "./schema"
