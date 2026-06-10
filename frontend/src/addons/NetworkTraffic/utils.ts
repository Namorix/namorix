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
