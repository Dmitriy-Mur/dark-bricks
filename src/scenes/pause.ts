import { getMusicVolume, getSfxVolume, playSfx, setMusicVolume, setSfxVolume } from "../core/audio"
import { getLang, setLang, t } from "../core/i18n"

function btn(): Style<UIButton> {
  return {
    backgroundColor: "#2a2420",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 8,
    width: "100%",
    alignItems: "center",
  }
}

export function openPauseOverlay(scene: Scene2D, onResume: () => void, onSaveExit: () => void): void {
  let widget: UIWidget | null = null

  const dismiss = () => {
    if (widget) scene.widgets.remove(widget)
    widget = null
  }

  const build = () => {
    if (widget) scene.widgets.remove(widget)
    const music = getMusicVolume()
    const sfx = getSfxVolume()
    widget = UIWidget(
      UIColumn(
        UIText(t("pause.title")).style({ color: "#e6dcc8", fontSize: 22, fontWeight: "700" }),
        UIButton(UIText(t("pause.resume")).style({ color: "#f2ece4", fontSize: 18 }))
          .named("resume")
          .style(btn())
          .onClick(() => {
            playSfx("ui")
            dismiss()
            onResume()
          }),
        UIButton(UIText(t("pause.save")).style({ color: "#f2ece4", fontSize: 18 }))
          .named("save_exit")
          .style(btn())
          .onClick(() => {
            playSfx("ui")
            dismiss()
            onSaveExit()
          }),
        UIText(t("pause.settings")).style({ color: "#9a9088", fontSize: 13, marginTop: 14 }),
        UIRow(
          UIText(t("menu.music")).style({ color: "#c8bfb0", fontSize: 13, width: 72 }),
          UIButton(UIText("−").style({ color: "#ccc" }))
            .named("pause_music_minus")
            .style({ padding: 8, backgroundColor: "#2a2420", borderRadius: 8 })
            .onClick(() => {
              setMusicVolume(Math.max(0, Math.round((music - 0.1) * 10) / 10))
              build()
            }),
          UIText(`${Math.round(music * 100)}%`).style({ color: "#aaa", fontSize: 12, width: 40, textAlign: "center" }),
          UIButton(UIText("+").style({ color: "#ccc" }))
            .named("pause_music_plus")
            .style({ padding: 8, backgroundColor: "#2a2420", borderRadius: 8 })
            .onClick(() => {
              setMusicVolume(Math.min(1, Math.round((music + 0.1) * 10) / 10))
              build()
            }),
        ).style({ marginTop: 8, alignItems: "center", gap: 6 }),
        UIRow(
          UIText(t("menu.sfx")).style({ color: "#c8bfb0", fontSize: 13, width: 72 }),
          UIButton(UIText("−").style({ color: "#ccc" }))
            .named("pause_sfx_minus")
            .style({ padding: 8, backgroundColor: "#2a2420", borderRadius: 8 })
            .onClick(() => {
              setSfxVolume(Math.max(0, Math.round((sfx - 0.1) * 10) / 10))
              build()
            }),
          UIText(`${Math.round(sfx * 100)}%`).style({ color: "#aaa", fontSize: 12, width: 40, textAlign: "center" }),
          UIButton(UIText("+").style({ color: "#ccc" }))
            .named("pause_sfx_plus")
            .style({ padding: 8, backgroundColor: "#2a2420", borderRadius: 8 })
            .onClick(() => {
              setSfxVolume(Math.min(1, Math.round((sfx + 0.1) * 10) / 10))
              build()
            }),
        ).style({ marginTop: 8, alignItems: "center", gap: 6 }),
        UIButton(UIText(`${t("pause.lang")}: ${getLang() === "en" ? "EN" : "RU"}`).style({ color: "#ddd", fontSize: 15 }))
          .named("pause_lang")
          .style(btn())
          .onClick(() => {
            setLang(getLang() === "en" ? "ru" : "en")
            playSfx("ui")
            build()
          }),
      ).style({
        padding: 20,
        backgroundColor: "#1a1614",
        borderRadius: 14,
        width: "100%",
        maxWidth: 320,
        alignItems: "stretch",
      }),
    )
      .named("pause")
      .style({
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        overlayColor: "#00000088",
      })

    widget.onBack(() => {
      dismiss()
      onResume()
    })
    scene.widgets.append(widget)
  }

  build()
}
