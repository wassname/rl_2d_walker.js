drawInit = function() {
  globals.main_screen = document.getElementById("main_screen");
  globals.ctx = main_screen.getContext("2d");
  resetCamera();
}

resetCamera = function() {
  globals.zoom = config.max_zoom_factor;
  globals.translate_x = 0;
  globals.translate_y = 280;
}

setFps = function(fps) {
  config.draw_fps = fps;
  if(globals.draw_interval)
    clearInterval(globals.draw_interval);
  if(fps > 0 && config.simulation_fps > 0) {
    globals.draw_interval = setInterval(drawFrame, Math.round(1000/config.draw_fps));
  }
}

drawFrame = function() {
  var minmax = getMinMaxDistance();
  globals.target_zoom = Math.min(config.max_zoom_factor, getZoom(minmax.min_x, minmax.max_x + 4, minmax.min_y + 2, minmax.max_y + 2.5));
  globals.zoom += 0.1*(globals.target_zoom - globals.zoom);
  globals.translate_x += 0.1*(1.5-minmax.min_x - globals.translate_x);
  globals.translate_y += 0.3*(minmax.min_y*globals.zoom + 280 - globals.translate_y);
  //globals.translate_y = minmax.max_y*globals.zoom + 150;
  globals.ctx.clearRect(0, 0, globals.main_screen.width, globals.main_screen.height);
  globals.ctx.save();
  globals.ctx.translate(globals.translate_x*globals.zoom, globals.translate_y);
  globals.ctx.scale(globals.zoom, -globals.zoom);
  drawFloor();
  for(var k = config.population_size - 1; k >= 0 ; k--) {
    if(globals.walkers[k].health > 0) {
      drawWalker(globals.walkers[k]);
    }
  }
  globals.ctx.restore();
}

drawFloor = function() {
  globals.ctx.strokeStyle = "#444";
  globals.ctx.lineWidth = 1/globals.zoom;
  globals.ctx.beginPath();
  var floor_fixture = globals.floor.GetFixtureList();
  globals.ctx.moveTo(floor_fixture.m_shape.m_vertices[0].x, floor_fixture.m_shape.m_vertices[0].y);
  for(var k = 1; k < floor_fixture.m_shape.m_vertices.length; k++) {
    globals.ctx.lineTo(floor_fixture.m_shape.m_vertices[k].x, floor_fixture.m_shape.m_vertices[k].y);
  }
  globals.ctx.stroke();
}

drawWalker = function(walker) {
  if(walker.is_elite) {
    //globals.ctx.strokeStyle = "hsl(22,"+100*walker.health/config.walker_health+"%,35%)";
//     globals.ctx.fillStyle = "hsl(20,"+45*walker.health/config.walker_health+"%,85%)";
    globals.ctx.strokeStyle = "hsl(22,100%,"+(90-55*walker.health/config.walker_health)+"%)";
    globals.ctx.fillStyle = "hsl(20,45%,"+(100-15*walker.health/config.walker_health)+"%)";
  } else {
    //globals.ctx.strokeStyle = "hsl(240,"+100*walker.health/config.walker_health+"%,41%)";
//     globals.ctx.fillStyle = "hsl(240,"+17*walker.health/config.walker_health+"%,85%)";
    globals.ctx.strokeStyle = "hsl(240,100%,"+(90-49*walker.health/config.walker_health)+"%)";
    globals.ctx.fillStyle = "hsl(240,45%,"+(100-15*walker.health/config.walker_health)+"%)";
  }
  globals.ctx.lineWidth = 1/globals.zoom;

  // left legs and arms first
  drawRect(walker.left_arm.lower_arm);
  drawRect(walker.left_arm.upper_arm);
  drawRect(walker.left_leg.foot);
  drawRect(walker.left_leg.lower_leg);
  drawRect(walker.left_leg.upper_leg);

  // head
  drawRect(walker.head.neck);
  drawRect(walker.head.head);

  // torso
  drawRect(walker.torso.lower_torso);
  drawRect(walker.torso.upper_torso);

  // right legs and arms
  drawRect(walker.right_leg.upper_leg);
  drawRect(walker.right_leg.lower_leg);
  drawRect(walker.right_leg.foot);
  drawRect(walker.right_arm.upper_arm);
  drawRect(walker.right_arm.lower_arm);
}

drawRect = function(body) {
  // set strokestyle and fillstyle before call
  globals.ctx.beginPath();
  var fixture = body.GetFixtureList();
  var shape = fixture.GetShape();
  var p0 = body.GetWorldPoint(shape.m_vertices[0]);
  globals.ctx.moveTo(p0.x, p0.y);
  for(var k = 1; k < 4; k++) {
    var p = body.GetWorldPoint(shape.m_vertices[k]);
    globals.ctx.lineTo(p.x, p.y);
  }
  globals.ctx.lineTo(p0.x, p0.y);

  globals.ctx.fill();
  globals.ctx.stroke();
}

drawTest = function() {
  globals.ctx.strokeStyle = "#000";
  globals.ctx.fillStyle = "#666";
  globals.ctx.lineWidth = 1;
  globals.ctx.beginPath();
  globals.ctx.moveTo(0, 0);
  globals.ctx.lineTo(0, 2);
  globals.ctx.lineTo(2, 2);

  globals.ctx.fill();
  globals.ctx.stroke();

}

getMinMaxDistance = function() {
  var min_x = 9999;
  var max_x = -1;
  var min_y = 9999;
  var max_y = -1;
  for(var k = 0; k < globals.walkers.length; k++) {
    if(globals.walkers[k].health > 0) {
      var dist = globals.walkers[k].torso.upper_torso.GetPosition();
      min_x = Math.min(min_x, dist.x);
      max_x = Math.max(max_x, dist.x);
      min_y = Math.min(min_y, globals.walkers[k].low_foot_height, globals.walkers[k].head_height);
      max_y = Math.max(max_y, dist.y);
    }
  }
  return {min_x:min_x, max_x:max_x, min_y:min_y, max_y:max_y};
}

getZoom = function(min_x, max_x, min_y, max_y) {
  var delta_x = Math.abs(max_x - min_x);
  var delta_y = Math.abs(max_y - min_y);
  var zoom = Math.min(globals.main_screen.width/delta_x,globals.main_screen.height/delta_y);
  return zoom;
}