import React from "react"
import type { WithBaseProps } from "../types"
import { cx } from "../utils"

interface NmxLoadingProps extends WithBaseProps {
  overlay?: boolean
}

export const NmxLoading: React.FC<NmxLoadingProps> = ({
  overlay = false,
  shouldRender = true,
  className,
  ...rest
}) => {
  if (!shouldRender) return null

  return (
    <div {...rest} className={cx("nmx-loading", className)}>
      <div
        className={cx("nmx-loading__overlay", {
          "nmx-loading__overlay--solid": overlay,
        })}
      >
        <div className="nmx-loading__spinner" />
      </div>
    </div>
  )
}
