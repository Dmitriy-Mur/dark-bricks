import { BALANCE } from "../config/balance"

type Mote = {
  node: Path2D
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

const motes: Mote[] = []

export type Shake = { t: number }

export const shake: Shake = { t: 0 }

export function triggerShake(): void {
  shake.t = BALANCE.SHAKE_MS / 1000
}

/** Offset in world units so the jolt stays about SHAKE_PX on screen. */
export function shakeOffset(zoom: number): { x: number; y: number } {
  if (shake.t <= 0) return { x: 0, y: 0 }
  const k = shake.t / (BALANCE.SHAKE_MS / 1000)
  const px = BALANCE.SHAKE_PX * k
  const world = px / Math.max(0.2, zoom)
  return { x: (Math.random() - 0.5) * 2 * world, y: (Math.random() - 0.5) * 2 * world }
}

export function tickShake(dt: number): void {
  if (shake.t > 0) shake.t -= dt
}

export function spawnBurst(scene: Scene2D, x: number, y: number, color: string, count = 8, speed = 70): void {
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.4
    const s = speed * (0.45 + Math.random() * 0.7)
    const node = Path2D.circle(2 + Math.random() * 2.2, { fill: color, z: 7 })
    node.position = new Vec2(x, y)
    scene.add(node)
    motes.push({ node, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.28 + Math.random() * 0.2 })
  }
}

export function updateBursts(dt: number): void {
  for (let i = motes.length - 1; i >= 0; i--) {
    const m = motes[i]
    m.life -= dt
    m.x += m.vx * dt
    m.y += m.vy * dt
    m.vy -= 90 * dt
    m.node.position = new Vec2(m.x, m.y)
    m.node.scale = Math.max(0.2, m.life * 3)
    if (m.life <= 0) {
      m.node.destroy()
      motes.splice(i, 1)
    }
  }
}

export function clearBursts(): void {
  for (const m of motes) m.node.destroy()
  motes.length = 0
  shake.t = 0
}
