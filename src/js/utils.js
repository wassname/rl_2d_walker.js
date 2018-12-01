var randf = (low, high) => Math.random() * (high - low) + low

function deg2rad(deg) {
  return deg / 180 * Math.PI
}

module.exports = {deg2rad, randf}
