config = {
  time_step: 60,
  simulation_fps: 60,
  draw_fps: 60,
  velocity_iterations: 8,
  position_iterations: 3,
  max_zoom_factor: 130,
  min_motor_speed: -2,
  max_motor_speed: 2,
  population_size: 4,
  mutation_chance: 0.1,
  mutation_amount: 0.5,
  walker_health: 100, // 300
  fitness_criterium: 'score',
  check_health: true,
  elite_clones: 2,
  max_floor_tiles: 50,
  round_length: 1200,
  min_body_delta: 0,
  min_leg_delta: 0.0,
  instadeath_delta: 0.4
};

globals = {};

gameInit = function() {
  var joints = 12
  var bodyParts = 14
  var sensors = 14
  var state = sensors * 2
  var actions = joints
  var input = 2 * state + 1 * actions

  globals.brains = {
      actor: new window.neurojs.Network.Model([
          { type: 'input', size: input },
          { type: 'fc', size: 60, activation: 'relu' },
          { type: 'fc', size: 40, activation: 'relu' },
          { type: 'fc', size: 40, activation: 'relu', dropout: 0.30 },
          { type: 'fc', size: actions, activation: 'tanh' },
          { type: 'regression' }

      ]),

      critic: new window.neurojs.Network.Model([

          { type: 'input', size: input + actions },
          { type: 'fc', size: 80, activation: 'relu' },
          { type: 'fc', size: 70, activation: 'relu' },
          { type: 'fc', size: 60, activation: 'relu' },
          { type: 'fc', size: 50, activation: 'relu' },
          { type: 'fc', size: 1 },
          { type: 'regression' }

      ])

  }

  globals.brains.shared = new window.neurojs.Shared.ConfigPool()

  // this.brains.shared.set('actor', this.brains.actor.newConfiguration())
  globals.brains.shared.set('critic', globals.brains.critic.newConfiguration())


  globals.world = new b2.World(new b2.Vec2(0, -10));
  [globals.agents, globals.walkers] = createPopulation();

  globals.floor = createFloor();
  drawInit();

  globals.step_counter = 0;
  globals.simulation_interval = setInterval(simulationStep, Math.round(1000/config.simulation_fps));
  globals.draw_interval = setInterval(drawFrame, Math.round(1000 / config.draw_fps));
  globals.reset_interval = setInterval(resetSimulation, Math.round(8000 * 1000 / config.draw_fps));
  globals.logr_interval = setInterval(logRewards, Math.round(800 * 1000 / config.draw_fps));
}

logRewards = function () { 
  for(var k = 0; k < config.population_size; k++) {
    console.log(k, globals.walkers[k].rewards)
  }
}

resetSimulation = function () { 
  console.log('resetting walkers')
  for(var k = 0; k < config.population_size; k++) {
    globals.agents[k].walker = globals.walkers[k] = new Walker(globals.world)
  }
}

simulationStep = function() {
  globals.world.Step(1/config.time_step, config.velocity_iterations, config.position_iterations);
  globals.world.ClearForces();
  populationSimulationStep();
  if(typeof globals.step_counter == 'undefined') {
    globals.step_counter = 0;
  } else {
    globals.step_counter++;
  }
  // document.getElementById("generation_timer_bar").style.width = (100*globals.step_counter/config.round_length)+"%";
  // if(globals.step_counter > config.round_length) {
  //   nextGeneration();
  // }
}

setSimulationFps = function(fps) {
  config.simulation_fps = fps;
  clearInterval(globals.simulation_interval);
  if(fps > 0) {
    globals.simulation_interval = setInterval(simulationStep, Math.round(1000/config.simulation_fps));
    if(globals.paused) {
      globals.paused = false;
      if(config.draw_fps > 0) {
        globals.draw_interval = setInterval(drawFrame, Math.round(1000/config.draw_fps));
      }
    }
  } else {
    // pause the drawing as well
    clearInterval(globals.draw_interval);
    globals.paused = true;
  }
}

createPopulation = function(genomes) {
  // setQuote();
  // if(typeof globals.generation_count == 'undefined') {
  //   globals.generation_count = 0;
  // } else {
  //   globals.generation_count++;
  // }
  // updateGeneration(globals.generation_count);
  var walkers = [];
  var agents = []
  for(var k = 0; k < config.population_size; k++) {
    // walkers.push(new Walker(globals.world));
    var agent = new Agent({}, globals)
    agents.push(agent);
    walkers.push(agent.walker)

  }
  return [agents, walkers];
}

randAction= function(){ 
  var action = []
  for (let i = 0; i < 12; i++) {
    action.push(Math.randf(-1,1))
  }
  return action
}

populationSimulationStep = function() {
  for(var k = 0; k < config.population_size; k++) {
      // var action = randAction()
    // globals.walkers[k].simulationStep(action);
    globals.agents[k].step()
    // console.log(globals.walkers[k].walker.getState())
  }
  
}


function saveAs(dv, name) {
  var a;
  if (typeof window.downloadAnchor == 'undefined') {
      a = window.downloadAnchor = document.createElement("a");
      a.style = "display: none";
      document.body.appendChild(a);
  } else {
      a = window.downloadAnchor
  }

  var blob = new Blob([dv], { type: 'application/octet-binary' }),
      tmpURL = window.URL.createObjectURL(blob);

  a.href = tmpURL;
  a.download = name;
  a.click();

  window.URL.revokeObjectURL(tmpURL);
  a.href = "";
}

downloadBrain = function (n) {
  var ts = (new Date()).toISOString().replace(':','_')
  var buf = globals.agents[n].brain.export()
	saveAs(new DataView(buf), 'walker_brain'+ts+'.bin')
};


readBrain = function (buf) {
  var input = event.target;
  var reader = new FileReader();
  reader.onload = function(){
      var buffer = reader.result
      var imported = window.neurojs.NetOnDisk.readMultiPart(buffer)

      for (var i = 0; i <  globals.agents.length; i++) {
          globals.agents[i].brain.algorithm.actor.set(imported.actor.clone())
          globals.agents[i].brain.algorithm.critic.set(imported.critic)
          // window.gcd.world.agents[i].car.brain.learning = false
      }
  };

  reader.readAsArrayBuffer(input.files[0]);
};


updateIfLearning = function (value) {
  for (var i = 0; i <  globals.world.agents.length; i++) {
    globals.world.agents[i].brain.learning = value
  }

  globals.world.plotRewardOnly = !value
};
