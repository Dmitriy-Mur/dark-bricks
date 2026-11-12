import { BALANCE } from "../config/balance"
import { levelAt } from "../config/levels"
import { game } from "../core/state"
import { t } from "../core/i18n"

type Slot = { el: UIText; x: number; y: number; life: number }

let slots: Slot[] = []

export function spawnFloater(text: string, x: number, y: number): void {
  const slot = slots.find((s) => s.life <= 0)
  if (!slot) return
  slot.life = 0.7
  slot.x = x
  slot.y = y
  slot.el.text = text
  slot.el.style.opacity = 1
}

export function updateFloaters(cam: Camera2D, dt: number): void {
  for (const s of slots) {
    if (s.life <= 0) {
      s.el.style.opacity = 0
      continue
    }
    s.life -= dt
    s.y += 28 * dt
    const p = cam.worldToScreen(s.x, s.y)
    s.el.style.left = p.x - 10
    s.el.style.top = p.y - 12
    s.el.style.opacity = Math.max(0, s.life / 0.7)
  }
}

export function createFloaters(): UIWidget {
  slots = []
  const nodes: UIText[] = []
  for (let i = 0; i < 8; i++) {
    const el = UIText("").style({
      position: "absolute",
      color: "#f7f4ee",
      fontSize: 18,
      fontWeight: "700",
      opacity: 0,
      left: 0,
      top: 0,
    })
    slots.push({ el, x: 0, y: 0, life: 0 })
    nodes.push(el)
  }
  return UIWidget(...nodes)
    .named("floaters")
    .style({ left: 0, right: 0, top: 0, bottom: 0, pointerEvents: "none" })
}

export function createHud(onPause: () => void): UIWidget {
  const levelLabel = UIText("").style({ color: "#d8cfc4", fontSize: 13 })
  const playerLabel = UIText("").style({ color: "#8d847c", fontSize: 12 })
  const nameLabel = UIText("").style({ color: "#c4b8a8", fontSize: 14, fontWeight: "700" })
  const livesLabel = UIText("").style({ color: "#c45a5a", fontSize: 16 })
  const xpLabel = UIText("").style({ color: "#8a8078", fontSize: 11, marginRight: 8 })
  const xpBarFill = UIBox().style({
    width: "0%",
    height: "100%",
    backgroundColor: "#6a8a5a",
    borderRadius: 4,
    alignSelf: "flex-start",
  })
  const xpBarBg = UIBox(xpBarFill).style({
    flexGrow: 1,
    height: 10,
    backgroundColor: "#2a2220",
    borderRadius: 4,
    overflow: "hidden",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "stretch",
  })

  const pauseBtn = UIButton(UIText("II").style({ color: "#d9d0c6", fontSize: 14, fontWeight: "700" }))
    .named("pause")
    .style({
      position: "absolute",
      right: 8,
      top: 8,
      width: 36,
      height: 36,
      backgroundColor: "#1a181899",
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    })
    .onClick(onPause)

  const refresh = () => {
    const def = levelAt(game.levelIndex)
    levelLabel.text = `${t("hud.level")} ${game.levelIndex}`
    playerLabel.text = `${t("hud.player")} ${game.playerLevel}`
    nameLabel.text = t(def.nameKey)
    const hearts = game.lives <= 6 ? "♥".repeat(Math.max(0, game.lives)) : `♥×${game.lives}`
    livesLabel.text = hearts.length > 0 ? hearts : "·"
    xpLabel.text = t("hud.xp")
    const ratio = Math.max(0, Math.min(1, game.xp / BALANCE.XP_TO_LEVEL))
    xpBarFill.style.width = `${Math.round(ratio * 1000) / 10}%`
  }

  const body = UIColumn(
    nameLabel,
    UIRow(levelLabel, playerLabel).style({ gap: 10, marginTop: 2 }),
    UIRow(livesLabel).style({ marginTop: 2, alignItems: "center" }),
    UIRow(xpLabel, xpBarBg).style({ marginTop: 6, alignItems: "center", width: "100%" }),
  )
    .named("hud")
    .style({ alignItems: "stretch", width: "100%", paddingTop: 10, paddingLeft: 14, paddingRight: 52 })

  const hud = UIWidget(body, pauseBtn)
    .named("gameplay")
    .style({ left: 0, right: 0, top: 0 })

  refreshers.set(hud, refresh)
  refresh()
  return hud
}

const refreshers = new WeakMap<UIWidget, () => void>()

export function refreshHud(hud: UIWidget): void {
  refreshers.get(hud)?.()
}
