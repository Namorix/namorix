import type { WithBaseProps } from "../types"
import React from "react"
import { cx } from "../utils"
import { NmxIconFont, NmxIconFontSymbol } from "./NmxIcon"

interface NmxPaginationProps extends WithBaseProps {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange?: (parse: number) => void
}

export const NmxPagination: React.FC<NmxPaginationProps> = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  shouldRender = true,
  className,
}) => {
  if (!shouldRender) {
    return null
  }

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)
  const isFirst = page <= 1
  const isLast = page >= totalPages

  return (
    <div className={cx("nmx-pagination", className)}>
      <span className="nmx-pagination__count">
        Showing {from}-{to} of {totalItems}
      </span>

      <span className="nmx-pagination__info">
        {page} / {totalPages}
      </span>

      <button
        className="nmx-pagination__btn"
        disabled={isFirst}
        onClick={() => onPageChange?.(page - 1)}
        aria-label="Previous page"
      >
        <NmxIconFont symbol={NmxIconFontSymbol.ARROW_PREV} />
      </button>

      <button
        className="nmx-pagination__btn"
        disabled={isLast}
        onClick={() => onPageChange?.(page + 1)}
        aria-label="Next page"
      >
        <NmxIconFont symbol={NmxIconFontSymbol.ARROW_NEXT} />
      </button>
    </div>
  )
}
