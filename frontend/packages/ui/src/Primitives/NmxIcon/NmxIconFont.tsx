import type { NmxIconFontSymbol } from "./NmxIconFont.types"
import type { NmxSemanticColor, NmxSpacing, WithBaseProps } from "../../types"
import React from "react"
import { cx, cxSemantic, cxSize } from "../../utils"

interface NmxIconFontProps extends WithBaseProps {
  symbol: NmxIconFontSymbol
  onClick?: (e: React.MouseEvent) => void
  size?: NmxSpacing
  semantic?: NmxSemanticColor
}

export const NmxIconFont: React.FC<NmxIconFontProps> = ({
  symbol,
  onClick,
  size = "sm",
  semantic = null,
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
      className={cx(
        "nmx-icon-font",
        symbol,
        cxSize("nmx-icon-font", size),
        semantic ? cxSemantic("nmx-icon-font", semantic) : "",
        { "nmx-icon-font--color": semantic !== null },
        className,
      )}
      aria-hidden="true"
      onClick={onClick}
    ></span>
  )
}
