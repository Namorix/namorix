import React from "react"
import { cx } from "../../utils"
import type { WithBaseProps } from "../../types"

type NmxFormRowProps = WithBaseProps

export const NmxFormRow: React.FC<NmxFormRowProps> = ({
  shouldRender = true,
  children,
  className,
  ...rest
}) => {
  if (!shouldRender) return null

  return (
    <div {...rest} className={cx("nmx-form-row", className)}>
      {children}
    </div>
  )
}
