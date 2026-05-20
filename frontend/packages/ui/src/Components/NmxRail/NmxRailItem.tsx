import React, { useContext } from "react"
import { NmxIconFont } from "../../Primitives"
import { cx } from "../../utils"
import { NmxRailContext } from "./NmxRailContext"
import type { NmxRailItemProps } from "./NmxRail.types"

export const NmxRailItem: React.FC<NmxRailItemProps> = ({
  icon,
  label,
  active = false,
  onClick,
  shouldRender = true,
  className,
  ...rest
}) => {
  const context = useContext(NmxRailContext)

  const handleClick = () => {
    onClick?.()
    if (active && context.collapseOnActiveClick) {
      context.toggleCollapsed()
    }
  }

  if (!shouldRender) {
    return null
  }

  return (
    <div
      className={cx(
        "nmx-rail-item",
        { "nmx-rail-item--active": active },
        className,
      )}
      onClick={handleClick}
    >
      <button
        {...rest}
        className="nmx-rail-item__btn"
        role="tab"
        aria-selected={active}
      >
        <NmxIconFont
          symbol={icon}
          aria-hidden="true"
          className="nmx-rail-item__icon"
        />
      </button>
      <span className="nmx-rail-item__label">{label}</span>
    </div>
  )
}
