import type { NmxIconFontSymbol } from "./NmxIconFont.types"
import type { WithBaseProps } from "../../types"
import React from "react"
import { cx } from "../../utils"

interface NmxIconFontProps extends WithBaseProps {
  symbol: NmxIconFontSymbol
  onClick?: (e: React.MouseEvent) => void
}

export const NmxIconFont: React.FC<NmxIconFontProps> = ({
  symbol,
  onClick,
  shouldRender = true,
  className,
  ...rest
}) => {
  if (!shouldRender) {
    return
  }

  return (
    <span
      {...rest}
      className={cx("nmx-icon-font", symbol, className)}
      aria-hidden="true"
      onClick={onClick}
    ></span>
  )
}
