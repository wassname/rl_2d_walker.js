var config = require('./js/config')
const b2 = require('./vendor/jsbox2d')
const createFloor = require('./js/floor.js')
const DDPGAgent = require('./js/ddpg/ddpg_agent')
const {
    Walker
} = require('./js/walker')


var gravity = new b2.Vec2(0, -10)
var world = new b2.World(gravity)
floor = createFloor(world, config.max_floor_tiles);
var env = new Walker(world, floor, config)

const nbActions = env.joints.length + 4
const stateSize = env.bodies.length * 10 + env.joints.length * 3


var agent = new DDPGAgent(env, {
    stateSize,
    nbActions,
    resetEpisode: true,
    batchSize: 128,
    actorLr: 0.0001,
    criticLr: 0.001,
    memorySize: 30000,
    gamma: 0.99,

    desiredActionStddev: 0.1,
    initialStddev: 0.4,

    actorFirstLayerSize: 128,
    actorSecondLayerSize: 64,
    criticFirstLayerSSize: 128,
    criticFirstLayerASize: 128,
    criticSecondLayerSize: 64,

    nbEpochs: 1000,
    nbEpochsCycle: 10,
    nbTrainSteps: 100,
    maxStep: 800,
    saveDuringTraining: true,
    saveInterval: 20,

    tau: 0.008,
    adoptionCoefficient: 1.01,


});
agent.train(true);

agent.save("model-ddpg-traffic");
