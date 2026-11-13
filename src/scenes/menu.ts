import { t, getLang, setLang } from "../core/i18n"
import { hasSave, isEndlessUnlocked } from "../core/save"
import { getMusicVolume, getSfxVolume, playMusic, playSfx, setMusicVolume, setSfxVolume } from "../core/audio"
import { setPhase } from "../core/state"
import { volumeSlider } from "../ui/slider"
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

  const langBtn = UIButton(
    UIText(`${t("pause.lang")}: ${getLang() === "en" ? "EN" : "RU"}`).style({ color: "#ddd", fontSize: 15 }),
  )
    .named("lang")
    .style({
      backgroundColor: "#2a2420",
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 20,
      marginTop: 8,
      width: "100%",
      alignItems: "center",
    })
    .onClick(() => {
      setLang(getLang() === "en" ? "ru" : "en")
      playSfx("ui")
      openMenu()
    })

  UIScreen(
    UIColumn(
      UIText(t("app.title")).style({ color: "#e4d8c8", fontSize: 36, fontWeight: "700", textAlign: "center" }),
      ...buttons,
      langBtn,
      volumeSlider(t("menu.music"), getMusicVolume(), "music", setMusicVolume),
      volumeSlider(t("menu.sfx"), getSfxVolume(), "sfx", setSfxVolume),
    ).style({
      backgroundColor: "#1a1614",
      borderRadius: 20,
      padding: 28,
      alignItems: "stretch",
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
