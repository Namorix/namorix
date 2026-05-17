import React from "react"
import { cx } from "../../utils"
import type { WithBaseProps } from "../../types"

export interface NmxCardHeaderProps extends WithBaseProps {
  title?: string
  description?: string
  titleClassName?: string
  descriptionClassName?: string
}

export const NmxCardHeader: React.FC<NmxCardHeaderProps> = ({
  title,
  description,
  titleClassName,
  descriptionClassName,
  shouldRender = true,
  className,
  ...rest
}) => {
  if (!shouldRender || !title) {
    return null
  }

  return (
    <div {...rest} className={cx("nmx-card__header", className)}>
      <h2 className={cx("nmx-card__header-title", titleClassName)}>{title}</h2>
      {description && (
        <p className={cx("nmx-card__header-description", descriptionClassName)}>
          {description}
        </p>
      )}
    </div>
  )
}
