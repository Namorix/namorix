import { useEffect, useReducer, useRef, useState } from "react"

type MountedAction<T> = { type: "add"; tab: T } | { type: "remove"; tabs: T[] }

function mountedReducer<T>(state: Set<T>, action: MountedAction<T>): Set<T> {
  switch (action.type) {
    case "add": {
      if (state.has(action.tab)) return state
      return new Set(state).add(action.tab)
    }

    case "remove": {
      if (action.tabs.length === 0) return state
      const next = new Set(state)
      action.tabs.forEach((t) => next.delete(t))
      return next
    }
  }
}

export function useTabCache<T extends string>(defaultTab: T, idleMs = 0) {
  const [activeTab, setActiveTab] = useState<T>(defaultTab)
  const [mountedSet, dispatch] = useReducer(
    mountedReducer<T>,
    new Set<T>([defaultTab]),
  )
  const lastActiveRef = useRef<Partial<Record<T, number>>>({})

  useEffect(() => {
    lastActiveRef.current[activeTab] = Date.now()
    dispatch({ type: "add", tab: activeTab })
  }, [activeTab])

  useEffect(() => {
    if (idleMs <= 0) {
      return
    }

    const interval = setInterval(
      () => {
        const now = Date.now()
        const toRemove = [...mountedSet].filter((tab) => {
          if (tab === activeTab) return false
          return now - (lastActiveRef.current[tab] ?? 0) > idleMs
        })

        if (toRemove.length > 0) {
          dispatch({ type: "remove", tabs: toRemove })
        }
      },
      Math.min(idleMs, 60_000),
    )

    return () => clearInterval(interval)
  }, [activeTab, idleMs, mountedSet])

  return {
    activeTab,
    setActiveTab,
    isMounted: (tab: T) => mountedSet.has(tab),
  }
}
