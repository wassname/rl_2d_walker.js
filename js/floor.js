function createFloor() {
  var body_def = new b2.BodyDef();
  var body = globals.world.CreateBody(body_def);
  var fix_def = new b2.FixtureDef();
  fix_def.friction = 0.8;
  fix_def.shape = new b2.ChainShape();

  // start with flat floor
  var edges = [
    new b2.Vec2(-3.5, -0.16),
    new b2.Vec2(2.5, -0.16)
  ];

  for(var k = 2; k < config.max_floor_tiles; k++) {
    var ratio = k/config.max_floor_tiles;
    edges.push(new b2.Vec2(edges[edges.length-1].x + (1  + ratio * Math.random() - ratio/2), edges[edges.length-1].y + (ratio * Math.random() - ratio/2 )));
//    edges.push(new b2.Vec2(edges[edges.length-1].x + 1,-0.16));
  }
  fix_def.shape.CreateChain(edges, edges.length);
  body.CreateFixture(fix_def);
  return body;
}
