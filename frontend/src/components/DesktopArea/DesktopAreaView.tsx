import React from "react"
import type { DesktopIconData } from "./DesktopArea.types"
import { DesktopIcon } from "./DesktopIcon"

interface DesktopAreaViewProps {
  icons: DesktopIconData[]
  onIconOpen: (
    id: string,
    rect?: DOMRect,
    defaultWidth?: number,
    defaultHeight?: number,
    preferFullSize?: boolean,
  ) => void
}

export const DesktopAreaView: React.FC<DesktopAreaViewProps> = ({
  icons,
  onIconOpen,
}) => (
  <div className="nmx-desktop-area">
    <div className="nmx-desktop-area__grid">
      {icons.map((icon) => (
        <DesktopIcon key={icon.id} icon={icon} onOpen={onIconOpen} />
      ))}
    </div>
  </div>
)
