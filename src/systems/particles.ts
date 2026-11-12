import { BALANCE } from "../config/balance"

type MoteMode = "puff" | "grit" | "flash"

type Mote = {
  node: Path2D
  x: number
  y: number
  vx: number
  vy: number
  life: number
  life0: number
  mode: MoteMode
  spin: number
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

function pushMote(m: Mote): void {
  motes.push(m)
}

export function spawnBurst(scene: Scene2D, x: number, y: number, color: string, count = 8, speed = 70): void {
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.4
    const s = speed * (0.45 + Math.random() * 0.7)
    const node = Path2D.circle(2 + Math.random() * 2.2, { fill: color, z: 7 })
    node.position = new Vec2(x, y)
    scene.add(node)
    const life = 0.28 + Math.random() * 0.2
    pushMote({ node, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, life0: life, mode: "puff", spin: 0 })
  }
}

/** Many small squares. Used when a brick breaks. */
export function spawnGrit(scene: Scene2D, x: number, y: number, color: string): void {
  scatterSquares(scene, x, y, color, 22, 95, 0.34)
  scatterSquares(scene, x, y, "#efe6d6", 6, 70, 0.26)
}

/** Short flash and a tight grit burst at a laser contact. */
export function spawnImpact(scene: Scene2D, x: number, y: number): void {
  const flash = Path2D.circle(6, { fill: "#ffd8d0", z: 8 })
  flash.position = new Vec2(x, y)
  scene.add(flash)
  pushMote({ node: flash, x, y, vx: 0, vy: 0, life: 0.1, life0: 0.1, mode: "flash", spin: 0 })
  scatterSquares(scene, x, y, "#e23a2a", 8, 60, 0.18)
  scatterSquares(scene, x, y, "#fff4ee", 4, 40, 0.14)
}

function scatterSquares(
  scene: Scene2D,
  x: number,
  y: number,
  color: string,
  count: number,
  speed: number,
  lifeMax: number,
): void {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2
    const s = speed * (0.35 + Math.random() * 0.75)
    const size = 2.2 + Math.random() * 1.6
    const node = Path2D.rect([size, size], { fill: color, z: 7 })
    node.position = new Vec2(x, y)
    node.rotation = Math.random() * 180
    scene.add(node)
    const life = lifeMax * (0.55 + Math.random() * 0.45)
    pushMote({
      node,
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life,
      life0: life,
      mode: "grit",
      spin: (Math.random() - 0.5) * 240,
    })
  }
}

export function updateBursts(dt: number): void {
  for (let i = motes.length - 1; i >= 0; i--) {
    const m = motes[i]
    m.life -= dt
    m.x += m.vx * dt
    m.y += m.vy * dt
    if (m.mode !== "flash") m.vy -= 90 * dt
    m.node.position = new Vec2(m.x, m.y)
    if (m.spin !== 0) m.node.rotation += m.spin * dt
    const k = Math.max(0, m.life / m.life0)
    if (m.mode === "puff") m.node.scale = Math.max(0.2, m.life * 3)
    else if (m.mode === "flash") m.node.scale = 0.7 + (1 - k) * 1.4
    else m.node.scale = 0.45 + k * 0.55
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
