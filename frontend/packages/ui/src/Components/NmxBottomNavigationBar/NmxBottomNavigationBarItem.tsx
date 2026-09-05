import React from "react"
import { NmxIconFont } from "../../Primitives"
import { cx } from "../../utils"
import type { NmxBottomNavigationBarItemProps } from "./NmxBottomNavigationBar.types"

export const NmxBottomNavigationBarItem: React.FC<
  NmxBottomNavigationBarItemProps
> = ({
  icon,
  label,
  active = false,
  disabled = false,
  ariaLabel,
  onClick,
  shouldRender = true,
  className,
  ...rest
}) => {
  if (!shouldRender) return null

  return (
    <button
      {...rest}
      type="button"
      role="tab"
      aria-selected={active}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "nmx-bottom-nav-item",
        { "nmx-bottom-nav-item--active": active },
        className,
      )}
    >
      {icon && (
        <NmxIconFont
          symbol={icon}
          aria-hidden="true"
          className="nmx-bottom-nav-item__icon"
        />
      )}
      <span className="nmx-bottom-nav-item__label">{label}</span>
    </button>
  )
}
