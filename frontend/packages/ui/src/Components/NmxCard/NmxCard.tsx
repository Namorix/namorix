import React from "react"
import { cx } from "@namorix/core/utils"

type NmxCardProps = React.HTMLAttributes<HTMLDivElement>

export const NmxCard: React.FC<NmxCardProps> = ({
  children,
  className,
  ...rest
}) => {
  return (
    <div {...rest} className={cx("nmx-card", className)}>
      {children}
    </div>
  )
}
