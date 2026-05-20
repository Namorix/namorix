import React from "react"
import type { WithBaseProps } from "../../types"

export type NmxDataTableAlignType = "start" | "center" | "end"

export interface NmxDataTableColumn<T = unknown> {
  header: string
  renderCell: (row: T, rowIndex: number) => React.ReactNode
  grow?: number
  alignHeader?: NmxDataTableAlignType
  alignCell?: NmxDataTableAlignType
}

export interface NmxDataTableFallback {
  condition: boolean
  state?: "loading" | "error" | "empty" | "default"
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
}
