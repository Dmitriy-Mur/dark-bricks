import { BALANCE, diffMult } from "../config/balance"
import { levelAt } from "../config/levels"
import { playMusic, playSfx } from "../core/audio"
import { t } from "../core/i18n"
import { continueFromSave, markEndlessUnlocked, saveGame } from "../core/save"
import {
  ballCount,
  ballDamage,
  critChance,
  explosionChance,
  game,
  laserShotsPerSecond,
  onLifeLost,
  pierceMax,
  setPhase,
} from "../core/state"
import { freeBall, makeBall, serveY, syncBallVisual, type BallEntity } from "../entities/ball"
import { bossBounds, bossY, freeBoss, syncBossVisual, type BossEntity } from "../entities/boss"
import { brickBounds, freeBrick, syncBrickVisual, type BrickEntity } from "../entities/brick"
import { freeLaser, makeLaser, syncLaserVisual, type LaserBolt } from "../entities/laser"
import { freePaddle, syncPaddleVisual, type PaddleEntity } from "../entities/paddle"
import { freeProjectile, makeProjectile, syncProjectileVisual, type ProjectileEntity } from "../entities/projectile"
import { colorForHp } from "../config/palette"
import {
  arkanoidBounce,
  ballBossHit,
  ballBrickHit,
  ballPaddleHit,
  laserTarget,
  projectileCoreHit,
  pushBallThrough,
  resolveBallBrickBounce,
  separateBelowBoss,
} from "../systems/collision"
import { clearBursts, shakeOffset, spawnBurst, spawnGrit, spawnImpact, tickShake, triggerShake, updateBursts } from "../systems/particles"
import { clampPaddleX, integrateBall, integrateBoss, integrateProjectile } from "../systems/physics"
import { launchStuck, layoutStuck, spawnBoss, spawnFreshBalls, spawnPaddle, bricksForLevel } from "../systems/spawn"
import { grantBrickXp } from "../systems/xp"
import { createFloaters, createHud, refreshHud, spawnFloater, updateFloaters } from "../ui/hud"
import { openVictory, openDefeat } from "./end"
import { openMenu } from "./menu"
import { openPauseOverlay } from "./pause"
import { openBossIntro, openPerkSelect } from "./perkSelect"

/**
 * Serve: balls stick to the paddle until the pointer is released.
 * Pointer down and move drag the paddle. Pointer up launches every stuck ball.
 * A tap (down then up) places the paddle and serves. The pause icon is the only button;
 * the UI claims that touch before it reaches the scene.
 */

let scene: Scene2D | null = null
let loopId = 0
let generation = 0
let paddle: PaddleEntity | null = null
let balls: BallEntity[] = []
let bricks: BrickEntity[] = []
let boss: BossEntity | null = null
let projectiles: ProjectileEntity[] = []
let aim: LaserBolt | null = null
let aimT = 0
let hud: UIWidget | null = null
let banner: UIWidget | null = null
let bannerLabel: UIText | null = null
let bannerT = 0
let perkOpen = false
let pauseOpen = false
let transitioning = false
let laserCooldown = 0.4
let keysBound = false
let frame: {
  bg: Path2D
  left: Path2D
  right: Path2D
  top: Path2D
  bottom: Path2D
} | null = null

function bindKeys(): void {
  if (keysBound) return
  keysBound = true
  // Headless flows send KeyK to destroy one brick. There is no on-screen control.
  Input.on("keydown", (e) => {
    if (e.repeat || e.code !== "KeyK") return
    debugDestroyBrick()
  })
}

function debugDestroyBrick(): void {
  if (!scene || game.phase !== "gameplay" || perkOpen || pauseOpen) return
  const brick = bricks.find((b) => b.alive)
  if (!brick) return
  damageBrick(brick, brick.hp, {})
}

function levelIsClear(): boolean {
  if (bricks.some((b) => b.alive)) return false
  if (boss && boss.alive) return false
  return true
}

function fitCamera(): { y: number; zoom: number } {
  const w = device.width > 0 ? device.width : 390
  const h = device.height > 0 ? device.height : 844
  const zoom = Math.min(w / BALANCE.FIELD_W, h / BALANCE.FIELD_H) * 0.94
  return { y: 36, zoom: Math.max(0.25, zoom) }
}

