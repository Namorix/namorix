import type {
  NmxButtonVariant,
  NmxCxInput,
  NmxSemanticColor,
  NmxSize,
  NmxSpacing,
} from "../types"

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

export function cxSemantic(
  prefix: string,
  semantic?: NmxSemanticColor | null,
  doubleSymbolMinus: boolean = true,
) {
  return !semantic
    ? ""
    : `${prefix}${doubleSymbolMinus ? "--" : "-"}${semantic}`
}

export function cxVariant(prefix: string, variant?: NmxButtonVariant) {
  return !variant ? "" : `${prefix}--${variant}`
}

export function cxMuted(prefix: string, muted?: boolean) {
  return !muted ? "" : `${prefix}--muted`
}

export function cxSpacing(prefix: string, spacing?: NmxSpacing) {
  return !spacing ? "" : `${prefix}--${spacing}`
}

export function cxSize(prefix: string, size?: NmxSize) {
  return !size ? "" : `${prefix}--${size}`
}
