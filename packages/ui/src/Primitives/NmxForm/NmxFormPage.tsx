import React from "react"
import { cx } from "@namorix/core/utils"
import "./NmxForm.scss"

interface NmxFormPageProps extends React.HTMLAttributes<HTMLDivElement> {}

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
