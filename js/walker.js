// walker has fixed shapes and structures
// shape definitions are in the constructor


function deg2rad(deg) { 
  return deg/180*Math.PI
}


var Walker = function() {
  this.__constructor.apply(this, arguments);
}

const STRENGTH = 6

Walker.prototype.__constructor = function(world) {
  this.world = globals.world;

  this.density = 106.2; // common for all fixtures, no reason to be too specific

  this.max_distance = -5;
  this.health = 10 //config.walker_health;
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
  // Note for more info see : https://github.com/openai/gym/wiki/Humanoid-V1
  // For 3d definition https://github.com/openai/gym/blob/master/gym/envs/mujoco/assets/humanoid.xml
  var jd = new b2.RevoluteJointDef();
  var position = upper_torso.GetPosition().Clone();
  position.y -= this.torso_def.upper_height/2;
  position.x -= this.torso_def.lower_width/3;
  jd.Initialize(upper_torso, lower_torso, position);
  jd.lowerAngle = deg2rad(-30);
  jd.upperAngle = deg2rad(75);
  
  jd.enableLimit = true;
  jd.maxMotorTorque = 250 * STRENGTH;
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
  jd.lowerAngle = deg2rad(-100);
  jd.upperAngle = deg2rad(-2);
  jd.enableLimit = true;
  jd.maxMotorTorque = 160 * STRENGTH;
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
  jd.maxMotorTorque = 70 * STRENGTH;
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
  jd.lowerAngle = deg2rad(0);
  jd.upperAngle = deg2rad(85);
  jd.enableLimit = true;
  jd.maxMotorTorque = 100 * STRENGTH;
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
  jd.upperAngle = 0.2;
  jd.enableLimit = true;
  jd.maxMotorTorque = 2 * STRENGTH;
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
  jd.lowerAngle = deg2rad(-60);
  jd.upperAngle = deg2rad(125);
  jd.enableLimit = true;
  jd.maxMotorTorque = 200 * STRENGTH;
  jd.motorSpeed = 0;
  jd.enableMotor = true;
  this.joints.push(this.world.CreateJoint(jd));

  var jd = new b2.RevoluteJointDef();
  jd.Initialize(this.torso.upper_torso, this.left_arm.upper_arm, position);
  jd.lowerAngle = deg2rad(-60);
  jd.upperAngle = deg2rad(125);
  jd.enableLimit = true;
  jd.maxMotorTorque = 200 * STRENGTH;
  jd.motorSpeed = 0;
  jd.enableMotor = true;
  this.joints.push(this.world.CreateJoint(jd));

  // torso/legs
  var jd = new b2.RevoluteJointDef();
  position = this.torso.lower_torso.GetPosition().Clone();
  position.y -= this.torso_def.lower_height/2;
  jd.Initialize(this.torso.lower_torso, this.right_leg.upper_leg, position);
  jd.lowerAngle = deg2rad(-10);
  jd.upperAngle = deg2rad(80);
  jd.enableLimit = true;
  jd.maxMotorTorque = 250 * STRENGTH;
  jd.motorSpeed = 0;
  jd.enableMotor = true;
  this.joints.push(this.world.CreateJoint(jd));

  var jd = new b2.RevoluteJointDef();
  jd.Initialize(this.torso.lower_torso, this.left_leg.upper_leg, position);
  jd.lowerAngle = deg2rad(-10);
  jd.upperAngle = deg2rad(80);
  jd.enableLimit = true;
  jd.maxMotorTorque = 250 * STRENGTH;
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
  return  this.bodies
    .reduce((a, body) => {
      var t = body.GetTransform()
      var dt = body.GetLinearVelocity()

      a.push(t.p.x)
      a.push(t.p.y)
      a.push(dt.x)
      a.push(dt.y)
      a.push(t.q.s)
      a.push(t.q.c)
      a.push(body.GetAngularVelocity())
      return a
    }, [])
}

Walker.prototype.simulationPreStep = function (motorSpeeds) {  
  // act
  for (var k = 0; k < this.joints.length; k++) {
    this.joints[k].SetMotorSpeed(motorSpeeds[k] * 3); // action can range from -3 to 3, radians per second
  }
}

Walker.prototype.simulationStep = function (motorSpeeds) {
  /* score/reward */
  // reward copied from OpenAI Gym Humanoid Walker https://github.com/openai/gym/blob/master/gym/envs/mujoco/humanoid.py
  // also see https://github.com/AdamStelmaszczyk/learning2run/blob/master/osim-rl/osim/env/run.py#L67
  // https://github.com/openai/gym/blob/master/gym/envs/mujoco/assets/humanoidstandup.xml

  // reward for keeping head up
  var head_height_reward = this.head.head.GetPosition().y * 2;  // it's head should be above it's feet 2*(-0.25-2)

  // reward for moving one leg beyond the other (stepping)
  var left_leg_forward = this.right_leg.foot.GetPosition().x > this.left_leg.foot.GetPosition().x;
  var leg_switch_reward = (left_leg_forward!=this.last_left_left_forward)? 1:0

  // cost for moving joints to unnatural positions
  var joint_angle_cost = - 0.02 * this.joints.map(j=>j.GetJointAngle()-j.GetReferenceAngle()).reduce((o,v)=>o+v*v,0) // - 0.02 * (0 - 20)

  // reward for moving rights
  var position = this.torso.upper_torso.GetPosition().x
  if (this.last_position === undefined) this.last_position = position
  var velocity = (position - this.last_position) * 40
  this.last_position = position
  lin_vel_reward = 6 * velocity

  // punish for using energy, squared
  var quad_ctrl_cost = -0.01 * this.joints.map(j => j.GetJointSpeed()).reduce((sum, speed) => sum + speed ** 2)
  var bonus_happiness = 5 // May they find happiness for all their days

  // we don't have data on external forces, so I will just punish for contact with the ground
  var contacts = this.bodies.map(b => b.GetContactList()).filter(b => b).length
  quad_impact_cost = -Math.min(contacts - 4, 10)/8

  this.rewards = {
    lin_vel_reward,
    quad_ctrl_cost,
    quad_impact_cost,
    joint_angle_cost,
    bonus_happiness,
    head_height_reward,
    leg_switch_reward
  }
  
  this.reward = Object.values(this.rewards).reduce((tot,v)=>tot+v, 0) * 10

  this.last_left_left_forward = left_leg_forward

  var info = {}
  var done = 0
  return [this.getState(), this.reward, done, info]
}
