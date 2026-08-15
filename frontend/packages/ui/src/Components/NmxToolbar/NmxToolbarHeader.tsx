import React from "react"
import type { WithBaseProps } from "../../types"
import { cx } from "../../utils"
import { NmxIconFont, NmxIconFontSymbol } from "../../Primitives"

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
        <div
          className={cx("nmx-toolbar-header__action-back", {
            "nmx-toolbar-header__action-back--clickable":
              typeof children !== "undefined",
          })}
          onClick={onBack}
        >
          <div className="nmx-toolbar-header__action-back__info">
            {icon && (
              <NmxIconFont
                symbol={icon}
                className="nmx-toolbar-header__action-back__icon"
              />
            )}
            <span className="nmx-toolbar-header__action-back__title">
              {title}
            </span>
          </div>
          {children && <NmxIconFont symbol={NmxIconFontSymbol.ARROW_NEXT} />}
        </div>
      )}
      {children}
    </div>
  )
}
