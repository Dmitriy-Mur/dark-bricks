import type { PerkId, PerkStacks } from "../config/perks"
import {
  ballCount,
  ballDamage,
  critChance,
  explosionChance,
  game,
  laserShotsPerSecond,
  pierceMax,
  xpMultiplier,
} from "../core/state"
import { t } from "../core/i18n"
import { perkStackLabel } from "../systems/perks"

export function createPerkCard(
  id: PerkId,
  stacks: PerkStacks,
  name: string,
  onPick: (id: PerkId) => void,
): UIButton {
  const title = id === "life" ? t("perk.life") : t(`perk.${id}`)
  const desc = id === "life" ? t("perk.life.desc") : t(`perk.${id}.desc`)
  return UIButton(
    UIColumn(
      UIText(title).style({ color: "#e8e0d6", fontSize: 16, fontWeight: "700" }),
      UIText(perkStackLabel(id, stacks)).style({ color: "#c4b8a8", fontSize: 13, marginTop: 4 }),
      UIText(desc).style({ color: "#9a9088", fontSize: 12, marginTop: 6, textWrap: "wrap" }),
    ).style({ alignItems: "flex-start", padding: 12 }),
  )
    .named(name)
    .style({
      backgroundColor: "#2a2420",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#5a4036",
      marginTop: 8,
      width: "100%",
      alignItems: "stretch",
    })
    .onClick(() => onPick(id))
}

export function statsBlock(): UIColumn {
  const line = (label: string, val: string) =>
    UIRow(
      UIText(label).style({ color: "#8a8078", fontSize: 12, flexGrow: 1 }),
      UIText(val).style({ color: "#d0c8c0", fontSize: 12 }),
    ).style({ width: "100%", marginVertical: 1 })

  const widthPct = Math.round((1 + Math.min(10, game.perks.width) * 0.2) * 100)
  return UIColumn(
    UIText(t("perk.stats")).style({ color: "#c0b8b0", fontSize: 14, marginBottom: 6 }),
    line(t("perk.damage"), String(ballDamage())),
    line(t("perk.crit"), `${Math.round(critChance() * 100)}%`),
    line(t("perk.pierce"), String(pierceMax())),
    line(t("perk.explosion"), `${Math.round(explosionChance() * 100)}%`),
    line(t("perk.width"), `${widthPct}%`),
    line(t("perk.laser"), `${laserShotsPerSecond()}/s`),
    line(t("perk.balls"), String(ballCount())),
    line(t("perk.xp"), `${Math.round((xpMultiplier() - 1) * 100)}%`),
    line(t("hud.lives"), String(game.lives)),
  ).style({
    width: "100%",
    padding: 12,
    marginTop: 12,
    backgroundColor: "#120f0d",
    borderRadius: 10,
  })
}
