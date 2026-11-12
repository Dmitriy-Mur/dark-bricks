import { BALANCE } from "../config/balance"

export type SfxId =
  | "hit"
  | "break"
  | "laser"
  | "crit"
  | "boom"
  | "shot"
  | "bossDie"
  | "life"
  | "level"
  | "perk"
  | "ui"

export type MusicKind = "menu" | "level" | "boss"

let musicVol = 0.6
let sfxVol = 0.8
let want: MusicKind = "menu"
let playing: MusicKind | null = null
let musicVoice: Voice | null = null

const musicClips: Partial<Record<MusicKind, Sound>> = {}
const sfxClips: Partial<Record<SfxId, Sound>> = {}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

function applyBuses(): void {
  if (!audio.supported) return
  audio.bus("music").volume = musicVol
  audio.bus("sfx").volume = sfxVol
  audio.bus("music").reverb = { roomSize: 0.72, damping: 0.45, mix: 0.28, width: 0.8 }
}

function startMusic(): void {
  const clip = musicClips[want]
  if (!clip || !audio.supported) return
  if (playing === want && musicVoice?.playing) return
  if (musicVoice) musicVoice.stop({ fade: 0.25 })
  musicVoice = audio.play(clip, { loop: true, bus: "music", volume: 1, fade: 0.3 })
  playing = want
}

function loadClip(url: string, into: (s: Sound) => void): void {
  Sound.load(url)
    .then((s) => {
      into(s)
      if (musicClips[want]) startMusic()
    })
    .catch(() => {
      /* host without a decoder stays silent */
    })
}

export function initAudio(): void {
  const m = localStorage.getItem(BALANCE.VOL_MUSIC_KEY)
  const s = localStorage.getItem(BALANCE.VOL_SFX_KEY)
  if (m != null && m !== "") musicVol = clamp01(parseFloat(m))
  if (s != null && s !== "") sfxVol = clamp01(parseFloat(s))
  applyBuses()
  if (!audio.supported) return
  loadClip(asset("../../assets/music-menu.wav"), (snd) => {
    musicClips.menu = snd
  })
  loadClip(asset("../../assets/music-level.wav"), (snd) => {
    musicClips.level = snd
  })
  loadClip(asset("../../assets/music-boss.wav"), (snd) => {
    musicClips.boss = snd
  })
  loadClip(asset("../../assets/sfx-hit.wav"), (snd) => {
    sfxClips.hit = snd
  })
  loadClip(asset("../../assets/sfx-break.wav"), (snd) => {
    sfxClips.break = snd
  })
  loadClip(asset("../../assets/sfx-laser.wav"), (snd) => {
    sfxClips.laser = snd
  })
  loadClip(asset("../../assets/sfx-crit.wav"), (snd) => {
    sfxClips.crit = snd
  })
  loadClip(asset("../../assets/sfx-boom.wav"), (snd) => {
    sfxClips.boom = snd
  })
  loadClip(asset("../../assets/sfx-shot.wav"), (snd) => {
    sfxClips.shot = snd
  })
  loadClip(asset("../../assets/sfx-bossdie.wav"), (snd) => {
    sfxClips.bossDie = snd
  })
  loadClip(asset("../../assets/sfx-life.wav"), (snd) => {
    sfxClips.life = snd
  })
  loadClip(asset("../../assets/sfx-level.wav"), (snd) => {
    sfxClips.level = snd
  })
  loadClip(asset("../../assets/sfx-perk.wav"), (snd) => {
    sfxClips.perk = snd
  })
  loadClip(asset("../../assets/sfx-ui.wav"), (snd) => {
    sfxClips.ui = snd
  })
}

export function getMusicVolume(): number {
  return musicVol
}

export function getSfxVolume(): number {
  return sfxVol
}

export function setMusicVolume(v: number): void {
  musicVol = clamp01(v)
  localStorage.setItem(BALANCE.VOL_MUSIC_KEY, String(musicVol))
  applyBuses()
}

export function setSfxVolume(v: number): void {
  sfxVol = clamp01(v)
  localStorage.setItem(BALANCE.VOL_SFX_KEY, String(sfxVol))
  applyBuses()
}

export function playSfx(id: SfxId): void {
  const clip = sfxClips[id]
  if (clip && audio.supported) audio.play(clip, { bus: "sfx", volume: 1 })
  if (id === "ui" || id === "life") device.vibrate(id === "life" ? "heavy" : "light")
}

export function playMusic(kind: MusicKind): void {
  want = kind
  startMusic()
}

export function stopMusic(fade = 0.3): void {
  if (musicVoice) musicVoice.stop({ fade })
  musicVoice = null
  playing = null
}
