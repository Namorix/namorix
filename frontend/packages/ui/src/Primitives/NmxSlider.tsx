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
  unit?: string
  onChange?: (value: number) => void
}

export const NmxSlider: React.FC<NmxSliderProps> = ({
  value,
  defaultValue,
  min,
  max,
  step = 1,
  showValue = false,
  unit = "",
  onChange,
  className,
  shouldRender,
  ...rest
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? min)

  if (shouldRender === false) {
    return null
  }

  const isControlled = value !== undefined
  const displayValue = isControlled ? value : internalValue

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    if (!isControlled) setInternalValue(v)
    onChange?.(v)
  }

  const percent = ((displayValue - min) / (max - min)) * 100

  return (
    <div
      {...rest}
      className={cx(
        "nmx-slider",
        { "nmx-slider--with-value": showValue },
        className,
      )}
    >
      {showValue && (
        <div
          className="nmx-slider__bubble"
          style={{ left: `calc(${percent}% * (100% - 18px) / 100% + 9px)` }}
        >
          {displayValue}
          {unit}
        </div>
      )}
      <input
        type="range"
        className="nmx-slider__input"
        value={displayValue}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
      />
    </div>
  )
}
