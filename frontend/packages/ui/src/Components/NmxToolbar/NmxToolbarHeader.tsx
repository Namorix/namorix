import React from "react"
import type { WithBaseProps } from "../../types"
import { cx } from "../../utils"

export type NmxToolbarHeaderProps = WithBaseProps

export const NmxToolbarHeader: React.FC<NmxToolbarHeaderProps> = ({
  shouldRender = true,
  className,
  children,
  ...rest
}) => {
  if (!shouldRender) return null

  return (
    <div {...rest} className={cx("nmx-toolbar-header", className)}>
      {children}
    </div>
  )
}
