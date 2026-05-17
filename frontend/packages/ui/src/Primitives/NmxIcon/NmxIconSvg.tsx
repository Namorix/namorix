import type { WithBaseProps } from "../../types"
import type { NmxIconSvgSymbol } from "./NmxIconSvg.types"
import React from "react"
import { cx } from "../../utils"

interface NmxIconSvgProps extends WithBaseProps {
  symbol?: NmxIconSvgSymbol
}

export const NmxIconSvg: React.FC<NmxIconSvgProps> = ({
  symbol,
  className,
  shouldRender = true,
}) => {
  if (!shouldRender) {
    return
  }

  return (
    <span
      className={cx("nmx-icon-svg", className)}
      style={
        {
          "--nmx-icon-src": `var(--nmx-icon-${symbol})`,
        } as React.CSSProperties
      }
      aria-hidden="true"
    ></span>
  )
}
