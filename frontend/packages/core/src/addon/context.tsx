import React, { createContext, useContext } from "react"
import type { AddonContext } from "./types"

const AddonCxt = createContext<AddonContext | null>(null)

export function AddonContextProvider({
  value,
  children,
}: {
  value: AddonContext
  children: React.ReactNode
}) {
  return <AddonCxt.Provider value={value}>{children}</AddonCxt.Provider>
}

export function useAddonContext(): AddonContext {
  const ctx = useContext(AddonCxt)
  if (!ctx) {
    throw new Error("useAddonContext must be used inside defineAddon")
  }
  return ctx
}
