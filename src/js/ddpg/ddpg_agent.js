const {
    tf
} = require('./tf_import')
const AdaptiveParamNoiseSpec = require('./noise')
const PrioritizedMemory = require('./prioritized_memory')
const {
    Actor,
    Critic,
    copyFromSave,
    copyModel
} = require('./models')
const {
    DDPG,
    logTfMemory
} = require('./ddpg')
const {
    mean
} = require('../utils')


function setMetric(name, value) {
    console.debug('metric', name, value)
}


// This class is called from js/DDPG/index.js
class DDPGAgent {

    /**
     * @param env (metacar.env) Set in js/DDPG/index.js
     */
    constructor(env, config) {

        this.stopTraining = false;
        this.env = env;

        config = config || {};
        // Default Config
        this.config = {
            "stateSize": config.stateSize || 17,
            "nbActions": config.nbActions || 2,
            "seed": config.seed || 0,
            "batchSize": config.batchSize || 128,
            "actorLr": config.actorLr || 0.0001,
            "criticLr": config.criticLr || 0.001,
            "memorySize": config.memorySize || 30000,
            "gamma": config.gamme || 0.99,
            "noiseDecay": config.noiseDecay || 0.99,
            "rewardScale": config.rewardScale || 1,
            "nbEpochs": config.nbEpochs || 200,
            "nbEpochsCycle": config.nbEpochsCycle || 10,
            "nbTrainSteps": config.nbTrainSteps || 110,
            "tau": config.tau || 0.008,
            "initialStddev": config.initialStddev || 0.1,
            "minActionStddev": config.minActionStddev || 0.01,
            "desiredActionStddev": config.desiredActionStddev || 0.1,
            "adoptionCoefficient": config.adoptionCoefficient || 1.01,
            "actorFirstLayerSize": config.actorFirstLayerSize || 64,
            "actorSecondLayerSize": config.actorSecondLayerSize || 32,
            "criticFirstLayerSSize": config.criticFirstLayerSSize || 64,
            "criticFirstLayerASize": config.criticFirstLayerASize || 64,
            "criticSecondLayerSize": config.criticSecondLayerSize || 32,
            "maxStep": config.maxStep || 800,
            "stopOnRewardError": config.stopOnRewardError != undefined ? config.stopOnRewardError : true,
            "resetEpisode": config.resetEpisode != undefined ? config.resetEpisode : false,
            "saveDuringTraining": config.saveDuringTraining || false,
            "saveInterval": config.saveInterval || 20
        };
        this.epoch = 0;
        // From js/DDPG/noise.js
        this.noise = new AdaptiveParamNoiseSpec(this.config);

        // Configure components.

        // Buffer replay
        // The baseline use 1e6 but this size should be enough for this problem
        this.memory = new PrioritizedMemory(this.config.memorySize);
        // Actor and Critic are from js/DDPG/models.js
        this.actor = new Actor(this.config);
        this.critic = new Critic(this.config);

        // Seed javascript
        // Math.seedrandom(0);

        this.rewardsList = [];
        this.infoList = []
        this.epiDuration = [];

        // DDPG
        this.ddpg = new DDPG(this.actor, this.critic, this.memory, this.noise, this.config);
    }

    save(name) {
        /*
            Save the network
        */
        if (typeof WEB === "undefined") {
            this.ddpg.critic.model.save('file://./outputs/critic-' + name);
            this.ddpg.actor.model.save('file://./outputs/actor-' + name);
        } else {
            this.ddpg.actor.model.save('downloads://actor-' + name);
            this.ddpg.critic.model.save('downloads://critic-' + name);
        }
    }

    async restore(folder, name) {
        /*
            Restore the weights of the network
        */
        var critic, actor
        if (typeof WEB === "undefined") {
            console.log('loading', 'file://' + folder + '/critic-' + name + '.json')
            console.log('loading', 'file://' + folder + '/actor-' + name + '.json')
            critic = await tf.loadModel('file://' + folder + '/critic-' + name + '.json');
            actor = await tf.loadModel("file://" + folder + "/actor-" + name + ".json");
        } else {
            console.log('loading', window.location.origin + window.location.pathname + folder + '/actor-' + name + '.json')
            console.log('loading', window.location.origin + window.location.pathname + folder + '/critic-' + name + '.json')
            critic = await tf.loadModel(window.location.origin + window.location.pathname + folder + '/critic-' + name + '.json');
            actor = await tf.loadModel(window.location.origin + window.location.pathname + folder + "/actor-" + name + ".json");
        }

        this.ddpg.critic = copyFromSave(critic, Critic, this.config, this.ddpg.obsInput, this.ddpg.actionInput);
        this.ddpg.actor = copyFromSave(actor, Actor, this.config, this.ddpg.obsInput, this.ddpg.actionInput);

        // Define in js/DDPG/models.js
        // Init target network Q' and μ' with the same weights
        this.ddpg.actorTarget = copyModel(this.ddpg.actor, Actor);
        this.ddpg.criticTarget = copyModel(this.ddpg.critic, Critic);
        // Perturbed Actor (See parameter space noise Exploration paper)
        this.ddpg.perturbedActor = copyModel(this.ddpg.actor, Actor);
        //this.adaptivePerturbedActor = copyModel(this.actor, Actor);
        this.ddpg.setLearningOp();
    }

