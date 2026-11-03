// Pure lifecycle state machine; React Native/HTTP/storage are injected and tested separately.
function createPushRegistrationController(deps) {
  let userId = null, epoch = 0, flight = null, timer = null, attempts = 0, prompted = false, rerun = false;
  let record;
  let logoutFlight = null;
  const clearTimer = () => { if (timer != null) deps.clearTimer(timer); timer = null; };
  const load = async () => { if (record === undefined) record = await deps.load(); return record; };
  const persist = async value => { record = value; await deps.save(value); };
  const cleanup = async value => {
    if (!value) return;
    await deps.revoke(value);
    if (value.previous) await cleanup(value.previous);
  };
  const schedule = delay => {
    clearTimer();
    if (userId && deps.isActive()) timer = deps.setTimer(() => { timer = null; request(); }, delay);
  };
  async function attempt(version, owner) {
    const current = () => version === epoch && owner === userId;
    let saved = await load();
    if (!current()) return;
    if (saved && saved.userId !== owner) {
      await cleanup(saved);
      await persist(null);
      saved = null;
    }
    if (!current()) return;
    let permission = await deps.permission();
    if (!permission.granted && permission.canAskAgain && !prompted && current()) {
      prompted = true;
      permission = await deps.askPermission();
    }
    if (!current()) return;
    if (!permission.granted) {
      await cleanup(saved);
      await persist(null);
      return;
    }
    const token = await deps.token();
    if (!current()) return;
    const pending = saved?.token === token ? saved : { userId: owner, token, previous: saved || undefined };
    // Journal before HTTP so a failed response/storage write can still be unbound.
    await persist(pending);
    if (!current()) return;
    const response = await deps.register(token, saved?.token !== token ? saved?.token : undefined);
    // Even a cancelled session must retain the receipt for logout to revoke.
    if (!response.registered || !response.revoke_key) throw new Error('The backend does not support safe push registration yet.');
    await persist({ userId: owner, token, revokeKey: response.revoke_key });
  }
  function request() {
    if (!userId || !deps.isActive()) return Promise.resolve();
    if (flight) { rerun = true; return flight; }
    const version = epoch, owner = userId;
    flight = attempt(version, owner).then(() => {
      attempts = 0;
    }).catch(error => {
      attempts++;
      deps.onError?.(error);
    }).finally(() => {
      flight = null;
      if (version !== epoch || owner !== userId) return;
      const next = rerun ? 0 : attempts ? Math.min(60000, 2000 * 2 ** Math.min(attempts - 1, 5)) : 15 * 60 * 1000;
      rerun = false;
      schedule(next);
    });
    return flight;
  }
  function stop() { epoch++; userId = null; rerun = false; clearTimer(); }
  return {
    start(owner) {
      if (logoutFlight) return logoutFlight.then(() => this.start(owner));
      if (userId !== owner) { stop(); userId = owner; attempts = 0; prompted = false; }
      // A previous account's work must finish before the next account reconciles.
      if (flight) { const pending = flight; return pending.then(() => request()); }
      return request();
    },
    request,
    stop,
    logout() {
      if (logoutFlight) return logoutFlight;
      stop();
      logoutFlight = (async () => {
        if (flight) await flight;
        await cleanup(await load());
        await persist(null);
      })().finally(() => { logoutFlight = null; });
      return logoutFlight;
    },
  };
}
module.exports = { createPushRegistrationController };
