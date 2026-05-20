import type { WithBaseProps } from "../../types"
import React from "react"
import { cx } from "../../utils"

type NmxDataTableCellProps = WithBaseProps

export const NmxDataTableCell: React.FC<NmxDataTableCellProps> = ({
  shouldRender = true,
  children,
  className,
  ...rest
}) => {
  if (!shouldRender) {
    return null
  }

  return (
    <div {...rest} className={cx("nmx-data-table__cell", className)}>
      {children}
    </div>
  )
}
