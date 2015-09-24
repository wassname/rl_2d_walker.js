quotes = [
  "The Ministry of Silly Walks on steroids",
  "It's like watching other people QWOP",
  "Keep tumbling",
  "As seen on a negative comment on Reddit",
  "The Walking Sad",
  "The Walking Fad",
  "Army of QWOP",
  "Nice me-and-my-friends-leaving-the-bar-at-2am simulator!"
];

printNames = function(walkers) {
  var name_list = document.getElementById("name_list");
  name_list.innerHTML = "";
  for(var k = 0; k < walkers.length; k++) {
    var tr = document.createElement("TR");
    if(walkers[k].is_elite) {
      tr.className = "elite_name";
    }
    var td = document.createElement("TD");
    td.className = "name";
    td.appendChild(document.createTextNode(walkers[k].name));
    tr.appendChild(td);

    td = document.createElement("TD");
    td.className = "score";
    td.appendChild(document.createTextNode(walkers[k][config.fitness_criterium].toFixed(2)));
    tr.appendChild(td);
    name_list.appendChild(tr);
  }
}

printChampion = function(walker) {
  var champ_list = document.getElementById("champ_list");
  var tr = document.createElement("TR");

  var cur_rows = champ_list.getElementsByTagName("TR");
  if(cur_rows.length >= config.population_size) {
    champ_list.removeChild(cur_rows[0]);
  }

  var td = document.createElement("TD");
  td.className = "generation";
  td.appendChild(document.createTextNode(globals.generation_count));
  tr.appendChild(td);

  td = document.createElement("TD");
  td.className = "name";
  td.appendChild(document.createTextNode(walker.name));
  tr.appendChild(td);

  td = document.createElement("TD");
  td.className = "score";
  td.appendChild(document.createTextNode(walker[config.fitness_criterium].toFixed(2)));
  tr.appendChild(td);

  champ_list.appendChild(tr);
}

updateGeneration = function(number) {
  document.getElementById("gen_number").innerHTML = number;
}

setQuote = function() {
  document.getElementById("page_quote").innerHTML = '"'+quotes[Math.floor(Math.random() * quotes.length)]+'"';
}

interfaceSetup = function() {
  var mut_chance_sel = document.getElementById("mutation_chance");
  for(var k = 0; k < mut_chance_sel.options.length; k++) {
    if(mut_chance_sel.options[k].value == config.mutation_chance) {
      mut_chance_sel.options[k].selected = true;
      break;
    }
  }
  var mut_amount_sel = document.getElementById("mutation_amount");
  for(var k = 0; k < mut_amount_sel.options.length; k++) {
    if(mut_amount_sel.options[k].value == config.mutation_amount) {
      mut_amount_sel.options[k].selected = true;
      break;
    }
  }

  var elite_clones_sel = document.getElementById("elite_clones");
  for(var k = 0; k <= config.population_size; k++) {
    var option = document.createElement("OPTION");
    option.value = k;
    option.label = k;
    if(k == config.elite_clones) {
      option.selected = true;
    }
    elite_clones_sel.appendChild(option);
  }

  var round_length_sel = document.getElementById("round_length");
  for(var k = 0; k <= round_length_sel.options.length; k++) {
    if(round_length_sel.options[k].value == config.round_length) {
      round_length_sel.options[k].selected = true;
      break;
    }
  }

  round_length_sel.onchange = function() {
    config.round_length = round_length_sel.value;
  }

  var fps_sel = document.getElementById("draw_fps");
  for(var k = 0; k < fps_sel.options.length; k++) {
    if(fps_sel.options[k].value == config.draw_fps) {
      fps_sel.options[k].selected = true;
      break;
    }
  }

  fps_sel.onchange = function() {
    setFps(fps_sel.value);
  }

  var simulation_fps_sel = document.getElementById("simulation_fps");
  for(var k = 0; k < simulation_fps_sel.options.length; k++) {
    if(simulation_fps_sel.options[k].value == config.simulation_fps) {
      simulation_fps_sel.options[k].selected = true;
      break;
    }
  }

  simulation_fps_sel.onchange = function() {
    setSimulationFps(simulation_fps_sel.value);
  }

}