const config = require('./config')
const {Charts} = require('./charts')


if typeof window !=="undefined"
  var requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) { window.setTimeout(callback, 1000 / 60); };
else
  var requestAnimFrame = function (callback) { window.setTimeout(callback, 1000 / 60); };


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

class Game { 
  constructor(params) {
    var bodyParts = 16
    var joints = 14
    var state = bodyParts * 10 + joints * 3
    var actions = joints + 4
    var input = 2 * state + 1 * actions
  
    
    chooseQoute()
    this.world = new b2.World(new b2.Vec2(0, -10));
    this.floor = createFloor(this.world);
    [this.agents, this.walkers] = createPopulation();
  
    drawInit();
  
    this.step_counter = 0;
  
    this.display_interval = setInterval(displayProgress, Math.round(380 * 1000 / config.draw_fps));
    this.charts_interval = setInterval(updateCharts, Math.round(380 * 1000 / config.draw_fps));
  
    this.running = true
    requestAnimFrame(loop)
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
  
  
  resetSimulation() { 
    // turn training off temporarlity to avoid NaN's
    updateIfLearning(false)
    // this.running = false
  
    this.world.Destroy() // this way we get rid of listeners and body parts and joints
    this.world = new b2.World(new b2.Vec2(0, -10));
    this.floor = createFloor(this.world);
    for (var k = 0; k < config.population_size; k++) {
      this.agents[k].walker = this.walkers[k] = new Walker(this.world, this.floor)
    }
  
    // this.running = true
    setTimeout(() => updateIfLearning(true), 1000)
    // setTimeout(() => requestAnimFrame(loop), 1000)
  
  }
  
  loop() { 
    drawFrame()
    simulationStep()
    drawFrame()
    if (this.running) requestAnimFrame(loop); // start next timer
  }
  
  
  updateCharts() { 
    var groupN = 100
    var maxN = 100000
    if (this.agents[0].infos.length>=groupN) {
      if (!this.charts) { 
        this.charts = new Charts()
        this.charts.init(this.agents, groupN)
      } else {
        this.charts.update(this.agents, groupN, maxN)
      }    
    }
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

// downloadBrain = function (n) {
//   var ts = (new Date()).toISOString().replace(':','_')
//   var buf = this.agents[n].brain.export()
// 	saveAs(new DataView(buf), 'walker_brain_'+n+'_'+ts+'.bin')
// };


// readBrain = function (buf) {
//   var input = event.target;
//   var reader = new FileReader();
//   reader.onload = function(){
//       var buffer = reader.result
//       var imported = window.neurojs.NetOnDisk.readMultiPart(buffer)

//       for (var i = 0; i <  this.agents.length; i++) {
//           this.agents[i].brain.algorithm.actor.set(imported.actor.clone())
//           this.agents[i].brain.algorithm.critic.set(imported.critic)
//       }
//   };

//   reader.readAsArrayBuffer(input.files[0]);
// };


module.exports = {Game, chooseQoute, saveAs}
