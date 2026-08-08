import type { CurvePoint } from "@/lib/curves"

interface Props {
  points: CurvePoint[]
  width?: number
  height?: number
  color?: string
  fillOpacity?: number
  className?: string
  strokeWidth?: number
  // Optional vertical marker positions in the same units as points[i].t
  markers?: number[]
}

export function Sparkline({
  points,
  width = 96,
  height = 28,
  color = "currentColor",
  fillOpacity = 0.18,
  strokeWidth = 1.4,
  className,
  markers = [],
}: Props) {
  if (!points.length) return null
  const tMin = points[0].t
  const tMax = points[points.length - 1].t
  const tRange = tMax - tMin || 1
  const padY = 2
  const usableH = height - padY * 2

  const xy = points.map((p) => {
    const x = ((p.t - tMin) / tRange) * width
    const y = padY + (1 - p.v) * usableH
    return [x, y] as const
  })

  const linePath = xy
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ")

  const fillPath = `${linePath} L${width.toFixed(2)},${height} L0,${height} Z`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <path d={fillPath} fill={color} opacity={fillOpacity} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {markers.map((m, i) => {
        const x = ((m - tMin) / tRange) * width
        return (
          <line
            key={i}
            x1={x}
            x2={x}
            y1={0}
            y2={height}
            stroke={color}
            strokeOpacity={0.35}
            strokeWidth={0.75}
            strokeDasharray="2 2"
          />
        )
      })}
    </svg>
  )
}
