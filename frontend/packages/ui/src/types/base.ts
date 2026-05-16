import React from "react"
import type { NmxButtonVariant, NmxSemanticColor } from "./primitives"

export interface WithBaseProps {
  className?: string
  children?: React.ReactNode
  shouldRender?: boolean
}

export interface WithHTMLProps<T extends HTMLElement = HTMLDivElement>
  extends WithBaseProps, React.HtmlHTMLAttributes<T> {}

export interface WithSemanticColor {
  semantic?: NmxSemanticColor
}

export interface WithVariant<T extends string = NmxButtonVariant> {
  variant?: T
}
