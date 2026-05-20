import type { WithBaseProps, WithSemanticColor } from "../types"
import React from "react"
import { cx, cxSemantic } from "../utils"

interface NmxBadgeProps extends WithBaseProps, WithSemanticColor {}

export const NmxBadge: React.FC<NmxBadgeProps> = ({
  semantic = "info",
  shouldRender = true,
  children,
  className,
  ...rest
}) => {
  if (!shouldRender) {
    return null
  }

  return (
    <span
      {...rest}
      className={cx("nmx-badge", cxSemantic("nmx-badge", semantic), className)}
    >
      {children}
    </span>
  )
}
