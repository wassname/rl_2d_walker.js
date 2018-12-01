var config = require('./js/config')
const b2 = require('./vendor/jsbox2d')
const createFloor = require('./js/floor.js')
const DDPGAgent = require('./js/ddpg/ddpg_agent')
const {
    Walker
} = require('./js/walker')


var world = new b2.World(new b2.Vec2(0, -10))
floor = createFloor(world, config.max_floor_tiles);
var env = new Walker(world, floor, config)

const nbActions = env.joints.length + 4
const stateSize = env.bodies.length * 10 + env.joints.length * 3

var agent = new DDPGAgent(env, {
    stateSize,
    nbActions,
    resetEpisode: true,
    desiredActionStddev: 0.4,
    initialStddev: 0.4,
    actorFirstLayerSize: 128,
    actorSecondLayerSize: 64,
    criticFirstLayerSSize: 128,
    criticFirstLayerASize: 128,
    criticSecondLayerSize: 64,
    nbEpochs: 1000
});
agent.train(true);
