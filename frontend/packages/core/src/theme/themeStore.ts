import { useEffect, useState } from "react"
import { NMX_THEME_CSS_PATH_KEY, NMX_THEME_STORAGE_KEY } from "../constants"

type Listener = (id: string | null) => void

let currentId: string | null = localStorage.getItem(NMX_THEME_STORAGE_KEY)
const listeners = new Set<Listener>()

export const themeStore = {
  get: () => currentId,
  set: (id: string | null, cssPath?: string) => {
    currentId = id
    if (id !== null) {
      localStorage.setItem(NMX_THEME_STORAGE_KEY, id)
    }
    if (cssPath !== undefined) {
      localStorage.setItem(NMX_THEME_CSS_PATH_KEY, cssPath)
    }
    listeners.forEach((fn) => fn(id))
  },
  subscribe: (fn: Listener): (() => void) => {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },
}

export function useThemeStore() {
  const [id, setId] = useState(themeStore.get)
  useEffect(() => themeStore.subscribe(setId), [])
  return id
}
