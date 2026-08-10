import type { WithBaseProps } from "../../types"
import React from "react"
import { cx } from "../../utils"

interface NmxMetaListProps extends WithBaseProps {
  contained?: boolean
  alignItem?: "start" | "end"
}

export const NmxMetaList: React.FC<NmxMetaListProps> = ({
  contained = false,
  alignItem = "start",
  shouldRender = true,
  children,
  className,
  ...rest
}) => {
  if (!shouldRender) {
    return
  }

  return (
    <div
      {...rest}
      className={cx(
        "nmx-meta-list",
        alignItem !== "start" && "nmx-meta-list--align-item--" + alignItem,
        { "nmx-meta-list--contained": contained },
        className,
      )}
    >
      {children}
    </div>
  )
}
