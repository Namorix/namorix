import React from "react"
import { type WithBaseProps } from "../../types"
import { cx } from "../../utils"

interface NmxSettingsRowProps extends WithBaseProps {
  label: string
  description?: string
}

export const NmxSettingsRow: React.FC<NmxSettingsRowProps> = ({
  label,
  description,
  shouldRender = true,
  children,
  className,
  ...rest
}) => {
  if (!shouldRender) return null

  return (
    <div {...rest} className={cx("nmx-settings-row", className)}>
      <div className="nmx-settings-row__label-wrap">
        <span className="nmx-settings-row__label">{label}</span>
        {description && (
          <span className="nmx-settings-row__desc">{description}</span>
        )}
      </div>
      <div className="nmx-settings-row__control">{children}</div>
    </div>
  )
}
