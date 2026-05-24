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
  const [activeIndex, setActiveIndex] = useState(-1)
  const [showDropdown, setShowDropdown] = useState(false)
  const [internalValue, setInternalValue] = useState("")
  const resolvedValue = value ?? internalValue
  const usedKeys =
    suggestions
      ?.filter((s) => resolvedValue.includes(s.key))
      .map((s) => s.key) ?? []

  const insertSuggestion = React.useCallback(
    (suggestionKey: string) => {
      const prefix = resolvedValue && !resolvedValue.endsWith(" ") ? " " : ""
      const newVal = resolvedValue + prefix + suggestionKey
      setInternalValue(newVal)
      onChange?.(newVal)
      setActiveIndex(-1)
      setShowDropdown(false)
    },
    [resolvedValue, onChange],
  )

  if (!shouldRender) return null

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestions) return

    switch (e.key) {
      case "ArrowDown":
        if (!showDropdown) return
        e.preventDefault()
        setActiveIndex((prev) => {
          let next = prev < suggestions.length - 1 ? prev + 1 : 0
          let attempts = 0
          while (
            usedKeys.includes(suggestions[next]?.key ?? "") &&
            attempts < suggestions.length
          ) {
            next = next < suggestions.length - 1 ? next + 1 : 0
            attempts++
          }
          return next
        })
        break

      case "ArrowUp":
        if (!showDropdown) return
        e.preventDefault()
        setActiveIndex((prev) => {
          let next = prev > 0 ? prev - 1 : suggestions.length - 1
          let attempts = 0
          while (
            usedKeys.includes(suggestions[next]?.key ?? "") &&
            attempts < suggestions.length
          ) {
            next = next > 0 ? next - 1 : suggestions.length - 1
            attempts++
          }
          return next
        })
        break

      case "Enter":
        if (
          activeIndex >= 0 &&
          suggestions &&
          activeIndex < suggestions.length
        ) {
          const s = suggestions[activeIndex]
          if (!s || usedKeys.includes(s.key)) break
          e.preventDefault()
          insertSuggestion(s.key)
        }
        break
    }
  }

  const handleChange = (v: string) => {
    onChange?.(v)
    if (value === undefined) setInternalValue(v)
    setShowDropdown(true)
  }

  return (
    <div className={cx("nmx-search-input-wrapper", className)}>
      <div
        className="nmx-search-input"
        onFocus={() => {
          setShowDropdown(true)
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setShowDropdown(false)
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
            if (e.key === "Enter") {
              e.preventDefault()
              setShowDropdown(false)
              onSubmit?.(resolvedValue)
            } else if (e.key === "Escape") {
              e.preventDefault()
              e.currentTarget.blur()
              setActiveIndex(-1)
            }
          }}
        />
        {resolvedValue && (
          <button
            type="button"
            className="nmx-search-input__clear"
            onClick={() => handleChange("")}
          >
            <NmxIconFont symbol={NmxIconFontSymbol.CLOSE} />
          </button>
        )}
        {showDropdown && (
          <div
            className="nmx-search-input__dropdown"
            onMouseLeave={() => setActiveIndex(-1)}
          >
            {suggestions &&
              suggestions.map((s, i) => {
                const disabled = usedKeys.includes(s.key)
                return (
                  <div
                    key={s.key}
                    className={cx("nmx-search-input__suggestion", {
                      "nmx-search-input__suggestion--active": i === activeIndex,
                      "nmx-search-input__suggestion--disabled": disabled,
                    })}
                    onMouseDown={(e) => {
                      if (disabled) return
                      e.preventDefault()
                      insertSuggestion(s.key)
                    }}
                    onMouseEnter={() => {
                      if (!disabled) setActiveIndex(i)
                    }}
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
                )
              })}
          </div>
        )}
      </div>
      <button
        type="button"
        className="nmx-search-input__submit"
        onClick={() => {
          onSubmit?.(resolvedValue)
          setShowDropdown(false)
        }}
      >
        <NmxIconFont symbol={NmxIconFontSymbol.ENTER} />
      </button>
    </div>
  )
}
