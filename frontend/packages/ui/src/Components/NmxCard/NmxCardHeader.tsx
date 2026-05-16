import React from "react"
import { cx } from "../../utils"
import type { WithBaseProps } from "../../types"

interface NmxCardHeaderProps extends WithBaseProps {
  title?: string
  description?: string
}

export const NmxCardHeader: React.FC<NmxCardHeaderProps> = ({
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
    <div {...rest} className={cx("nmx-card__header", className)}>
      <h2 className="nmx-card__header-title">{title}</h2>
      {description && (
        <p className="nmx-card__header-description">{description}</p>
      )}
    </div>
  )
}
