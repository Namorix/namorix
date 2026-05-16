import React from "react"
import { cx } from "@namorix/core/utils"

type NmxCardBodyProps = React.HTMLAttributes<HTMLDivElement>

export const NmxCardBody: React.FC<NmxCardBodyProps> = ({
  children,
  className,
  ...rest
}) => {
  return (
    <div {...rest} className={cx("nmx-card__body", className)}>
      {children}
    </div>
  )
}
