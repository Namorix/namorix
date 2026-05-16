import React from "react"
import { cx } from "../../utils"
import type { WithBaseProps } from "../../types"

type NmxCardContentProps = WithBaseProps

export const NmxCardContent: React.FC<NmxCardContentProps> = ({
  shouldRender = true,
  children,
  className,
  ...rest
}) => {
  if (!shouldRender) {
    return
  }

  return (
    <div {...rest} className={cx("nmx-card__content", className)}>
      {children}
    </div>
  )
}
