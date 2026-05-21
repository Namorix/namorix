import type { WithBaseProps, WithSemanticColor } from "../types"
import React from "react"
import { cx, cxSemantic } from "../utils"

interface NmxBadgeProps extends WithBaseProps, WithSemanticColor {
  bgEnabled?: boolean
}

export const NmxBadge: React.FC<NmxBadgeProps> = ({
  semantic = "info",
  bgEnabled = true,
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
      className={cx(
        "nmx-badge",
        cxSemantic("nmx-badge", semantic),
        { "nmx-badge-bg": bgEnabled },
        className,
      )}
    >
      {children}
    </span>
  )
}
