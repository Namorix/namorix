import React, { useContext } from "react"
import { cx } from "../../utils"
import type { NmxToolbarListProps } from "./NmxToolbar.types"
import { NmxToolbarItem } from "./NmxToolbarItem"
import { NmxTabContext } from "../NmxTabContext"
import { useHorizontalDrag } from "../../hooks"

export const NmxToolbarList: React.FC<NmxToolbarListProps> = ({
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
  const listRef = useHorizontalDrag<HTMLDivElement>()
  const onActiveTabChange = explicitOnChange ?? ctx?.setActiveTab ?? (() => {})

  if (!shouldRender) return null

  return (
    <div
      {...rest}
      ref={listRef}
      className={cx("nmx-toolbar-list", className)}
      role="tablist"
    >
      {items?.map((item) => (
        <NmxToolbarItem
          key={item.key}
          icon={item.icon}
          label={!t ? item.label : t(item.label)}
          active={activeKey === item.key}
          disabled={item.disabled}
          onClick={() => onActiveTabChange(item.key)}
        />
      ))}
    </div>
  )
}
