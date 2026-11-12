/** Brick and ball colors for HP / damage 1–10. Fixed. */
export const HP_COLORS = [
  "#7a8a68",
  "#5a7350",
  "#3f6359",
  "#465a70",
  "#544670",
  "#6e4459",
  "#70593a",
  "#8a702e",
  "#8a4a26",
  "#6b2222",
] as const

export function colorForHp(hp: number): string {
  const i = Math.max(1, Math.min(10, Math.round(hp))) - 1
  return HP_COLORS[i]
}
