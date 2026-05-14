import React from "react"
import { cx } from "@namorix/core/utils"
import "./NmxForm.scss"

type NmxFormPageProps = React.HTMLAttributes<HTMLDivElement>

export const NmxFormPage: React.FC<NmxFormPageProps> = ({
  children,
  className,
  ...rest
}) => {
  return (
    <div {...rest} className={cx("nmx-form-page", className)}>
      {children}
    </div>
  )
}
