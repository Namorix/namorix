import type { WithBaseProps } from "../types"
import React from "react"
import { cx, cxSpacing } from "../utils"

export interface NmxGridProps extends WithBaseProps {
  cols?: number | "auto"
  minColWidth?: number
  gap?: "sm" | "md" | "lg"
}

export const NmxGrid: React.FC<NmxGridProps> = ({
  cols = "auto",
  minColWidth = 160,
  gap = "md",
  shouldRender = true,
  className,
  children,
  ...rest
}) => {
  if (!shouldRender) {
    return null
  }

  const gridCols =
    cols === "auto"
      ? `repeat(auto-fit, minmax(${minColWidth}px, 1fr))`
      : `repeat(auto-fit, minmax(max(${minColWidth}px, calc(${(100 / cols).toFixed(2)}% - var(--nmx-grid-spacing, 0px))), 1fr))`
  return (
    <div
      {...rest}
      className={cx("nmx-grid", cxSpacing("nmx-grid", gap), className)}
      style={
        {
          "--nmx-grid-cols": gridCols,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}
