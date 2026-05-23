import React from "react"
import type { WithBaseProps } from "../../types"
import { cx } from "../../utils"

export type NmxAddonRootProps = WithBaseProps

export const NmxAddonRoot: React.FC<NmxAddonRootProps> = ({
  shouldRender = true,
  className,
  children,
  ...rest
}) => {
  if (!shouldRender) return null

  return (
    <div {...rest} className={cx("nmx-addon-root", className)}>
      {children}
    </div>
  )
}
