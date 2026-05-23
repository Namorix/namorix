import React from "react"
import type { WithBaseProps } from "../../types"
import { cx } from "../../utils"

export type NmxAddonPageProps = WithBaseProps

export const NmxAddonPage: React.FC<NmxAddonPageProps> = ({
  shouldRender = true,
  className,
  children,
  ...rest
}) => {
  if (!shouldRender) return null

  return (
    <div {...rest} className={cx("nmx-addon-page", className)}>
      {children}
    </div>
  )
}
