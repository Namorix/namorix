import React from "react"
import type { WithBaseProps, WithSemanticColor } from "../../types"
import { cx, cxSemantic } from "../../utils"

interface NmxIconBoxProps extends WithBaseProps, WithSemanticColor {}

export const NmxIconBox: React.FC<NmxIconBoxProps> = ({
  semantic = "primary",
  shouldRender = true,
  children,
  className,
  ...rest
}) => {
  if (!shouldRender) {
    return
  }

  return (
    <div
      {...rest}
      className={cx(
        "nmx-icon-box",
        cxSemantic("nmx-icon-box", semantic),
        className,
      )}
    >
      {children}
    </div>
  )
}
