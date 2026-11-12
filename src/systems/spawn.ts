import { levelAt } from "../config/levels"
import { BALANCE, diffMult } from "../config/balance"
import { game, ballCount, pierceMax } from "../core/state"
import { makeBall, serveY, type BallEntity } from "../entities/ball"
import { makeBoss, type BossEntity } from "../entities/boss"
import { makeBrick, type BrickEntity } from "../entities/brick"
import { makePaddle, type PaddleEntity } from "../entities/paddle"
import { ballSpeed } from "./physics"

export function bricksForLevel(levelIndex: number): BrickEntity[] {
  const def = levelAt(levelIndex)
  const out: BrickEntity[] = []
  for (const cell of def.cells) out.push(makeBrick(cell.col, cell.row, cell.hp))
  return out
}

export function spawnBoss(levelIndex: number): BossEntity | null {
  const def = levelAt(levelIndex)
  if (!def.boss || def.bossIndex <= 0) return null
  return makeBoss(def.bossIndex, diffMult(game.difficulty))
}

export function spawnPaddle(): PaddleEntity {
  return makePaddle(0)
}

export function layoutStuck(balls: BallEntity[], paddleX: number): void {
  const stuck = balls.filter((b) => b.stuck)
  const n = stuck.length
  const y = serveY()
  for (let i = 0; i < n; i++) {
    const b = stuck[i]
    b.stuckOffset = (i - (n - 1) / 2) * 16
    const limit = BALANCE.FIELD_W / 2 - 8
    b.x = Math.max(-limit, Math.min(limit, paddleX + b.stuckOffset))
    b.y = y
    b.vx = 0
    b.vy = 0
    b.pierceLeft = pierceMax()
  }
}

export function spawnFreshBalls(paddleX: number): BallEntity[] {
  const n = ballCount()
  const balls: BallEntity[] = []
  for (let i = 0; i < n; i++) balls.push(makeBall(paddleX, serveY()))
  for (const b of balls) b.stuck = true
  layoutStuck(balls, paddleX)
  return balls
}

/** Pointer up launches every ball still glued to the paddle. */
export function launchStuck(balls: BallEntity[]): void {
  const stuck = balls.filter((b) => b.stuck)
  const n = stuck.length
  const speed = ballSpeed()
  for (let i = 0; i < n; i++) {
    const b = stuck[i]
    const spread = (i - (n - 1) / 2) * 0.14
    b.stuck = false
    b.vx = Math.sin(spread) * speed
    b.vy = Math.cos(spread) * speed
    b.pierceLeft = pierceMax()
    b.touched = []
  }
}
