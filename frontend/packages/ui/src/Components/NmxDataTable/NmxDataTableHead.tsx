import type { WithBaseProps } from "../../types"
import React from "react"
import { cx } from "../../utils"

type NmxDataTableHeadProps = WithBaseProps

export const NmxDataTableHead: React.FC<NmxDataTableHeadProps> = ({
  shouldRender = true,
  children,
  className,
  ...rest
}) => {
  if (!shouldRender) {
    return null
  }

  return (
    <div {...rest} className={cx("nmx-data-table__head", className)}>
      {children}
    </div>
  )
}
