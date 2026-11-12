import { BALANCE } from "../config/balance"
import { game, queueLevelUps, xpMultiplier } from "../core/state"
import { playSfx } from "../core/audio"

/** XP only for a brick that is actually destroyed. Overflow queues extra level-ups. */
export function grantBrickXp(): void {
  const gain = BALANCE.XP_PER_BRICK * xpMultiplier()
  game.xp += gain
  let ups = 0
  while (game.xp >= BALANCE.XP_TO_LEVEL) {
    game.xp -= BALANCE.XP_TO_LEVEL
    game.playerLevel += 1
    ups += 1
  }
  if (ups > 0) {
    queueLevelUps(ups)
    playSfx("level")
    console.log(`level up player=${game.playerLevel} queue=${game.perkQueue}`)
  }
}
