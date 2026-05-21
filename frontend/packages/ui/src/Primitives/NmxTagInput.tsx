import React, { useRef, useState } from "react"
import { cx } from "../utils"
import type { WithBaseProps } from "../types"

interface NmxTagInputProps extends WithBaseProps {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
  maxTags?: number
}

export const NmxTagInput: React.FC<NmxTagInputProps> = ({
  value,
  onChange,
  suggestions = [],
  placeholder,
  maxTags,
  shouldRender = true,
  className,
}) => {
  const [input, setInput] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  if (!shouldRender) return null

  const filtered = input
    ? suggestions.filter((s) => s.includes(input) && !value.includes(s))
    : []

  const createTag = (tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed || value.includes(trimmed)) return
    if (maxTags !== undefined && value.length >= maxTags) return

    onChange([...value, trimmed])
    setInput("")
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
      e.preventDefault()
      if (input) {
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
      return
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    setShowDropdown(true)
  }

  return (
    <div className={cx("nmx-tag-input", className)}>
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
        {showDropdown && (filtered.length > 0 || input) && (
          <div className="nmx-tag-input__dropdown">
            {filtered.map((s) => (
              <div
                key={s}
                className="nmx-tag-input__option"
                onMouseDown={() => createTag(s)}
              >
                {s}
              </div>
            ))}
            {input && filtered.length === 0 && (
              <div
                className="nmx-tag-input__option nmx-tag-input__option--create"
                onMouseDown={() => createTag(input)}
              >
                Create &quot;{input}&quot;
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
