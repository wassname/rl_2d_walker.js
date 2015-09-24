config = {
  time_step: 60,
  simulation_fps: 60,
  draw_fps: 60,
  velocity_iterations: 8,
  position_iterations: 3,
  max_zoom_factor: 130,
  min_motor_speed: -2,
  max_motor_speed: 2,
  population_size: 20,
  mutation_chance: 0.1,
  mutation_amount: 0.5,
  walker_health: 300,
  fitness_criterium: 'score',
  check_health: true,
  elite_clones: 2,
  max_floor_tiles: 50,
  round_length: 1200,
  min_body_delta: 1.4,
  min_leg_delta: 0.4,
  instadeath_delta: 0.4
};

globals = {};

gameInit = function() {
  interfaceSetup();

  globals.world = new b2.World(new b2.Vec2(0, -10));
  globals.walkers = createPopulation();

  globals.floor = createFloor();
  drawInit();

  globals.step_counter = 0;
  globals.simulation_interval = setInterval(simulationStep, Math.round(1000/config.simulation_fps));
  globals.draw_interval = setInterval(drawFrame, Math.round(1000/config.draw_fps));
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
  document.getElementById("generation_timer_bar").style.width = (100*globals.step_counter/config.round_length)+"%";
  if(globals.step_counter > config.round_length) {
    nextGeneration();
  }
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
  setQuote();
  if(typeof globals.generation_count == 'undefined') {
    globals.generation_count = 0;
  } else {
    globals.generation_count++;
  }
  updateGeneration(globals.generation_count);
  var walkers = [];
  for(var k = 0; k < config.population_size; k++) {
    if(genomes && genomes[k]) {
      walkers.push(new Walker(globals.world, genomes[k]));
    } else {
      walkers.push(new Walker(globals.world));
    }
    if(globals.generation_count > 0 && k < config.elite_clones) {
      walkers[walkers.length - 1].is_elite = true;
    } else {
      walkers[walkers.length - 1].is_elite = false;
    }
  }
  return walkers;
}

populationSimulationStep = function() {
  var dead_dudes = 0;
  for(var k = 0; k < config.population_size; k++) {
    if(globals.walkers[k].health > 0) {
      globals.walkers[k].simulationStep();
    } else {
      if(!globals.walkers[k].is_dead) {
        for(var l = 0; l < globals.walkers[k].bodies.length; l++) {
          if(globals.walkers[k].bodies[l]) {
            globals.world.DestroyBody(globals.walkers[k].bodies[l]);
            globals.walkers[k].bodies[l] = null;
          }
        }
        globals.walkers[k].is_dead = true;
      }
      dead_dudes++;
    }
  }
  printNames(globals.walkers);
  if(dead_dudes >= config.population_size) {
    nextGeneration();
  }
}

nextGeneration = function() {
  if(globals.simulation_interval)
    clearInterval(globals.simulation_interval);
  if(globals.draw_interval)
    clearInterval(globals.draw_interval);
  getInterfaceValues();
  var genomes = createNewGenerationGenomes();
  killGeneration();
  globals.walkers = createPopulation(genomes);
  resetCamera();
  globals.step_counter = 0;
  globals.simulation_interval = setInterval(simulationStep, Math.round(1000/config.simulation_fps));
  if(config.draw_fps > 0) {
    globals.draw_interval = setInterval(drawFrame, Math.round(1000/config.draw_fps));
  }
}

killGeneration = function() {
  for(var k = 0; k < globals.walkers.length; k++) {
    for(var l = 0; l < globals.walkers[k].bodies.length; l++) {
      if(globals.walkers[k].bodies[l])
        globals.world.DestroyBody(globals.walkers[k].bodies[l]);
    }
  }
}

createNewGenerationGenomes = function() {
  globals.walkers.sort(function(a,b) {
    return b[config.fitness_criterium] - a[config.fitness_criterium];
  });
  if(typeof globals.last_record == 'undefined') {
    globals.last_record = 0;
  }
  if(globals.walkers[0][config.fitness_criterium] > globals.last_record) {
    printChampion(globals.walkers[0]);
    globals.last_record = globals.walkers[0][config.fitness_criterium];
  }

  var genomes = [];
  var parents = null;
  // clones
  for(var k = 0; k < config.elite_clones; k++) {
    genomes.push(globals.walkers[k].genome);
  }
  for(var k = config.elite_clones; k < config.population_size; k++) {
    if(parents = pickParents()) {
      genomes.push(copulate(globals.walkers[parents[0]], globals.walkers[parents[1]]));
    }
  }
  genomes = mutateClones(genomes);
  return genomes;
}

pickParents = function() {
  var parents = [];
  for(var k = 0; k < config.population_size; k++) {
    if(Math.random() < (1/(k+2))) {
      parents.push(k);
      if(parents.length >= 2) {
        break;
      }
    }
  }
  if(typeof parents[0] == 'undefined' || typeof parents[1] == 'undefined') {
    return false;
  }
  return parents;
}

copulate = function(walker_1, walker_2) {
  var new_genome = [];
  for(var k = 0; k < walker_1.genome.length; k++) {
    if(Math.random() < 0.5) {
      var parent = walker_1;
    } else {
      var parent = walker_2
    }
    var new_gene = JSON.parse(JSON.stringify(parent.genome[k]));
    for(var g in walker_1.genome[k]) {
      if(walker_1.genome[k].hasOwnProperty(g)) {
        if(Math.random() < config.mutation_chance) {
          if(g.indexOf('target') >= 0) {
            new_gene[g] = Math.floor(Math.random() * walker_1.bodies.length);
          } else {
            new_gene[g] = new_gene[g] * (1 + config.mutation_amount*(Math.random()*2 - 1));
          }
        }
      }
    }
    new_genome[k] = new_gene;
  }
  return new_genome;
}

mutateClones = function(genomes) {
  if(parseFloat(config.mutation_chance) == 0) {
    return genomes;
  }

  for(var k = 0; k < genomes.length; k++) {
    var current = JSON.stringify(genomes[k]);
    for(var l = k + 1; l < genomes.length; l++) {
      if(current == JSON.stringify(genomes[l])) {
        var to_mutate = Math.floor(Math.random() * genomes[l].length);
        for(var g in genomes[l][to_mutate]) {
          if(genomes[l][to_mutate].hasOwnProperty(g)) {
            if(g.indexOf('target') < 0) {
              genomes[l][to_mutate][g] = genomes[l][to_mutate][g] * (1 + config.mutation_amount*(Math.random()*2 - 1));
            }
          }
        }
      }
    }
  }
  return genomes;
}

getInterfaceValues = function() {
  config.elite_clones = document.getElementById("elite_clones").value;
  config.mutation_chance = document.getElementById("mutation_chance").value
  config.mutation_amount = document.getElementById("mutation_amount").value
}