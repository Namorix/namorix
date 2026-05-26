import type { WithBaseProps, WithSemanticColor } from "../../types"
import React from "react"
import { cx, cxSemantic } from "../../utils"

interface NmxChipProps extends WithBaseProps, WithSemanticColor {
  active?: boolean
  onClick?: () => void
}

export const NmxChip: React.FC<NmxChipProps> = ({
  active = false,
  semantic = "info",
  shouldRender = true,
  onClick,
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
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.()
      }}
      className={cx(
        "nmx-chip",
        { "nmx-chip--active": active },
        cxSemantic("nmx-chip", semantic),
        className,
      )}
    >
      {children}
    </span>
  )
}
