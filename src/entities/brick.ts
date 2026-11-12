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
  cracks?: Path2D[]
  crackHp?: number
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

function rng(seed: number): () => number {
  let s = seed >>> 0 || 1
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

/** Full fissure, then clipped by how much HP is gone so the same crack grows in place. */
function crackPolylines(id: number, lost: number): [number, number][][] {
  const rand = rng(id * 997 + 13)
  type Line = { pts: [number, number][]; reveal: number }
  const lines: Line[] = []
  const mains = 3
  for (let m = 0; m < mains; m++) {
    const pts: [number, number][] = []
    let x = (rand() * 2 - 1) * 12
    let y = (rand() * 2 - 1) * 4
    let ang = rand() * Math.PI * 2
    pts.push([x, y])
    const steps = 8
    for (let i = 0; i < steps; i++) {
      ang += (rand() - 0.5) * 1.15
      const step = 2.1 + rand() * 2.2
      x = clamp(x + Math.cos(ang) * step, -16, 16)
      y = clamp(y + Math.sin(ang) * step * 0.42, -6.5, 6.5)
      if (rand() < 0.5) {
        x = clamp(x + (rand() - 0.5) * 2.8, -16, 16)
        y = clamp(y + (rand() - 0.5) * 1.5, -6.5, 6.5)
      }
      pts.push([x, y])
      if (i > 0 && rand() < 0.42) {
        const branch: [number, number][] = [[x, y]]
        let bx = x
        let by = y
        let bang = ang + (rand() < 0.5 ? 1 : -1) * (0.6 + rand() * 0.7)
        const bsteps = 2 + Math.floor(rand() * 3)
        for (let k = 0; k < bsteps; k++) {
          bang += (rand() - 0.5) * 0.9
          bx = clamp(bx + Math.cos(bang) * (1.5 + rand() * 1.7), -16, 16)
          by = clamp(by + Math.sin(bang) * (1.1 + rand() * 0.8), -6.5, 6.5)
          branch.push([bx, by])
        }
        lines.push({ pts: branch, reveal: 0.22 + rand() * 0.62 })
      }
    }
    lines.push({ pts, reveal: m === 0 ? 0 : m === 1 ? 0.38 : 0.7 })
  }
  const out: [number, number][][] = []
  for (const line of lines) {
    if (lost <= line.reveal) continue
    const span = Math.max(0.15, (lost - line.reveal) / (1 - line.reveal))
    const n = Math.max(2, Math.ceil(line.pts.length * span))
    out.push(line.pts.slice(0, n))
  }
  return out
}

function clearCracks(b: BrickEntity): void {
  if (!b.cracks) return
  for (const c of b.cracks) c.destroy()
  b.cracks = undefined
  b.crackHp = undefined
}

export function syncBrickVisual(b: BrickEntity, scene: Scene2D): void {
  if (!b.alive) {
    b.node?.destroy()
    clearCracks(b)
    b.node = undefined
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
    scene.add(b.node)
  }
  b.node.fill = fill
  b.node.position = new Vec2(x, y)
  const damaged = b.maxHp > 1 && b.hp < b.maxHp
  const lost = damaged ? 1 - (b.hp - 1) / (b.maxHp - 1) : 0
  if (lost <= 0.02) {
    clearCracks(b)
    return
  }
  if (b.crackHp === b.hp && b.cracks) {
    for (const c of b.cracks) c.position = new Vec2(x, y)
    return
  }
  clearCracks(b)
  const cracks: Path2D[] = []
  for (const pts of crackPolylines(b.id, lost)) {
    if (pts.length < 2) continue
    const line = Path2D.line(pts, { width: 0.7, color: "#140e0c", cap: "round", join: "round" }, { z: 3 })
    line.position = new Vec2(x, y)
    cracks.push(line)
  }
  if (cracks.length > 0) scene.add(...cracks)
  b.cracks = cracks
  b.crackHp = b.hp
}

export function freeBrick(b: BrickEntity): void {
  b.node?.destroy()
  clearCracks(b)
  b.node = undefined
}
