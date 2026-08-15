import React from "react"
import {cx, cxSpacing} from "../../utils"
import type {NmxSpacing, WithBaseProps} from "../../types"

export interface NmxCardHeaderProps extends WithBaseProps {
  title?: string
  description?: string
  titleClassName?: string
  descriptionClassName?: string
  spacing?: NmxSpacing | null
}

export const NmxCardHeader: React.FC<NmxCardHeaderProps> = ({
  title,
  description,
  titleClassName,
  descriptionClassName,
  spacing = null,
  shouldRender = true,
  className,
  ...rest
}) => {
  if (!shouldRender || !title) {
    return null
  }

  return (
    <div {...rest} className={cx("nmx-card__header", spacing && cxSpacing("nmx-card__header", spacing), className)}>
      <h2 className={cx("nmx-card__header-title", titleClassName)}>{title}</h2>
      {description && (
        <p className={cx("nmx-card__header-description", descriptionClassName)}>
          {description}
        </p>
      )}
    </div>
  )
}
