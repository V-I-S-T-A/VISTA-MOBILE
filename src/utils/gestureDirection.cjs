function dragDirection(dx, dy, slop = 10) {
  'worklet';
  if (Math.abs(dx) > slop && Math.abs(dx) > Math.abs(dy) * 1.5) return 'horizontal';
  if (Math.abs(dy) > slop && Math.abs(dy) > Math.abs(dx) * 1.5) return 'vertical';
  return null;
}
module.exports = { dragDirection };
