// Presenter-side buzz-in helper shared by games (Family Feud uses it). Needs buzz.js + firebase-config.js.
window.Host = (function () {
  const H = { room: null, players: {}, assign: {}, err: '' };
  let attempt = Date.now(), ref = null, getTeams = () => [], last = null;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  H.url = () => new URL('../../play/?room=' + H.room, location.href).href;
  H.setState = (open, fresh) => { if (!H.room) return; if (fresh) attempt = Date.now(); Buzz.r('state').set({ open, attempt: 'a' + attempt }); };
  H.reset = () => { ref && ref.off(); ref = null; H.setState(false, true); };
  H.syncTeams = arr => { last = arr; if (H.room) Buzz.r('teams').set(arr).catch(() => {}); };
  H.open = cb => {
    H.setState(true, true); ref && ref.off(); ref = Buzz.r('buzzes/a' + attempt);
    ref.on('value', s => {
      const b = Object.entries(s.val() || {}).sort((x, y) => x[1] - y[1]);
      cb(b.map(([id, ts]) => ({ id, name: (H.players[id] || {}).name || 'Player', team: H.assign[id], gap: ts - b[0][1] })));
    });
  };
  H.gate = go => {
    const PW = window.PRESENTER_PASSWORD;
    if (!PW || sessionStorage.getItem('fg-pres') === '1') return go();
    const a = document.getElementById('app');
    a.innerHTML = '<div class="setup"><h1>Presenter</h1><p>Enter the presenter password.</p><input id="pw" type="password" aria-label="Password"><button id="ok">Unlock</button><p class="hint" id="pe"></p></div>';
    const t = () => { if (a.querySelector('#pw').value === PW) { sessionStorage.setItem('fg-pres', '1'); go(); } else a.querySelector('#pe').textContent = 'Wrong password.'; };
    a.querySelector('#ok').onclick = t; a.querySelector('#pw').onkeydown = e => { if (e.key === 'Enter') t(); };
  };
  H.init = async (teamsFn, ready) => {
    getTeams = teamsFn;
    if (Buzz.configured()) {
      try {
        await Buzz.init(); H.room = await Buzz.createRoom(localStorage.getItem('fg-room')); localStorage.setItem('fg-room', H.room);
        Buzz.r('players').on('value', s => { H.players = s.val() || {}; H.paintPlayers(); });
        Buzz.r('assign').on('value', s => { H.assign = s.val() || {}; H.paintPlayers(); });
        H.setState(false, true); if (last) Buzz.r('teams').set(last).catch(() => {});
      } catch (e) { console.error(e); H.err = 'Buzz-in setup failed: ' + e.message; }
    }
    ready && ready();
  };
  const qr = id => { const n = document.getElementById(id); if (n && window.QRCode) { n.innerHTML = ''; new QRCode(n, { text: H.url(), width: 120, height: 120 }); } };
  H.paintJoin = id => {
    const b = document.getElementById(id); if (!b) return;
    if (!Buzz.configured()) { b.innerHTML = '<p class="hint">Phone buzzers are off. See SETUP-BUZZERS.md to turn them on.</p>'; return; }
    if (!H.room) { b.innerHTML = `<p class="hint">${esc(H.err || 'Connecting buzzers…')}</p>`; return; }
    b.innerHTML = `<div class="join"><div id="qr"></div><div><div class="hint">Players open</div><b>${esc(H.url().split('play/')[0] + 'play/')}</b><div class="hint">Room code</div><div class="code">${H.room}</div></div></div>`;
    qr('qr');
  };
  H.showPlayers = () => { if (document.getElementById('pp')) return; const m = document.createElement('div'); m.className = 'modal'; m.id = 'pp'; document.body.appendChild(m); H.paintPlayers(); };
  H.paintPlayers = () => {
    const ids = Object.keys(H.players), c = document.getElementById('pcount'); if (c) c.textContent = ids.length;
    const m = document.getElementById('pp'); if (!m) return;
    const teams = getTeams();
    m.innerHTML = `<div class="meta">Room ${H.room} · ${ids.length} player${ids.length === 1 ? '' : 's'}</div><div id="qr2"></div>
      <div class="plist">${ids.map(id => `<div class="prow"><span>${esc(H.players[id].name)}</span><select data-p="${id}"><option value="">No team</option>${teams.map((t, i) => `<option value="${i}"${H.assign[id] === i ? ' selected' : ''}>${esc(t.name)}</option>`).join('')}</select><button class="ghost sm" data-k="${id}">Remove</button></div>`).join('') || '<p class="hint">Waiting for players to join…</p>'}</div>
      <div class="row"><button id="rnd">Randomize teams</button><button class="ghost" id="pclose">Done</button></div>`;
    qr('qr2');
    m.querySelectorAll('select').forEach(s => s.onchange = () => Buzz.r('assign/' + s.dataset.p).set(s.value === '' ? null : +s.value));
    m.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { Buzz.r('players/' + b.dataset.k).remove(); Buzz.r('assign/' + b.dataset.k).remove(); });
    m.querySelector('#rnd').onclick = () => { if (!teams.length) return; const a = {}; Object.keys(H.players).sort(() => Math.random() - .5).forEach((id, i) => a[id] = i % teams.length); Buzz.r('assign').set(a); };
    m.querySelector('#pclose').onclick = () => m.remove();
  };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') document.getElementById('pclose')?.click(); });
  return H;
})();
