import React, { memo } from "react"
import { useWindowsStore } from "../../stores"
import { WindowFrame } from "../WindowFrame"
import { useShallow } from "zustand/react/shallow"

const MemoWindowFrame = memo(WindowFrame)

export const WindowManager: React.FC = () => {
  const windows = useWindowsStore(useShallow((state) => state.windows))

  return (
    <>
      {windows.map((win) => (
        <MemoWindowFrame key={win.id} win={win} />
      ))}
    </>
  )
}
