import React from "react"
import { cx } from "@namorix/ui"
import type { WithBaseProps } from "../../types"

type NmxToolbarContainerProps = WithBaseProps

export const NmxToolbarContainer: React.FC<NmxToolbarContainerProps> = ({
  children,
  className,
  shouldRender = true,
  ...rest
}) => {
  return (
    <div {...rest} className={cx("nmx-toolbar-container", className)}>
      {children}
    </div>
  )
}
