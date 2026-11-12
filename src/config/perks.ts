export const PERK_CAPS = {
  damage: 10,
  crit: 5,
  pierce: 2,
  explosion: 5,
  width: 10,
  laser: 4,
  balls: 5,
  xp: 5,
} as const

export type StackPerkId = keyof typeof PERK_CAPS
export type PerkId = StackPerkId | "life"

export type PerkStacks = Record<StackPerkId, number>

export function emptyPerks(): PerkStacks {
  return { damage: 0, crit: 0, pierce: 0, explosion: 0, width: 0, laser: 0, balls: 0, xp: 0 }
}

/** Shots per second at laser stacks 0..4. Stack 1 unlocks the beam. */
export const LASER_RATES = [0, 0.5, 1, 1.5, 2] as const

export const ROLL_PERKS: PerkId[] = [
  "damage",
  "crit",
  "pierce",
  "explosion",
  "width",
  "laser",
  "balls",
  "xp",
  "life",
]

export function isPerkMaxed(id: PerkId, stacks: PerkStacks): boolean {
  if (id === "life") return false
  return stacks[id] >= PERK_CAPS[id]
}

export function perkIncrement(id: PerkId, stacks: PerkStacks): PerkStacks {
  if (id === "life") return stacks
  if (stacks[id] >= PERK_CAPS[id]) return stacks
  return { ...stacks, [id]: stacks[id] + 1 }
}
