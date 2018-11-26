// walker has fixed shapes and structures
// shape definitions are in the constructor


var Walker = function() {
  this.__constructor.apply(this, arguments);
}

Walker.prototype.__constructor = function(world) {
  this.world = globals.world;

  this.density = 106.2; // common for all fixtures, no reason to be too specific

  this.max_distance = -5;
  this.health = config.walker_health;
  this.score = 0;
  this.low_foot_height = 0;
  this.head_height = 0;
  this.steps = 0;
  this.distance = 0 
  this.last_left_left_forward = true

  this.hue = Math.randf(200,360)

  this.bd = new b2.BodyDef({positions: {x:10, y:-10}});
  this.bd.position.x += Math.randf(-10, 10)
  this.bd.type = b2.Body.b2_dynamicBody;
  this.bd.linearDamping = 0;
  this.bd.angularDamping = 0.01;
  this.bd.allowSleep = true;
  this.bd.awake = true;

  this.fd = new b2.FixtureDef();
  this.fd.density = this.density;
  this.fd.restitution = 0.1;
  this.fd.shape = new b2.PolygonShape();
  this.fd.filter.groupIndex = -1;

  this.torso_def = {
    upper_width: 0.25,
    upper_height: 0.45,
    lower_width: 0.25,
    lower_height: 0.2
  };

  this.leg_def = {
    femur_width: 0.18,
    femur_length: 0.45,
    tibia_width: 0.13,
    tibia_length: 0.38,
    foot_height: 0.08,
    foot_length: 0.28
  };

  this.arm_def = {
    arm_width: 0.12,
    arm_length: 0.37,
    forearm_width: 0.1,
    forearm_length: 0.42
  }

  this.head_def = {
    head_width: 0.22,
    head_height: 0.22,
    neck_width: 0.1,
    neck_height: 0.08
  }

  this.joints = [];

  this.torso = this.createTorso();
  this.left_leg = this.createLeg();
  this.right_leg = this.createLeg();
  this.left_arm = this.createArm();
  this.right_arm = this.createArm();
  this.head = this.createHead();
  this.connectParts();

  this.bodies = this.getBodies();
}

Walker.prototype.createTorso = function() {
  // upper torso
  this.bd.position.Set(0.5 - this.leg_def.foot_length/2 + this.leg_def.tibia_width/2, this.leg_def.foot_height/2 + this.leg_def.foot_height/2 + this.leg_def.tibia_length + this.leg_def.femur_length + this.torso_def.lower_height + this.torso_def.upper_height/2);
  var upper_torso = this.world.CreateBody(this.bd);

  this.fd.shape.SetAsBox(this.torso_def.upper_width/2, this.torso_def.upper_height/2);
  upper_torso.CreateFixture(this.fd);

  // lower torso
  this.bd.position.Set(0.5 - this.leg_def.foot_length/2 + this.leg_def.tibia_width/2, this.leg_def.foot_height/2 + this.leg_def.foot_height/2 + this.leg_def.tibia_length + this.leg_def.femur_length + this.torso_def.lower_height/2);
  var lower_torso = this.world.CreateBody(this.bd);

  this.fd.shape.SetAsBox(this.torso_def.lower_width/2, this.torso_def.lower_height/2);
  lower_torso.CreateFixture(this.fd);

  // torso joint
  var jd = new b2.RevoluteJointDef();
  var position = upper_torso.GetPosition().Clone();
  position.y -= this.torso_def.upper_height/2;
  position.x -= this.torso_def.lower_width/3;
  jd.Initialize(upper_torso, lower_torso, position);
  jd.lowerAngle = -Math.PI/18;
  jd.upperAngle = Math.PI/10;
  jd.enableLimit = true;
  jd.maxMotorTorque = 250;
  jd.motorSpeed = 0;
  jd.enableMotor = true;
  this.joints.push(this.world.CreateJoint(jd));

  return {upper_torso: upper_torso, lower_torso: lower_torso};
}

