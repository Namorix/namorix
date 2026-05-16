import React from "react"
import type { WithBaseProps } from "../../types"
import { cx } from "../../utils"

type NmxCardProps = WithBaseProps

export const NmxCard: React.FC<NmxCardProps> = ({
  shouldRender = true,
  children,
  className,
  ...rest
}) => {
  if (!shouldRender) {
    return
  }

  return (
    <div {...rest} className={cx("nmx-card", className)}>
      {children}
    </div>
  )
}
