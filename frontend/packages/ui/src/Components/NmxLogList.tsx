import React from "react"
import type { NmxFallback, NmxSemanticColor, WithBaseProps } from "../types"
import { cx, cxSemantic } from "../utils"
import { markupToHtml } from "@namorix/core"

export interface NmxLogEntry {
  id: string | number
  time: string
  message: string
  semantic?: NmxSemanticColor
  markupToHtmlEnabled?: boolean
}

interface NmxLogListProps extends WithBaseProps {
  items: NmxLogEntry[]
  showTime?: boolean
  contained?: boolean
  fallbackConditions?: NmxFallback[]
  onItemClick?: (item: NmxLogEntry, index: number) => void
}

export const NmxLogList: React.FC<NmxLogListProps> = ({
  items,
  showTime = true,
  contained = false,
  fallbackConditions,
  onItemClick,
  shouldRender = true,
  className,
  ...rest
}) => {
  if (!shouldRender) {
    return null
  }

  const fallbackEntry = fallbackConditions?.find((f) => f.condition)

  return (
    <div
      {...rest}
      className={cx(
        "nmx-log-list",
        { "nmx-log-list--contained": contained },
        className,
      )}
    >
      {fallbackEntry ? (
        <div
          className={`nmx-log-list__fallback nmx-log-list__fallback--${fallbackEntry.state ?? "default"}`}
        >
          {fallbackEntry.content}
        </div>
      ) : (
        items.map((item, index) => (
          <div
            key={item.id}
            onClick={onItemClick ? () => onItemClick(item, index) : undefined}
            className={cx("nmx-log-list__item", {
              "nmx-log-list__item--clickable": onItemClick !== undefined,
            })}
            role={onItemClick ? "button" : undefined}
            tabIndex={onItemClick ? 0 : undefined}
            onKeyDown={
              onItemClick
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      onItemClick(item, index)
                    }
                  }
                : undefined
            }
          >
            {showTime && (
              <span className="nmx-log-list__item-time">{item.time}</span>
            )}
            {item.markupToHtmlEnabled ? (
              <span
                className={cx(
                  "nmx-log-list__item-message",
                  cxSemantic("nmx-log-list__item-message", item.semantic),
                )}
                dangerouslySetInnerHTML={{ __html: markupToHtml(item.message) }}
              />
            ) : (
              <span
                className={cx(
                  "nmx-log-list__item-message",
                  cxSemantic("nmx-log-list__item-message", item.semantic),
                )}
              >
                {item.message}
              </span>
            )}
          </div>
        ))
      )}
    </div>
  )
}
