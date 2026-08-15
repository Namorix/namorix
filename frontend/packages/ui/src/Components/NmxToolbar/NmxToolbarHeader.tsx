import React from "react"
import type { WithBaseProps } from "../../types"
import { cx } from "../../utils"
import {NmxIconFont, type NmxIconFontSymbol} from "../../Primitives"

export interface NmxToolbarHeaderProps extends WithBaseProps {
  title?: string
  icon?: NmxIconFontSymbol
  onBack?: () => void
}

export const NmxToolbarHeader: React.FC<NmxToolbarHeaderProps> = ({
  title,
  icon,
  onBack,
  shouldRender = true,
  className,
  children,
  ...rest
}) => {
  if (!shouldRender) return null

  return (
    <div {...rest} className={cx("nmx-toolbar-header", className)}>
      {(title || icon) && (
        <div className="nmx-toolbar-header__action-back">
          {icon && <NmxIconFont symbol={icon}/>}
          {title}
        </div>
      )}
      {children}
    </div>
  )
}
