const { Game } = require('./js/game')
const config = require('./js/config')

var game
window.game = game

function init() {
  window.game = new Game(config)
}

window.addEventListener("load", init, false);
module.exports = {game, Game}
