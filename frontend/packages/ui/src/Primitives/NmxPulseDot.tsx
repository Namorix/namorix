import type { WithBaseProps } from "../types"
import React from "react"
import { cx } from "../utils"

interface NmxPulseDotProps extends WithBaseProps {
  status?: "live" | "stopped" | "error"
}

export const NmxPulseDot: React.FC<NmxPulseDotProps> = ({
  status = "stopped",
  shouldRender = true,
  className,
  ...rest
}) => {
  if (!shouldRender) {
    return null
  }

  return (
    <span
      {...rest}
      className={cx("nmx-pulse-dot", `nmx-pulse-dot--${status}`, className)}
    ></span>
  )
}
