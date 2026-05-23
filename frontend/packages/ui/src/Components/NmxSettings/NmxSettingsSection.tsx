import React from "react"
import { type WithBaseProps } from "../../types"
import { cx } from "../../utils"

interface NmxSettingsSectionProps extends WithBaseProps {
  title?: string
}

export const NmxSettingsSection: React.FC<NmxSettingsSectionProps> = ({
  title,
  shouldRender = true,
  children,
  className,
  ...rest
}) => {
  if (!shouldRender) return null

  return (
    <section {...rest} className={cx("nmx-settings-section", className)}>
      {title && <span className="nmx-settings-section__title">{title}</span>}
      {children}
    </section>
  )
}
