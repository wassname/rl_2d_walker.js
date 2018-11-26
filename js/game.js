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
  walker_health: 100,
  max_floor_tiles: 30,
  round_length: 8000,
  min_body_delta: 0,
  min_leg_delta: 0.0,
};

globals = {};

chooseQoute = function () { 
  var qoutes = [
    'Play the funky music, robot',
    'The origin of funkd',
    'The chaos computer club',
    'Only the humans that like to dance survived',
    'Classic robot dance move - the human',
    'First we dance Manhatten, then we dance the world',
    'One hour after ingesting substance 1043',
    'Red robot redemption',
    'Father was a rolling robot',
    'Light as a trash can, nimble as a ox',
    'Have you tried turning it off and on again?',
    'Eurovision 2050',
  ]
  var qoute = qoutes[Math.randi(0,qoutes.length)]
  document.getElementById('page_quote').innerText = '"'+qoute+'"'

}

displayProgress = function () { 
  // TODO show stats
  var stats = {
    'trainingTime': globals.step_counter / config.simulation_fps,
    'meanProgress': globals.walkers.map(w => w.last_position).reduce((s, v) => s + v) / globals.walkers.length,
    'meanReward': globals.walkers.map(w => w.reward).reduce((s, v) => s + v) / globals.walkers.length,
  } 
  document.getElementById('stats-prog').innerText = JSON.stringify(stats, null, 2)
  document.getElementById('stats-ag0').innerText = JSON.stringify(globals.walkers[0].rewards, null, 2)
}

gameInit = function() {
  var joints = 12
  var bodyParts = 14
  var state = bodyParts * 7
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
  
  
  chooseQoute()
  globals.world = new b2.World(new b2.Vec2(0, -10));
  [globals.agents, globals.walkers] = createPopulation();

  globals.floor = createFloor();
  drawInit();

  globals.step_counter = 0;
  globals.simulation_interval = setInterval(simulationStep, Math.round(1000/config.simulation_fps));
  globals.draw_interval = setInterval(drawFrame, Math.round(1000 / config.draw_fps));
  globals.reset_interval = setInterval(resetSimulation, Math.round(config.round_length * 1000 / config.draw_fps));
  globals.logr_interval = setInterval(logRewards, Math.round(800 * 1000 / config.draw_fps));
  globals.display_interval = setInterval(displayProgress, Math.round(80 * 1000 / config.draw_fps));
}

logRewards = function () { 
  for(var k = 0; k < config.population_size; k++) {
    console.table(globals.walkers[k].rewards)
  }
}

resetSimulation = function () { 
  // turn training off temporarlity to avoid NaN's
  updateIfLearning(false)
  console.log('resetting walkers')
  for(var k = 0; k < config.population_size; k++) {
    globals.agents[k].walker = globals.walkers[k] = new Walker(globals.world)
  }
  setTimeout(()=>updateIfLearning(true), 1000)
}

simulationStep = function () {
  globals.step_counter++;

  // step world
  globals.world.Step(1/config.time_step, config.velocity_iterations, config.position_iterations);
  globals.world.ClearForces();

  // step agents
  populationSimulationStep();
}

// setSimulationFps = function(fps) {
//   config.simulation_fps = fps;
//   clearInterval(globals.simulation_interval);
//   if(fps > 0) {
//     globals.simulation_interval = setInterval(simulationStep, Math.round(1000/config.simulation_fps));
//     if(globals.paused) {
//       globals.paused = false;
//       if(config.draw_fps > 0) {
//         globals.draw_interval = setInterval(drawFrame, Math.round(1000/config.draw_fps));
//       }
//     }
//   } else {
//     // pause the drawing as well
//     clearInterval(globals.draw_interval);
//     globals.paused = true;
//   }
// }

createPopulation = function(genomes) {
  var walkers = [];
  var agents = []
  for(var k = 0; k < config.population_size; k++) {
    var agent = new Agent({}, globals)
    agents.push(agent);
    walkers.push(agent.walker)

  }
  return [agents, walkers];
}


populationSimulationStep = function() {
  for(var k = 0; k < config.population_size; k++) {
    globals.agents[k].step()
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
	saveAs(new DataView(buf), 'walker_brain_'+n+'_'+ts+'.bin')
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
      }
  };

  reader.readAsArrayBuffer(input.files[0]);
};


updateIfLearning = function (value) {
  for (var i = 0; i <  globals.agents.length; i++) {
    globals.agents[i].brain.learning = value
  }
};
