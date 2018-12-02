var config = require('./js/config')


const { HeadlessGame } = require('./js/game')
var game = new HeadlessGame(config)
game.agent.train(true);

// game.agent.save("model-ddpg-traffic");
game.agent.save("model-ddpg-walker");
