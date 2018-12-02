var config = require('../src/js/config')


const { HeadlessGame } = require('../src/js/game')
var game = new HeadlessGame(config)
game.agent.restore('./outputs', 'model-ddpg-walker/model') // resume
game.agent.train(true); 

// game.agent.save("model-ddpg-walker");
