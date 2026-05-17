import type { WithBaseProps } from "../../types"
import type { NmxIconSvgSymbol } from "./NmxIconSvg.types"
import React from "react"
import { cx } from "../../utils"

interface NmxIconSvgProps extends WithBaseProps {
  symbol?: NmxIconSvgSymbol
  size?: number
}

export const NmxIconSvg: React.FC<NmxIconSvgProps> = ({
  symbol,
  size = 24,
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
          "--nmx-icon-size": `${size}px`,
        } as React.CSSProperties
      }
      aria-hidden="true"
    ></span>
  )
}
