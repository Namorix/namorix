import Database from "better-sqlite3"
import { BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import { mkdirSync } from "fs"
import { join } from "path"

const DATA_PATH = process.env.DATA_PATH ?? "./data"
const MIGRATIONS_FOLDER = process.env.MIGRATIONS_FOLDER ?? "migrations"

export type NmxDB<
  TSchema extends Record<string, unknown> = Record<string, never>,
> = BetterSQLite3Database<TSchema>

export class NmxDataBase<
  TSchema extends Record<string, unknown> = Record<string, never>,
> {
  private _db: NmxDB<TSchema> | null = null
  private _schema: TSchema
  private _dataPath: string
  private _dbFilename: string
  private _migrationsFolder: string

  constructor(schema: TSchema) {
    this._schema = schema
    this._dataPath = DATA_PATH
    this._dbFilename = "namorix.db"
    this._migrationsFolder = MIGRATIONS_FOLDER
  }

  setDataPath(dir: string): this {
    this._dataPath = dir
    return this
  }

  setDBFilename(filename: string): this {
    this._dbFilename = filename
    return this
  }

  setMigrationsFolder(dir: string): this {
    this._migrationsFolder = dir
    return this
  }

  start(): NmxDB<TSchema> {
    if (this._db) {
      return this._db
    }

    const dbPath = join(this._dataPath, this._dbFilename)
    const migrationPath = join(this._dataPath, this._migrationsFolder)

    mkdirSync(this._dataPath, { recursive: true })
    mkdirSync(migrationPath, { recursive: true })

    const sqlite = new Database(dbPath)
    this._db = drizzle(sqlite, { schema: this._schema })

    if (this._migrationsFolder) {
      migrate(this._db, { migrationsFolder: migrationPath })
    }

    return this._db
  }

  get db(): NmxDB<TSchema> {
    if (!this._db) {
      throw new Error("DB not started. Call start() first")
    }
    return this._db
  }
}
