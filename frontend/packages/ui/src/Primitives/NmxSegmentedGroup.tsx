import React from "react"
import type { WithBaseProps } from "../types"
import { cx } from "../utils"

interface NmxSegmentedGroupProps<T extends string> extends WithBaseProps {
  value?: T
  defaultValue?: T
  options: { value: T; label: string }[]
  onChange?: (value: T) => void
}

export const NmxSegmentedGroup = <T extends string>({
  value,
  defaultValue,
  options,
  onChange,
  className,
  shouldRender,
}: NmxSegmentedGroupProps<T>) => {
  if (shouldRender === false) return null

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [internalValue, setInternalValue] = React.useState(
    defaultValue ?? options[0]?.value,
  )
  const isControlled = value !== undefined
  const activeValue = isControlled ? value : (internalValue as T)

  const handleClick = (v: T) => {
    if (!isControlled) setInternalValue(v)
    onChange?.(v)
  }

  return (
    <div className={cx("nmx-segmented-group", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          className={cx(
            "nmx-segmented-group__btn",
            activeValue === opt.value && "nmx-segmented-group__btn--active",
          )}
          onClick={() => handleClick(opt.value as T)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
