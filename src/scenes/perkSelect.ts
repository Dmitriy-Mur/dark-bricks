import { BALANCE } from "../config/balance"
import type { PerkId } from "../config/perks"
import { playSfx } from "../core/audio"
import { t } from "../core/i18n"
import { game, setPhase } from "../core/state"
import { levelAt } from "../config/levels"
import { applyPerk, rollPerkChoices } from "../systems/perks"
import { createPerkCard, statsBlock } from "../ui/perkCard"

export function openPerkSelect(scene: Scene2D, onDone: () => void): void {
  setPhase("perk_select")

  const show = () => {
    const choices = rollPerkChoices(game.perks)
    const seen = new Map<string, number>()
    let widget!: UIWidget

    const pick = (id: PerkId) => {
      playSfx("perk")
      applyPerk(id)
      game.perkQueue = Math.max(0, game.perkQueue - 1)
      console.log(`perk pick ${id}`)
      scene.widgets.remove(widget)
      if (game.perkQueue > 0) show()
      else {
        setPhase("gameplay")
        onDone()
      }
    }

    const cards = choices.map((id) => {
      const n = seen.get(id) ?? 0
      seen.set(id, n + 1)
      const name = n === 0 ? `perk_${id}` : `perk_${id}_${n}`
      return createPerkCard(id, game.perks, name, pick)
    })

    widget = UIWidget(
      UIScrollable(
        UIColumn(
          UIText(t("perk.title")).style({ color: "#e6dcc8", fontSize: 22, fontWeight: "700", textAlign: "left" }),
          ...cards,
          statsBlock(),
        ).style({ width: "100%", alignSelf: "stretch", alignItems: "stretch", padding: 16 }),
      ).style({ flexGrow: 1, width: "100%", alignItems: "stretch" }),
    )
      .named("perkSelect")
      .style({
        left: 12,
        right: 12,
        top: 36,
        bottom: 16,
        backgroundColor: "#161210f2",
        borderRadius: 16,
        overlayColor: "#000000c0",
        flexDirection: "column",
        alignItems: "stretch",
      })

    scene.widgets.append(widget)
  }

  show()
}

export function openBossIntro(onContinue: () => void): void {
  setPhase("boss_intro")
  const def = levelAt(game.levelIndex)
  let done = false
  let timer = 0

  const screen = UIScreen(
    UIColumn(
      UIText(t("boss.intro")).style({ color: "#c85a5a", fontSize: 26, fontWeight: "700", textAlign: "center" }),
      UIText(t(def.nameKey)).style({ color: "#c8bfb0", fontSize: 18, marginTop: 12, textAlign: "center" }),
      UIButton(UIText(t("boss.continue")).style({ color: "#f2ece4", fontSize: 16 }))
        .named("boss_go")
        .style({
          marginTop: 24,
          backgroundColor: "#3a2820",
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 32,
        })
        .onClick(() => go()),
    ).style({ padding: 28, alignItems: "center" }),
  )
    .named("bossIntro")
    .style({ backgroundColor: "#0a0808", alignItems: "center", justifyContent: "center" })

  const go = () => {
    if (done) return
    done = true
    clearTimeout(timer)
    playSfx("ui")
    screen.close()
    onContinue()
  }

  timer = setTimeout(go, BALANCE.BOSS_INTRO_MS)
  screen.onTouchStart(() => go())
  screen.onBack(() => go())
  screen.open()
}
