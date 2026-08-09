import type { TFunction } from "i18next"
import { type NmxNotificationDto, markupToHtml } from "@namorix/core"
import { resolveAddonLocaleTitleByKey } from "./addon"
import { NmxIconFontSymbol, NmxIconSvgSymbol } from "@namorix/ui"
import type { NmxAddonLocaleKeys } from "../addons"

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
  beacon: NmxIconSvgSymbol.APP_BEACON,
  warden: NmxIconSvgSymbol.APP_WARDEN,
}

type NotificationDescriptionRenderer = (
  t: TFunction,
  notif: NmxNotificationDto,
  params?: Record<string, string>,
) => string | undefined

const descriptionRenderers = new Map<string, NotificationDescriptionRenderer>()

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

export function resolveSourceName(t: TFunction, source?: string): string {
  return (
    resolveAddonLocaleTitleByKey(t, source as NmxAddonLocaleKeys) ?? t("system")
  )
}

export function registerNotificationDescriptionRenderer(
  source: string,
  renderer: NotificationDescriptionRenderer,
): void {
  descriptionRenderers.set(source, renderer)
}

export function notificationKeySource(key?: string): string {
  return key?.split(":")[0] ?? ""
}

export function resolveNotificationDescriptionHtml(
  t: TFunction,
  notification: NmxNotificationDto,
): string {
  const params = parseParams(notification.params)
  const renderer = descriptionRenderers.get(
    notificationKeySource(notification.key),
  )
  const custom = renderer?.(t, notification, params)
  if (custom) return markupToHtml(custom)
  const desc = resolveNotificationDescription(t, notification)
  return desc ? markupToHtml(desc) : ""
}
