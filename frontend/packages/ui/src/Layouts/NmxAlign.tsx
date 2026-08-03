import React from "react"
import type { WithBaseProps } from "../types"
import { cx, cxSpacing } from "../utils"

export interface NmxAlignProps extends WithBaseProps {
  direction?: "row" | "column"
  gap?: "xs" | "sm" | "md" | "lg" | "xl"
  align?: "start" | "center" | "end" | "stretch" | "baseline"
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly"
  wrap?: boolean
  grow?: boolean
}

export const NmxAlign: React.FC<NmxAlignProps> = ({
  direction = "row",
  gap = "md",
  align = "center",
  justify,
  wrap,
  grow,
  shouldRender = true,
  className,
  children,
  ...rest
}) => {
  if (!shouldRender) return null

  return (
    <div
      {...rest}
      className={cx(
        "nmx-align",
        direction === "column" && "nmx-align--column",
        cxSpacing("nmx-align", gap),
        align !== "center" && `nmx-align--align-${align}`,
        justify && `nmx-align--justify-${justify}`,
        wrap && "nmx-align--wrap",
        grow && "nmx-align--grow",
        className,
      )}
    >
      {children}
    </div>
  )
}
