import { PERK_CAPS, ROLL_PERKS, isPerkMaxed, perkIncrement, type PerkId, type PerkStacks } from "../config/perks"
import { game } from "../core/state"

/**
 * Up to three distinct non-maxed perks. Life is in the pool and never maxed,
 * so a normal roll can include +1 life. If every other perk is maxed, the offer is life.
 */
export function rollPerkChoices(stacks: PerkStacks): PerkId[] {
  const pool = ROLL_PERKS.filter((id) => !isPerkMaxed(id, stacks))
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const swap = pool[i]
    pool[i] = pool[j]
    pool[j] = swap
  }
  const out: PerkId[] = []
  for (const id of pool) {
    if (out.length >= 3) break
    if (out.indexOf(id) < 0) out.push(id)
  }
  if (out.length === 0 || out.every((id) => id !== "life" && isPerkMaxed(id, stacks))) return ["life"]
  return out
}

export function applyPerk(id: PerkId): void {
  if (id === "life") {
    game.lives += 1
    return
  }
  game.perks = perkIncrement(id, game.perks)
}

export function perkStackLabel(id: PerkId, stacks: PerkStacks): string {
  if (id === "life") return String(game.lives)
  return `${stacks[id]}/${PERK_CAPS[id]}`
}
