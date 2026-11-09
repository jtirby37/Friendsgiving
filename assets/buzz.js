// Shared buzz-in layer on Firebase. Any game can use it: Buzz.init(), Buzz.createRoom(), Buzz.r(path).
window.Buzz = (function () {
  const cfg = window.FIREBASE_CONFIG || {};
  const configured = () => typeof firebase !== 'undefined' && cfg.apiKey && cfg.databaseURL && !/YOUR_/.test(cfg.apiKey + cfg.databaseURL);
  let db, uid, ready;
  const B = {
    room: null,
    configured,
    uid: () => uid,
    ts: () => firebase.database.ServerValue.TIMESTAMP,
    r: p => db.ref('rooms/' + B.room + (p ? '/' + p : '')),
    init() {
      if (!configured()) return Promise.resolve(false);
      if (!ready) {
        firebase.initializeApp(cfg);
        ready = firebase.auth().signInAnonymously().then(c => { uid = c.user.uid; db = firebase.database(); return true; });
      }
      return ready;
    },
    async createRoom(saved) {
      if (saved) { const h = await db.ref('rooms/' + saved + '/host').get(); if (h.exists() && h.val() === uid) { B.room = saved; return saved; } }
      const A = 'ABCDEFGHJKMNPQRSTUVWXYZ';
      for (let k = 0; k < 20; k++) {
        const c = Array.from({ length: 4 }, () => A[Math.random() * A.length | 0]).join('');
        const r = await db.ref('rooms/' + c + '/host').transaction(v => v === null ? uid : undefined);
        if (r.committed) { B.room = c; return c; }
      }
      throw new Error('Could not create a room');
    }
  };
  return B;
})();
