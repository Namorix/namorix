import React from "react"
import type {
  NmxButtonVariant,
  NmxSemanticColor,
  NmxSpacing,
} from "./primitives"

export interface NmxFallback {
  condition: boolean | undefined | null | unknown
  state?: "loading" | "error" | "empty"
  content?: React.ReactNode
}

export interface WithBaseProps {
  className?: string
  children?: React.ReactNode
  shouldRender?: boolean
}

export interface WithStylesheet {
  style?: React.CSSProperties
}

export interface WithHTMLProps<T extends HTMLElement = HTMLDivElement>
  extends WithBaseProps, React.HtmlHTMLAttributes<T> {}

export interface WithSemanticColor {
  semantic?: NmxSemanticColor
}

export interface WithMuted {
  muted?: boolean
}

export interface WithVariant<T extends string = NmxButtonVariant> {
  variant?: T
}

export interface WithUppercase {
  uppercase?: boolean
}

export interface WithOnClick {
  onClick?: React.MouseEventHandler<HTMLDivElement>
}

export interface WithSpacing {
  spacing?: NmxSpacing
}