/** Board fill and the frame cover the whole viewport, including above and below the playfield. */
function layoutFrame(): void {
  if (!scene || !frame) return
  const w = device.width > 0 ? device.width : 390
  const h = device.height > 0 ? device.height : 844
  const zoom = Math.max(0.25, scene.camera.zoom)
  const cam = scene.camera.position
  const viewW = w / zoom
  const viewH = h / zoom
  const bleed = 40
  const thick = 12
  frame.bg.position = new Vec2(cam.x, cam.y)
  frame.bg.scale = new Vec2(viewW + bleed * 2, viewH + bleed * 2)
  const sideH = viewH + bleed * 2
  frame.left.position = new Vec2(-BALANCE.FIELD_W / 2 - thick / 2, cam.y)
  frame.right.position = new Vec2(BALANCE.FIELD_W / 2 + thick / 2, cam.y)
  frame.left.scale = new Vec2(thick, sideH)
  frame.right.scale = new Vec2(thick, sideH)
  const railW = viewW + bleed * 2
  frame.top.position = new Vec2(cam.x, cam.y + viewH / 2 - thick / 2)
  frame.bottom.position = new Vec2(cam.x, cam.y - viewH / 2 + thick / 2)
  frame.top.scale = new Vec2(railW, thick)
  frame.bottom.scale = new Vec2(railW, thick)
}

function clearActors(): void {
  for (const b of balls) freeBall(b)
  for (const b of bricks) freeBrick(b)
  for (const p of projectiles) freeProjectile(p)
  clearAim()
  if (boss) freeBoss(boss)
  balls = []
  bricks = []
  projectiles = []
  boss = null
}

function teardownScene(): void {
  generation += 1
  if (loopId) clearLoop(loopId)
  loopId = 0
  clearBursts()
  clearActors()
  if (paddle) freePaddle(paddle)
  paddle = null
  hud = null
  banner = null
  bannerLabel = null
  perkOpen = false
  pauseOpen = false
  frame = null
  if (scene) {
    scene.close()
    scene.destroy()
    scene = null
  }
}

function hideBanner(): void {
  bannerT = 0
  if (banner) banner.style.display = "none"
}

function showFallenBanner(): void {
  if (!banner || !bannerLabel) return
  bannerLabel.text = t("boss.fallen")
  banner.style.display = "flex"
  bannerT = BALANCE.BOSS_DEATH_DELAY
}

function loadLevel(): void {
  if (!scene || !paddle) return
  transitioning = false
  clearActors()
  hideBanner()
  paddle.x = 0
  bricks = bricksForLevel(game.levelIndex)
  boss = spawnBoss(game.levelIndex)
  balls = spawnFreshBalls(paddle.x)
  laserCooldown = 0.35
  const def = levelAt(game.levelIndex)
  playMusic(def.boss ? "boss" : "level")
  console.log(`level start ${game.levelIndex} ${t(def.nameKey)}`)
  syncWorld()
}

function syncWorld(): void {
  if (!scene || !paddle) return
  syncPaddleVisual(paddle, scene)
  for (const b of bricks) syncBrickVisual(b, scene)
  for (const b of balls) syncBallVisual(b, scene)
  if (boss && boss.alive) syncBossVisual(boss, scene)
  for (const p of projectiles) syncProjectileVisual(p, scene)
  if (hud) refreshHud(hud)
}

function neighborBricks(b: BrickEntity): BrickEntity[] {
  return bricks.filter(
    (o) => o.alive && o.id !== b.id && Math.abs(o.col - b.col) + Math.abs(o.row - b.row) === 1,
  )
}

function damageBrick(
  b: BrickEntity,
  dmg: number,
  opts: { pierce?: boolean; laser?: boolean; explosion?: boolean },
): void {
  if (!b.alive || !scene) return
  const direct = !opts.pierce && !opts.laser && !opts.explosion
  let damage = dmg
  const bounds = brickBounds(b)
  const cx = (bounds.left + bounds.right) / 2
  const cy = (bounds.top + bounds.bottom) / 2
  if (direct && Math.random() < critChance()) {
    damage *= BALANCE.CRIT_MULT
    playSfx("crit")
    spawnFloater(t("crit.mark"), cx, cy)
    spawnBurst(scene, cx, cy, "#f4f1ea", 6, 50)
  }
  b.hp -= damage
  if (b.hp <= 0) {
    b.alive = false
    game.bricksBroken += 1
    grantBrickXp()
    playSfx("break")
    console.log(`brick destroyed xp=${game.xp} player=${game.playerLevel}`)
    spawnGrit(scene, cx, cy, colorForHp(b.maxHp))
    if (direct && Math.random() < explosionChance()) {
      playSfx("boom")
      triggerShake()
      spawnBurst(scene, cx, cy, "#c4552a", 12, 100)
      for (const n of neighborBricks(b)) damageBrick(n, BALANCE.EXPLOSION_DMG, { explosion: true })
    }
  } else {
    playSfx("hit")
  }
  syncBrickVisual(b, scene)
}

