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
  muted: "var(--nmx-color-on-surface-variant)",
  error: "var(--nmx-color-error)",
  warning: "var(--nmx-color-warning)",
  success: "var(--nmx-color-success)",
  info: "var(--nmx-color-info)",
  text: "var(--nmx-color-on-surface)",
}

function safe(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function toHtml(str: string) {
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
