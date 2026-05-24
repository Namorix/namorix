import type { WithBaseProps } from "../types"
import React, { useState } from "react"
import { cx } from "../utils"
import { NmxIconFont, NmxIconFontSymbol } from "./NmxIcon"
import { NmxFormInput } from "./NmxForm"

export interface NmxSearchSuggestion {
  key: string
  label: string
  description: string
}

interface NmxSearchInputProps extends WithBaseProps {
  ref?: React.RefObject<HTMLInputElement | null>
  value?: string
  onChange?: (value: string) => void
  onSubmit?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  suggestions?: NmxSearchSuggestion[]
}

export const NmxSearchInput = ({
  ref,
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled,
  invalid,
  suggestions,
  shouldRender = true,
  className,
}: NmxSearchInputProps) => {
  const [focused, setFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const showDropdown = focused && suggestions && suggestions.length > 0
  const [internalValue, setInternalValue] = useState("")
  const resolvedValue = value ?? internalValue

  if (!shouldRender) return null

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
        break

      case "ArrowUp":
        e.preventDefault()
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
        break

      case "Enter":
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          e.preventDefault()
          const s = suggestions[activeIndex]
          if (!s) break
          const prefix = value && !value.endsWith(" ") ? " " : ""
          onChange?.(value + prefix + s.key)
          setActiveIndex(-1)
        }
        break
    }
  }

  const handleChange = (v: string) => {
    onChange?.(v)
    if (value === undefined) setInternalValue(v)
  }

  return (
    <div className={cx("nmx-search-input-wrapper", className)}>
      <div
        className="nmx-search-input"
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setFocused(false)
            setActiveIndex(-1)
          }
        }}
        onKeyDown={handleKeyDown}
      >
        <NmxIconFont
          symbol={NmxIconFontSymbol.SEARCH}
          className="nmx-search-input__icon"
        />
        <NmxFormInput
          ref={ref}
          value={resolvedValue}
          onValueChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          invalid={invalid}
          className="nmx-search-input__control"
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Escape") {
              e.preventDefault()
              e.currentTarget.blur()
              setActiveIndex(-1)
            }
          }}
        />
        {value && (
          <button
            type="button"
            className="nmx-search-input__clear"
            onClick={() => handleChange("")}
          >
            <NmxIconFont symbol={NmxIconFontSymbol.CLOSE} />
          </button>
        )}
        {showDropdown && (
          <div className="nmx-search-input__dropdown">
            {suggestions.map((s, i) => (
              <div
                key={s.key}
                className={cx("nmx-search-input__suggestion", {
                  "nmx-search-input__suggestion--active": i === activeIndex,
                })}
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange?.(
                    value + (value && !value.endsWith(" ") ? " " : "") + s.key,
                  )
                  setActiveIndex(-1)
                }}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <span className="nmx-search-input__suggestion-key">
                  {s.key}
                </span>
                <span className="nmx-search-input__suggestion-label">
                  {s.label}
                </span>
                <span className="nmx-search-input__suggestion-desc">
                  {s.description}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        className="nmx-search-input__submit"
        onClick={() => onSubmit?.(resolvedValue)}
      >
        <NmxIconFont symbol={NmxIconFontSymbol.ENTER} />
      </button>
    </div>
  )
}
