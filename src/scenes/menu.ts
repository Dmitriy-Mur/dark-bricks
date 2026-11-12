import { t, getLang, setLang } from "../core/i18n"
import { hasSave, isEndlessUnlocked } from "../core/save"
import { getMusicVolume, getSfxVolume, playMusic, playSfx, setMusicVolume, setSfxVolume } from "../core/audio"
import { setPhase } from "../core/state"
import { openDifficultySelect } from "./difficulty"
import { continueGame } from "./gameplay"

function btn(): Style<UIButton> {
  return {
    backgroundColor: "#3a3028",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 12,
    width: "100%",
    alignItems: "center",
  }
}

function volumeRow(label: string, value: number, minusName: string, plusName: string, onChange: (v: number) => void): UIRow {
  return UIRow(
    UIText(label).style({ color: "#9a9088", fontSize: 13, width: 72 }),
    UIButton(UIText("−").style({ color: "#ccc" }))
      .named(minusName)
      .style({ padding: 8, backgroundColor: "#2a2420", borderRadius: 8 })
      .onClick(() => {
        onChange(Math.max(0, Math.round((value - 0.1) * 10) / 10))
        openMenu()
      }),
    UIText(`${Math.round(value * 100)}%`).style({ color: "#888", fontSize: 12, width: 44, textAlign: "center" }),
    UIButton(UIText("+").style({ color: "#ccc" }))
      .named(plusName)
      .style({ padding: 8, backgroundColor: "#2a2420", borderRadius: 8 })
      .onClick(() => {
        onChange(Math.min(1, Math.round((value + 0.1) * 10) / 10))
        openMenu()
      }),
  ).style({ marginTop: 10, alignItems: "center", gap: 8 })
}

export function openMenu(): void {
  setPhase("menu")
  playMusic("menu")
  const buttons: UIButton[] = []
  if (hasSave()) {
    buttons.push(
      UIButton(UIText(t("menu.continue")).style({ color: "#f2ece4", fontSize: 18 }))
        .named("continue")
        .style(btn())
        .onClick(() => {
          playSfx("ui")
          continueGame()
        }),
    )
  }
  buttons.push(
    UIButton(UIText(t("menu.new")).style({ color: "#f2ece4", fontSize: 18 }))
      .named("new_game")
      .style(btn())
      .onClick(() => {
        playSfx("ui")
        openDifficultySelect(false)
      }),
  )
  if (isEndlessUnlocked()) {
    buttons.push(
      UIButton(UIText(t("menu.endless")).style({ color: "#d7c4a2", fontSize: 18 }))
        .named("endless")
        .style(btn())
        .onClick(() => {
          playSfx("ui")
          openDifficultySelect(true)
        }),
    )
  }

  const langBtn = UIButton(UIText(getLang() === "en" ? "EN" : "RU").style({ color: "#c8bfb0", fontSize: 14 }))
    .named("lang")
    .style({ padding: 8, marginTop: 14, backgroundColor: "#241c18", borderRadius: 8 })
    .onClick(() => {
      setLang(getLang() === "en" ? "ru" : "en")
      playSfx("ui")
      openMenu()
    })

  UIScreen(
    UIColumn(
      UIText(t("app.title")).style({ color: "#e4d8c8", fontSize: 36, fontWeight: "700" }),
      ...buttons,
      langBtn,
      volumeRow(t("menu.music"), getMusicVolume(), "music_minus", "music_plus", setMusicVolume),
      volumeRow(t("menu.sfx"), getSfxVolume(), "sfx_minus", "sfx_plus", setSfxVolume),
    ).style({
      backgroundColor: "#1a1614",
      borderRadius: 20,
      padding: 28,
      alignItems: "center",
      width: "100%",
      maxWidth: 360,
    }),
  )
    .named("menu")
    .style({
      backgroundColor: "#0e0c0b",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    })
    .open()
}
