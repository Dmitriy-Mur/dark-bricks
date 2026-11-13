export const BALANCE = {
  BRICK_W: 40,
  BRICK_H: 18,
  BRICK_GAP: 4,
  /** Inner playfield. Bricks span the full width; the core is clamped inside it. */
  FIELD_W: 392,
  FIELD_H: 680,
  PADDLE_Y: -270,
  PADDLE_H: 12,
  BALL_RADIUS: 10,
  BALL_SPEED_BASE: 320,
  /** Degrees off vertical at the paddle's outer edge. */
  BALL_MAX_ANGLE_DEG: 72,
  /** Balls below this (world Y grows upward) have fallen. */
  LOST_Y: -360,
  /** Equal XP per destroyed brick. ~18–24 bricks ≈ one player level. */
  XP_PER_BRICK: 1,
  XP_TO_LEVEL: 18,
  BOSS_W: 240,
  BOSS_H: 70,
  /**
   * Boss i is 1-based.
   * hp = BOSS_BASE_HP + (i - 1) * 30
   * speedFactor = 1 + (i - 1) * 0.15
   * moveSpeed = BOSS_BASE_SPEED * speedFactor * difficulty
   * projectileSpeed = PROJECTILE_SPEED * speedFactor * difficulty
   * shootCooldown = BOSS_SHOOT_COOLDOWN / (speedFactor * difficulty)
   * Difficulty multiplies every time-based value (higher → faster). HP and damage are not scaled.
   */
  BOSS_BASE_HP: 40,
  BOSS_HP_PER_INDEX: 30,
  BOSS_BASE_SPEED: 72,
  BOSS_SPEED_PER_INDEX: 0.15,
  BOSS_SHOOT_COOLDOWN: 2.4,
  BOSS_DEATH_DELAY: 2.5,
  BOSS_INTRO_MS: 1600,
  PROJECTILE_SPEED: 170,
  LASER_DMG: 1,
  EXPLOSION_DMG: 1,
  CRIT_MULT: 2,
  SHAKE_PX: 2.5,
  SHAKE_MS: 100,
  LANG_KEY: "dark_bricks_lang",
  SAVE_KEY: "dark_bricks_save",
  VOL_MUSIC_KEY: "dark_bricks_vol_music",
  VOL_SFX_KEY: "dark_bricks_vol_sfx",
  ENDLESS_KEY: "dark_bricks_endless",
} as const

export type DifficultyId = "twilight" | "curse" | "abyss"

export const DIFFICULTY = {
  twilight: { mult: 1.0, lives: 3 },
  curse: { mult: 1.35, lives: 2 },
  abyss: { mult: 1.7, lives: 1 },
} as const satisfies Record<DifficultyId, { mult: number; lives: number }>

export function diffMult(id: DifficultyId): number {
  return DIFFICULTY[id].mult
}

export type BossStats = {
  hp: number
  speedFactor: number
  moveSpeed: number
  projectileSpeed: number
  shootCooldown: number
}

export function bossStats(index: number, mult: number): BossStats {
  const i = Math.max(1, index)
  const speedFactor = 1 + (i - 1) * BALANCE.BOSS_SPEED_PER_INDEX
  return {
    hp: BALANCE.BOSS_BASE_HP + (i - 1) * BALANCE.BOSS_HP_PER_INDEX,
    speedFactor,
    moveSpeed: BALANCE.BOSS_BASE_SPEED * speedFactor * mult,
    projectileSpeed: BALANCE.PROJECTILE_SPEED * speedFactor * mult,
    shootCooldown: BALANCE.BOSS_SHOOT_COOLDOWN / (speedFactor * mult),
  }
}
