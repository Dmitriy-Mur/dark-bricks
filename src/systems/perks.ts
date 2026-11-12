import { PERK_CAPS, ROLL_PERKS, isPerkMaxed, perkIncrement, type PerkId, type PerkStacks } from "../config/perks"
import { game } from "../core/state"

/**
 * Three distinct non-maxed perks when the pool allows it.
 * Shortfalls are filled with +1 life. If nothing else remains, the only offer is life.
 */
export function rollPerkChoices(stacks: PerkStacks): PerkId[] {
  const pool = ROLL_PERKS.filter((id) => !isPerkMaxed(id, stacks))
  if (pool.length === 0) return ["life"]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const swap = pool[i]
    pool[i] = pool[j]
    pool[j] = swap
  }
  const out = pool.slice(0, 3)
  while (out.length < 3) out.push("life")
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
  if (id === "life") return "∞"
  return `${stacks[id]}/${PERK_CAPS[id]}`
}
