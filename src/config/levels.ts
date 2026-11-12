import { BALANCE } from "./balance"

export type BrickCell = { col: number; row: number; hp: number }

export type LevelDef = {
  id: string
  nameKey: string
  boss: boolean
  /** 1-based boss number when `boss` is set, otherwise 0. */
  bossIndex: number
  cells: BrickCell[]
}

export const GRID_COLS = 9

/** '.' empty, '1'..'9' hp, 'a' = 10. Authored layouts, parsed once. */
function cells(rows: string[]): BrickCell[] {
  const out: BrickCell[] = []
  for (let row = 0; row < rows.length; row++) {
    const line = rows[row]
    for (let col = 0; col < line.length && col < GRID_COLS; col++) {
      const ch = line[col]
      if (ch === "." || ch === " ") continue
      const hp = ch === "a" || ch === "A" ? 10 : Number(ch)
      if (hp >= 1 && hp <= 10) out.push({ col, row, hp })
    }
  }
  return out
}

function level(
  id: string,
  nameKey: string,
  bossIndex: number,
  rows: string[],
): LevelDef {
  return { id, nameKey, boss: bossIndex > 0, bossIndex, cells: cells(rows) }
}

/** All 30 campaign layouts. Boss levels (3, 6, …, 30) still include bricks. */
export const LEVELS: LevelDef[] = [
  level("ashen-gate", "level.1", 0, [
    "...1.1...",
    "...2.2...",
    "..12321..",
    "...1.1...",
    ".1.....1.",
  ]),
  level("moss-crypt", "level.2", 0, [
    "..22222..",
    "..21112..",
    "..21112..",
    "..22222..",
  ]),
  level("lord-1", "level.3", 1, [
    "111111111",
    "1.1.1.1.1",
    "..11111..",
  ]),
  level("broken-fangs", "level.4", 0, [
    "3.2.3.2.3",
    ".3.2.3.2.",
    "2.3.2.3.2",
    "..22222..",
  ]),
  level("drowned-choir", "level.5", 0, [
    ".2.3.3.2.",
    "3.4.4.4.3",
    ".3.4.4.3.",
    "2.3.3.3.2",
  ]),
  level("lord-2", "level.6", 2, [
    "222222222",
    ".3333333.",
    "..3.3.3..",
  ]),
  level("spire-sighs", "level.7", 0, [
    "...555...",
    "..55555..",
    "...555...",
    "..44444..",
    "...444...",
    "..33333..",
    "...333...",
  ]),
  level("blood-ziggurat", "level.8", 0, [
    "....4....",
    "...444...",
    "..44444..",
    ".4444444.",
    "333333333",
  ]),
  level("lord-3", "level.9", 3, [
    ".4.4.4.4.",
    "444444444",
    ".4.5.5.4.",
    "..55555..",
  ]),
  level("iron-reliquary", "level.10", 0, [
    "666666666",
    "6.......6",
    "6..999..6",
    "6.......6",
    "666666666",
  ]),
  level("wailing-tide", "level.11", 0, [
    ".4.5.5.4.",
    "5.6.6.6.5",
    ".5.6.6.5.",
    "4.5.5.5.4",
    ".4.4.4.4.",
  ]),
  level("lord-4", "level.12", 4, [
    "555555555",
    ".5.6.6.5.",
    "..66666..",
    ".5.6.6.5.",
  ]),
  level("grinning-hall", "level.13", 0, [
    "77.....77",
    ".6.....6.",
    "..55555..",
    "...5.5...",
    "..66666..",
    ".6.....6.",
  ]),
  level("monks-folly", "level.14", 0, [
    "5..5..5..",
    "5..5..5..",
    "555555555",
    "5..5..5..",
    "5..5..5..",
    "..55555..",
  ]),
  level("lord-5", "level.15", 5, [
    "6.6.6.6.6",
    "666666666",
    ".7.7.7.7.",
    "..77777..",
  ]),
  level("obsidian-steps", "level.16", 0, [
    "88.......",
    ".77......",
    "..66.....",
    "...55....",
    "....4....",
    "...55....",
    "..66.....",
    ".77......",
    "88.......",
    "555555555",
  ]),
  level("crimson-altar", "level.17", 0, [
    "..33333..",
    "....a....",
    "...999...",
    "..97779..",
    "...999...",
    ".3333333.",
  ]),
  level("lord-6", "level.18", 6, [
    "777777777",
    ".8.8.8.8.",
    "..88888..",
    ".8.8.8.8.",
  ]),
  level("hollow-surf", "level.19", 0, [
    "..88888..",
    ".8.....8.",
    ".8.666.8.",
    ".8.6.6.8.",
    ".8.666.8.",
    ".8.....8.",
    "..88888..",
  ]),
  level("pale-jaws", "level.20", 0, [
    "8.7.8.7.8",
    ".8.7.7.8.",
    "8.7.8.7.8",
    "..77777..",
    "...7.7...",
    "..77777..",
  ]),
  level("lord-7", "level.21", 7, [
    "888888888",
    ".9.9.9.9.",
    "..99999..",
    ".8.9.9.8.",
  ]),
  level("tomb-crown", "level.22", 0, [
    "9...9...9",
    ".9.9.9.9.",
    "999999999",
    ".9.9.9.9.",
    "..99999..",
  ]),
  level("last-pyramid", "level.23", 0, [
    "....8....",
    "...888...",
    "..88888..",
    ".8888888.",
    "888888888",
  ]),
  level("lord-8", "level.24", 8, [
    "999999999",
    ".a.a.a.a.",
    "..aaaaa..",
    ".9.a.a.9.",
  ]),
  level("night-flood", "level.25", 0, [
    "7.8.9.8.7",
    "8.9.a.9.8",
    "7.8.9.8.7",
    "8.9.9.9.8",
    "7.8.8.8.7",
  ]),
  level("black-bastion", "level.26", 0, [
    "..88888..",
    ".8.aaa.8.",
    ".8.a9a.8.",
    ".8.aaa.8.",
    "..88888..",
  ]),
  level("lord-9", "level.27", 9, [
    "aaaaaaaaa",
    ".9.a.a.9.",
    "..99999..",
    ".aaaaaaaa",
  ]),
  level("sacrifice-stone", "level.28", 0, [
    "..aaaaa..",
    "....a....",
    "..99999..",
    ".9a9a9a9.",
    "..99999..",
    ".3333333.",
  ]),
  level("final-spire", "level.29", 0, [
    "....a....",
    "...aaa...",
    "....a....",
    "...999...",
    "..99999..",
    "...999...",
    "..88888..",
    "...888...",
  ]),
  level("lord-10", "level.30", 10, [
    ".aaaaaaaa",
    "a.9aa9.a.",
    ".aaaaaaa.",
    "..99999..",
  ]),
]

export function levelAt(index: number): LevelDef {
  if (index >= 1 && index <= LEVELS.length) return LEVELS[index - 1]
  const wrapped = LEVELS[(Math.max(1, index) - 1) % LEVELS.length]
  const lap = Math.floor((Math.max(1, index) - 1) / LEVELS.length)
  const boss = index % 3 === 0
  return {
    id: `${wrapped.id}-e${lap}`,
    nameKey: wrapped.nameKey,
    boss,
    bossIndex: boss ? index / 3 : 0,
    cells: wrapped.cells.map((c) => ({
      col: c.col,
      row: c.row,
      hp: Math.min(10, c.hp + lap),
    })),
  }
}

export function brickWorldOrigin(): { ox: number; oy: number } {
  const totalW = GRID_COLS * (BALANCE.BRICK_W + BALANCE.BRICK_GAP) - BALANCE.BRICK_GAP
  const ox = -totalW / 2 + BALANCE.BRICK_W / 2
  const oy = 150
  return { ox, oy }
}
