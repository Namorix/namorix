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

type ColorToken =
  | "primary"
  | "muted"
  | "error"
  | "warning"
  | "success"
  | "info"
  | "text"

const COLOR_MAP: Record<ColorToken, string> = {
  primary: "var(--nmx-color-primary)",
  error: "var(--nmx-color-error)",
  warning: "var(--nmx-color-warning)",
  success: "var(--nmx-color-success)",
  info: "var(--nmx-color-info)",
  text: "var(--nmx-color-on-surface)",
  muted: "var(--nmx-color-on-surface-variant)",
}

function safe(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function toHtml(str: string) {
  const escaped = safe(str)
  return escaped
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(
      /\[color:(primary|muted|error|warning|success|info|text)](.*?)\[\/color]/g,
      (_, token: ColorToken, content: string) => {
        const cssVar = COLOR_MAP[token]
        return `<span style="color:${cssVar}">${content}</span>`
      },
    )
}

export function resolveNotificationTitle(
  t: TFunction,
  notif: NmxNotificationDto,
): string {
  const params = parseParams(notif.params)
  return t(`notification:${notif.key}.title`, params)
}

export function resolveNotificationDescription(
  t: TFunction,
  notif: NmxNotificationDto,
): string | undefined {
  const params = parseParams(notif.params)
  return t(`notification:${notif.key}.description`, params)
}

export function resolveNotificationTitleHtml(
  t: TFunction,
  notification: NmxNotificationDto,
): string {
  return toHtml(resolveNotificationTitle(t, notification))
}

export function resolveNotificationDescriptionHtml(
  t: TFunction,
  notification: NmxNotificationDto,
): string {
  const desc = resolveNotificationDescription(t, notification)
  return desc ? toHtml(desc) : ""
}
