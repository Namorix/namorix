import React, { memo } from "react"
import { WindowFrame } from "./WindowFrame"
import { selectorZOrder, useAppSelector } from "../store"

const MemoWindowFrame = memo(WindowFrame)

export const WindowManager: React.FC = () => {
  const order = useAppSelector(selectorZOrder)

  return (
    <>
      {order.map((id) => (
        <MemoWindowFrame key={id} winId={id} />
      ))}
    </>
  )
}
