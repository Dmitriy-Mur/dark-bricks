import { BALANCE, diffMult } from "../config/balance"
import { game } from "../core/state"
import type { BallEntity } from "../entities/ball"
import type { BossEntity } from "../entities/boss"
import type { PaddleEntity } from "../entities/paddle"
import type { ProjectileEntity } from "../entities/projectile"
import { wallBounce } from "./collision"

export function ballSpeed(): number {
  return BALANCE.BALL_SPEED_BASE * diffMult(game.difficulty)
}

export function integrateBall(ball: BallEntity, dt: number, collide: () => void): void {
  if (ball.stuck) return
  const dist = Math.hypot(ball.vx, ball.vy) * dt
  const steps = Math.max(1, Math.min(6, Math.ceil(dist / BALANCE.BALL_RADIUS)))
  const h = dt / steps
  for (let i = 0; i < steps; i++) {
    ball.x += ball.vx * h
    ball.y += ball.vy * h
    wallBounce(ball)
    collide()
  }
}

export function integrateBoss(b: BossEntity, dt: number): void {
  const limit = BALANCE.FIELD_W / 2 - BALANCE.BOSS_W / 2
  b.x += b.vx * dt
  if (b.x < -limit) {
    b.x = -limit
    b.vx = Math.abs(b.vx)
  }
  if (b.x > limit) {
    b.x = limit
    b.vx = -Math.abs(b.vx)
  }
}

export function integrateProjectile(p: ProjectileEntity, dt: number): void {
  p.x += p.vx * dt
  p.y += p.vy * dt
}

/** Core center stays inside the field. Wings may hang past the walls. */
export function clampPaddleX(coreW: number, x: number): number {
  const limit = BALANCE.FIELD_W / 2 - coreW / 2
  return Math.max(-limit, Math.min(limit, x))
}