function onBossDamaged(amount: number, allowCrit: boolean): void {
  if (!boss || !boss.alive || !scene) return
  let damage = amount
  if (allowCrit && Math.random() < critChance()) {
    damage *= BALANCE.CRIT_MULT
    playSfx("crit")
    spawnFloater(t("crit.mark"), boss.x, bossY())
    spawnBurst(scene, boss.x, bossY() - 10, "#f4f1ea", 6, 40)
  }
  boss.hp -= damage
  if (boss.hp <= 0) killBoss()
  else syncBossVisual(boss, scene)
}

function killBoss(): void {
  if (!boss || !boss.alive || !scene) return
  const x = boss.x
  const y = bossY()
  boss.alive = false
  playSfx("bossDie")
  spawnBurst(scene, x, y, "#6b2222", 20, 120)
  syncBossVisual(boss, scene)
  showFallenBanner()
  console.log(`boss fallen ${t("boss.fallen")}`)
}

function loseLife(): void {
  playSfx("life")
  onLifeLost()
  for (const p of projectiles) freeProjectile(p)
  projectiles = []
  clearAim()
  if (game.phase === "defeat") {
    teardownScene()
    openDefeat()
    return
  }
  if (!paddle) return
  for (const b of balls) freeBall(b)
  balls = spawnFreshBalls(paddle.x)
  if (boss && boss.alive) boss.shootTimer = Math.max(boss.shootTimer, 1.1)
  syncWorld()
}

function ballsInPlay(): boolean {
  return balls.length > 0 && balls.every((b) => !b.stuck)
}

function clearAim(): void {
  aimT = 0
  if (!aim) return
  freeLaser(aim)
  aim = null
}

function tickAim(step: number): void {
  if (aimT <= 0) return
  aimT -= step
  if (aimT <= 0) clearAim()
}

/** Top of the playfield. World Y grows upward. */
function fieldTop(): number {
  return BALANCE.FIELD_H / 2
}

function paddleMouth(): number {
  return BALANCE.PADDLE_Y + BALANCE.PADDLE_H / 2
}

/**
 * End of the upward beam: the near face of the closest brick or boss in the
 * paddle column, or the top edge of the level when that column is empty.
 */
function beamStop(): { y: number; hit: ReturnType<typeof laserTarget> } {
  const origin = paddleMouth()
  const ceiling = fieldTop()
  if (!paddle) return { y: ceiling, hit: null }
  const hit = laserTarget(bricks, boss, paddle.x, origin)
  if (!hit) return { y: ceiling, hit: null }
  const face = hit.kind === "brick" ? brickBounds(hit.brick).bottom : bossBounds(hit.boss).bottom
  return { y: Math.min(ceiling, face), hit }
}

/** One shot: a short flash from the paddle to the stop point, then the line is gone. */
function fireLaser(): void {
  if (!scene || !paddle || !ballsInPlay()) return
  const origin = paddleMouth()
  const { y, hit } = beamStop()
  if (y <= origin + 1) return
  clearAim()
  aim = makeLaser(paddle.x, origin, y)
  syncLaserVisual(aim, scene)
  aimT = 0.07
  playSfx("laser")
  if (!hit) return
  if (hit.kind === "brick") damageBrick(hit.brick, BALANCE.LASER_DMG, { laser: true })
  else onBossDamaged(BALANCE.LASER_DMG, false)
  spawnImpact(scene, paddle.x, y)
}

function collideBall(ball: BallEntity): void {
  if (!paddle) return
  if (ballPaddleHit(ball, paddle)) {
    ball.pierceLeft = pierceMax()
    arkanoidBounce(ball, paddle)
  }
  ball.touched = ball.touched.filter((id) => {
    const brick = bricks.find((b) => b.id === id)
    return brick ? ballBrickHit(ball, brick) : false
  })
  for (const brick of bricks) {
    if (!brick.alive || !ballBrickHit(ball, brick)) continue
    if (ball.touched.indexOf(brick.id) >= 0) continue
    ball.touched.push(brick.id)
    // Pierce charges are spent only on bricks and refill only on a paddle touch or respawn.
    // A charged hit passes through (no bounce, no crit, no explosion). At 0 the ball bounces.
    if (ball.pierceLeft > 0) {
      damageBrick(brick, ballDamage(), { pierce: true })
      ball.pierceLeft -= 1
      pushBallThrough(ball, brick)
    } else {
      damageBrick(brick, ballDamage(), {})
      resolveBallBrickBounce(ball, brick)
      break
    }
  }
  if (boss && boss.alive && ballBossHit(ball, boss)) {
    onBossDamaged(ballDamage(), true)
    separateBelowBoss(ball, boss)
  }
}

