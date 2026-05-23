import React, { useRef, useState } from "react"
import { cx } from "../utils"
import type { WithBaseProps } from "../types"

interface NmxTagInputProps extends WithBaseProps {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
  maxTags?: number
  caseSensitive?: boolean
}

export const NmxTagInput: React.FC<NmxTagInputProps> = ({
  value,
  onChange,
  suggestions = [],
  placeholder,
  maxTags,
  caseSensitive = false,
  shouldRender = true,
  className,
}) => {
  const [input, setInput] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  if (!shouldRender) return null

  const filtered = input
    ? suggestions.filter((s) => {
        const match = caseSensitive
          ? s.includes(input)
          : s.toLowerCase().includes(input.toLowerCase())
        return match && !value.includes(s)
      })
    : []

  const totalItems = (input ? 1 : 0) + filtered.length

  const createTag = (tag: string | undefined) => {
    if (!tag) return

    const trimmed = tag.trim()
    if (!trimmed || value.includes(trimmed)) return
    if (maxTags !== undefined && value.length >= maxTags) return

    onChange([...value, trimmed])
    setInput("")
    setShowDropdown(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0))
      return
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1))
      return
    }

    if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
      e.preventDefault()
      if (activeIndex === 0 && input) {
        createTag(input)
      } else if (activeIndex > 0 && filtered[activeIndex - 1]) {
        createTag(filtered[activeIndex - 1])
      } else if (input) {
        createTag(input)
      }
      return
    }

    if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1))
      return
    }

    if (e.key === "Escape") {
      setShowDropdown(false)
      setActiveIndex(-1)
      return
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    setShowDropdown(true)
    setActiveIndex(0)
  }

  return (
    <div className={cx("nmx-tag-input", className)}>
      <div className="nmx-tag-input__scroller-wrap">
        <div className="nmx-tag-input__scroller">
          {value.map((tag) => (
            <span key={tag} className="nmx-tag-input__tag">
              <span>{tag}</span>
              <button
                type="button"
                className="nmx-tag-input__remove"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
          <div className="nmx-tag-input__wrapper">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder={value.length === 0 ? placeholder : undefined}
              className="nmx-tag-input__input"
            />
          </div>
        </div>
      </div>
      {showDropdown && totalItems > 0 && (
        <div className="nmx-tag-input__dropdown">
          {input && (
            <div
              className={cx("nmx-tag-input__option", {
                "nmx-tag-input__option--active": activeIndex === 0,
              })}
              onMouseDown={() => createTag(input)}
            >
              Create &quot;{input}&quot;
            </div>
          )}
          {filtered.map((s, i) => (
            <div
              key={s}
              className={cx("nmx-tag-input__option", {
                "nmx-tag-input__option--active": activeIndex === i + 1,
              })}
              onMouseDown={() => createTag(s)}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
