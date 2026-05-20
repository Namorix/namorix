export function drawSparkline(
  ctx: CanvasRenderingContext2D,
  data: number[],
  color: string,
  width: number,
  height: number,
) {
  if (data.length === 0) {
    return
  }

  const plot = data.length === 1 ? [data[0]!, data[0]!] : data

  const min = Math.min(...plot)
  const max = Math.max(...plot)
  const range = max - min || 1

  const points = plot.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * height,
  }))

  // Gradient fill
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, color + "33")
  gradient.addColorStop(1, "transparent")
  ctx.fillStyle = gradient

  // Fill path
  ctx.beginPath()
  ctx.moveTo(points[0]!.x, height)
  for (const p of points) {
    ctx.lineTo(p.x, p.y)
  }
  ctx.closePath()
  ctx.fill()

  // Stroke line
  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.lineJoin = "round"
  ctx.lineCap = "round"
  ctx.moveTo(points[0]!.x, points[0]!.y)
  for (let i = 1; i < points.length; ++i) {
    ctx.lineTo(points[i]!.x, points[i]!.y)
  }
  ctx.stroke()

  // Circle markers
  for (const idx of [0, points.length - 1]) {
    const p = points[idx]!
    ctx.beginPath()
    ctx.fillStyle = color
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
    ctx.fill()
  }
}
