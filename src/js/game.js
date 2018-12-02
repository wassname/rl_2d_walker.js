const config = require('./config')
const {
  Charts
} = require('./charts')
const {
  randi
} = require('./utils')
const b2 = require('../vendor/jsbox2d')
const createFloor = require('./floor.js')
const DDPGAgent = require('./ddpg/ddpg_agent')
const {
  Walker
} = require('./walker')

if (typeof window !== "undefined")
  var requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
    window.setTimeout(callback, 1000 / 60);
  };
else
  var requestAnimFrame = function (callback) {
    window.setTimeout(callback, 1000 / 60);
  };


chooseQoute = function () {
  var qoutes = [
    'Play the funky music, robot',
    'The origin of funkd',
    'The chaos computer club',
    'Only the humans that like to dance survived',
    'Classic robot dance move - the human',
    'First we dance Manhatten, then we dance the world',
    'Video of subjects one hour after ingesting substance q1043',
    'Red robot redemption',
    'Father was a rolling robot',
    'Float like a bumblebee, string like a butterfly',
    'Dance evolution',
    'Have you tried turning it off and on again?',
    'Eurovision 2050',
    'Humans crawl before they walk. Robots dance before they walk',
    'This is not a disco',
    'Disco simulator 2100'
  ]
  var qoute = qoutes[randi(0, qoutes.length)]
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
      saveInterval: 5,

      tau: 0.008,
      adoptionCoefficient: 1.01,


    });
  }
}

class Game extends HeadlessGame {
  constructor(config) {
    super(config)

    this.agent.stop()
    console.log('../outputs', 'model-ddpg-walker/model')
    // this.agent.restore('../outputs', 'model-ddpg-walker/model')
    setInterval(() => this.agent.play(), 100)
    chooseQoute()
  }

  displayProgress() {
    var stats = {
      'trainingTime': this.step_counter / config.simulation_fps,
      'meanProgress': this.walkers.map(w => w.last_position).reduce((s, v) => s + v) / this.walkers.length,
      'meanReward': this.walkers.map(w => w.reward).reduce((s, v) => s + v) / this.walkers.length,
      'bufferSize': this.agents[0].brain.buffer.size
    }
    document.getElementById('stats-prog').innerText = JSON.stringify(stats, null, 2)
  }

  updateCharts() {
    var groupN = 100
    var maxN = 100000
    if (this.agents[0].infos.length >= groupN) {
      if (!this.charts) {
        this.charts = new Charts()
        this.charts.init(this.agents, groupN)
      } else {
        this.charts.update(this.agents, groupN, maxN)
      }
    }
  }
}

module.exports = {
  Game,
  chooseQoute,
  HeadlessGame
}
