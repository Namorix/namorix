import type { WithBaseProps } from "../types"
import React from "react"
import { cx } from "../utils"
import { NmxIconFont, NmxIconFontSymbol } from "./NmxIcon"
import { useTranslation } from "react-i18next"
import { NmxSelect } from "./NmxSelect"

interface NmxPaginationProps extends WithBaseProps {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  onPageChange?: (parse: number) => void
  elapsedMs?: number
}

export const NmxPagination: React.FC<NmxPaginationProps> = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  onPageChange,
  elapsedMs,
  shouldRender = true,
  className,
}) => {
  const { t } = useTranslation("core")

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
        {t("ui.pagination.showing", { from, to, total: totalItems })}
        {elapsedMs !== undefined && (
          <span className="nmx-pagination__elapsed">
            {t("ui.pagination.elapsed", { ms: elapsedMs })}
          </span>
        )}
      </span>

      <div className="nmx-pagination__actions">
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

        {pageSizeOptions && onPageSizeChange && (
          <NmxSelect
            value={String(pageSize)}
            options={pageSizeOptions.map((s) => ({
              value: String(s),
              label: String(s),
            }))}
            onChange={(v) => onPageSizeChange(Number(v))}
            className="nmx-pagination__size-wrap"
            selectClass="nmx-pagination__size-select"
          />
        )}
      </div>
    </div>
  )
}
