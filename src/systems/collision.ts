import { BALANCE, diffMult } from "../config/balance"
import { game } from "../core/state"
import type { BallEntity } from "../entities/ball"
import type { BossEntity } from "../entities/boss"
import { bossBounds } from "../entities/boss"
import type { BrickEntity } from "../entities/brick"
import { brickBounds } from "../entities/brick"
import type { PaddleEntity } from "../entities/paddle"
import { paddleRects, type Aabb } from "../entities/paddle"
import type { ProjectileEntity } from "../entities/projectile"
import { projectileBounds } from "../entities/projectile"

export function circleAabb(cx: number, cy: number, r: number): Aabb {
  return { left: cx - r, right: cx + r, top: cy + r, bottom: cy - r }
}

export function intersects(a: Aabb, b: Aabb): boolean {
  return a.left < b.right && a.right > b.left && a.bottom < b.top && a.top > b.bottom
}

export function ballBrickHit(ball: BallEntity, brick: BrickEntity): boolean {
  if (!brick.alive) return false
  return intersects(circleAabb(ball.x, ball.y, BALANCE.BALL_RADIUS), brickBounds(brick))
}

export function ballPaddleHit(ball: BallEntity, paddle: PaddleEntity): boolean {
  if (ball.vy > 0) return false
  const r = circleAabb(ball.x, ball.y, BALANCE.BALL_RADIUS)
  const rects = paddleRects(paddle)
  if (intersects(r, rects.core)) return true
  if (rects.left && intersects(r, rects.left)) return true
  if (rects.right && intersects(r, rects.right)) return true
  return false
}

export function ballBossHit(ball: BallEntity, boss: BossEntity): boolean {
  if (!boss.alive) return false
  return intersects(circleAabb(ball.x, ball.y, BALANCE.BALL_RADIUS), bossBounds(boss))
}

/** Boss shots damage only the core. Wings are a ghost. */
export function projectileCoreHit(p: ProjectileEntity, paddle: PaddleEntity): boolean {
  return intersects(projectileBounds(p), paddleRects(paddle).core)
}

export function resolveBallBrickBounce(ball: BallEntity, brick: BrickEntity): void {
  const b = brickBounds(brick)
  const r = BALANCE.BALL_RADIUS
  const overlapL = ball.x + r - b.left
  const overlapR = b.right - (ball.x - r)
  const overlapB = ball.y + r - b.bottom
  const overlapT = b.top - (ball.y - r)
  const min = Math.min(overlapL, overlapR, overlapB, overlapT)
  if (min === overlapL) {
    ball.x -= overlapL
    ball.vx = -Math.abs(ball.vx)
  } else if (min === overlapR) {
    ball.x += overlapR
    ball.vx = Math.abs(ball.vx)
  } else if (min === overlapB) {
    ball.y -= overlapB
    ball.vy = -Math.abs(ball.vy)
  } else {
    ball.y += overlapT
    ball.vy = Math.abs(ball.vy)
  }
}

/** Slide the ball along its velocity until it no longer overlaps the brick. */
export function pushBallThrough(ball: BallEntity, brick: BrickEntity): void {
  const speed = Math.hypot(ball.vx, ball.vy) || 1
  const ux = ball.vx / speed
  const uy = ball.vy / speed
  for (let i = 0; i < 24 && ballBrickHit(ball, brick); i++) {
    ball.x += ux * 2
    ball.y += uy * 2
  }
}

/**
 * Classic Arkanoid: hit offset across the whole paddle (core and wings share one rule).
 * Center → nearly straight up. Outer edge → BALL_MAX_ANGLE_DEG off vertical.
 */
export function arkanoidBounce(ball: BallEntity, paddle: PaddleEntity): void {
  const half = Math.max(1, paddle.totalW / 2)
  const rel = Math.max(-1, Math.min(1, (ball.x - paddle.x) / half))
  const maxRad = (BALANCE.BALL_MAX_ANGLE_DEG * Math.PI) / 180
  const angle = rel * maxRad
  const speed = Math.hypot(ball.vx, ball.vy) || BALANCE.BALL_SPEED_BASE * diffMult(game.difficulty)
  ball.vx = Math.sin(angle) * speed
  ball.vy = Math.abs(Math.cos(angle) * speed)
  ball.y = BALANCE.PADDLE_Y + BALANCE.PADDLE_H / 2 + BALANCE.BALL_RADIUS + 1
  ball.touched = []
}

export function wallBounce(ball: BallEntity): void {
  const hw = BALANCE.FIELD_W / 2
  if (ball.x - BALANCE.BALL_RADIUS < -hw) {
    ball.x = -hw + BALANCE.BALL_RADIUS
    ball.vx = Math.abs(ball.vx)
  }
  if (ball.x + BALANCE.BALL_RADIUS > hw) {
    ball.x = hw - BALANCE.BALL_RADIUS
    ball.vx = -Math.abs(ball.vx)
  }
  const top = BALANCE.FIELD_H / 2
  if (ball.y + BALANCE.BALL_RADIUS > top) {
    ball.y = top - BALANCE.BALL_RADIUS
    ball.vy = -Math.abs(ball.vy)
  }
}

export function separateBelowBoss(ball: BallEntity, boss: BossEntity): void {
  const b = bossBounds(boss)
  ball.y = b.bottom - BALANCE.BALL_RADIUS - 1
  ball.vy = -Math.abs(ball.vy)
}

export type LaserHit =
  | { kind: "brick"; brick: BrickEntity; near: number }
  | { kind: "boss"; boss: BossEntity; near: number }

/**
 * World Y grows upward. The laser is a ray from the paddle core toward +Y.
 * Among brick and boss AABBs that contain the ray's x and sit above the paddle,
 * the hit is the one with the smallest bottom edge — nearest the paddle.
 */
export function laserTarget(
  bricks: BrickEntity[],
  boss: BossEntity | null,
  x: number,
  paddleTop: number,
): LaserHit | null {
  let best: LaserHit | null = null
  const consider = (hit: LaserHit) => {
    if (!best || hit.near < best.near) best = hit
  }
  for (const brick of bricks) {
    if (!brick.alive) continue
    const b = brickBounds(brick)
    if (x < b.left || x > b.right) continue
    if (b.bottom <= paddleTop) continue
    consider({ kind: "brick", brick, near: b.bottom })
  }
  if (boss && boss.alive) {
    const b = bossBounds(boss)
    if (x >= b.left && x <= b.right && b.bottom > paddleTop) {
      consider({ kind: "boss", boss, near: b.bottom })
    }
  }
  return best
}
