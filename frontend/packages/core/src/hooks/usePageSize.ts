import { useState } from "react"
import { PaginationDefaults } from "../constants"

export function usePageSize() {
  const [pageSize, setPageSizeState] = useState(() => {
    const saved = localStorage.getItem(PaginationDefaults.storageKey)
    return saved ? Number(saved) : PaginationDefaults.defaultPageSize
  })

  const setPageSize = (size: number) => {
    localStorage.setItem(PaginationDefaults.storageKey, String(size))
    setPageSizeState(size)
  }

  return { pageSize, setPageSize, options: PaginationDefaults.pageSizeOptions }
}
