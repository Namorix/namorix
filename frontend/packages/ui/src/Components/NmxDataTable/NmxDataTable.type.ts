import React from "react"
import type { WithBaseProps } from "../../types"

export type NmxDataTableAlignType = "start" | "center" | "end"

export type NmxDataTableBreakpoint = "sm" | "md" | "lg" | "xl"

export interface NmxDataTableColumn<T = unknown> {
  header: string
  renderCell: (row: T, rowIndex: number) => React.ReactNode
  grow?: number
  hideBelow?: NmxDataTableBreakpoint
  alignHeader?: NmxDataTableAlignType
  alignCell?: NmxDataTableAlignType
  disableEllipsisHeader?: boolean
  disableEllipsisCell?: boolean
  enableUserSelectCell?: boolean
}

export interface NmxDataTableFallback {
  condition: boolean | undefined | null | unknown
  state?: "loading" | "error" | "empty"
  content?: React.ReactNode
}

export interface NmxDataTableProps<T = unknown> extends WithBaseProps {
  columns: ReadonlyArray<NmxDataTableColumn<T>>
  rows: readonly T[]
  fallbackConditions?: NmxDataTableFallback[]
  clickableRows?: boolean
  disableAutoCellSize?: boolean
  getRowClass?: (row: T, rowIndex: number) => string | undefined
  onRowClick?: (row: T, rowIndex: number) => void
  headerClass?: string
  rowClass?: string
}
