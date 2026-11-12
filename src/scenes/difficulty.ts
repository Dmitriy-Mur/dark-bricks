import type { DifficultyId } from "../config/balance"
import { playSfx } from "../core/audio"
import { t } from "../core/i18n"
import { resetRun, setPhase } from "../core/state"
import { openMenu } from "./menu"
import { startNewRun } from "./gameplay"

const IDS: DifficultyId[] = ["twilight", "curse", "abyss"]

export function openDifficultySelect(endless = false): void {
  setPhase("difficulty")
  const cards = IDS.map((id) =>
    UIButton(
      UIColumn(
        UIText(t(`diff.${id}`)).style({ color: "#e0d6cc", fontSize: 20, fontWeight: "700" }),
        UIText(t(`diff.${id}.desc`)).style({
          color: "#9a9088",
          fontSize: 13,
          marginTop: 8,
          textWrap: "wrap",
        }),
      ).style({ padding: 14, alignItems: "flex-start" }),
    )
      .named(`diff_${id}`)
      .style({
        backgroundColor: "#241e1a",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#4a3a32",
        marginTop: 8,
        width: "100%",
      })
      .onClick(() => {
        playSfx("ui")
        resetRun(id, endless)
        startNewRun()
      }),
  )

  const screen = UIScreen(
    UIColumn(
      UIText(t("diff.title")).style({ color: "#c8bfb0", fontSize: 24, marginBottom: 8 }),
      ...cards,
      UIButton(UIText(t("nav.back")).style({ color: "#b0a69c", fontSize: 14 }))
        .named("diff_back")
        .style({ marginTop: 16, padding: 8 })
        .onClick(() => {
          playSfx("ui")
          openMenu()
        }),
    ).style({ padding: 8, maxWidth: 420, width: "100%" }),
  )
    .named("difficulty")
    .style({
      backgroundColor: "#0e0c0b",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    })

  screen.onBack(() => openMenu())
  screen.open()
}