function updateBoss(dt: number): void {
  if (!boss || !boss.alive || !scene) return
  integrateBoss(boss, dt)
  boss.tear += dt * 1.6
  const wasPhase2 = boss.phase2
  boss.phase2 = boss.hp <= boss.maxHp * 0.5
  if (!wasPhase2 && boss.phase2) {
    spawnBurst(scene, boss.x - 52, bossY() + 4, "#6b2222", 8, 36)
    spawnBurst(scene, boss.x + 52, bossY() + 4, "#6b2222", 8, 36)
  }
  boss.shootTimer -= dt
  if (boss.shootTimer <= 0) {
    boss.shootTimer = boss.shootCooldown
    playSfx("shot")
    const speed = boss.projectileSpeed
    const y = bossBounds(boss).bottom - 8
    const angles = boss.phase2 ? [-20, 0, 20] : [0]
    for (const deg of angles) {
      const a = (deg * Math.PI) / 180
      const shot = makeProjectile(boss.x, y, Math.sin(a) * speed, -Math.cos(a) * speed)
      projectiles.push(shot)
      syncProjectileVisual(shot, scene)
    }
  }
  syncBossVisual(boss, scene)
}

function ensureBallCount(): void {
  if (!paddle || !scene) return
  const want = ballCount()
  const flying = balls.some((b) => !b.stuck)
  while (balls.length < want) {
    const extra = makeBall(paddle.x, serveY())
    extra.pierceLeft = pierceMax()
    extra.stuck = !flying
    if (flying) {
      const speed = BALANCE.BALL_SPEED_BASE * diffMult(game.difficulty)
      const spread = (balls.length - (want - 1) / 2) * 0.16
      extra.vx = Math.sin(spread) * speed
      extra.vy = Math.abs(Math.cos(spread) * speed)
    }
    balls.push(extra)
  }
  layoutStuck(balls, paddle.x)
  for (const ball of balls) syncBallVisual(ball, scene)
}

function openPerks(): void {
  if (!scene || perkOpen) return
  perkOpen = true
  openPerkSelect(scene, () => {
    perkOpen = false
    ensureBallCount()
    if (paddle && scene) syncPaddleVisual(paddle, scene)
    setPhase("gameplay")
    if (hud) refreshHud(hud)
    if (levelIsClear() && bannerT <= 0) beginLevelEnd()
  })
}

function beginLevelEnd(): void {
  if (transitioning) return
  if (game.perkQueue > 0) {
    openPerks()
    return
  }
  if (!game.endlessMode && game.levelIndex >= 30) {
    transitioning = true
    markEndlessUnlocked()
    teardownScene()
    openVictory()
    return
  }
  transitioning = true
  game.levelIndex += 1
  if (levelAt(game.levelIndex).boss) {
    teardownScene()
    openBossIntro(() => setupScene())
    return
  }
  loadLevel()
}

function openPause(): void {
  if (!scene || pauseOpen || perkOpen || game.phase !== "gameplay") return
  pauseOpen = true
  setPhase("pause")
  openPauseOverlay(
    scene,
    () => {
      pauseOpen = false
      setPhase("gameplay")
      if (hud) refreshHud(hud)
    },
    () => {
      saveGame()
      teardownScene()
      openMenu()
    },
  )
}

function dropLostBalls(): boolean {
  const kept: BallEntity[] = []
  for (const b of balls) {
    if (b.stuck || b.y >= BALANCE.LOST_Y) kept.push(b)
    else freeBall(b)
  }
  balls = kept
  if (balls.length === 0) {
    loseLife()
    return true
  }
  return false
}

