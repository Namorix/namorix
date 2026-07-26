import { useState } from "react"
import type { WithBaseProps } from "../types"
import { cx } from "../utils"

export interface NmxTab<T> {
  value: T
  label: string
}

interface NmxTabsProps<T> extends WithBaseProps {
  value?: string
  defaultValue?: string
  tabs: NmxTab<T>[]
  onChange?: (value: T) => void
}

export const NmxTabs = <T extends string = string>({
  value,
  defaultValue,
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
    <div {...rest} className={cx("nmx-tabs", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={cx(
            "nmx-tabs__tab",
            activeValue === tab.value && "nmx-tabs__tab--active",
          )}
          onClick={() => handleClick(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
