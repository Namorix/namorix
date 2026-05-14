import React from "react"
import { cx } from "@namorix/core/utils"
import "./NmxForm.scss"

type NmxFormCardProps = React.HTMLAttributes<HTMLDivElement>

export const NmxFormCard: React.FC<NmxFormCardProps> = ({
  children,
  className,
  ...rest
}) => {
  return (
    <div {...rest} className={cx("nmx-form-card", className)}>
      {children}
    </div>
  )
}
