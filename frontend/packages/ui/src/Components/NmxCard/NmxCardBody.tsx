import React from "react"
import { cx } from "../../utils"
import type { WithBaseProps } from "../../types"

type NmxCardBodyProps = WithBaseProps

export const NmxCardBody: React.FC<NmxCardBodyProps> = ({
  shouldRender = true,
  children,
  className,
  ...rest
}) => {
  if (!shouldRender) {
    return
  }

  return (
    <div {...rest} className={cx("nmx-card__body", className)}>
      {children}
    </div>
  )
}
