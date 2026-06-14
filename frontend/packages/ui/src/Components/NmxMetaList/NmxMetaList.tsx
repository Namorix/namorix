import type { WithBaseProps } from "../../types"
import React from "react"
import { cx } from "../../utils"

interface NmxMetaListProps extends WithBaseProps {
  contained?: boolean
}

export const NmxMetaList: React.FC<NmxMetaListProps> = ({
  contained = false,
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
        { "nmx-meta-list--contained": contained },
        className,
      )}
    >
      {children}
    </div>
  )
}
