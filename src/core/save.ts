import { BALANCE, type DifficultyId } from "../config/balance"
import { emptyPerks, type PerkStacks } from "../config/perks"
import { applySnapshot, game, snapshotFromGame, type GameSnapshot } from "./state"

function isDifficulty(v: unknown): v is DifficultyId {
  return v === "twilight" || v === "curse" || v === "abyss"
}

function readSnapshot(raw: string): GameSnapshot | null {
  try {
    const v = JSON.parse(raw) as Partial<GameSnapshot>
    if (!v || !isDifficulty(v.difficulty)) return null
    if (typeof v.levelIndex !== "number" || typeof v.lives !== "number") return null
    const perks = { ...emptyPerks(), ...(v.perks ?? {}) } as PerkStacks
    return {
      difficulty: v.difficulty,
      levelIndex: v.levelIndex,
      lives: v.lives,
      xp: typeof v.xp === "number" ? v.xp : 0,
      playerLevel: typeof v.playerLevel === "number" ? v.playerLevel : 1,
      perks,
      endlessUnlocked: Boolean(v.endlessUnlocked),
      endlessMode: Boolean(v.endlessMode),
      bricksBroken: typeof v.bricksBroken === "number" ? v.bricksBroken : 0,
    }
  } catch {
    return null
  }
}

export function loadMeta(): void {
  game.endlessUnlocked = localStorage.getItem(BALANCE.ENDLESS_KEY) === "1"
}

export function markEndlessUnlocked(): void {
  game.endlessUnlocked = true
  localStorage.setItem(BALANCE.ENDLESS_KEY, "1")
}

export function isEndlessUnlocked(): boolean {
  return game.endlessUnlocked || localStorage.getItem(BALANCE.ENDLESS_KEY) === "1"
}

export function hasSave(): boolean {
  return localStorage.getItem(BALANCE.SAVE_KEY) != null
}

export function saveGame(): void {
  const snap = snapshotFromGame()
  if (snap.endlessUnlocked) markEndlessUnlocked()
  localStorage.setItem(BALANCE.SAVE_KEY, JSON.stringify(snap))
}

export function loadGame(): GameSnapshot | null {
  const raw = localStorage.getItem(BALANCE.SAVE_KEY)
  if (!raw) return null
  return readSnapshot(raw)
}

export function clearSave(): void {
  localStorage.removeItem(BALANCE.SAVE_KEY)
}

export function continueFromSave(): boolean {
  const s = loadGame()
  if (!s) return false
  applySnapshot(s)
  if (s.endlessUnlocked) markEndlessUnlocked()
  return true
}
