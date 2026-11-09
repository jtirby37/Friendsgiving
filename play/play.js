const el = document.getElementById('p'), Q = new URLSearchParams(location.search);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const fmt = n => (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString();
const ord = n => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
let st = {}, bz = {}, assign = null, teams = [], pending = false, me = null, watchAtt = null, watchRef = null;

function joinScreen(msg) {
  const g = k => localStorage.getItem(k) || '';
  el.innerHTML = `<h1>Join the game</h1>${msg ? `<p class="err">${esc(msg)}</p>` : ''}
    <input id="c" placeholder="Room code" maxlength="4" autocapitalize="characters" value="${esc((Q.get('room') || g('fg-p-room')).toUpperCase())}">
    <input id="n" placeholder="Your name" maxlength="20" value="${esc(g('fg-p-name'))}"><button id="go">Join</button>`;
  el.querySelector('#go').onclick = () => join(el.querySelector('#c').value, el.querySelector('#n').value);
}

async function join(code, nm) {
  code = code.trim().toUpperCase(); nm = nm.trim();
  if (!/^[A-Z]{4}$/.test(code) || !nm) return joinScreen('Enter the 4-letter room code and your name.');
  if (!Buzz.configured()) return joinScreen('Buzzers are not set up yet.');
  try {
    await Buzz.init(); Buzz.room = code; me = Buzz.uid();
    if (!(await Buzz.r('host').get()).exists()) return joinScreen('Room not found. Check the code.');
    await Buzz.r('players/' + me).set({ name: nm });
    localStorage.setItem('fg-p-room', code); localStorage.setItem('fg-p-name', nm);
    Buzz.r('state').on('value', s => { const n = s.val() || {}; if (n.attempt !== st.attempt) pending = false; st = n; watch(); paint(); });
    Buzz.r('assign/' + me).on('value', s => { assign = s.val(); paint(); });
    Buzz.r('teams').on('value', s => { teams = s.val() || []; paint(); });
  } catch (e) { joinScreen('Could not join: ' + e.message); }
}

function watch() {
  if (!st.attempt || st.attempt === watchAtt) return;
  watchRef && watchRef.off(); watchAtt = st.attempt; bz = {};
  watchRef = Buzz.r('buzzes/' + st.attempt); watchRef.on('value', s => { bz = s.val() || {}; paint(); });
}

function paint() {
  const team = assign !== null && teams[assign] ? teams[assign] : null;
  const rank = Object.entries(bz).sort((a, b) => a[1] - b[1]).findIndex(e => e[0] === me) + 1;
  let label, cls;
  if (!team) { label = 'Waiting for host'; cls = 'off'; }
  else if (rank || pending) { label = rank ? 'Buzzed! #' + rank : 'Buzzed!'; cls = 'got'; }
  else if (st.open) { label = 'BUZZ!'; cls = 'go'; }
  else { label = 'Locked'; cls = 'off'; }
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  el.innerHTML = `<div class="who">${esc(localStorage.getItem('fg-p-name') || '')}${team ? ' · ' + esc(team.name) : ''}</div>
    <button id="buzz" class="${cls}"${cls === 'go' ? '' : ' disabled'}>${label}</button>
    ${team ? `<div class="card"><div class="big">${fmt(team.score)}</div><div>${ord(1 + teams.filter(t => t.score > team.score).length)} of ${teams.length}</div>
    <div class="board">${sorted.map(t => `<div class="${t === team ? 'me' : ''}"><span>${esc(t.name)}</span><span>${fmt(t.score)}</span></div>`).join('')}</div></div>`
      : '<div class="card">The host will put you on a team.</div>'}`;
}

el.addEventListener('pointerdown', e => {
  if (!e.target.closest('#buzz.go')) return;
  pending = true; paint(); navigator.vibrate && navigator.vibrate(40);
  Buzz.r('buzzes/' + st.attempt + '/' + me).set(Buzz.ts()).catch(() => { pending = false; paint(); });
});

const sr = localStorage.getItem('fg-p-room'), sn = localStorage.getItem('fg-p-name');
if (sr && sn && (!Q.get('room') || Q.get('room').toUpperCase() === sr)) join(sr, sn); else joinScreen();
