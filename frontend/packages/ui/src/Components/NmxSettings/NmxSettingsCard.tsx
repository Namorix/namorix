import React from "react"
import { type WithBaseProps } from "../../types"
import { cx } from "../../utils"

export const NmxSettingsCard: React.FC<WithBaseProps> = ({
  shouldRender = true,
  children,
  className,
  ...rest
}) => {
  if (!shouldRender) return null

  return (
    <div {...rest} className={cx("nmx-settings-card", className)}>
      {children}
    </div>
  )
}
