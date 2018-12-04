var b2 = require('../vendor/jsbox2d')

function createFloor(world, max_floor_tiles) {
  var body_def = new b2.BodyDef();
  var body = world.CreateBody(body_def);
  body.SetUserData('floor')
  var fix_def = new b2.FixtureDef();
  fix_def.friction = 0.8;
  fix_def.shape = new b2.ChainShape();

  // start with flat floor
  var edges = [
    new b2.Vec2(-3.5, 18), // back wall
    new b2.Vec2(-3.5, -0.16),
    new b2.Vec2(2.5, -0.16)
  ];

  for (var k = 2; k < max_floor_tiles; k++) {
    var ratio = k / max_floor_tiles;
    // add uneven floor by continuing from the last point, plus some random jittering
    edges.push(new b2.Vec2(
      edges[edges.length - 1].x + (1 + ratio * Math.random() - ratio / 2),
      edges[edges.length - 1].y + (ratio * Math.random() - ratio / 2)));
    //    edges.push(new b2.Vec2(edges[edges.length-1].x + 1,-0.16));
  }
  edges.push(new b2.Vec2(edges[edges.length - 1].x + 5, edges[edges.length - 1].y + 5)); // front wall
  edges.push(new b2.Vec2(edges[edges.length - 1].x + 7, edges[edges.length - 1].y + 15)); // front wall
  edges.push(new b2.Vec2(edges[edges.length - 1].x + 8, edges[edges.length - 1].y + 35)); // front wall
  edges.push(new b2.Vec2(edges[edges.length - 1].x + 8, edges[edges.length - 1].y + 45)); // front wall
  fix_def.shape.CreateChain(edges, edges.length);
  body.CreateFixture(fix_def);
  return body;
}

module.exports = createFloor
