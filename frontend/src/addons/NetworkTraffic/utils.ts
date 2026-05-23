import { HttpMethods } from "@namorix/core"
import type { NmxSemanticColor } from "@namorix/ui"

export function methodToSemantic(method?: HttpMethods): NmxSemanticColor {
  return method === HttpMethods.POST
    ? "success"
    : method === HttpMethods.PUT || method === HttpMethods.PATCH
      ? "warning"
      : method === HttpMethods.DELETE
        ? "error"
        : "info"
}

export function statusToSemantic(code: number): NmxSemanticColor {
  if (code >= 500) return "error"
  if (code >= 400) return "warning"
  if (code >= 300) return "info"
  return "success"
}

export function formatDuration(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`
}

export function formatSize(bytes: number): string {
  return bytes >= 1024 ? `${(bytes / 1024).toFixed(1)}KB` : `${bytes}B`
}

export function formatTimestamp(ts: string): string {
  const d = new Date(ts)

  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  const ss = String(d.getSeconds()).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const mo = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear()

  return `${hh}:${mm}:${ss} - ${dd}/${mo}/${yyyy}`
}
