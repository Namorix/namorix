import React, { useContext } from "react"
import { cx } from "../../utils"
import { NmxIconFontSymbol } from "../../Primitives"
import { NmxRailContext } from "./NmxRailContext"
import type { NmxRailListProps } from "./NmxRail.types"
import { NmxRailItem } from "./NmxRailItem"
import { useIsWindowed } from "../../context/NmxHostContext"
import { NmxTabContext } from "../NmxTabContext"

export const NmxRailList: React.FC<NmxRailListProps> = ({
  title,
  items,
  t,
  showToggle,
  shouldRender = true,
  className,
  ...rest
}) => {
  const { collapsed, toggleCollapsed } = useContext(NmxRailContext)
  const tabCtx = useContext(NmxTabContext)
  const isWindowed = useIsWindowed()
  const isToggleShowed =
    typeof showToggle === "boolean" ? showToggle : isWindowed
  const activeKey = tabCtx?.activeTab ?? ""
  const onActiveTabChange = tabCtx?.setActiveTab ?? (() => {})

  if (!shouldRender) {
    return null
  }

  return (
    <div {...rest} className={cx("nmx-rail-list", className)} role="navigation">
      <div className="nmx-rail-list__items">
        {isToggleShowed && (
          <NmxRailItem
            icon={
              !collapsed ? NmxIconFontSymbol.MENU_FOLD : NmxIconFontSymbol.MENU
            }
            label={t && title ? t(title) : !title ? "" : title}
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand" : "Collapse"}
            className="nmx-rail-item__toggle"
          />
        )}
        {items?.map((item) => (
          <NmxRailItem
            key={item.key}
            icon={item.icon}
            label={!t ? item.label : t(item.label)}
            active={activeKey === item.key}
            onClick={() => onActiveTabChange(item.key)}
          />
        ))}
      </div>
    </div>
  )
}
