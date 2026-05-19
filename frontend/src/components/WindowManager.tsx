import React, { memo } from "react"
import { WindowFrame } from "./WindowFrame"
import { selectorWindowOrder, useAppSelector } from "../store"

const MemoWindowFrame = memo(WindowFrame)

export const WindowManager: React.FC = () => {
  const order = useAppSelector(selectorWindowOrder)

  return (
    <>
      {order.map((id) => (
        <MemoWindowFrame key={id} winId={id} />
      ))}
    </>
  )
}
