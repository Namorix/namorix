import type { WithBaseProps } from "../../types"
import type { NmxIconSvgSymbol } from "./NmxIconSvg.types"
import React, { useState } from "react"
import { cx } from "../../utils"

interface NmxIconSvgProps extends WithBaseProps {
  symbol?: NmxIconSvgSymbol
  src?: string
}

export const NmxIconSvg: React.FC<NmxIconSvgProps> = ({
  symbol,
  src,
  className,
  shouldRender = true,
}) => {
  const [imgError, setImgError] = useState(false)

  if (!shouldRender) {
    return
  }

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt=""
        className={cx("nmx-icon-svg", "icon", className)}
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <span
      className={cx("nmx-icon-svg", "symbol", className)}
      style={
        {
          "--nmx-icon-src": `var(--nmx-icon-${symbol})`,
        } as React.CSSProperties
      }
      aria-hidden="true"
    ></span>
  )
}
