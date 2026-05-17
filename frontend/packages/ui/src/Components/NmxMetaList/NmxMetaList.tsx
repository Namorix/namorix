import type { WithBaseProps } from "../../types"
import React from "react"
import { cx } from "../../utils"

type NmxMetaListProps = WithBaseProps

export const NmxMetaList: React.FC<NmxMetaListProps> = ({
  shouldRender = true,
  children,
  className,
  ...rest
}) => {
  if (!shouldRender) {
    return
  }

  return (
    <div {...rest} className={cx("nmx-meta-list", className)}>
      {children}
    </div>
  )
}
