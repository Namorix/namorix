import React from "react"
import { cx } from "@namorix/core/utils"
import "./NmxForm.scss"

interface NmxFormHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  shouldRender?: boolean
}

export const NmxFormHeader: React.FC<NmxFormHeaderProps> = ({
  title,
  description,
  shouldRender = true,
  className,
  ...rest
}) => {
  if (!shouldRender || !title) {
    return null
  }

  return (
    <div {...rest} className={cx("nmx-form-page__header", className)}>
      <h2 className="nmx-form-page__header-title">{title}</h2>
      {description && (
        <p className="nmx-form-page__header-description">{description}</p>
      )}
    </div>
  )
}
