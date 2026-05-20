import { createContext, useContext } from "react"

export const NmxHostContext = createContext<"shell" | null>(null)
export const useIsWindowed = () => useContext(NmxHostContext) === "shell"