Walker.prototype.createLeg = function() {
  // upper leg
  this.bd.position.Set(0.5 - this.leg_def.foot_length/2 + this.leg_def.tibia_width/2, this.leg_def.foot_height/2 + this.leg_def.foot_height/2 + this.leg_def.tibia_length + this.leg_def.femur_length/2);
  var upper_leg = this.world.CreateBody(this.bd);

  this.fd.shape.SetAsBox(this.leg_def.femur_width/2, this.leg_def.femur_length/2);
  upper_leg.CreateFixture(this.fd);

  // lower leg
  this.bd.position.Set(0.5 - this.leg_def.foot_length/2 + this.leg_def.tibia_width/2, this.leg_def.foot_height/2 + this.leg_def.foot_height/2 + this.leg_def.tibia_length/2);
  var lower_leg = this.world.CreateBody(this.bd);

  this.fd.shape.SetAsBox(this.leg_def.tibia_width/2, this.leg_def.tibia_length/2);
  lower_leg.CreateFixture(this.fd);

  // foot
  this.bd.position.Set(0.5, this.leg_def.foot_height/2);
  var foot = this.world.CreateBody(this.bd);

  this.fd.shape.SetAsBox(this.leg_def.foot_length/2, this.leg_def.foot_height/2);
  foot.CreateFixture(this.fd);

  // leg joints
  var jd = new b2.RevoluteJointDef();
  var position = upper_leg.GetPosition().Clone();
  position.y -= this.leg_def.femur_length/2;
  position.x += this.leg_def.femur_width/4;
  jd.Initialize(upper_leg, lower_leg, position);
  jd.lowerAngle = -1.4;
  jd.upperAngle = 0;
  jd.enableLimit = true;
  jd.maxMotorTorque = 160;
  jd.motorSpeed = 0;
  jd.enableMotor = true;
  this.joints.push(this.world.CreateJoint(jd));

  // foot joint
  var position = lower_leg.GetPosition().Clone();
  position.y -= this.leg_def.tibia_length/2;
  jd.Initialize(lower_leg, foot, position);
  jd.lowerAngle = -Math.PI/5;
  jd.upperAngle = Math.PI/6;
  jd.enableLimit = true;
  jd.maxMotorTorque = 70;
  jd.motorSpeed = 0;
  jd.enableMotor = true;
  this.joints.push(this.world.CreateJoint(jd));

  return {upper_leg: upper_leg, lower_leg: lower_leg, foot:foot};
}

Walker.prototype.createArm = function() {
  // upper arm
  this.bd.position.Set(0.5 - this.leg_def.foot_length/2 + this.leg_def.tibia_width/2, this.leg_def.foot_height/2 + this.leg_def.foot_height/2 + this.leg_def.tibia_length + this.leg_def.femur_length + this.torso_def.lower_height + this.torso_def.upper_height - this.arm_def.arm_length/2);
  var upper_arm = this.world.CreateBody(this.bd);

  this.fd.shape.SetAsBox(this.arm_def.arm_width/2, this.arm_def.arm_length/2);
  upper_arm.CreateFixture(this.fd);

  // lower arm
  this.bd.position.Set(0.5 - this.leg_def.foot_length/2 + this.leg_def.tibia_width/2, this.leg_def.foot_height/2 + this.leg_def.foot_height/2 + this.leg_def.tibia_length + this.leg_def.femur_length + this.torso_def.lower_height + this.torso_def.upper_height - this.arm_def.arm_length - this.arm_def.forearm_length/2);
  var lower_arm = this.world.CreateBody(this.bd);

  this.fd.shape.SetAsBox(this.arm_def.forearm_width/2, this.arm_def.forearm_length/2);
  lower_arm.CreateFixture(this.fd);

  // arm joint
  var jd = new b2.RevoluteJointDef();
  var position = upper_arm.GetPosition().Clone();
  position.y -= this.arm_def.arm_length/2;
  jd.Initialize(upper_arm, lower_arm, position);
  jd.lowerAngle = 0;
  jd.upperAngle = 1.22;
  jd.enableLimit = true;
  jd.maxMotorTorque = 60;
  jd.motorSpeed = 0;
  jd.enableMotor = true;
  this.joints.push(this.world.CreateJoint(jd));

  return {upper_arm: upper_arm, lower_arm: lower_arm};
}

Walker.prototype.createHead = function() {
  // neck
  this.bd.position.Set(0.5 - this.leg_def.foot_length/2 + this.leg_def.tibia_width/2, this.leg_def.foot_height/2 + this.leg_def.foot_height/2 + this.leg_def.tibia_length + this.leg_def.femur_length + this.torso_def.lower_height + this.torso_def.upper_height + this.head_def.neck_height/2);
  var neck = this.world.CreateBody(this.bd);

  this.fd.shape.SetAsBox(this.head_def.neck_width/2, this.head_def.neck_height/2);
  neck.CreateFixture(this.fd);

  // head
  this.bd.position.Set(0.5 - this.leg_def.foot_length/2 + this.leg_def.tibia_width/2, this.leg_def.foot_height/2 + this.leg_def.foot_height/2 + this.leg_def.tibia_length + this.leg_def.femur_length + this.torso_def.lower_height + this.torso_def.upper_height + this.head_def.neck_height + this.head_def.head_height/2);
  var head = this.world.CreateBody(this.bd);

  this.fd.shape.SetAsBox(this.head_def.head_width/2, this.head_def.head_height/2);
  head.CreateFixture(this.fd);

  // neck joint
  var jd = new b2.RevoluteJointDef();
  var position = neck.GetPosition().Clone();
  position.y += this.head_def.neck_height/2;
  jd.Initialize(head, neck, position);
  jd.lowerAngle = -0.1;
  jd.upperAngle = 0.1;
  jd.enableLimit = true;
  jd.maxMotorTorque = 2;
  jd.motorSpeed = 0;
  jd.enableMotor = true;
  this.joints.push(this.world.CreateJoint(jd));

  return {head: head, neck: neck};
}

