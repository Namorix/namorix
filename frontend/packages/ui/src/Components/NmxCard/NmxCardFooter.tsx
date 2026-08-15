import React from "react"
import {cx, cxSpacing} from "../../utils"
import type {NmxSpacing, WithBaseProps} from "../../types"

interface NmxCardFooterProps extends WithBaseProps {
  spacingBottom?: NmxSpacing | null
}

export const NmxCardFooter: React.FC<NmxCardFooterProps> = ({
  spacingBottom = null,
  shouldRender = true,
  className,
  children,
  ...rest
}) => {
  if (!shouldRender) {
    return
  }

  return (
    <div {...rest} className={cx("nmx-card__footer", spacingBottom && cxSpacing("nmx-card__footer", spacingBottom), className)}>
      {children}
    </div>
  )
}
