import type { WithBaseProps } from "../../types"
import React from "react"
import { cx } from "../../utils"

type NmxSettingsWrapProps = WithBaseProps

export const NmxSettingsWrap: React.FC<NmxSettingsWrapProps> = ({
  shouldRender = true,
  children,
  className,
}) => {
  if (!shouldRender) return
  return <div className={cx("nmx-settings-wrap", className)}>{children}</div>
}