Walker.prototype.connectParts = function() {

  //neck/torso
  var jd = new b2.WeldJointDef();
  jd.bodyA = this.head.neck;
  jd.bodyB = this.torso.upper_torso;
  jd.localAnchorA = new b2.Vec2(0, -this.head_def.neck_height/2);
  jd.localAnchorB = new b2.Vec2(0, this.torso_def.upper_height/2);
  jd.referenceAngle = 0;
  this.world.CreateJoint(jd);

  // torso/arms
  var jd = new b2.RevoluteJointDef();
  position = this.torso.upper_torso.GetPosition().Clone();
  position.y += this.torso_def.upper_height/2;
  jd.Initialize(this.torso.upper_torso, this.right_arm.upper_arm, position);
  jd.lowerAngle = -Math.PI/5;
  jd.upperAngle = Math.PI/4;
  jd.enableLimit = true;
  jd.maxMotorTorque = 120;
  jd.motorSpeed = 0;
  jd.enableMotor = true;
  this.joints.push(this.world.CreateJoint(jd));

  var jd = new b2.RevoluteJointDef();
  jd.Initialize(this.torso.upper_torso, this.left_arm.upper_arm, position);
  jd.lowerAngle = -Math.PI/5;
  jd.upperAngle = Math.PI/4;
  jd.enableLimit = true;
  jd.maxMotorTorque = 120;
  jd.motorSpeed = 0;
  jd.enableMotor = true;
  this.joints.push(this.world.CreateJoint(jd));

  // torso/legs
  var jd = new b2.RevoluteJointDef();
  position = this.torso.lower_torso.GetPosition().Clone();
  position.y -= this.torso_def.lower_height/2;
  jd.Initialize(this.torso.lower_torso, this.right_leg.upper_leg, position);
  jd.lowerAngle = -Math.PI/8;
  jd.upperAngle = Math.PI/7;
  jd.enableLimit = true;
  jd.maxMotorTorque = 250;
  jd.motorSpeed = 0;
  jd.enableMotor = true;
  this.joints.push(this.world.CreateJoint(jd));

  var jd = new b2.RevoluteJointDef();
  jd.Initialize(this.torso.lower_torso, this.left_leg.upper_leg, position);
  jd.lowerAngle = -Math.PI/8;
  jd.upperAngle = Math.PI/7;
  jd.enableLimit = true;
  jd.maxMotorTorque = 250;
  jd.motorSpeed = 0;
  jd.enableMotor = true;
  this.joints.push(this.world.CreateJoint(jd));
}

Walker.prototype.getBodies = function() {

  return [
    this.head.head,
    this.head.neck,
    this.torso.upper_torso,
    this.torso.lower_torso,
    this.left_arm.upper_arm,
    this.left_arm.lower_arm,
    this.right_arm.upper_arm,
    this.right_arm.lower_arm,
    this.left_leg.upper_leg,
    this.left_leg.lower_leg,
    this.left_leg.foot,
    this.right_leg.upper_leg,
    this.right_leg.lower_leg,
    this.right_leg.foot
  ];
}

Walker.prototype.getState = function () { 
  return this.bodies
    .map(b => b.GetPosition())
    .reduce((o, p) => { o.push(p.x); o.push(p.y); return o }, [])
}

Walker.prototype.simulationStep = function (motorSpeeds) {
  
  // act
  for(var k = 0; k < this.joints.length; k++) {
    this.joints[k].SetMotorSpeed(motorSpeeds[k]*3); // action can range from -3 to 3, radians per second
  }

  /* score/reward */
  var head_height_reward = this.head.head.GetPosition().y;  // it's head should be above it's feet

  // TODO reward for moving one leg beyond the other?
  var left_leg_forward = this.right_leg.foot.GetPosition().x > this.left_leg.foot.GetPosition().x;
  var leg_switch_reward = (left_leg_forward!=this.last_left_left_forward)? 5:0

  // reward copied from OpenAI Gym Humanoid Walker https://github.com/openai/gym/blob/master/gym/envs/mujoco/humanoid.py
  // also see https://github.com/AdamStelmaszczyk/learning2run/blob/master/osim-rl/osim/env/run.py#L67
  var velocity = this.torso.upper_torso.GetLinearVelocity().x
  lin_vel_reward = 6 * velocity

  // punish for using energy, squared
  var quad_ctrl_cost = -0.1 * this.joints.map(j => j.GetJointSpeed()).reduce((sum, speed) => sum + speed ** 2)
  var alive_bonus = 5

  // we don't have data on external forces, so I will just punish for contact
  var contacts = this.bodies.map(b => b.GetContactList()).filter(b => b).length
  quad_impact_cost = -Math.min(contacts - 2, 10)/4

  this.rewards = {
    lin_vel_reward,
    quad_ctrl_cost,
    quad_impact_cost,
    alive_bonus,
    head_height_reward,
    leg_switch_reward
  }
  
  this.reward = Object.values(this.rewards).reduce((tot,v)=>tot+v, 0)

  this.last_left_left_forward = left_leg_forward

  return
}
