import React from "react"
import { cx, cxSemantic } from "../utils"
import type { WithBaseProps, WithSemanticColor } from "../types"

interface NmxInlineAlertProps extends WithBaseProps, WithSemanticColor {
  message?: string | undefined | null
}

export const NmxInlineAlert: React.FC<NmxInlineAlertProps> = ({
  message,
  semantic = "info",
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
        cxSemantic("nmx-inline-alert", semantic),
        className,
      )}
    >
      {message}
    </div>
  )
}
