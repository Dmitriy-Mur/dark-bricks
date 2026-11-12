export type LaserBolt = {
  x: number
  y0: number
  y1: number
  node?: Path2D
}

export function makeLaser(x: number, y0: number, y1: number): LaserBolt {
  return { x, y0, y1 }
}

export function syncLaserVisual(l: LaserBolt, scene: Scene2D): void {
  if (!l.node) {
    l.node = Path2D.rect([2.4, 1], { fill: "#e02020", z: 6 })
    scene.add(l.node)
  }
  const bottom = Math.min(l.y0, l.y1)
  const top = Math.max(l.y0, l.y1)
  const span = Math.max(1, top - bottom)
  l.node.position = new Vec2(l.x, bottom + span / 2)
  l.node.scale = new Vec2(1, span)
}

export function freeLaser(l: LaserBolt): void {
  l.node?.destroy()
  l.node = undefined
}
