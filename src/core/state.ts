import { BALANCE, DIFFICULTY, type DifficultyId } from "../config/balance"
import { emptyPerks, LASER_RATES, type PerkStacks } from "../config/perks"

/**
 * Menu, difficulty, victory, defeat and boss intro are UIScreen destinations.
 * Gameplay is a Scene2D. Pause, perk select and the fallen-lord banner are widgets
 * on that scene: UIScreen.open() replaces the active scene, so those overlays must not.
 */
export type GamePhase =
  | "menu"
  | "difficulty"
  | "gameplay"
  | "perk_select"
  | "boss_intro"
  | "pause"
  | "victory"
  | "defeat"

export type GameSnapshot = {
  difficulty: DifficultyId
  levelIndex: number
  lives: number
  xp: number
  playerLevel: number
  perks: PerkStacks
  endlessUnlocked: boolean
  endlessMode: boolean
  bricksBroken: number
}

export const game = {
  phase: "menu" as GamePhase,
  difficulty: "twilight" as DifficultyId,
  levelIndex: 1,
  lives: 3,
  xp: 0,
  playerLevel: 1,
  perks: emptyPerks(),
  perkQueue: 0,
  endlessUnlocked: false,
  endlessMode: false,
  bricksBroken: 0,
  won: false,
}

export function resetRun(difficulty: DifficultyId, endless = false): void {
  game.difficulty = difficulty
  game.levelIndex = endless ? 31 : 1
  game.lives = DIFFICULTY[difficulty].lives
  game.xp = 0
  game.playerLevel = 1
  game.perks = emptyPerks()
  game.perkQueue = 0
  game.bricksBroken = 0
  game.endlessMode = endless
  game.won = false
  game.phase = "gameplay"
}

export function snapshotFromGame(): GameSnapshot {
  return {
    difficulty: game.difficulty,
    levelIndex: game.levelIndex,
    lives: game.lives,
    xp: game.xp,
    playerLevel: game.playerLevel,
    perks: { ...game.perks },
    endlessUnlocked: game.endlessUnlocked,
    endlessMode: game.endlessMode,
    bricksBroken: game.bricksBroken,
  }
}

function isDifficulty(v: string): v is DifficultyId {
  return v === "twilight" || v === "curse" || v === "abyss"
}

export function applySnapshot(s: GameSnapshot): void {
  game.difficulty = isDifficulty(s.difficulty) ? s.difficulty : "twilight"
  game.levelIndex = Math.max(1, s.levelIndex | 0)
  game.lives = Math.max(0, s.lives | 0)
  game.xp = Math.max(0, s.xp)
  game.playerLevel = Math.max(1, s.playerLevel | 0)
  game.perks = { ...emptyPerks(), ...s.perks }
  game.endlessUnlocked = s.endlessUnlocked
  game.endlessMode = s.endlessMode
  game.bricksBroken = Math.max(0, s.bricksBroken | 0)
  game.perkQueue = 0
  game.won = false
}

export function setPhase(phase: GamePhase): void {
  game.phase = phase
}

/** Ball damage is 1 + stacks, clamped to the 10-color palette. Stack cap stays 10. */
export function ballDamage(): number {
  return Math.min(10, 1 + game.perks.damage)
}

export function critChance(): number {
  return Math.min(0.5, game.perks.crit * 0.1)
}

export function explosionChance(): number {
  return Math.min(0.5, game.perks.explosion * 0.1)
}

export function pierceMax(): number {
  return Math.min(2, game.perks.pierce)
}

/** Ball count is 1 + stacks, clamped to 5. Stack cap stays 5. */
export function ballCount(): number {
  return Math.min(5, 1 + game.perks.balls)
}

export function xpMultiplier(): number {
  return 1 + Math.min(PERK_CAP_XP, game.perks.xp) * 0.1
}

const PERK_CAP_XP = 5

/**
 * Total paddle width relative to the core.
 * Each stack adds 20% of the core to the total, split across both wings
 * (10% of the core per side). Stack 10 → 3 bricks.
 */
export function paddleWidthMultiplier(): number {
  return 1 + Math.min(10, game.perks.width) * 0.2
}

export function laserShotsPerSecond(): number {
  const idx = Math.max(0, Math.min(LASER_RATES.length - 1, game.perks.laser))
  return LASER_RATES[idx]
}

export function onLifeLost(): void {
  game.lives -= 1
  game.xp = 0
  console.log(`life lost lives=${game.lives}`)
  if (game.lives <= 0) setPhase("defeat")
}

export function queueLevelUps(count: number): void {
  game.perkQueue += count
}
