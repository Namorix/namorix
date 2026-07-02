import type { TFunction } from "i18next"
import {
  type NmxAddonLocaleKeys,
  type NmxNotificationDto,
  toHtml,
} from "@namorix/core"
import { resolveAddonLocaleTitleByKey } from "./addon"
import { NmxIconFontSymbol, NmxIconSvgSymbol } from "@namorix/ui"

export const NOTIFICATION_TYPE_ICON: Record<string, NmxIconFontSymbol> = {
  info: NmxIconFontSymbol.INFO,
  success: NmxIconFontSymbol.CHECK,
  warning: NmxIconFontSymbol.WARNING,
  error: NmxIconFontSymbol.CLOSE,
  security: NmxIconFontSymbol.SECURITY,
}

export const NOTIFICATION_SOURCE_ICON: Record<string, NmxIconSvgSymbol> = {
  system: NmxIconSvgSymbol.APP_SYSTEM,
  settings: NmxIconSvgSymbol.APP_SETTINGS,
}

function parseParams(raw?: string): Record<string, string> | undefined {
  if (!raw) return undefined
  try {
    return JSON.parse(raw) as Record<string, string>
  } catch {
    return undefined
  }
}

export function resolveNotificationDescription(
  t: TFunction,
  notif: NmxNotificationDto,
): string | undefined {
  const params = parseParams(notif.params)
  return t(`notification:${notif.key}`, params)
}

export function resolveNotificationDescriptionHtml(
  t: TFunction,
  notification: NmxNotificationDto,
): string {
  const desc = resolveNotificationDescription(t, notification)
  return desc ? toHtml(desc) : ""
}

export function resolveSourceName(t: TFunction, source?: string): string {
  return (
    resolveAddonLocaleTitleByKey(t, source as NmxAddonLocaleKeys) ?? t("system")
  )
}
