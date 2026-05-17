import React from "react"
import { useWindowsStore } from "../../stores"
import { WindowFrame } from "../WindowFrame"

export const WindowManager: React.FC = () => {
  const windows = useWindowsStore((state) => state.windows)

  return (
    <>
      {windows.map((win) => (
        <WindowFrame key={win.id} win={win} />
      ))}
    </>
  )
}
