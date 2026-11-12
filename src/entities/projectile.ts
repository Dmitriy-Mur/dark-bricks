import type { Aabb } from "./paddle"

export type ProjectileEntity = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  node?: Path2D
}

let projId = 1

export function makeProjectile(x: number, y: number, vx: number, vy: number): ProjectileEntity {
  return { id: projId++, x, y, vx, vy }
}

export function syncProjectileVisual(p: ProjectileEntity, scene: Scene2D): void {
  if (!p.node) {
    p.node = Path2D.polygon(
      [
        [0, 12],
        [-7, -8],
        [7, -8],
      ],
      { fill: "#8e1c1c", stroke: { width: 1, color: "#2a0808" }, z: 6 },
    )
    scene.add(p.node)
  }
  p.node.position = new Vec2(p.x, p.y)
  p.node.rotation = (Math.atan2(p.vy, p.vx) * 180) / Math.PI - 90
}

export function projectileBounds(p: ProjectileEntity): Aabb {
  return { left: p.x - 8, right: p.x + 8, top: p.y + 12, bottom: p.y - 8 }
}

export function freeProjectile(p: ProjectileEntity): void {
  p.node?.destroy()
  p.node = undefined
}
