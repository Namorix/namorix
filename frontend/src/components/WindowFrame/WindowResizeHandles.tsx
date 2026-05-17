import React, { memo } from "react"

const EDGES = ["n", "s", "e", "w", "ne", "nw", "se", "sw"] as const
export const WindowResizeHandles = memo(
  ({
    onResizeStart,
  }: {
    onResizeStart: React.MouseEventHandler<HTMLDivElement>
  }) => (
    <>
      {EDGES.map((edge) => (
        <div
          key={edge}
          data-edge={edge}
          className={`nmx-window-frame__resize-handle nmx-window-frame__resize-handle-${edge}`}
          onMouseDown={onResizeStart}
        />
      ))}
    </>
  ),
)

WindowResizeHandles.displayName = "WindowResizeHandles"
