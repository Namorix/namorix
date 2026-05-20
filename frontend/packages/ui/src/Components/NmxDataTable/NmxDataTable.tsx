import type {
  NmxDataTableAlignType,
  NmxDataTableColumn,
  NmxDataTableProps,
} from "./NmxDataTable.type"
import React from "react"
import { cx } from "../../utils"

function buildGridTemplateColumns<T>(
  cols: ReadonlyArray<NmxDataTableColumn<T>>,
): string {
  const num = cols.length
  if (num === 0) {
    return "auto"
  }

  const anyGrow = cols.some((col) => col.grow != null)
  if (!anyGrow) {
    if (num === 1) {
      return "minmax(0, 1fr)"
    }
    return `${Array.from({ length: num - 1 }, () => "auto").join(" ")} minmax(0, 1fr)`
  }
  return cols
    .map((col) => (col.grow != null ? `minmax(0, ${col.grow}fr)` : "auto"))
    .join("")
}

function alignClass(
  kind: "header" | "row",
  align?: NmxDataTableAlignType,
): string {
  return !align || align === "start"
    ? ""
    : `nmx-data-table__${kind}-cell-align-${align}`
}

export const NmxDataTable = <T extends object>({
  columns,
  rows,
  fallbackConditions,
  clickableRows = false,
  disableAutoCellSize = false,
  getRowClass,
  onRowClick,
  shouldRender = true,
  className,
  ...rest
}: NmxDataTableProps<T>) => {
  if (!shouldRender) {
    return null
  }

  const colCount = columns.length
  if (colCount === 0) {
    return <div className="nmx-data-table nmx-data-table--no-columns" />
  }

  const fallbackEntry = fallbackConditions?.find(
    (fallback) => fallback.condition,
  )
  const hasClick = clickableRows && !!onRowClick && !fallbackEntry

  const columnVars = disableAutoCellSize
    ? ({ "--nmx-data-table-columns": String(colCount) } as React.CSSProperties)
    : ({
        "--nmx-data-table-columns": String(colCount),
        gridTemplateColumns: buildGridTemplateColumns<T>(columns),
      } as React.CSSProperties)

  return (
    <div {...rest} className={cx("nmx-data-table", className)}>
      <div className="nmx-data-table__wrap" role="table" style={columnVars}>
        <div className="nmx-data-table__header-row" role="row">
          {columns.map((col, index) => (
            <div
              key={index}
              role="columnheader"
              className={cx(
                "nmx-data-table__header-cell",
                alignClass("header", col.alignHeader),
              )}
            >
              {col.header}
            </div>
          ))}
        </div>

        <div className="nmx-data-table__body-scroll" role="rowgroup">
          {fallbackEntry ? (
            <div
              className="nmx-data-table__row nmx-data-table__row-fallback-content"
              role="row"
            >
              <div
                className="nmx-data-table__cel--fallback-content"
                role="cell"
              >
                <p
                  className={`nmx-data-table__cell--fallback-content--${fallbackEntry.state ?? "default"}`}
                >
                  {fallbackEntry.content}
                </p>
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div
              className="nmx-data-table__row nmx-data-table__row--fallback-content"
              role="row"
            >
              <div
                className="nmx-data-table__row__cell--fallback-content"
                role="cell"
              />
            </div>
          ) : (
            rows.map((row, rowIndex) => {
              const extra = getRowClass?.(row, rowIndex)?.trim() ?? ""

              return (
                <div
                  key={rowIndex}
                  className={cx(
                    "nmx-data-table__row",
                    { "nmx-data-table__row--clickable": hasClick },
                    extra,
                  )}
                  role="row"
                  onClick={
                    hasClick ? () => onRowClick?.(row, rowIndex) : undefined
                  }
                >
                  {columns.map((col, colIndex) => (
                    <div
                      key={colIndex}
                      role="cell"
                      className={cx(
                        "nmx-data-table__row-cell",
                        alignClass("row", col.alignCell),
                      )}
                    >
                      {col.renderCell(row, rowIndex)}
                    </div>
                  ))}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
