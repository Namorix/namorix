import type { NmxSemanticColor, WithBaseProps } from "../types"
import React, { useEffect, useRef } from "react"
import { cx, cxSemantic, drawSparkline } from "../utils"

export interface NmxStatCardProps extends WithBaseProps {
  label: string
  value: string | number | null | undefined
  unit?: string
  semantic?: NmxSemanticColor
  trend?: {
    value: string
    direction: "up" | "down" | "neutral"
  }
  sparkData?: number[]
}

export const NmxStatCard: React.FC<NmxStatCardProps> = ({
  label,
  value,
  unit,
  semantic = "info",
  trend,
  sparkData,
  shouldRender = true,
  className,
  ...rest
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!sparkData || sparkData.length === 0) {
      return
    }

    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        return
      }

      ctx.scale(dpr, dpr)

      const accent =
        getComputedStyle(canvas)
          .getPropertyValue(cxSemantic("--nmx-color", semantic, false))
          .trim() ||
        getComputedStyle(document.documentElement)
          .getPropertyValue("--nmx-color-primary")
          .trim()

      drawSparkline(ctx, sparkData, accent, rect.width, rect.height)
    }

    draw()

    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [semantic, sparkData])

  if (!shouldRender) {
    return null
  }

  const displayValue =
    value === null || value === undefined ? "-" : String(value)

  return (
    <div {...rest} className={cx("nmx-stat-card", className)}>
      <span className="nmx-stat-card__header">{label}</span>
      <div className="nmx-stat-card__main">
        <span className="nmx-stat-card__value">{displayValue}</span>
        {unit && <span className="nmx-stat-card__unit">{unit}</span>}
      </div>
      {sparkData && sparkData.length >= 1 && (
        <canvas ref={canvasRef} className="nmx-stat-card__spark" />
      )}
      {trend && (
        <span
          className={`nmx-stat-card__trend nmx-stat-card__trend--${trend.direction}`}
        >
          {trend.value}
        </span>
      )}
    </div>
  )
}
