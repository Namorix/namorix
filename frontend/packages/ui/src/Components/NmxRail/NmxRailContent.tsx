import type { WithBaseProps } from "../../types"
import React from "react"
import { cx } from "../../utils"

export type NmxRailContentProps = WithBaseProps

export const NmxRailContent: React.FC<NmxRailContentProps> = ({
  shouldRender = true,
  className,
  children,
  ...rest
}) => {
  if (!shouldRender) {
    return null
  }

  return (
    <div {...rest} className={cx("nmx-rail-content", className)}>
      {children}
    </div>
  )
}
