import type { WithBaseProps } from "../../types"
import React from "react"
import { cx } from "../../utils"

type NmxDataTableBodyProps = WithBaseProps

export const NmxDataTableBody: React.FC<NmxDataTableBodyProps> = ({
  shouldRender = true,
  children,
  className,
  ...rest
}) => {
  if (!shouldRender) {
    return null
  }

  return (
    <div {...rest} className={cx("nmx-data-table__body", className)}>
      {children}
    </div>
  )
}
