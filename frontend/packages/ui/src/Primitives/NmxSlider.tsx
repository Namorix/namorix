import React from "react"
import { cx } from "../utils"
import type { WithBaseProps } from "../types"

interface NmxSliderProps extends WithBaseProps {
  value?: number
  defaultValue?: number
  min: number
  max: number
  step?: number
  showValue?: boolean
  onChange?: (value: number) => void
}

export const NmxSlider: React.FC<NmxSliderProps> = ({
  value,
  defaultValue,
  min,
  max,
  step = 1,
  showValue = false,
  onChange,
  className,
  shouldRender,
}) => {
  if (shouldRender === false) return null

  const [internalValue, setInternalValue] = React.useState(defaultValue ?? min)
  const isControlled = value !== undefined
  const displayValue = isControlled ? value : internalValue

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    if (!isControlled) setInternalValue(v)
    onChange?.(v)
  }

  return (
    <div className={cx("nmx-slider", className)}>
      <input
        type="range"
        className="nmx-slider__input"
        value={displayValue}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
      />
      {showValue && <span className="nmx-slider__value">{displayValue}px</span>}
    </div>
  )
}
