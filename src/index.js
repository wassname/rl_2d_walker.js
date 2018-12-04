const { Game, chooseQoute } = require('./js/game')
window.b2 = require('./vendor/jsbox2d')
window.config = require('./js/config')
window.chooseQoute = chooseQoute
window.Game = Game

module.exports = {Game}
