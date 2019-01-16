import  {Game, chooseQoute } from './js/game'
import { config } from './js/config'
import { b2 } from './vendor/jsbox2d'

window.b2 = b2
window.config = config
window.chooseQoute = chooseQoute
window.Game = Game

export {Game}
