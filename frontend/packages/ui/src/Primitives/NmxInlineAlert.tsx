import React from "react"
import { cx } from "@namorix/core/utils"

export type NmxInlineAlertVariant = "error" | "warning" | "success" | "info"

interface NmxInlineAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string | undefined | null
  variant?: NmxInlineAlertVariant
  shouldRender?: boolean
}

export const NmxInlineAlert: React.FC<NmxInlineAlertProps> = ({
  message,
  variant = "info",
  shouldRender = true,
  className,
  ...rest
}) => {
  if (!shouldRender || !message) {
    return null
  }

  return (
    <div
      {...rest}
      className={cx(
        "nmx-inline-alert",
        "nmx-inline-alert--" + variant,
        className,
      )}
    >
      {message}
    </div>
  )
}
