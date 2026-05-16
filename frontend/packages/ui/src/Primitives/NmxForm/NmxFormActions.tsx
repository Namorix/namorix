import React from "react"
import { cx } from "@namorix/core/utils"

interface NmxFormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  shouldRender?: boolean
}

export const NmxFormActions: React.FC<NmxFormActionsProps> = ({
  children,
  className,
  shouldRender = true,
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
