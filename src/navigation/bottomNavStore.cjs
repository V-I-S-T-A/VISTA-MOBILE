// The navigator owns one retained bar. A cold tab can render its content later
// without removing the controls during the page animation.
function createBottomNavStore() {
  let current = null;
  let owner = null;
  const listeners = new Set();
  return {
    getSnapshot: () => current,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    publish(nextOwner, element) {
      owner = nextOwner;
      if (current === element) return;
      current = element;
      listeners.forEach(listener => listener(current));
    },
    release(previousOwner) {
      // Retain the last presentation until the next focused route publishes.
      // Routes without navigation explicitly hide the host at navigator level.
      if (owner === previousOwner) owner = null;
    },
  };
}
module.exports = { createBottomNavStore };
