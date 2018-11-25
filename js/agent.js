
function Agent(opt, world) {
    this.walker = new Walker(world.world)
    this.options = opt

    this.world = world
    this.frequency = 20
    this.reward = 0
    this.loaded = false

    this.loss = 0
    this.timer = 0
    this.timerFrequency = 60 / this.frequency
    this.resetFrequency = 30 / this.frequency

    if (this.options.dynamicallyLoaded !== true) {
    	this.init(world.brains.actor.newConfiguration(), null)
    }
    
};

Agent.prototype.init = function (actor, critic) {
    var actions = this.walker.joints.length
    var temporal = 1
    var states = this.walker.bodies.length * 2

    var input = window.neurojs.Agent.getInputDimension(states, actions, temporal)

    this.brain = new window.neurojs.Agent({

        actor: actor,
        critic: critic,

        states: states,
        actions: actions,

        algorithm: 'ddpg',

        temporalWindow: temporal, 

        discount: 0.97, 

        experience: 75e3, 
        // buffer: window.neurojs.Buffers.UniformReplayBuffer,

        learningPerTick: 40, 
        startLearningAt: 900,

        theta: 0.05, // progressive copy

        alpha: 0.1 // advantage learning

    })

    // this.world.brains.shared.add('actor', this.brain.algorithm.actor)
    this.world.brains.shared.add('critic', this.brain.algorithm.critic)

    this.actions = actions
	this.loaded = true
};

Agent.prototype.step = function () {
	if (!this.loaded) {
		return 
	}

    this.timer++

    if (this.timer % this.timerFrequency === 0) {
        
        // reward from last step
        this.reward = this.walker.score * 1
        // console.log(this.reward)
        this.walker.score = 0
        
        // train
        this.loss = this.brain.learn(this.reward)
        this.action = this.brain.policy(this.walker.getState())
    }
    
    if (this.action) {
        this.walker.simulationStep(this.action)
    }

    return this.timer % this.timerFrequency === 0
};
