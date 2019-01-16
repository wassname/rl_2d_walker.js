var randf = (low, high) => Math.random() * (high - low) + low
var randi = (low, high) => Math.round(Math.random() * (high - low) + low) //1

function deg2rad(deg) {
  return deg / 180 * Math.PI
}

function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x))
}

class MovingAverage {
  constructor(N) {
    this.N = N
    this.buffer = []
  }
  add(val) {
    if (this.buffer.length > this.N) this.buffer.splice(0, 1)
    this.buffer.push(val)
  }
  mean() {
    return mean(this.buffer)
  }
}


function mean(array) {
  if (array.length == 0)
    return null;
  var sum = array.reduce(function (a, b) {
    return a + b;
  });
  var avg = sum / array.length;
  return avg;
}


export {
  deg2rad,
  randf,
  randi,
  MovingAverage,
  mean,
  clamp
}
