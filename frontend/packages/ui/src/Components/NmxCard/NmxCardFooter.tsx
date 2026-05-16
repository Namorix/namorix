import React from "react"
import { cx } from "@namorix/core/utils"

interface NmxCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  shouldRender?: boolean
}

export const NmxCardFooter: React.FC<NmxCardFooterProps> = ({
  shouldRender = true,
  className,
  children,
  ...rest
}) => {
  if (!shouldRender) {
    return null
  }

  return (
    <div {...rest} className={cx("nmx-card__footer", className)}>
      {children}
    </div>
  )
}
