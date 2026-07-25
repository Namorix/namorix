import React from "react"
import type { WithBaseProps, WithOnClick } from "../../types"
import { cx } from "../../utils"

type NmxCardProps = WithBaseProps & WithOnClick

export const NmxCard: React.FC<NmxCardProps> = ({
  onClick,
  shouldRender = true,
  children,
  className,
  ...rest
}) => {
  if (!shouldRender) {
    return
  }

  return (
    <div {...rest} className={cx("nmx-card", className)} onClick={onClick}>
      {children}
    </div>
  )
}
