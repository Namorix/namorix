import type { WithBaseProps } from "../../types"
import React from "react"
import { cx } from "../../utils"

interface NmxHorizontalWrapItemProps extends WithBaseProps {
  pushRight?: boolean
}

export const NmxHorizontalWrapItem: React.FC<NmxHorizontalWrapItemProps> = ({
  pushRight = false,
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
        "nmx-horizontal-wrap__item",
        `nmx-horizontal-wrap__item--push-${pushRight ? "right" : "left"}`,
        className,
      )}
    >
      {children}
    </div>
  )
}
