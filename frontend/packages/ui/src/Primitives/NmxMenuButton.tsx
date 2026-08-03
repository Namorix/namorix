import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useListNavigation,
  useRole,
} from "@floating-ui/react"
import { NmxIconFont, type NmxIconFontSymbol } from "./NmxIcon"
import type {
  NmxSemanticColor,
  WithBaseProps,
  WithSemanticColor,
  WithVariant,
} from "../types"
import React, { useRef, useState } from "react"
import { cx, cxSemantic, cxVariant } from "../utils"

interface NmxMenuButtonDivider<T> {
  value: T
  position: "top" | "bottom"
}

export interface NmxMenuButtonOption<T = string> {
  value: T
  label: string
  semantic?: NmxSemanticColor
  icon?: NmxIconFontSymbol
}

interface NmxMenuButtonProps<T>
  extends
    WithBaseProps,
    WithSemanticColor,
    WithVariant,
    Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      "className" | "children" | "onSelect" | "disabled"
    > {
  label?: string
  options: NmxMenuButtonOption<T>[]
  filterItem?: (option: NmxMenuButtonOption<T>) => boolean
  dividerIndexes?: NmxMenuButtonDivider<T>[]
  onSelect: (value: T) => void
  disabled?: boolean
  arrowDisabled?: boolean
}

export const NmxMenuButton = <T extends string = string>({
  label,
  options,
  filterItem,
  dividerIndexes,
  onSelect,
  variant = "filled",
  semantic = "trace",
  disabled = false,
  arrowDisabled = false,
  className,
  shouldRender = true,
  children,
  ...rest
}: NmxMenuButtonProps<T>) => {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const listRef = useRef<(HTMLElement | null)[]>([])

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom-end",
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  })

  const click = useClick(context, { enabled: !disabled })
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: "menu" })
  const listNav = useListNavigation(context, {
    listRef,
    activeIndex,
    onNavigate: setActiveIndex,
    loop: true,
  })

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
    [click, dismiss, role, listNav],
  )

  const referenceProps = getReferenceProps({
    ...rest,
    onClick(e: React.MouseEvent<HTMLButtonElement>) {
      e.stopPropagation()
      rest.onClick?.(e)
    },
  })

  const filteredOptions = options.filter((opt) => filterItem?.(opt) ?? true)

  const handleSelect = (opt: NmxMenuButtonOption<T>) => {
    onSelect(opt.value)
    setOpen(false)
  }

  if (!shouldRender) return null

  return (
    <>
      <button
        {...rest}
        ref={(node) => refs.setReference(node)}
        type="button"
        disabled={disabled}
        className={cx(
          "nmx-button",
          {
            "nmx-menu-button--open": open,
            "nmx-menu-button__trigger": !arrowDisabled,
          },
          cxVariant("nmx-button", variant),
          cxSemantic("nmx-button", semantic),
          className,
        )}
        {...referenceProps}
        data-row-action
      >
        {children ?? label}
      </button>
      {open && (
        <FloatingPortal>
          <div
            ref={(node) => {
              refs.setFloating(node)
            }}
            style={floatingStyles}
            className="nmx-menu-button__dropdown"
            {...getFloatingProps()}
          >
            {filteredOptions.map((opt, i) => {
              const divider = dividerIndexes?.find((d) => d.value === opt.value)
              const showTopDivider = divider?.position === "top" && i > 0
              const showBottomDivider =
                divider?.position === "bottom" && i < filteredOptions.length - 1

              return (
                <React.Fragment key={opt.value}>
                  {showTopDivider && (
                    <div className="nmx-menu-button__divider" />
                  )}

                  <button
                    type="button"
                    ref={(el) => {
                      listRef.current[i] = el
                    }}
                    className={cx(
                      "nmx-button__content",
                      "nmx-menu-button__item",
                      {
                        "nmx-menu-button__item--active": i === activeIndex,
                        "nmx-button__semantic":
                          typeof opt.semantic !== "undefined",
                      },
                      cxSemantic("nmx-button", opt.semantic),
                    )}
                    {...getItemProps({
                      onClick: (e) => {
                        e.stopPropagation()
                        handleSelect(opt)
                      },
                    })}
                    role="menuitem"
                  >
                    {opt.icon && (
                      <NmxIconFont
                        symbol={opt.icon}
                        className="nmx-menu-button__item-icon"
                      />
                    )}
                    <span>{opt.label}</span>
                  </button>

                  {showBottomDivider && (
                    <div className="nmx-menu-button__divider" />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
