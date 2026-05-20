import type { WithBaseProps } from "../../types"
import React from "react"
import { cx } from "../../utils"

type NmxDataTableRowProps = WithBaseProps

export const NmxDataTableRow: React.FC<NmxDataTableRowProps> = ({
  shouldRender = true,
  children,
  className,
  ...rest
}) => {
  if (!shouldRender) {
    return null
  }

  return (
    <div {...rest} className={cx("nmx-data-table__row", className)}>
      {children}
    </div>
  )
}
