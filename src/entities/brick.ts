import { BALANCE } from "../config/balance"
import { brickWorldOrigin } from "../config/levels"
import { colorForHp } from "../config/palette"
import type { Aabb } from "./paddle"

export type BrickEntity = {
  id: number
  col: number
  row: number
  hp: number
  maxHp: number
  alive: boolean
  node?: Path2D
  crack?: Path2D
}

let nextId = 1

export function brickPosition(col: number, row: number): { x: number; y: number } {
  const { ox, oy } = brickWorldOrigin()
  const stepX = BALANCE.BRICK_W + BALANCE.BRICK_GAP
  const stepY = BALANCE.BRICK_H + BALANCE.BRICK_GAP
  return { x: ox + col * stepX, y: oy - row * stepY }
}

export function makeBrick(col: number, row: number, hp: number): BrickEntity {
  return { id: nextId++, col, row, hp, maxHp: hp, alive: hp > 0 }
}

export function brickBounds(b: BrickEntity): Aabb {
  const { x, y } = brickPosition(b.col, b.row)
  const hw = BALANCE.BRICK_W / 2
  const hh = BALANCE.BRICK_H / 2
  return { left: x - hw, right: x + hw, top: y + hh, bottom: y - hh }
}

export function syncBrickVisual(b: BrickEntity, scene: Scene2D): void {
  if (!b.alive) {
    b.node?.destroy()
    b.crack?.destroy()
    b.node = undefined
    b.crack = undefined
    return
  }
  const { x, y } = brickPosition(b.col, b.row)
  const fill = colorForHp(b.hp)
  if (!b.node) {
    b.node = Path2D.roundRect([BALANCE.BRICK_W, BALANCE.BRICK_H], 2, {
      fill,
      stroke: { width: 1, color: "#120e0c" },
      z: 2,
    })
    b.crack = Path2D.shape(
      (p) => {
        p.moveTo(-12, -5)
        p.lineTo(-2, 0)
        p.lineTo(6, -4)
        p.lineTo(11, 3)
      },
      { stroke: { width: 1.2, color: "#f2efe6aa" }, z: 3 },
    )
    scene.add(b.node, b.crack)
  }
  b.node.fill = fill
  b.node.position = new Vec2(x, y)
  const damaged = b.maxHp > 1 && b.hp < b.maxHp
  const lost = damaged ? 1 - (b.hp - 1) / (b.maxHp - 1) : 0
  if (b.crack) {
    b.crack.position = new Vec2(x, y)
    b.crack.visible = lost > 0.05
    b.crack.scale = 0.55 + lost * 0.9
  }
}

export function freeBrick(b: BrickEntity): void {
  b.node?.destroy()
  b.crack?.destroy()
  b.node = undefined
  b.crack = undefined
}
