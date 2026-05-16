import React from "react"
import { cx } from "../../utils"
import type { WithBaseProps } from "../../types"

type NmxCardFooterProps = WithBaseProps

export const NmxCardFooter: React.FC<NmxCardFooterProps> = ({
  shouldRender = true,
  className,
  children,
  ...rest
}) => {
  if (!shouldRender) {
    return
  }

  return (
    <div {...rest} className={cx("nmx-card__footer", className)}>
      {children}
    </div>
  )
}
