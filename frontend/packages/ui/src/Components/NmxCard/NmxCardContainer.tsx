import type { WithBaseProps } from "../../types"
import React from "react"
import { cx } from "../../utils"

type NmxCardWrapProps = WithBaseProps

export const NmxCardContainer: React.FC<NmxCardWrapProps> = ({
  shouldRender = true,
  children,
  className,
}) => {
  if (!shouldRender) return
  return <div className={cx("nmx-card__container", className)}>{children}</div>
}
