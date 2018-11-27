
function Agent(opt, world) {
    this.walker = new Walker(world.world)
    this.options = opt

    this.world = world
    this.frequency = 20
    this.loaded = false

    this.infos = []
    this.maxInfos = 2000

    this.steps = 0
    this.timer = 0
    this.timerFrequency = 60 / this.frequency

    if (this.options.dynamicallyLoaded !== true) {
    	this.init(world.brains.actor.newConfiguration(), null)
    }
    
};

Agent.prototype.init = function (actor, critic) {
    var actions = this.walker.joints.length
    var temporal = 1
    var states = this.walker.bodies.length * 7

    var input = window.neurojs.Agent.getInputDimension(states, actions, temporal)

    this.brain = new window.neurojs.Agent({

        actor: actor,
        critic: critic,

        states: states,
        actions: actions,

        algorithm: 'ddpg',

        temporalWindow: temporal, 

        discount: 0.97,  // time discount
        rate: 0.001,  // learning rate,
        theta: 0.05, // progressive copy
        alpha: 0.1, // advantage learning

        // buffer: window.neurojs.Buffers.UniformReplayBuffer,
        experience: 3e3, 

        learningPerTick: 40, 
        startLearningAt: 900,
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
        this.steps++
        var [state, reward, done, info] = this.walker.simulationStep()

        if (done) {
            // TODO reset?
        }

        if (this.infos.length>this.maxInfos) this.infos = this.infos.slice(1)
        
        // train
        info.loss = this.brain.learn(reward) 
        this.action = this.brain.policy(state)
        info.x = this.steps
        info.time = new Date().getTime()
        this.infos.push(info)
    }
    if (this.action) {
        this.walker.simulationPreStep(this.action)
    }

    return this.timer % this.timerFrequency === 0
};
