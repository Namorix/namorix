import React from "react"
import { cx } from "../../utils"
import type { WithBaseProps } from "../../types"

interface NmxCardBodyProps extends WithBaseProps {
  isEmpty?: boolean
}

export const NmxCardBody: React.FC<NmxCardBodyProps> = ({
  isEmpty = false,
  shouldRender = true,
  children,
  className,
  ...rest
}) => {
  if (!shouldRender) {
    return
  }

  return (
    <div {...rest} className={cx("nmx-card__body", {"nmx-card__body--empty": isEmpty}, className)}>
      {children}
    </div>
  )
}
