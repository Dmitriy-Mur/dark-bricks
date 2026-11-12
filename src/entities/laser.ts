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
  const h = Math.max(4, Math.abs(l.y1 - l.y0))
  if (!l.node) {
    l.node = Path2D.rect([3, 1], { fill: "#d7c4a2", z: 6 })
    scene.add(l.node)
  }
  l.node.position = new Vec2(l.x, (l.y0 + l.y1) / 2)
  l.node.scale = new Vec2(1, h)
}

export function freeLaser(l: LaserBolt): void {
  l.node?.destroy()
  l.node = undefined
}
