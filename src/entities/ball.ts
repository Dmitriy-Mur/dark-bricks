import { BALANCE } from "../config/balance"
import { colorForHp } from "../config/palette"
import { ballDamage } from "../core/state"

export type BallEntity = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  /** Bricks this ball may still pass through. Refilled only on paddle touch and respawn. */
  pierceLeft: number
  stuck: boolean
  stuckOffset: number
  /** Brick ids already resolved while still overlapping, so a pierce does not multi-hit. */
  touched: number[]
  node?: Path2D
  glow?: Path2D
}

let ballId = 1

export function makeBall(x: number, y: number): BallEntity {
  return {
    id: ballId++,
    x,
    y,
    vx: 0,
    vy: 0,
    pierceLeft: 0,
    stuck: true,
    stuckOffset: 0,
    touched: [],
  }
}

export function serveY(): number {
  return BALANCE.PADDLE_Y + BALANCE.PADDLE_H / 2 + BALANCE.BALL_RADIUS + 2
}

export function syncBallVisual(b: BallEntity, scene: Scene2D): void {
  const col = colorForHp(ballDamage())
  const r = BALANCE.BALL_RADIUS
  if (!b.node) {
    b.glow = Path2D.circle(r * 1.85, { fill: `${col}55`, z: 5 })
    b.node = Path2D.circle(r, {
      fill: col,
      stroke: { width: 2, color: "#f4f1ea" },
      z: 6,
    })
    scene.add(b.glow, b.node)
  }
  b.node.fill = col
  if (b.glow) b.glow.fill = `${col}66`
  const p = new Vec2(b.x, b.y)
  b.node.position = p
  if (b.glow) b.glow.position = p
}

export function freeBall(b: BallEntity): void {
  b.node?.destroy()
  b.glow?.destroy()
  b.node = undefined
  b.glow = undefined
}
