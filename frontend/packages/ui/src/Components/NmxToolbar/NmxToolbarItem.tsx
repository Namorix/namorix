import React from "react"
import { NmxIconFont } from "../../Primitives"
import { cx } from "../../utils"
import type { NmxToolbarItemProps } from "./NmxToolbar.types"

export const NmxToolbarItem: React.FC<NmxToolbarItemProps> = ({
  icon,
  label,
  active = false,
  disabled = false,
  onClick,
  shouldRender = true,
  className,
  style,
  ...rest
}) => {
  if (!shouldRender) return null

  return (
    <button
      {...rest}
      role="tab"
      aria-selected={active}
      disabled={disabled}
      className={cx(
        "nmx-toolbar-item",
        { "nmx-toolbar-item--active": active },
        className,
      )}
      style={style}
      onClick={onClick}
    >
      {icon && (
        <NmxIconFont
          symbol={icon}
          aria-hidden="true"
          className="nmx-toolbar-item__icon"
        />
      )}
      <span className="nmx-toolbar-item__label">{label}</span>
    </button>
  )
}
