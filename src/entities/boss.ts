import { BALANCE, bossStats } from "../config/balance"
import { colorForHp } from "../config/palette"
import type { Aabb } from "./paddle"

export type BossEntity = {
  index: number
  x: number
  vx: number
  hp: number
  maxHp: number
  alive: boolean
  shootTimer: number
  shootCooldown: number
  projectileSpeed: number
  phase2: boolean
  tear: number
  nodes: Path2D[]
  body?: Path2D
  barBg?: Path2D
  barFill?: Path2D
  socketL?: Path2D
  socketR?: Path2D
  irisL?: Path2D
  irisR?: Path2D
  pupilL?: Path2D
  pupilR?: Path2D
  mouth?: Path2D
  upper: Path2D[]
  lower: Path2D[]
  tearL?: Path2D
  tearR?: Path2D
}

export function bossY(): number {
  return BALANCE.FIELD_H / 2 - BALANCE.BOSS_H / 2 - 78
}

export function makeBoss(index: number, diffMult: number): BossEntity {
  const stats = bossStats(index, diffMult)
  return {
    index,
    x: 0,
    vx: stats.moveSpeed,
    hp: stats.hp,
    maxHp: stats.hp,
    alive: true,
    shootTimer: 0.8,
    shootCooldown: stats.shootCooldown,
    projectileSpeed: stats.projectileSpeed,
    phase2: false,
    tear: 0,
    nodes: [],
    upper: [],
    lower: [],
  }
}

export function bossBounds(b: BossEntity): Aabb {
  const y = bossY()
  return {
    left: b.x - BALANCE.BOSS_W / 2,
    right: b.x + BALANCE.BOSS_W / 2,
    top: y + BALANCE.BOSS_H / 2,
    bottom: y - BALANCE.BOSS_H / 2,
  }
}

function tooth(pointUp: boolean): Path2D {
  // Y grows up: a downward point is negative local Y.
  const pts: [number, number][] = pointUp
    ? [
        [0, 11],
        [-5, -2],
        [5, -2],
      ]
    : [
        [0, -11],
        [-5, 2],
        [5, 2],
      ]
  return Path2D.polygon(pts, { fill: "#e6dcc8", z: 6 })
}

function track(b: BossEntity, node: Path2D): Path2D {
  b.nodes.push(node)
  return node
}

export function syncBossVisual(b: BossEntity, scene: Scene2D): void {
  if (!b.alive) {
    freeBoss(b)
    return
  }
  const y = bossY()
  const col = colorForHp(((Math.max(1, b.index) - 1) % 10) + 1)
  if (!b.body) {
    b.body = track(
      b,
      Path2D.roundRect([BALANCE.BOSS_W, BALANCE.BOSS_H], 8, {
        fill: col,
        stroke: { width: 2, color: "#140c0c" },
        z: 3,
      }),
    )
    b.barBg = track(b, Path2D.rect([BALANCE.BOSS_W, 8], { fill: "#1a1210", z: 4 }))
    b.barFill = track(b, Path2D.rect([BALANCE.BOSS_W - 4, 5], { fill: "#8a2020", z: 5 }))
    b.socketL = track(b, Path2D.ellipse([30, 18], { fill: "#070707", z: 4 }))
    b.socketR = track(b, Path2D.ellipse([30, 18], { fill: "#070707", z: 4 }))
    b.irisL = track(b, Path2D.circle(5, { fill: "#6a8aaa", z: 5 }))
    b.irisR = track(b, Path2D.circle(5, { fill: "#6a8aaa", z: 5 }))
    b.pupilL = track(b, Path2D.circle(2.2, { fill: "#050505", z: 6 }))
    b.pupilR = track(b, Path2D.circle(2.2, { fill: "#050505", z: 6 }))
    b.mouth = track(
      b,
      Path2D.roundRect([BALANCE.BOSS_W * 0.72, 28], 4, { fill: "#100606", z: 4 }),
    )
    for (let i = 0; i < 9; i++) {
      const up = track(b, tooth(false))
      const down = track(b, tooth(true))
      b.upper.push(up)
      b.lower.push(down)
    }
    b.tearL = track(b, Path2D.circle(2.4, { fill: "#6b2222", z: 5 }))
    b.tearR = track(b, Path2D.circle(2.4, { fill: "#6b2222", z: 5 }))
    scene.add(...b.nodes)
  }
  b.body!.position = new Vec2(b.x, y)
  const iris = b.phase2 ? "#c42020" : "#7f96a8"
  if (b.irisL) b.irisL.fill = iris
  if (b.irisR) b.irisR.fill = iris
  const eyeY = y + 14
  const placeEye = (socket: Path2D | undefined, irisN: Path2D | undefined, pupil: Path2D | undefined, x: number) => {
    socket!.position = new Vec2(b.x + x, eyeY)
    irisN!.position = new Vec2(b.x + x, eyeY)
    pupil!.position = new Vec2(b.x + x, eyeY)
  }
  placeEye(b.socketL, b.irisL, b.pupilL, -58)
  placeEye(b.socketR, b.irisR, b.pupilR, 58)
  const mouthY = y - 14
  b.mouth!.position = new Vec2(b.x, mouthY)
  const mouthHalf = 14
  for (let i = 0; i < b.upper.length; i++) {
    const x = b.x - 72 + i * 18
    b.upper[i].position = new Vec2(x, mouthY + mouthHalf - 2)
    b.lower[i].position = new Vec2(x + 9, mouthY - mouthHalf + 2)
  }
  const drop = (b.tear % 1) * 26
  const showTears = b.phase2
  if (b.tearL) {
    b.tearL.visible = showTears
    b.tearL.position = new Vec2(b.x - 52, eyeY - 10 - drop)
  }
  if (b.tearR) {
    b.tearR.visible = showTears
    b.tearR.position = new Vec2(b.x + 52, eyeY - 10 - drop)
  }
  const ratio = Math.max(0, Math.min(1, b.hp / b.maxHp))
  const barY = y + BALANCE.BOSS_H / 2 + 12
  b.barBg!.position = new Vec2(b.x, barY)
  const fillW = BALANCE.BOSS_W - 4
  b.barFill!.position = new Vec2(b.x - (fillW * (1 - ratio)) / 2, barY)
  b.barFill!.scale = new Vec2(Math.max(0.02, ratio), 1)
}

export function freeBoss(b: BossEntity): void {
  for (const n of b.nodes) n.destroy()
  b.nodes = []
  b.upper = []
  b.lower = []
  b.body = undefined
  b.barBg = undefined
  b.barFill = undefined
  b.alive = false
}
