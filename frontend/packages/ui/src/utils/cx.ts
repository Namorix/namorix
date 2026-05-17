import type { NmxButtonVariant, NmxCxInput, NmxSemanticColor } from "../types"

export function cx(...classes: NmxCxInput[]): string {
  return classes
    .flatMap((cls) => {
      if (!cls) return []
      if (typeof cls === "string") return [cls]
      return Object.entries(cls)
        .filter(([, value]) => value)
        .map(([key]) => key)
    })
    .join(" ")
}

export function cxSemantic(prefix: string, semantic?: NmxSemanticColor) {
  return !semantic ? "" : `${prefix}--${semantic}`
}

export function cxVariant(prefix: string, variant?: NmxButtonVariant) {
  return !variant ? "" : `${prefix}--${variant}`
}

export function cxMuted(prefix: string, muted?: boolean) {
  return !muted ? "" : `${prefix}--muted`
}
