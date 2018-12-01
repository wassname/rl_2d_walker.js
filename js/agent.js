
function Agent(opt, globals) {
    this.walker = new Walker(globals.world, globals.floor)
    this.options = opt

    this.globals = globals
    this.frequency = 20
    this.loaded = false

    this.infos = []
    this.maxInfos = 2000

    this.steps = 0
    this.timer = 0
    this.timerFrequency = 60 / this.frequency

    if (this.options.dynamicallyLoaded !== true) {
    	this.init(globals.brains.actor.newConfiguration(), null)
    }
    
};

Agent.prototype.init = function (actor, critic) {
    var actions = this.walker.joints.length + 4
    var temporal = 1
    var states = this.walker.bodies.length * 10 + this.walker.joints.length * 3

    var input = window.neurojs.Agent.getInputDimension(states, actions, temporal)

    // Example params https://github.com/udacity/deep-reinforcement-learning/blob/master/ddpg-bipedal/ddpg_agent.py
    this.brain = new window.neurojs.Agent({
        actor: actor,
        critic: critic,

        states: states,
        actions: actions,

        algorithm: 'ddpg',

        temporalWindow: temporal, 

        discount: 0.99,  // time discount
        rate: 3e-4,  // learning rate,
        theta: 1e-3, // progressive copy
        // alpha: 0.1, // advantage learning

        // buffer: window.neurojs.Buffers.UniformReplayBuffer,
        experience: 100e3, 

        learningPerTick: 512, 
        startLearningAt: 10000,
    })

    this.brain.algorithm.critic.optim.regularization.l2 = 0.0001
    this.brain.algorithm.actor.optim.regularization.l2 = 0.0001

    // this.globals.brains.shared.add('actor', this.brain.algorithm.actor)
    this.globals.brains.shared.add('critic', this.brain.algorithm.critic)

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