function tick(dt: number): void {
  if (!scene || !paddle) return
  const step = Math.min(0.05, dt)
  const fit = fitCamera()
  tickShake(step)
  const j = shakeOffset(fit.zoom)
  scene.camera.zoom = fit.zoom
  scene.camera.position = new Vec2(j.x, fit.y + j.y)
  layoutFrame()
  updateBursts(step)
  updateFloaters(scene.camera, step)

  if (perkOpen || pauseOpen || game.phase !== "gameplay") {
    if (hud) refreshHud(hud)
    return
  }

  if (bannerT > 0) {
    bannerT -= step
    if (bannerT <= 0) hideBanner()
  }

  if (levelIsClear()) {
    clearAim()
    if (bannerT > 0) {
      if (hud) refreshHud(hud)
      return
    }
    beginLevelEnd()
    return
  }

  layoutStuck(balls, paddle.x)
  tickAim(step)

  const rate = laserShotsPerSecond()
  if (ballsInPlay() && rate > 0) {
    laserCooldown -= step
    const interval = 1 / (rate * diffMult(game.difficulty))
    if (laserCooldown <= 0) {
      fireLaser()
      laserCooldown = interval
    }
  }

  updateBoss(step)

  for (const shot of [...projectiles]) {
    integrateProjectile(shot, step)
    if (projectileCoreHit(shot, paddle)) {
      freeProjectile(shot)
      projectiles = projectiles.filter((p) => p !== shot)
      loseLife()
      return
    }
    if (shot.y < BALANCE.LOST_Y - 30) {
      freeProjectile(shot)
      projectiles = projectiles.filter((p) => p !== shot)
    } else {
      syncProjectileVisual(shot, scene)
    }
  }

  for (const ball of balls) {
    integrateBall(ball, step, () => collideBall(ball))
    syncBallVisual(ball, scene)
  }
  if (dropLostBalls()) return

  syncPaddleVisual(paddle, scene)
  for (const b of bricks) if (b.alive) syncBrickVisual(b, scene)
  if (hud) refreshHud(hud)
  if (levelIsClear() && bannerT <= 0) beginLevelEnd()
}

function setupScene(): void {
  teardownScene()
  bindKeys()
  const sc = new Scene2D({ background: "#14110f", filter: "linear" })
  scene = sc
  const bg = Path2D.rect([1, 1], { fill: "#14110f", z: 0 })
  const wallL = Path2D.rect([1, 1], { fill: "#241c18", z: 1 })
  const wallR = Path2D.rect([1, 1], { fill: "#241c18", z: 1 })
  const wallT = Path2D.rect([1, 1], { fill: "#241c18", z: 1 })
  const wallB = Path2D.rect([1, 1], { fill: "#241c18", z: 1 })
  const pit = Path2D.rect([BALANCE.FIELD_W, 6], { fill: "#4a1515", z: 1 })
  pit.position = new Vec2(0, -BALANCE.FIELD_H / 2 + 2)
  const ceiling = Path2D.rect([BALANCE.FIELD_W + 24, 8], { fill: "#7a6c62", z: 2 })
  ceiling.position = new Vec2(0, BALANCE.FIELD_H / 2)
  frame = { bg, left: wallL, right: wallR, top: wallT, bottom: wallB }
  sc.add(bg, wallL, wallR, wallT, wallB, pit, ceiling)
  const fit = fitCamera()
  sc.camera.zoom = fit.zoom
  sc.camera.position = new Vec2(0, fit.y)
  layoutFrame()

  paddle = spawnPaddle()
  hud = createHud(() => openPause())
  const floaters = createFloaters()
  bannerLabel = UIText("").style({
    color: "#e8d4c4",
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Georgia",
    textAlign: "center",
  })
  banner = UIWidget(UIColumn(bannerLabel).style({ alignItems: "center", padding: 8 }))
    .style({
      left: 16,
      right: 16,
      top: 96,
      alignItems: "center",
      pointerEvents: "none",
      display: "none",
    })
    .named("bossBanner")
  sc.widgets(hud, floaters, banner)

  sc.addEventListener("touchstart", (ev) => {
    if (!scene || !paddle || pauseOpen || perkOpen || game.phase !== "gameplay") return
    const w = scene.camera.screenToWorld(ev.clientX, ev.clientY)
    paddle.x = clampPaddleX(paddle.coreW, w.x)
    ev.track({
      onMove: (e) => {
        if (!scene || !paddle) return
        const moved = scene.camera.screenToWorld(e.clientX, e.clientY)
        paddle.x = clampPaddleX(paddle.coreW, moved.x)
      },
      onEnd: () => {
        launchStuck(balls)
      },
    })
  })
  sc.onBack(() => {
    if (!perkOpen && !pauseOpen && game.phase === "gameplay") openPause()
  })

  loadLevel()
  sc.open()
  setPhase("gameplay")
  loopId = setLoop((frameDt) => tick(frameDt))
}

export function startNewRun(): void {
  setupScene()
}

export function continueGame(): void {
  if (!continueFromSave()) return
  setupScene()
}
