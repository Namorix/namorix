import React from "react"
import { cx } from "@namorix/core/utils"

type NmxCardContentProps = React.HTMLAttributes<HTMLDivElement>

export const NmxCardContent: React.FC<NmxCardContentProps> = ({
  children,
  className,
  ...rest
}) => {
  return (
    <div {...rest} className={cx("nmx-card__content", className)}>
      {children}
    </div>
  )
}
