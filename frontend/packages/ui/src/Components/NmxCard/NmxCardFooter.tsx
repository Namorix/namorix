import React from "react"
import { cx, cxSpacing } from "../../utils"
import type {
  NmxAlignHorizontal,
  NmxAlignVertical,
  NmxSpacing,
  WithBaseProps,
} from "../../types"

interface NmxCardFooterProps extends WithBaseProps {
  spacingBottom?: NmxSpacing | null
  alignVertical?: NmxAlignVertical | null
  alignHorizontal?: NmxAlignHorizontal | null
}

export const NmxCardFooter: React.FC<NmxCardFooterProps> = ({
  spacingBottom = null,
  alignVertical = null,
  alignHorizontal = null,
  shouldRender = true,
  className,
  children,
  ...rest
}) => {
  if (!shouldRender) {
    return
  }

  return (
    <div
      {...rest}
      className={cx(
        "nmx-card__footer",
        // Either align prop turns the footer into a row; the modifiers then only set
        // align-items/justify-content, so a consumer that already made it a flex box
        // (own className) can still use them without this.
        (alignVertical || alignHorizontal) && "nmx-card__footer--flex",
        alignVertical && `nmx-card__footer--align-vertical--${alignVertical}`,
        alignHorizontal && `nmx-card__footer--align-horizontal--${alignHorizontal}`,
        spacingBottom && cxSpacing("nmx-card__footer", spacingBottom),
        className,
      )}
    >
      {children}
    </div>
  )
}
