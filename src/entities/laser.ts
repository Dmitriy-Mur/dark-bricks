export type LaserBolt = {
  x: number
  y0: number
  y1: number
  glow?: Path2D
  core?: Path2D
}

export function makeLaser(x: number, y0: number, y1: number): LaserBolt {
  return { x, y0, y1 }
}

function segment(l: LaserBolt): [number, number][] {
  const y0 = Math.min(l.y0, l.y1)
  const y1 = Math.max(l.y0, l.y1)
  return [
    [l.x, y0],
    [l.x, y1],
  ]
}

/** A line in world space from the paddle to the stop point. Points, not a scaled stub. */
export function syncLaserVisual(l: LaserBolt, scene: Scene2D): void {
  const pts = segment(l)
  if (!l.glow) {
    l.glow = Path2D.line(pts, { width: 6, color: "#ff241ccc", cap: "butt", units: "px" }, { z: 8 })
    l.core = Path2D.line(pts, { width: 2, color: "#fff4f2", cap: "butt", units: "px" }, { z: 9 })
    scene.add(l.glow, l.core)
    return
  }
  l.glow.points = pts
  if (l.core) l.core.points = pts
}

export function freeLaser(l: LaserBolt): void {
  l.glow?.destroy()
  l.core?.destroy()
  l.glow = undefined
  l.core = undefined
}
