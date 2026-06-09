import { useState } from "react"
import type { WithBaseProps } from "../types"
import { cx } from "../utils"
import  { NmxIconFont, type NmxIconFontSymbol } from "./NmxIcon"

export interface NmxSegmentedGroupData<T extends string> {
  value: T
  label: string
  icon?: NmxIconFontSymbol
}

interface NmxSegmentedGroupProps<T extends string> extends WithBaseProps {
  value?: T
  defaultValue?: T
  options: NmxSegmentedGroupData<T>[]
  onChange?: (value: T) => void
  renderItem?: (
    opt: NmxSegmentedGroupData<T>,
    active: boolean,
  ) => React.ReactNode
}

export const NmxSegmentedGroup = <T extends string>({
  value,
  defaultValue,
  options,
  onChange,
  renderItem,
  className,
  shouldRender,
  ...rest
}: NmxSegmentedGroupProps<T>) => {
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? options[0]?.value,
  )

  if (shouldRender === false) {
    return null
  }

  const isControlled = value !== undefined
  const activeValue = isControlled ? value : (internalValue as T)

  const handleClick = (v: T) => {
    if (!isControlled) setInternalValue(v)
    onChange?.(v)
  }

  return (
    <div {...rest} className={cx("nmx-segmented-group", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          className={cx(
            "nmx-segmented-group__btn",
            activeValue === opt.value && "nmx-segmented-group__btn--active",
          )}
          onClick={() => handleClick(opt.value as T)}
        >
          {renderItem ? (
            renderItem(opt, activeValue === opt.value)
          ) : (
            <>
              {opt.icon && (
                <NmxIconFont
                  symbol={opt.icon}
                  className="nmx-segmented-group__icon"
                />
              )}
              {opt.label}
            </>
          )}
        </button>
      ))}
    </div>
  )
}
