import React from "react"
import { cx, cxSemantic } from "../utils"
import type {
  NmxSemanticColor,
  WithBaseProps,
  WithSemanticColor,
} from "../types"

type MessageType = string | Error | undefined | unknown | null

interface NmxInlineAlertProps extends WithBaseProps, WithSemanticColor {
  message?: MessageType
}

export interface NmxInlineAlertState {
  semantic: NmxSemanticColor
  message?: MessageType
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
      {message ? String(message) : ""}
    </div>
  )
}
