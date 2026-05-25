import type { WithBaseProps } from "../../types"
import React from "react"
import { cx, cxSpacing } from "../../utils"

export interface NmxHorizontalWrapProps extends WithBaseProps {
  gap?: "sm" | "md" | "lg"
  align?: "start" | "center" | "end" | "stretch"
  justify?: "start" | "center" | "end" | "between" | "around"
}

export const NmxHorizontalWrap: React.FC<NmxHorizontalWrapProps> = ({
  gap = "md",
  align,
  justify,
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
        "nmx-horizontal-wrap",
        cxSpacing("nmx-horizontal-wrap", gap),
        align && `nmx-horizontal-wrap--align-${align}`,
        justify && `nmx-horizontal-wrap--justify-${justify}`,
        className,
      )}
    >
      {children}
    </div>
  )
}
