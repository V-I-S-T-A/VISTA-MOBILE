// One controller per mounted screen. Scroll samples stay outside React; only
// visibility changes notify the small navbar, never rerendering the whole list.
function createBottomNavScroll({ hideDistance = 20, revealDistance = 8, topEdge = 12 } = {}) {
  let hidden = false;
  let active = false;
  let previous = null;
  let direction = 0;
  let distance = 0;
  const listeners = new Set();
  const setHidden = value => {
    if (value === hidden) return;
    hidden = value;
    listeners.forEach(listener => listener(value));
  };
  const offset = event => {
    const native = event?.nativeEvent;
    const y = native?.contentOffset?.y;
    if (!Number.isFinite(y)) return null;
    const content = native?.contentSize?.height;
    const viewport = native?.layoutMeasurement?.height;
    // Clamp elastic overscroll so a bottom bounce cannot masquerade as an up-scroll.
    const max = Number.isFinite(content) && Number.isFinite(viewport) ? Math.max(0, content - viewport) : Infinity;
    return Math.max(0, Math.min(y, max));
  };
  const begin = event => {
    active = true;
    previous = offset(event);
    direction = 0;
    distance = 0;
  };
  const end = () => { active = false; direction = 0; distance = 0; };
  return {
    isHidden: () => hidden,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    show() { end(); previous = null; setHidden(false); },
    scrollProps: {
      scrollEventThrottle: 16,
      onScrollBeginDrag: begin,
      onScrollEndDrag: end,
      onMomentumScrollBegin: begin,
      onMomentumScrollEnd: end,
      onScroll(event) {
        const y = offset(event);
        if (y === null) return;
        const delta = previous === null ? 0 : y - previous;
        previous = y;
        if (y <= topEdge) { distance = 0; direction = 0; setHidden(false); return; }
        // Keyboard auto-scroll, refresh/layout changes and scrollTo are not gestures.
        if (!active || delta === 0) return;
        const nextDirection = Math.sign(delta);
        distance = nextDirection === direction ? distance + Math.abs(delta) : Math.abs(delta);
        direction = nextDirection;
        if (direction > 0 && distance >= hideDistance) setHidden(true);
        else if (direction < 0 && distance >= revealDistance) setHidden(false);
      },
    },
  };
}

module.exports = { createBottomNavScroll };
