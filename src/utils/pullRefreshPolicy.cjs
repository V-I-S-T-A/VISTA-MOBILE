const PULL_REFRESH = Object.freeze({ threshold: 56, hold: 48, maxDistance: 128, resistance: 160, topTolerance: 1, slop: 10 });

function resistedPull(distance) {
  'worklet';
  const positive = Math.max(0, Number(distance) || 0);
  return PULL_REFRESH.maxDistance * positive / (PULL_REFRESH.resistance + positive);
}

module.exports = { PULL_REFRESH, resistedPull };
