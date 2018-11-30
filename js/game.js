var requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) { window.setTimeout(callback, 1000 / 60); };

config = {
  time_step: 60,
  simulation_fps: 60,
  draw_fps: 60,
  velocity_iterations: 8,
  position_iterations: 3,
  max_zoom_factor: 130,
  min_motor_speed: -2,
  max_motor_speed: 2,
  population_size: 1,
  walker_health: 100,
  max_floor_tiles: 50,
  round_length: 1000,
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
    'Video of subjects one hour after ingesting substance q1043',
    'Red robot redemption',
    'Father was a rolling robot',
    'Float like a bumblebee, string like a butterfly',
    'Dance evolution',
    'Have you tried turning it off and on again?',
    'Eurovision 2050',
    'Humans must learn to crawl then walk. Robots break dance then walk',
    ''
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
    'bufferSize': globals.agents[0].brain.buffer.size
  } 
  document.getElementById('stats-prog').innerText = JSON.stringify(stats, null, 2)
}

gameInit = function() {
  var bodyParts = 16
  var joints = 14
  var state = bodyParts * 10 + joints * 3
  var actions = joints + 4
  var input = 2 * state + 1 * actions

  
  globals.brains = {
    actor: new window.neurojs.Network.Model([
      { type: 'input', size: input },
      { type: 'fc', size: 256, activation: 'relu' },
      // { type: 'noise', sigma: 0.2, delta: 0.001, theta: 0.15 },
      // { type: 'fc', size: 160, activation: 'relu' },
      // { type: 'noise', sigma: 0.2, delta: 0.001, theta: 0.15 },
      // { type: 'fc', size: 100, activation: 'relu' },
      { type: 'fc', size: 100, activation: 'relu', dropout: 0.30 },
      //  delta represents the equilibrium or mean value supported by fundamentals; 
      // sigma the degree of volatility around it caused by shocks, 
      // theta the rate by which these shocks dissipate and the variable reverts towards the mean. 
      { type: 'fc', size: actions, activation: 'tanh' },
      { type: 'noise', sigma: 0.3, delta: 0.1, theta: 0.15 },
      { type: 'regression' }
      
    ]),
    
    critic: new window.neurojs.Network.Model([
      
      { type: 'input', size: input + actions },
      { type: 'fc', size: 256, activation: 'relu' },
      { type: 'fc', size: 256, activation: 'relu' },
      { type: 'fc', size: 128, activation: 'relu' },
      { type: 'fc', size: 1 },
      { type: 'regression' }
      
    ])
    
  }
  
  globals.brains.shared = new window.neurojs.Shared.ConfigPool()
  
  // this.brains.shared.set('actor', this.brains.actor.newConfiguration())
  globals.brains.shared.set('critic', globals.brains.critic.newConfiguration())
  
  
  chooseQoute()
  globals.world = new b2.World(new b2.Vec2(0, -10));
  globals.floor = createFloor();
  [globals.agents, globals.walkers] = createPopulation();

  drawInit();

  globals.step_counter = 0;
  // globals.simulation_interval = setInterval(simulationStep, Math.round(1000/config.simulation_fps));
  // globals.draw_interval = setInterval(drawFrame, Math.round(1000 / config.draw_fps));

  globals.display_interval = setInterval(displayProgress, Math.round(380 * 1000 / config.draw_fps));
  globals.charts_interval = setInterval(updateCharts, Math.round(380 * 1000 / config.draw_fps));

  globals.running = true
  requestAnimFrame(loop)

}

loop = function () { 
  simulationStep()
  drawFrame()
  if (globals.running) requestAnimFrame(loop); // start next timer
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

  // step agents (only after step 50 when they are on the ground)
  populationSimulationStep();
}

updateCharts = function () { 
  var groupN = 100
  if (globals.agents[0].infos.length>=groupN) {
    if (!globals.charts) { 
      globals.charts = new Charts()
      globals.charts.init(globals.agents, groupN)
    } else {
      globals.charts.update(globals.agents, groupN, 100000)
    }    
  }
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
  for (var k = 0; k < config.population_size; k++) {
    if (globals.walkers[k].steps>150) 
      globals.agents[k].step()
    else
    globals.walkers[k].simulationStep()
  }  
  var steps = globals.agents[0].walker.steps
  if ((steps!==0) && (0 == steps % config.round_length)) {
    resetSimulation()
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
