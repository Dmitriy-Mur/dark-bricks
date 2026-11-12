import { loadLangFromStorage } from "./core/i18n"
import { initAudio } from "./core/audio"
import { loadMeta } from "./core/save"
import { openMenu } from "./scenes/menu"

export function boot(): void {
  loadLangFromStorage()
  loadMeta()
  initAudio()
  openMenu()
}
