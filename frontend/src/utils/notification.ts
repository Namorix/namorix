import type { TFunction } from "i18next"
import type { NmxNotificationDto } from "@namorix/core"

function parseParams(raw?: string): Record<string, string> | undefined {
  if (!raw) return undefined
  try {
    return JSON.parse(raw) as Record<string, string>
  } catch {
    return undefined
  }
}

export function resolveNotifTitle(
  t: TFunction,
  notif: NmxNotificationDto,
): string {
  const params = parseParams(notif.params)
  return t(`notification.${notif.titleKey}`, params)
}

export function resolveNotifDescription(
  t: TFunction,
  notif: NmxNotificationDto,
): string | undefined {
  if (!notif.descriptionKey) return undefined
  const params = parseParams(notif.params)
  return t(`notification.${notif.descriptionKey}`, params)
}
