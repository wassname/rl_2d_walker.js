const config = require('./config')
const {
  Charts
} = require('./charts')
const {
  tf
} = require('./ddpg//tf_import')
const {
  randi
} = require('./utils')
const b2 = require('../vendor/jsbox2d')
const createFloor = require('./floor.js')
const DDPGAgent = require('./ddpg/ddpg_agent')
const {
  Walker
} = require('./walker')


chooseQoute = function () {
  var qoutes = [
    'Play the funky music, robot',
    'The origin of funkd',
    'The chaos computer club',
    'Only the ones that like to dance survived',
    'Classic robot dance move - the human',
    'First we dance Manhatten, then we dance the world',
    'Video of subjects one hour after ingesting substance q1043',
    'Red robot redemption',
    'Boogie robotland',
    'Father was a rolling robot',
    'Float like a bumblebee, string like a butterfly',
    'Dance dance evolution',
    'Have you tried turning it off and on again?',
    'Eurovision 2050',
    'We must learn to walk before we can run',
    'This is not a disco',
    'Disco simulator 2100',
    "This is a metaphor for life",
    "The balls represent love",
    "The wall represent age",
    "You're driving me up the wall",
    "Ministry of silly walks",
    "In the future there will only be dubstep",
    "In place of computers Shake-a-spear and beef-oven used string and wood to make music",
  ]
  var qoute = qoutes[randi(0, qoutes.length-1)]
  document.getElementById('page_quote').innerText = '"' + qoute + '"'
}

class HeadlessGame {
  constructor(config) {
    this.config = config
    this.initWorld()
  }

  initWorld() {

    var gravity = new b2.Vec2(0, -10)
    this.world = new b2.World(gravity)
    this.floor = createFloor(this.world, this.config.max_floor_tiles);
    this.env = new Walker(this.world, this.floor, this.config)

    const nbActions = this.env.joints.length + 4
    const stateSize = this.env.bodies.length * 10 + this.env.joints.length * 3

    this.agent = new DDPGAgent(this.env, {
      stateSize,
      nbActions,
      resetEpisode: true,
      batchSize: 8*1024,
      actorLr: 0.0001/4,
      criticLr: 0.001,
      memorySize: 10000,
      gamma: 0.99,

      desiredActionStddev: 0.05,
      minActionStddev: 0.0001,
      initialStddev: 0.2,
      adoptionCoefficient: 1.01,
      noiseDecay: 0.96,

      actorFirstLayerSize: 128,
      actorSecondLayerSize: 64,
      criticFirstLayerSSize: 128,
      criticFirstLayerASize: 128,
      criticSecondLayerSize: 64,

      nbEpochs: 1500,
      nbEpochsCycle: 40,
      nbTrainSteps: 5,
      maxStep: 4000,
      saveDuringTraining: true,
      saveInterval: 10,

      tau: 0.008,


    });
  }

}



class Game extends HeadlessGame {
  constructor(config, canvas_id) {
    config.canvas_id = canvas_id
    super(config)

    this.agent.stop()
  }

  loop() { 
    setInterval(() => {
      this.play()
    }, 1000 / this.config.draw_fps)
    
    // random qoutes
    setInterval(() => {
      chooseQoute
    }, 1000 * 20)
  }

  /**
   * Play one step
   */
  play() {
    // Get the current state
    const state = this.agent.env.getState();
    if (this.agent.env.steps % this.config.action_repeat == 0) {
      // Pick an action, but only on every N'th step (because of action repeat during training)
      const tfActions = this.agent.ddpg.predict(tf.tensor2d([state]));
      this.actions = tfActions.buffer().values;
      tfActions.dispose();      
    }
    this.agent.env.step(this.actions, 1);
  }


  loadBrain(folder, name) { 
    this.agent.restore(folder, name)
    // var title = name.replace('model-ddpg-walker-', '').replace('/model', '').replace('model-ddpg-walker', '')
    // document.getElementById('brain-name').innerText = title

  }
}

module.exports = {
  Game,
  chooseQoute,
  HeadlessGame
}
