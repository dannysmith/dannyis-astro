/**
 * Hand-inked arrow geometry: SVG path data for an arrow from `from` to `to`,
 * drawn to read as a pen stroke rather than a vector line.
 *
 * - `shaft` is a *filled* outline around a gently bowed cubic bezier, tapering to
 *   a point at both ends and swelling in the middle. That taper is the ink.
 * - `head` is two separate strokes rather than one joined polyline, like two
 *   flicks of a pen.
 *
 * Coordinates are in the host SVG's user units — CSS pixels, with no viewBox.
 */

export interface Point {
  x: number
  y: number
}

export interface InkArrow {
  shaft: string
  head: string
}

const SAMPLES = 9
const HEAD_LENGTH = 7.5
const HEAD_SPREAD = 3.25

export function inkArrow(from: Point, to: Point): InkArrow {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy) || 1

  // Unit normal to the straight line. Pushing both control points along it bows
  // the curve; longer arrows bow more, short ones stay nearly straight.
  const nx = -dy / length
  const ny = dx / length
  const bow = Math.min(5, length * 0.08)
  const c1 = { x: from.x + dx * 0.34 + nx * bow, y: from.y + dy * 0.34 + ny * bow }
  const c2 = {
    x: from.x + dx * 0.72 + nx * bow * 0.55,
    y: from.y + dy * 0.72 + ny * bow * 0.55,
  }

  const edgeA: string[] = []
  const edgeB: string[] = []

  for (let i = 0; i < SAMPLES; i++) {
    const t = i / (SAMPLES - 1)
    const u = 1 - t

    const x = u ** 3 * from.x + 3 * u ** 2 * t * c1.x + 3 * u * t ** 2 * c2.x + t ** 3 * to.x
    const y = u ** 3 * from.y + 3 * u ** 2 * t * c1.y + 3 * u * t ** 2 * c2.y + t ** 3 * to.y

    // Tangent (first derivative), used to offset perpendicular to the curve.
    const tx = 3 * u ** 2 * (c1.x - from.x) + 6 * u * t * (c2.x - c1.x) + 3 * t ** 2 * (to.x - c2.x)
    const ty = 3 * u ** 2 * (c1.y - from.y) + 6 * u * t * (c2.y - c1.y) + 3 * t ** 2 * (to.y - c2.y)
    const tangent = Math.hypot(tx, ty) || 1

    // Zero-ish at both ends, fullest in the middle.
    const halfWidth = Math.sin(Math.PI * t) ** 0.65 * 0.75 + 0.04
    const ox = (-ty / tangent) * halfWidth
    const oy = (tx / tangent) * halfWidth

    edgeA.push(`${round(x + ox)} ${round(y + oy)}`)
    edgeB.push(`${round(x - ox)} ${round(y - oy)}`)
  }

  const shaft = `M ${edgeA.join(' L ')} L ${edgeB.reverse().join(' L ')} Z`

  // Arrowhead barbs sit back along the final segment's direction.
  const hx = to.x - c2.x
  const hy = to.y - c2.y
  const headLength = Math.hypot(hx, hy) || 1
  const backX = -hx / headLength
  const backY = -hy / headLength
  const barbA = {
    x: to.x + backX * HEAD_LENGTH - backY * HEAD_SPREAD,
    y: to.y + backY * HEAD_LENGTH + backX * HEAD_SPREAD,
  }
  const barbB = {
    x: to.x + backX * HEAD_LENGTH + backY * HEAD_SPREAD,
    y: to.y + backY * HEAD_LENGTH - backX * HEAD_SPREAD,
  }
  const tip = `${round(to.x)} ${round(to.y)}`
  const head = `M ${round(barbA.x)} ${round(barbA.y)} L ${tip} M ${tip} L ${round(barbB.x)} ${round(barbB.y)}`

  return { shaft, head }
}

const round = (n: number) => Math.round(n * 100) / 100
