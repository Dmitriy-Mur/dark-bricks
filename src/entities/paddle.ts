import { BALANCE } from "../config/balance"
import { game } from "../core/state"

export type Aabb = { left: number; right: number; top: number; bottom: number }

export type PaddleEntity = {
  x: number
  coreW: number
  totalW: number
  core?: Path2D
  vein?: Path2D
  leftIn?: Path2D
  leftOut?: Path2D
  rightIn?: Path2D
  rightOut?: Path2D
}

export function makePaddle(x = 0): PaddleEntity {
  const coreW = BALANCE.BRICK_W
  return { x, coreW, totalW: coreW }
}

export function recomputePaddleWidth(p: PaddleEntity): void {
  p.coreW = BALANCE.BRICK_W
  const stacks = Math.min(10, game.perks.width)
  // "+20% per side" at 10 stacks would be 5 bricks, but the cap is "total 3".
  // total = core * (1 + 0.2 * stacks): each stack adds 10% of the core on each side.
  p.totalW = p.coreW * (1 + 0.2 * stacks)
}

export function paddleRects(p: PaddleEntity): { core: Aabb; left?: Aabb; right?: Aabb } {
  recomputePaddleWidth(p)
  const y = BALANCE.PADDLE_Y
  const hh = BALANCE.PADDLE_H / 2
  const coreHalf = p.coreW / 2
  const core: Aabb = {
    left: p.x - coreHalf,
    right: p.x + coreHalf,
    top: y + hh,
    bottom: y - hh,
  }
  const wing = (p.totalW - p.coreW) / 2
  if (wing <= 0.5) return { core }
  return {
    core,
    left: { left: p.x - p.totalW / 2, right: p.x - coreHalf, top: y + hh, bottom: y - hh },
    right: { left: p.x + coreHalf, right: p.x + p.totalW / 2, top: y + hh, bottom: y - hh },
  }
}

function ensureSeg(node: Path2D | undefined, scene: Scene2D, fill: string): Path2D {
  if (node) return node
  const made = Path2D.rect([1, BALANCE.PADDLE_H], { fill, z: 4 })
  scene.add(made)
  return made
}

function placeSeg(node: Path2D, x0: number, x1: number): void {
  const w = x1 - x0
  if (w < 0.6) {
    node.visible = false
    return
  }
  node.visible = true
  node.position = new Vec2((x0 + x1) / 2, BALANCE.PADDLE_Y)
  node.scale = new Vec2(w, 1)
}

export function syncPaddleVisual(p: PaddleEntity, scene: Scene2D): void {
  recomputePaddleWidth(p)
  const y = BALANCE.PADDLE_Y
  if (!p.core) {
    p.core = Path2D.roundRect([p.coreW, BALANCE.PADDLE_H], 2, {
      fill: "#c8bfb0",
      stroke: { width: 1, color: "#1a1410" },
      z: 4,
    })
    p.vein = Path2D.rect([p.coreW * 0.55, 2], { fill: "#6b2222", z: 5 })
    scene.add(p.core, p.vein)
  }
  p.core.position = new Vec2(p.x, y)
  if (p.vein) p.vein.position = new Vec2(p.x, y + 1)

  p.leftIn = ensureSeg(p.leftIn, scene, "#6e675e")
  p.leftOut = ensureSeg(p.leftOut, scene, "#6e675e44")
  p.rightIn = ensureSeg(p.rightIn, scene, "#6e675e")
  p.rightOut = ensureSeg(p.rightOut, scene, "#6e675e44")

  const wallL = -BALANCE.FIELD_W / 2
  const wallR = BALANCE.FIELD_W / 2
  const left0 = p.x - p.totalW / 2
  const left1 = p.x - p.coreW / 2
  const right0 = p.x + p.coreW / 2
  const right1 = p.x + p.totalW / 2
  // Wings may cross the walls. The part outside is drawn faint so it dissolves.
  placeSeg(p.leftIn, Math.max(left0, wallL), Math.min(left1, wallR))
  placeSeg(p.leftOut, left0, Math.min(left1, wallL))
  placeSeg(p.rightIn, Math.max(right0, wallL), Math.min(right1, wallR))
  placeSeg(p.rightOut, Math.max(right0, wallR), right1)
}

export function freePaddle(p: PaddleEntity): void {
  p.core?.destroy()
  p.vein?.destroy()
  p.leftIn?.destroy()
  p.leftOut?.destroy()
  p.rightIn?.destroy()
  p.rightOut?.destroy()
  p.core = undefined
  p.vein = undefined
  p.leftIn = undefined
  p.leftOut = undefined
  p.rightIn = undefined
  p.rightOut = undefined
}
