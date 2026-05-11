import { getDB, settings } from "../db"

const cache = new Map<string, string>()

export const SettingKey = {
  SIGNUP_ENABLED: "signup_enabled",
} as const

export type SettingKey = (typeof SettingKey)[keyof typeof SettingKey]

export async function getSetting(key: SettingKey): Promise<string | null> {
  if (cache.has(key)) {
    return cache.get(key) ?? null
  }

  const db = getDB()
  const row = await db.query.settings.findFirst({
    where: (s, { eq }) => eq(s.key, key),
  })

  if (row) {
    cache.set(key, row.value)
  }
  return row?.value ?? null
}

export async function setSetting(key: SettingKey, value: string): Promise<void> {
  const db = getDB()
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })

  cache.set(key, value)
}

export async function hasSetting(key: SettingKey): Promise<boolean> {
  return (await getSetting(key)) !== null
}

export async function initSettings(): Promise<void> {
  if (!(await hasSetting(SettingKey.SIGNUP_ENABLED))) {
    await setSignUpEnabled(true)
  }
}

export async function isSignUpEnabled(): Promise<boolean> {
  const value = await getSetting(SettingKey.SIGNUP_ENABLED)
  return value !== "false"
}

export async function setSignUpEnabled(enabled: boolean): Promise<void> {
  await setSetting(SettingKey.SIGNUP_ENABLED, String(enabled))
}
