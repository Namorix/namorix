import React from "react"
import { cx } from "../../utils"
import type { WithBaseProps } from "../../types"

type NmxFormActionsProps = WithBaseProps

export const NmxFormActions: React.FC<NmxFormActionsProps> = ({
  shouldRender = true,
  children,
  className,
  ...rest
}) => {
  if (!shouldRender) {
    return null
  }

  return (
    <div {...rest} className={cx("nmx-form-actions", className)}>
      {children}
    </div>
  )
}
