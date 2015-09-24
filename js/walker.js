// walker has fixed shapes and structures
// shape definitions are in the constructor


var Walker = function() {
  this.__constructor.apply(this, arguments);
}

Walker.prototype.__constructor = function(world, genome) {

  this.world = globals.world;

  this.density = 106.2; // common for all fixtures, no reason to be too specific

  this.max_distance = -5;
  this.health = config.walker_health;
  this.score = 0;
  this.low_foot_height = 0;
  this.head_height = 0;
  this.steps = 0;

  this.bd = new b2.BodyDef();
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

  if(genome) {
    this.genome = JSON.parse(JSON.stringify(genome));
  } else {
    this.genome = this.createGenome(this.joints, this.bodies);
  }

  this.name = this.makeName(this.genome);
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
  // neck/torso
//   var jd = new b2.RevoluteJointDef();
//   var position = this.head.neck.GetPosition().Clone();
//   position.y -= this.head_def.neck_height/2;
//   jd.Initialize(this.head.neck, this.torso.upper_torso, position);
//   jd.lowerAngle = 0;
//   jd.upperAngle = 0.2;
//   jd.enableLimit = true;
//   jd.maxMotorTorque = 2;
//   jd.motorSpeed = 0;
//   jd.enableMotor = true;
//   this.joints.push(this.world.CreateJoint(jd));

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

Walker.prototype.createGenome = function(joints, bodies) {
  var genome = [];
  for(var k = 0; k < joints.length; k++) {
    var gene = new Object();
    /*
    gene.target_body1 = Math.floor(Math.random() * bodies.length);
    gene.target_body2 = Math.floor(Math.random() * bodies.length);
    gene.target_body3 = Math.floor(Math.random() * bodies.length);
    gene.body_cos_multiplier1 = 6*Math.random() - 3;
    gene.body_cos_multiplier2 = 6*Math.random() - 3;
    gene.body_cos_multiplier3 = 6*Math.random() - 3;

    gene.torso_angle_multiplier = 4*Math.random() -2;
    */
    gene.cos_factor = 6*Math.random() - 3;
    gene.time_factor = Math.random()/10;
    gene.time_shift = Math.random()*Math.PI/2
    genome.push(gene);
  }
  return genome;
}

Walker.prototype.simulationStep = function() {
  for(var k = 0; k < this.joints.length; k++) {
    /*
    var target_body1 = this.bodies[this.genome[k].target_body1];
    var target_body2 = this.bodies[this.genome[k].target_body2];
    var target_body3 = this.bodies[this.genome[k].target_body3];

    var sin1 = Math.sin(target_body1.GetAngle());
    var sin2 = Math.sin(target_body2.GetAngle());
    var sin3 = Math.sin(target_body3.GetAngle());

    this.joints[k].SetMotorSpeed(
      this.genome[k].cos_factor *           Math.sin(this.genome[k].torso_angle_multiplier*this.torso.upper_torso.GetAngle()) +
      this.genome[k].body_cos_multiplier1 * sin1 +
      this.genome[k].body_cos_multiplier2 * sin2 +
      this.genome[k].body_cos_multiplier3 * sin3
    );
    */
    this.joints[k].SetMotorSpeed(this.genome[k].cos_factor*Math.cos(this.genome[k].time_shift+this.genome[k].time_factor*globals.step_counter));
  }
  var oldmax = this.max_distance;
  var distance = this.torso.upper_torso.GetPosition().x;
  this.max_distance = Math.max(this.max_distance, distance);

  // score
  this.head_height = this.head.head.GetPosition().y;
  this.low_foot_height = Math.min(this.left_leg.foot.GetPosition().y, this.right_leg.foot.GetPosition().y);
  var body_delta = this.head_height-this.low_foot_height;
  var leg_delta = this.right_leg.foot.GetPosition().x - this.left_leg.foot.GetPosition().x;

  if(body_delta > config.min_body_delta) {
    this.score += body_delta/50;
    if(this.max_distance > oldmax) {
      if(Math.abs(leg_delta) > config.min_leg_delta && this.head.head.m_linearVelocity.y > -2) {
        if(typeof this.leg_delta_sign == 'undefined') {
          this.leg_delta_sign = leg_delta/Math.abs(leg_delta);
        } else if(this.leg_delta_sign * leg_delta < 0) {
          this.leg_delta_sign = leg_delta/Math.abs(leg_delta);
          this.steps++;
          this.score += 100;
          this.score += this.max_distance;
          this.health = config.walker_health;
        }
      }
    }
  }

  if(config.check_health) {
    if(body_delta < config.instadeath_delta) {
      this.health = 0;
    } else {
      this.health--;
    }
  }

  return;
}

Walker.prototype.makeName = function(genome) {
  var name = '';
  var vowels = ['a','e','i','o','u'];
  var space_position = Math.floor(genome.length/2);
  for(var k = 0; k < genome.length; k++) {
    var sum = 0;
    for(var l in genome[k]) {
      if(genome[k].hasOwnProperty(l)) {
        sum += (genome[k][l]*10);
      }
      sum = Math.abs(Math.floor(sum));
    }
    if(k == space_position) {
      name += ' ';
    }
    if(k%2) {
      name += vowels[sum%5];
    } else {
      name += String.fromCharCode(97+sum%26);
    }
  }
  return name;
}