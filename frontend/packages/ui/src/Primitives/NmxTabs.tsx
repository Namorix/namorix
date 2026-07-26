import { useState } from "react"
import type { WithBaseProps } from "../types"
import { cx } from "../utils"
import type { TFunction } from "@namorix/core"
import { NmxIconFont, type NmxIconFontSymbol } from "./NmxIcon"

export interface NmxTab<T> {
  value: T
  icon?: NmxIconFontSymbol
  label: string
}

interface NmxTabsProps<T> extends WithBaseProps {
  value?: string
  defaultValue?: string
  t?: TFunction
  tabs: NmxTab<T>[]
  onChange?: (value: T) => void
}

export const NmxTabs = <T extends string = string>({
  value,
  defaultValue,
  t,
  tabs,
  onChange,
  className,
  shouldRender,
  ...rest
}: NmxTabsProps<T>) => {
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? tabs[0]?.value,
  )

  if (shouldRender === false) return null

  const isControlled = value !== undefined
  const activeValue = isControlled ? value : internalValue

  const handleClick = (v: T) => {
    if (!isControlled) setInternalValue(v)
    onChange?.(v)
  }

  return (
    <div
      {...rest}
      className={cx("nmx-tabs", className)}
      data-count={tabs.length}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={cx(
            "nmx-tabs__tab",
            activeValue === tab.value && "nmx-tabs__tab--active",
          )}
          onClick={() => handleClick(tab.value)}
        >
          {tab.icon && (
            <NmxIconFont symbol={tab.icon} className="nmx-tabs__icon" />
          )}
          <span className="nmx-tabs__label">
            {!t ? tab.label : t(tab.label)}
          </span>
        </button>
      ))}
    </div>
  )
}
