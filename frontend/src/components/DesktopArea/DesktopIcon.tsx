import type { DesktopIconData } from "./DesktopArea.types"
import React, { useRef } from "react"
import { NmxIconSvg } from "@namorix/ui"

interface DesktopIconProps {
  icon: DesktopIconData
  onOpen: (
    id: string,
    rect?: DOMRect,
    defaultWidth?: number,
    defaultHeight?: number,
    preferFullSize?: boolean,
  ) => void
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({ icon, onOpen }) => {
  const btnRef = useRef<HTMLButtonElement>(null)

  return (
    <button
      ref={btnRef}
      className="nmx-desktop-area__item"
      type="button"
      onDoubleClick={() => {
        const rect = btnRef.current?.getBoundingClientRect()
        onOpen(
          icon.id,
          rect,
          icon.defaultWidth,
          icon.defaultHeight,
          icon.preferFullSize,
        )
      }}
    >
      <NmxIconSvg symbol={icon.icon} className="nmx-desktop-area__icon" />
      <span className="nmx-desktop-area__icon-label">{icon.label}</span>
    </button>
  )
}
