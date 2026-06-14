import React from "react"
import type { WithBaseProps } from "../../types"
import { cx } from "../../utils"

export interface NmxAddonRootProps extends WithBaseProps {
  scrolled?: boolean
}

export const NmxAddonRoot: React.FC<NmxAddonRootProps> = ({
  scrolled = false,
  shouldRender = true,
  className,
  children,
  ...rest
}) => {
  if (!shouldRender) return null

  return (
    <div
      {...rest}
      className={cx(
        "nmx-addon-root",
        { "nmx-addon-root--scrolled": scrolled },
        className,
      )}
    >
      {children}
    </div>
  )
}
