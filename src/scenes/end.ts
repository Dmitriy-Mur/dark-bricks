import type { DifficultyId } from "../config/balance"
import { clearSave, markEndlessUnlocked } from "../core/save"
import { playSfx } from "../core/audio"
import { t } from "../core/i18n"
import { game, resetRun, setPhase } from "../core/state"
import { openMenu } from "./menu"
import { startNewRun } from "./gameplay"

function btn(): Style<UIButton> {
  return {
    backgroundColor: "#2a2420",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 10,
    alignItems: "center",
    width: "100%",
  }
}

function perkLine(): string {
  const p = game.perks
  const bits: string[] = []
  if (p.damage) bits.push(`${t("perk.damage")} ${p.damage}`)
  if (p.crit) bits.push(`${t("perk.crit")} ${p.crit}`)
  if (p.pierce) bits.push(`${t("perk.pierce")} ${p.pierce}`)
  if (p.explosion) bits.push(`${t("perk.explosion")} ${p.explosion}`)
  if (p.width) bits.push(`${t("perk.width")} ${p.width}`)
  if (p.laser) bits.push(`${t("perk.laser")} ${p.laser}`)
  if (p.balls) bits.push(`${t("perk.balls")} ${p.balls}`)
  if (p.xp) bits.push(`${t("perk.xp")} ${p.xp}`)
  return bits.length > 0 ? bits.join(", ") : t("end.none")
}

function statsLines(): UIColumn {
  return UIColumn(
    UIText(t("end.stats")).style({ color: "#9a9088", fontSize: 14, marginTop: 12, marginBottom: 6 }),
    UIText(`${t("stat.level")}: ${game.levelIndex}`).style({ color: "#c0b8b0", fontSize: 13 }),
    UIText(`${t("stat.player")}: ${game.playerLevel}`).style({ color: "#c0b8b0", fontSize: 13 }),
    UIText(`${t("stat.bricks")}: ${game.bricksBroken}`).style({ color: "#c0b8b0", fontSize: 13 }),
    UIText(`${t("stat.lives")}: ${Math.max(0, game.lives)}`).style({ color: "#c0b8b0", fontSize: 13 }),
    UIText(`${t("stat.damage")}: ${Math.min(10, 1 + game.perks.damage)}`).style({ color: "#c0b8b0", fontSize: 13 }),
    UIText(`${t("stat.perks")}: ${perkLine()}`).style({
      color: "#c0b8b0",
      fontSize: 13,
      textWrap: "wrap",
      textAlign: "center",
      marginTop: 4,
    }),
  ).style({ alignItems: "center", maxWidth: 320 })
}

export function openVictory(): void {
  setPhase("victory")
  markEndlessUnlocked()
  clearSave()
  const screen = UIScreen(
    UIColumn(
      UIText(t("end.victory")).style({ color: "#c8d0a8", fontSize: 28, fontWeight: "700", textAlign: "center" }),
      UIText(t("end.victory.hint")).style({ color: "#7a9a6a", fontSize: 14, marginTop: 8, textAlign: "center" }),
      statsLines(),
      UIButton(UIText(t("end.endless")).style({ color: "#f2ece4", fontSize: 18 }))
        .named("victory_endless")
        .style(btn())
        .onClick(() => {
          playSfx("ui")
          game.endlessMode = true
          game.levelIndex = 31
          game.won = false
          game.perkQueue = 0
          screen.close()
          startNewRun()
        }),
      UIButton(UIText(t("end.restart")).style({ color: "#f2ece4", fontSize: 18 }))
        .named("victory_restart")
        .style(btn())
        .onClick(() => {
          playSfx("ui")
          const diff = game.difficulty
          screen.close()
          resetRun(diff, false)
          startNewRun()
        }),
      UIButton(UIText(t("end.menu")).style({ color: "#ccc", fontSize: 16 }))
        .named("victory_menu")
        .style(btn())
        .onClick(() => {
          playSfx("ui")
          screen.close()
          openMenu()
        }),
    ).style({ padding: 24, alignItems: "center", backgroundColor: "#141810", borderRadius: 16, width: "100%", maxWidth: 380 }),
  )
    .named("victory")
    .style({ backgroundColor: "#0a0c08", alignItems: "center", justifyContent: "center", padding: 20 })

  screen.onBack(() => openMenu())
  screen.open()
}

export function openDefeat(): void {
  setPhase("defeat")
  clearSave()
  const diff = game.difficulty as DifficultyId
  const endless = game.endlessMode
  const screen = UIScreen(
    UIColumn(
      UIText(t("end.defeat")).style({ color: "#aa5a5a", fontSize: 28, fontWeight: "700", textAlign: "center" }),
      statsLines(),
      UIButton(UIText(t("end.restart")).style({ color: "#f2ece4", fontSize: 18 }))
        .named("defeat_restart")
        .style(btn())
        .onClick(() => {
          playSfx("ui")
          screen.close()
          resetRun(diff, endless)
          startNewRun()
        }),
      UIButton(UIText(t("end.menu")).style({ color: "#ccc", fontSize: 16 }))
        .named("defeat_menu")
        .style(btn())
        .onClick(() => {
          playSfx("ui")
          screen.close()
          openMenu()
        }),
    ).style({ padding: 24, alignItems: "center", backgroundColor: "#1a1414", borderRadius: 16, width: "100%", maxWidth: 380 }),
  )
    .named("defeat")
    .style({ backgroundColor: "#0a0808", alignItems: "center", justifyContent: "center", padding: 20 })

  screen.onBack(() => openMenu())
  screen.open()
}
