import React, { useContext } from "react"
import { cx } from "../../utils"
import { NmxTabContext } from "../NmxTabContext"
import type { NmxBottomNavigationBarProps } from "./NmxBottomNavigationBar.types"
import { NmxBottomNavigationBarItem } from "./NmxBottomNavigationBarItem"

export const NmxBottomNavigationBar: React.FC<
  NmxBottomNavigationBarProps
> = ({
  items,
  t,
  activeKey: explicitActiveKey,
  onActiveTabChange: explicitOnChange,
  shouldRender = true,
  className,
  ...rest
}) => {
  const ctx = useContext(NmxTabContext)
  const activeKey = explicitActiveKey ?? ctx?.activeTab ?? ""
  const onActiveTabChange = explicitOnChange ?? ctx?.setActiveTab ?? (() => {})

  if (!shouldRender) return null

  return (
    <nav
      {...rest}
      role="tablist"
      className={cx("nmx-bottom-nav", className)}
    >
      {items?.map((item) => (
        <NmxBottomNavigationBarItem
          key={item.key}
          icon={item.icon}
          label={!t ? item.label : t(item.label)}
          ariaLabel={item.ariaLabel}
          active={activeKey === item.key}
          disabled={item.disabled}
          onClick={() => onActiveTabChange(item.key)}
        />
      ))}
    </nav>
  )
}
