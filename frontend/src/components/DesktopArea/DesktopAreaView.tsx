import React from "react"
import { DesktopIcon } from "./DesktopIcon"
import type { AddonItem, OnOpenApp } from "../../types"

interface DesktopAreaViewProps {
  addons: AddonItem[]
  onIconOpen: OnOpenApp
}

export const DesktopAreaView: React.FC<DesktopAreaViewProps> = ({
  addons,
  onIconOpen,
}) => (
  <div className="nmx-desktop-area">
    <div className="nmx-desktop-area__grid">
      {addons.map((addon) => (
        <DesktopIcon key={addon.id} addon={addon} onOpen={onIconOpen} />
      ))}
    </div>
  </div>
)
