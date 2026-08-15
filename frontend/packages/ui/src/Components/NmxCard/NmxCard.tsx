import React from "react"
import type { NmxSpacing, WithBaseProps, WithOnClick } from "../../types"
import { cx, cxSpacing } from "../../utils"

interface NmxCardProps extends WithBaseProps, WithOnClick {
  spacing?: "none" | NmxSpacing
}

export const NmxCard: React.FC<NmxCardProps> = ({
  onClick,
  spacing = null,
  shouldRender = true,
  children,
  className,
  ...rest
}) => {
  if (!shouldRender) {
    return
  }

  return (
    <div
      {...rest}
      className={cx(
        "nmx-card",
        onClick && "nmx-card--clickable",
        spacing === "none" && "nmx-card-spacing--none",
        spacing && spacing !== "none" && cxSpacing("nmx-card", spacing),
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
