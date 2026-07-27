import React, { useRef, useState } from "react"
import type { WithBaseProps } from "../types"
import { cx } from "../utils"
import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  size,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useListNavigation,
} from "@floating-ui/react"

export interface NmxSelectData<T = string> {
  value: T
  label: string
  description?: string
}

interface NmxSelectProps<T> extends WithBaseProps {
  value?: T
  options: NmxSelectData<T>[]
  onChange?: (value: T) => void
  placeholder?: string
  disabled?: boolean
  selectClass?: string
  renderOption?: (
    option: NmxSelectData<T>,
    selected: boolean,
  ) => React.ReactNode
}

export const NmxSelect = <T extends string = string>({
  value,
  options,
  onChange,
  placeholder,
  disabled,
  renderOption,
  selectClass,
  className,
  shouldRender,
  ...rest
}: NmxSelectProps<T>) => {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const selectedOption = options.find((o) => o.value === value)
  const listRef = useRef<(HTMLElement | null)[]>([])

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(0),
      flip(),
      shift({ padding: 8 }),
      size({
        apply({ rects, availableHeight, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
            maxHeight: `${Math.min(240, availableHeight)}px`,
          })
        },
      }),
    ],
  })

  const click = useClick(context, { enabled: !disabled })
  const dismiss = useDismiss(context)
  const listNav = useListNavigation(context, {
    listRef,
    activeIndex,
    onNavigate: setActiveIndex,
    loop: true,
  })

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
    [click, dismiss, listNav],
  )

  const handleSelect = (opt: NmxSelectData<T>) => {
    onChange?.(opt.value)
    setOpen(false)
  }

  if (shouldRender === false) {
    return null
  }

  return (
    <div
      {...rest}
      className={cx("nmx-select-wrap", className, { "nmx-select--open": open })}
    >
      <button
        ref={(node) => refs.setReference(node)}
        type="button"
        className={cx("nmx-select__control", selectClass)}
        disabled={disabled}
        {...getReferenceProps()}
      >
        <span className="nmx-select__label">
          {selectedOption
            ? selectedOption.label
            : placeholder && (
                <span className="nmx-select-placeholder">{placeholder}</span>
              )}
        </span>
      </button>
      {open && (
        <FloatingPortal>
          <div
            ref={(node) => {
              refs.setFloating(node)
            }}
            style={floatingStyles}
            className="nmx-select__dropdown"
            {...getFloatingProps()}
          >
            {options.map((opt, i) => (
              <div
                key={opt.value}
                ref={(el) => {
                  listRef.current[i] = el
                }}
                className={cx("nmx-select__option", {
                  "nmx-select__option--selected": opt.value === value,
                  "nmx-select__option--active": i === activeIndex,
                })}
                {...getItemProps({
                  onClick: () => handleSelect(opt),
                })}
                role="option"
                aria-selected={opt.value === value}
              >
                {renderOption ? (
                  renderOption(opt, opt.value === value)
                ) : (
                  <>
                    <span className="nmx-select__option-label">
                      {opt.label}
                    </span>
                    {opt.description && (
                      <span className="nmx-select__option-description">
                        {opt.description}
                      </span>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </FloatingPortal>
      )}
    </div>
  )
}
