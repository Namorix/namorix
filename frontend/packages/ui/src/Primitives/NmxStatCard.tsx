import type { NmxSemanticColor, WithBaseProps } from "../types"
import React, { useEffect, useMemo, useRef } from "react"
import { cx, cxSemantic, drawSparkline } from "../utils"
import { NmxIconFont, type NmxIconFontSymbol } from "./NmxIcon"

export interface Threshold {
  value: number
  semantic: NmxSemanticColor
}

export interface NmxStatCardProps extends WithBaseProps {
  label: string
  description?: string
  value: string | number | null | undefined
  icon?: NmxIconFontSymbol
  unit?: string
  semantic?: NmxSemanticColor
  trend?: {
    value: string
    direction: "up" | "down" | "neutral"
  }
  sparkData?: number[]
  thresholdEnabled?: boolean
  thresholds?: Threshold[]
}

const DEFAULT_THRESHOLDS: Threshold[] = [
  { value: 50, semantic: "success" },
  { value: 80, semantic: "warning" },
  { value: 100, semantic: "error" },
]

export const NmxStatCard: React.FC<NmxStatCardProps> = ({
  label,
  description,
  value,
  icon,
  unit,
  semantic = "primary",
  trend,
  sparkData,
  thresholdEnabled = false,
  thresholds = DEFAULT_THRESHOLDS,
  shouldRender = true,
  className,
  ...rest
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const resolvedColor = useMemo(() => {
    if (!thresholdEnabled || !thresholds || value == null) {
      return semantic
    }

    const num = typeof value === "number" ? value : parseFloat(value)
    if (isNaN(num)) return semantic

    const matched = [...thresholds]
      .sort((a, b) => a.value - b.value)
      .find((t) => num <= t.value)
    return matched?.semantic ?? semantic
  }, [thresholdEnabled, thresholds, value, semantic])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const draw = () => {
      if (!sparkData || sparkData.length === 0) {
        return
      }

      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      const width = canvas.clientWidth ?? rect.width
      const height = canvas.clientHeight ?? rect.height

      if (width === 0 || height === 0) return

      canvas.width = width * dpr
      canvas.height = height * dpr

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        return
      }

      ctx.scale(dpr, dpr)

      const accent =
        getComputedStyle(canvas)
          .getPropertyValue(cxSemantic("--nmx-color", resolvedColor, false))
          .trim() ||
        getComputedStyle(document.documentElement)
          .getPropertyValue("--nmx-color-primary")
          .trim()

      drawSparkline(ctx, sparkData, accent, width, height)
    }

    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [resolvedColor, semantic, sparkData])

  if (!shouldRender) {
    return null
  }

  const displayValue =
    value === null || value === undefined ? "-" : String(value)

  return (
    <div {...rest} className={cx("nmx-stat-card", className)}>
      <div className="nmx-stat-card__header">
        {icon && <NmxIconFont symbol={icon} className="nmx-stat-card__icon" />}
        <span className="nmx-stat-card__label">{label}</span>
      </div>
      <div className="nmx-stat-card__main">
        <span className="nmx-stat-card__value">{displayValue}</span>
        {unit && <span className="nmx-stat-card__unit">{unit}</span>}
      </div>
      {description && (
        <span className="nmx-stat-card__description">{description}</span>
      )}
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
