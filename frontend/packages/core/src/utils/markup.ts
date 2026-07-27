import React from "react"

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

function applyMarkup(escaped: string) {
  return escaped
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(
      /\[color:(primary|muted|error|warning|success|info|text)](.*?)\[\/color]/g,
      (_, token: ColorToken, content: string) =>
        `<span style="color:${COLOR_MAP[token as ColorToken]}">${content}</span>`,
    )
}

export function markupToHtml(str: string) {
  return applyMarkup(safe(str))
}

function styleToCss(style: React.CSSProperties) {
  return Object.entries(style)
    .map(
      ([k, v]) => `${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}:${v}`,
    )
    .join(";")
}

function nodeToHtml(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean")
    return ""
  if (typeof node === "string") return markupToHtml(node)
  if (typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(nodeToHtml).join("")

  if (React.isValidElement(node)) {
    const { type, props } = node as React.ReactElement<{
      children?: React.ReactNode
      className?: string
      style?: React.CSSProperties
    }>

    const inner = nodeToHtml(props.children)

    if (type === React.Fragment) return inner
    if (typeof type !== "string") return inner // custom component: không render được, chỉ lấy children

    const classAttr = props.className ? ` class="${safe(props.className)}"` : ""
    const styleAttr = props.style ? ` style="${styleToCss(props.style)}"` : ""
    return `<${type}${classAttr}${styleAttr}>${inner}</${type}>`
  }

  return ""
}

export function markupToHtmlFromNode(node: React.ReactNode): string {
  return nodeToHtml(node)
}
