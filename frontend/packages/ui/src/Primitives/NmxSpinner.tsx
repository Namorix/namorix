import React from "react"
import type { WithBaseProps } from "../types"
import { cx } from "../utils"

interface NmxSpinnerProps extends WithBaseProps {
  size?: "sm" | "md" | "lg"
}

export const NmxSpinner: React.FC<NmxSpinnerProps> = ({
  size = "md",
  shouldRender = true,
  className,
  ...rest
}) => {
  if (!shouldRender) return null

  return (
    <span
      {...rest}
      className={cx("nmx-spinner", `nmx-spinner--${size}`, className)}
    />
  )
}