    /**
     * Play one step
     */
    play() {
        // Get the current state
        const state = this.env.getState();
        // Pick an action
        const tfActions = this.ddpg.predict(tf.tensor2d([state]));
        const actions = tfActions.buffer().values;
        this.env.step(actions);
        tfActions.dispose();
    }

    /**
     * Get the estimation of the Q value given the state
     * and the action
     * @param state number[]
     * @param action [a, steering]
     */
    getQvalue(state, a) {
        return this.ddpg.getQvalue(state, a);
    }

    stop() {
        this.stopTraining = true;
    }

    /**
     * Step into the training environement
     * @param tfPreviousStep (tf.tensor2d) Current state
     * @param mPreviousStep number[]
     * @return {done, state} One boolean and the new state
     */
    stepTrain(tfPreviousStep, mPreviousStep) {
        // Get actions
        const tfActions = this.ddpg.perturbedPrediction(tfPreviousStep);
        // Step in the environment with theses actions
        let mActions = Array.from(tfActions.buffer().values);
        let [mState, mReward, mDone, info] = this.env.step(mActions);
        this.rewardsList.push(mReward);
        this.infoList.push(info);
        // Get the new observations
        let tfState = tf.tensor2d([mState]);
        if (mReward == -1 && this.config.stopOnRewardError) {
            mDone = 1;
        }
        // Add the new tuple to the buffer
        this.ddpg.memory.append(mPreviousStep, mActions, mReward, mState, mDone);
        // Dispose tensors
        tfPreviousStep.dispose();
        tfActions.dispose();

        return {
            mDone,
            mState,
            tfState
        };
    }

    /**
     * Optimize models and log states
     */
    _optimize() {
        this.ddpg.noise.desiredActionStddev = Math.max(this.config.minActionStddev, this.config.noiseDecay * this.ddpg.noise.desiredActionStddev);
        let lossValuesCritic = [];
        let lossValuesActor = [];
        console.time("Training");
        for (let t = 0; t < this.config.nbTrainSteps; t++) {
            let {
                lossC,
                lossA
            } = this.ddpg.optimizeCriticActor();
            lossValuesCritic.push(lossC);
            lossValuesActor.push(lossA);
        }
        console.timeEnd("Training");
        console.log("desiredActionStddev:", this.ddpg.noise.desiredActionStddev);
        setMetric("CriticLoss", mean(lossValuesCritic));
        setMetric("ActorLoss", mean(lossValuesActor));
    }

    /**
     * Train DDPG Agent
     */
    async train(realTime) {
        this.stopTraining = false;
        // One epoch
        for (this.epoch; this.epoch < this.config.nbEpochs; this.epoch++) {
            // Perform cycles.
            this.rewardsList = [];
            this.stepList = [];
            this.infoList = [];
            this.distanceList = [];
            // document.getElementById("trainingProgress").innerHTML = "Progression: "+this.epoch+"/"+this.config.nbEpochs+"<br>";
            console.log("Progression: " + this.epoch + "/" + this.config.nbEpochs + " epochs")
            for (let c = 0; c < this.config.nbEpochsCycle; c++) {
                if (c % 10 == 0) {
                    logTfMemory();
                }
                let mPreviousStep = this.env.getState();
                let tfPreviousStep = tf.tensor2d([mPreviousStep]);
                let step = 0;

                console.time("LoopTime");
                for (step = 0; step < this.config.maxStep; step++) {
                    let rel = this.stepTrain(tfPreviousStep, mPreviousStep);
                    mPreviousStep = rel.mState;
                    tfPreviousStep = rel.tfState;
                    if (rel.mDone && this.config.stopOnRewardError) {
                        break;
                    }
                    if (this.stopTraining) {
                        this.env.render(true);
                        return;
                    }
                    if (realTime && step % 10 == 0)
                        await tf.nextFrame();
                }
                this.stepList.push(step);
                console.timeEnd("LoopTime");
                let distance = this.ddpg.adaptParamNoise();
                this.distanceList.push(distance[0]);

                if (this.config.resetEpisode) {
                    this.env.reset();
                }
                this.env.shuffle({
                    cars: false
                });
                tfPreviousStep.dispose();
                console.log("e=" + this.epoch + ", c=" + c);

                await tf.nextFrame();
            }
            if (this.epoch > 5) {
                this._optimize();
            }
            if (this.config.saveDuringTraining && this.epoch % this.config.saveInterval == 0 && this.epoch != 0) {
                this.save("model-ddpg-walker-epoch-" + this.epoch);
                this.save("model-ddpg-walker");
            }
            for (const name in this.infoList[0]) {
                let vals = this.infoList.map(info => info[name])
                if (vals.length) {
                    let meanVal = mean(vals)
                    setMetric(name, mean(vals));
                } else {
                    console.log('WARN: empty metric', name)
                }
            }
            setMetric("Reward", mean(this.rewardsList));
            setMetric("EpisodeDuration", mean(this.stepList));
            setMetric("NoiseDistance", mean(this.distanceList));
            await tf.nextFrame();
        }

        this.env.render(true);
    }

};

module.exports = DDPGAgent
