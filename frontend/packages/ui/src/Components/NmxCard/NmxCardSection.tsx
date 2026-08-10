import React from "react"
import type { WithBaseProps } from "../../types"
import { cx } from "../../utils"

interface NmxCardSectionProps extends WithBaseProps {
  title?: string
}

export const NmxCardSection: React.FC<NmxCardSectionProps> = ({
  title,
  shouldRender = true,
  children,
  className,
  ...rest
}) => {
  if (!shouldRender) return null

  return (
    <section {...rest} className={cx("nmx-card-section", className)}>
      {title && <span className="nmx-card-section__title">{title}</span>}
      {children}
    </section>
  )
}
