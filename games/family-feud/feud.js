const D = window.FEUD, app = document.getElementById('app'), KEY = 'fg-feud-v1', MUTE = 'fg-feud-mute';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fresh = () => ({ phase: 'pick', game: -1, teams: [], ri: 0, rounds: [], control: -1, fm: null });
let S = fresh();
try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.phase && (s.game < 0 || D.games[s.game])) S = Object.assign(fresh(), s); } catch (e) {}
function publishBoard() {
  if (!Host.room) return;
  const g = D.games[S.game];
  const pub = { game: 'feud', phase: S.phase, title: g?.name || D.title, teams: S.teams.map(t => ({name:t.name,score:t.score})), control:S.control };
  if (S.phase === 'round') {
    const r = g.rounds[S.ri], st = S.rounds[S.ri];
    Object.assign(pub,{question:r.q,round:S.ri+1,multiplier:D.multipliers[S.ri]||1,bank:bankOf(),strikes:st.strikes,slots:r.a.map((a,i)=>st.rev[i]?{revealed:true,answer:a[0],points:a[1]}:{revealed:false})});
  } else if (S.phase === 'fm') {
    pub.stage=S.fm.stage;
    if (S.fm.stage === 'done') {
      pub.results=g.fast.map((f,q)=>({question:f.q,players:[0,1].map(p=>{const k=S.fm.picks[p][q];return {answer:k.ans>=0&&k.ans!==null?f.a[k.ans][0]:k.said||'No answer',points:fmPts(p,q)};})}));
      pub.total=fmTotal(0)+fmTotal(1);
    }
  }
  Buzz.r('publicState').set(pub).catch(e=>console.error('TV update failed',e));
}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} Host.syncTeams(S.teams.map(t => ({ name: t.name, score: t.score, unit: 'pts' }))); publishBoard(); };

/* ---------- sound ---------- */
let muted = false, ac;
try { muted = localStorage.getItem(MUTE) === '1'; } catch (e) {}
function beep(freq, start, dur, type, vol) {
  if (muted) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + start;
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol || .15, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur);
  } catch (e) {}
}
const ding = () => { beep(880, 0, .18); beep(1320, .12, .35); };
const buzz = () => beep(120, 0, .6, 'sawtooth', .2);
const timesUp = () => { beep(660, 0, .2); beep(660, .25, .2); beep(440, .5, .5); };

/* ---------- shared ---------- */
function render() {
  document.querySelectorAll('.xflash').forEach(m => m.remove());
  stopTimer();
  ({ pick: showPick, setup: showSetup, round: showRound, fm: showFM, final: showFinal })[S.phase]();
}
const tools = () => `<div class="tools">${Host.room ? `<a target="_blank" rel="noopener" href="../../board/?room=${Host.room}">TV display · ${Host.room}</a>` : ''}${Host.room ? `<button class="ghost sm" id="players">Players (<span id="pcount">${Object.keys(Host.players).length}</span>)</button>` : ''}<button class="ghost sm" id="mute">${muted ? '🔇 Sound off' : '🔊 Sound on'}</button><a href="../../">All games</a><button class="ghost sm" id="newg">New game</button></div>`;
function bindTools() {
  app.querySelector('#mute').onclick = e => { muted = !muted; try { localStorage.setItem(MUTE, muted ? '1' : '0'); } catch (_) {} e.target.textContent = muted ? '🔇 Sound off' : '🔊 Sound on'; };
  app.querySelector('#newg').onclick = newGame;
  const p = app.querySelector('#players'); if (p) p.onclick = Host.showPlayers;
}
function newGame() {
  if (!confirm('Start a new game? Scores will be cleared and you can pick a game again.')) return;
  const names = S.teams.map(t => ({ name: t.name, score: 0 }));
  S = fresh(); S.teams = names; save(); Host.reset(); render();
}
function scoreBar() {
  return `<div class="scores">${S.teams.map((t, i) => `<div class="team ${i === S.control ? 'ctrl' : ''}">
    <button class="nm" data-c="${i}" title="Mark as the team playing">${esc(t.name)}</button>
    <div class="sc"><button class="adj" data-i="${i}" data-d="-10" aria-label="Subtract 10 from ${esc(t.name)}">−</button>
    <button class="val ${t.score < 0 ? 'neg' : ''}" data-i="${i}" title="Click to set score">${t.score}</button>
    <button class="adj" data-i="${i}" data-d="10" aria-label="Add 10 to ${esc(t.name)}">+</button></div></div>`).join('')}</div>`;
}
function bindScores() {
  app.querySelectorAll('.adj').forEach(b => b.onclick = () => { S.teams[+b.dataset.i].score += +b.dataset.d; save(); refreshScores(); });
  app.querySelectorAll('.val').forEach(b => b.onclick = () => {
    const i = +b.dataset.i, v = prompt('Set score for ' + S.teams[i].name, S.teams[i].score);
    if (v !== null && v.trim() !== '' && !isNaN(+v)) { S.teams[i].score = +v; save(); refreshScores(); }
  });
  app.querySelectorAll('.nm').forEach(b => b.onclick = () => { S.control = S.control === +b.dataset.c ? -1 : +b.dataset.c; save(); refreshScores(); });
}
function refreshScores() { app.querySelector('.scores').outerHTML = scoreBar(); bindScores(); }
function flashX() {
  const x = document.createElement('div'); x.className = 'xflash'; x.setAttribute('aria-hidden', 'true'); x.textContent = '✕';
  document.body.appendChild(x); setTimeout(() => x.remove(), 900);
}

/* ---------- pick a game ---------- */
function showPick() {
  app.innerHTML = `<div class="setup"><h1>${esc(D.title)}</h1><p>Pick a game to play.</p>
    <div class="games">${D.games.map((g, i) => `<button class="gcard" data-g="${i}"><span class="gn">Game ${i + 1}</span><h2>${esc(g.name)}</h2><p>${esc(g.theme)}</p></button>`).join('')}</div>
    <a href="../../">All games</a></div>`;
  app.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { S.game = +b.dataset.g; S.phase = 'setup'; save(); render(); });
}

/* ---------- setup ---------- */
function showSetup() {
  const g=D.games[S.game];
  app.innerHTML=`<div class="setup"><h1>${esc(g.name)}</h1><p class="theme">${esc(g.theme)}</p><div id="joinbox"></div>${Host.room ? `<p><a target="_blank" rel="noopener" href="../../board/?room=${Host.room}">Open TV display · ${Host.room}</a></p>` : ''}<p>Share the 4-digit room code. Players enter their names and create or join teams on their phones.</p><div id="teamwait" class="card">Waiting for teams…</div><div class="row"><button id="go">Start game</button></div><div class="row"><button class="ghost sm" id="chg">Change game</button><a href="../../">All games</a></div></div>`;
  Host.paintJoin('joinbox'); paintTeamWait();
  app.querySelector('#go').onclick=()=>{
    const entries=Object.entries(Host.roster||{});if(entries.length<2){alert('Have players create at least two teams first.');return;}
    S.teams=entries.map(([,t])=>({name:t.name,score:0}));const index={};entries.forEach(([id],i)=>index[id]=i);
    Object.entries(Host.players).forEach(([pid,p])=>{if(p.teamId&&index[p.teamId]!==undefined)Buzz.r('assign/'+pid).set(index[p.teamId]);});
    S.rounds=g.rounds.map(r=>({rev:r.a.map(()=>false),strikes:0,award:null}));S.ri=0;S.control=-1;S.fm=null;S.phase='round';save();render();
  };
  app.querySelector('#chg').onclick=()=>{S.phase='pick';S.game=-1;save();render();};
}
function paintTeamWait(){const box=document.getElementById('teamwait');if(!box)return;const entries=Object.entries(Host.roster||{});box.innerHTML=entries.length?entries.map(([id,t])=>`<div class="prow"><b>${esc(t.name)}</b><span>${Object.values(Host.players).filter(p=>p.teamId===id).length} players</span></div>`).join(''):'Waiting for players to create teams…';}

/* ---------- regular rounds ---------- */
const bankOf = () => {
  const r = D.games[S.game].rounds[S.ri], st = S.rounds[S.ri], m = D.multipliers[S.ri] || 1;
  return r.a.reduce((s, a, i) => s + (st.rev[i] ? a[1] : 0), 0) * m;
};
function playHTML(pop) {
  const r = D.games[S.game].rounds[S.ri], st = S.rounds[S.ri], bank = bankOf();
  const slots = r.a.map((a, i) => `<button class="slot ${st.rev[i] ? 'rev' : ''} ${i === pop ? 'pop' : ''}" data-s="${i}" aria-label="Answer ${i + 1}: ${st.rev[i] ? esc(a[0]) + ', ' + a[1] + ' points' : 'hidden'}">
    <span class="n">${i + 1}</span><span class="txt">${esc(a[0])}</span><span class="pts">${a[1]}</span></button>`).join('');
  const aw = st.award
    ? `<div class="awarded">Awarded <b>${st.award.amount}</b> to <b>${esc(S.teams[st.award.team].name)}</b><button class="ghost sm" id="undo">Undo</button></div>`
    : `<div class="award">${S.teams.map((t, i) => `<button data-a="${i}" ${bank ? '' : 'disabled'}>Award ${bank} to ${esc(t.name)}</button>`).join('')}</div>`;
  return `<p class="hint">Private answer key — tap an answer to reveal or hide it on the TV. Highlighted answers are public.</p><div class="board">${slots}</div>
    <div class="bankrow"><div class="bank">Bank: ${bank}</div><div class="strikes" aria-label="${st.strikes} strikes">${[0, 1, 2].map(i => `<span class="x ${i < st.strikes ? 'on' : ''}">✕</span>`).join('')}</div></div>
    <div class="row ctl"><button class="ghost" id="strike" ${st.strikes >= 3 ? 'disabled' : ''}>✕ Strike</button><button class="ghost sm" id="clr">Clear strikes</button><button class="ghost sm" id="revall" ${st.award ? '' : 'disabled'} title="Available after you award the bank">Reveal the rest</button></div>
    ${st.strikes >= 3 && !st.award ? '<p class="hint">Three strikes! The other team can steal the bank with one right answer.</p>' : ''}
    ${aw}`;
}
function bindPlay() {
  const st = S.rounds[S.ri], root = app.querySelector('#play');
  root.querySelectorAll('[data-s]').forEach(b => b.onclick = () => {
    const i = +b.dataset.s; st.rev[i] = !st.rev[i]; save(); if (st.rev[i]) ding(); refreshPlay(st.rev[i] ? i : -1);
  });
  root.querySelector('#strike').onclick = () => { if (st.strikes < 3) { st.strikes++; save(); buzz(); flashX(); refreshPlay(); } };
  root.querySelector('#clr').onclick = () => { st.strikes = 0; save(); refreshPlay(); };
  root.querySelector('#revall').onclick = () => { st.rev = st.rev.map(() => true); save(); ding(); refreshPlay(); };
  root.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
    const t = +b.dataset.a, amount = bankOf();
    st.award = { team: t, amount }; S.teams[t].score += amount; save(); ding(); refreshPlay(); refreshScores();
  });
  const u = root.querySelector('#undo');
  if (u) u.onclick = () => { S.teams[st.award.team].score -= st.award.amount; st.award = null; save(); refreshPlay(); refreshScores(); };
}
function refreshPlay(pop) { app.querySelector('#play').innerHTML = playHTML(pop); bindPlay(); }

/* ---------- face-off buzzers ---------- */
const fo = { ri: -1, list: [] };
function paintFace() {
  const b = document.getElementById('faceoff'); if (!b) return;
  b.innerHTML = `<div class="buzzbar"><button id="fopen">Face-off: open buzzers</button><button class="ghost" id="flock">Lock</button></div>
    <div class="bzlist">${fo.list.map((x, k) => { const t = S.teams[x.team]; return `<div class="bz${k ? '' : ' first'}"><span><b>${k + 1}.</b> ${esc(x.name)} <small>${t ? esc(t.name) : 'no team'} · ${k ? '+' + x.gap + ' ms' : 'first'}</small></span><button data-t="${x.team}"${t ? '' : ' disabled'}>Gets control</button></div>`; }).join('') || '<span class="hint">Read the question, then open the buzzers for the face-off.</span>'}</div>`;
  b.querySelector('#fopen').onclick = () => { fo.list = []; paintFace(); Host.open(l => { if (l.length && !fo.list.length) ding(); fo.list = l; paintFace(); }); };
  b.querySelector('#flock').onclick = () => Host.setState(false);
  b.querySelectorAll('[data-t]').forEach(x => x.onclick = () => { S.control = +x.dataset.t; save(); Host.reset(); fo.list = []; paintFace(); refreshScores(); ding(); });
}

function showRound() {
  const g = D.games[S.game], r = g.rounds[S.ri], last = S.ri === g.rounds.length - 1, mult = D.multipliers[S.ri] || 1;
  app.innerHTML = `<div class="top"><h1>${esc(g.name)}</h1>${tools()}</div>
    <div class="stage"><div class="meta">Round ${S.ri + 1} of ${g.rounds.length}${mult > 1 ? ` <span class="mult">×${mult} points</span>` : ''}</div>
    <div class="clue">${esc(r.q)}</div>${Host.room ? '<div id="faceoff"></div>' : ''}<div id="play">${playHTML()}</div></div>
    ${scoreBar()}
    <div class="footer"><button class="ghost" id="prev" ${S.ri === 0 ? 'disabled' : ''}>← Previous round</button>
    <span class="hint">Tap a team name to mark who is playing.</span>
    <button id="next">${last ? 'Fast Money →' : 'Next round →'}</button></div>`;
  if (fo.ri !== S.ri) { fo.ri = S.ri; fo.list = []; Host.reset(); }
  bindTools(); bindScores(); bindPlay(); paintFace();
  app.querySelector('#prev').onclick = () => { S.ri--; save(); render(); };
  app.querySelector('#next').onclick = () => {
    if (last) { S.phase = 'fm'; S.fm = S.fm || initFM(); } else S.ri++;
    save(); render();
  };
}

/* ---------- fast money ---------- */
const initFM = () => ({ stage: 'pick', team: null, applied: null, picks: [0, 1].map(() => D.games[S.game].fast.map(() => ({ said: '', ans: null }))) });
const timer = { left: 0, id: null, running: false };
function stopTimer() { if (timer.id) clearInterval(timer.id); timer.id = null; timer.running = false; }
function drawTimer() {
  const t = app.querySelector('#timer'), b = app.querySelector('#tstart');
  if (t) { t.textContent = timer.left; t.classList.toggle('low', timer.left <= 5); }
  if (b) b.textContent = timer.running ? 'Pause' : 'Start';
}
function startTimer() {
  if (timer.running || timer.left <= 0) return;
  timer.running = true;
  timer.id = setInterval(() => { timer.left--; if (timer.left <= 0) { stopTimer(); timesUp(); } drawTimer(); }, 1000);
  drawTimer();
}
let openQ = -1;
const fmPts = (p, q) => { const c = S.fm.picks[p][q]; return c.ans !== null && c.ans >= 0 ? D.games[S.game].fast[q].a[c.ans][1] : 0; };
const fmTotal = p => D.games[S.game].fast.reduce((s, _, q) => s + fmPts(p, q), 0);

function showFM() {
  const F = S.fm, body = F.stage === 'pick' ? fmPick() : F.stage === 'done' ? fmDone() : fmPlay();
  app.innerHTML = `<div class="top"><h1>⚡ Fast Money</h1>${tools()}</div><div class="fm">${body}</div>${scoreBar()}`;
  bindTools(); bindScores();
  ({ pick: bindPick, p1: bindPlayFM, p2: bindPlayFM, done: bindDone })[F.stage]();
}
function fmPick() {
  const c = D.fastMoney, lead = S.teams.reduce((b, t, i) => t.score > S.teams[b].score ? i : b, 0);
  return `<p>Pick the team playing Fast Money. Player 1 gets ${c.time1} seconds for ${D.games[S.game].fast.length} questions. Then Player 2 gets ${c.time2} seconds and can’t repeat Player 1’s answers. Reach ${c.target} points together for a ${c.bonus}-point bonus.</p>
    <div class="award">${S.teams.map((t, i) => `<button data-t="${i}" ${i === lead ? '' : 'class="ghost"'}>${esc(t.name)}${i === lead ? ' (leading)' : ''}</button>`).join('')}</div>
    <div class="row"><button class="ghost sm" id="back">← Back to rounds</button><button class="ghost sm" id="skip">Skip to final scores</button></div>`;
}
function bindPick() {
  app.querySelectorAll('[data-t]').forEach(b => b.onclick = () => {
    S.fm.team = +b.dataset.t; S.fm.stage = 'p1'; stopTimer(); timer.left = D.fastMoney.time1; openQ = -1; save(); showFM();
  });
  app.querySelector('#back').onclick = () => { S.phase = 'round'; S.ri = D.games[S.game].rounds.length - 1; save(); render(); };
  app.querySelector('#skip').onclick = () => { S.phase = 'final'; save(); render(); };
}
function fmPlay() {
  const F = S.fm, g = D.games[S.game], p = F.stage === 'p1' ? 0 : 1;
  const rows = g.fast.map((f, q) => {
    const c = F.picks[p][q], open = openQ === q, taken = p === 1 ? F.picks[0][q].ans : null;
    const res = c.ans === null ? '' : c.ans >= 0 ? `<div class="res ok">✓ ${esc(f.a[c.ans][0])} — ${f.a[c.ans][1]}</div>` : '<div class="res no">✗ No match — 0</div>';
    const chips = open ? `<div class="chips">${f.a.map((a, i) => `<button class="chip" data-q="${q}" data-v="${i}" ${taken === i ? 'disabled' : ''}>${esc(a[0])} · ${a[1]}${taken === i ? ' (taken)' : ''}</button>`).join('')}<button class="chip miss" data-q="${q}" data-v="-1">No match · 0</button></div>` : '';
    return `<div class="fq"><div class="qn">${q + 1}</div><div class="qb"><div class="qt">${esc(f.q)}</div>
      <div class="row"><input data-s="${q}" aria-label="Player ${p + 1} answer to question ${q + 1}" placeholder="What did they say?" value="${esc(c.said)}"><button class="ghost sm" data-o="${q}">${open ? 'Close' : 'Check answer'}</button></div>${chips}${res}</div></div>`;
  }).join('');
  return `<div class="fmhead"><div><h2>Player ${p + 1}</h2><div class="hint">${esc(S.teams[F.team].name)} · ${p === 0 ? 'Player 2 should not listen' : 'Player 1 is locked in'} · Total ${fmTotal(p)}</div></div>
    <div class="timerbox"><div id="timer" class="timer ${timer.left <= 5 ? 'low' : ''}">${timer.left}</div><button id="tstart">${timer.running ? 'Pause' : 'Start'}</button><button class="ghost sm" id="treset">Reset</button></div></div>
    ${rows}<div class="row"><button id="fnext">${p === 0 ? 'Done: Player 2 →' : 'Reveal results →'}</button></div>`;
}
function bindPlayFM() {
  const F = S.fm, p = F.stage === 'p1' ? 0 : 1, c = D.fastMoney;
  app.querySelectorAll('input[data-s]').forEach(i => {
    i.oninput = () => { F.picks[p][+i.dataset.s].said = i.value; save(); };
    i.onkeydown = e => { if (e.key === 'Enter') { openQ = +i.dataset.s; showFM(); } };
  });
  app.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { openQ = openQ === +b.dataset.o ? -1 : +b.dataset.o; showFM(); });
  app.querySelectorAll('.chip').forEach(b => b.onclick = () => { F.picks[p][+b.dataset.q].ans = +b.dataset.v; openQ = -1; save(); ding(); showFM(); });
  app.querySelector('#tstart').onclick = () => { timer.running ? stopTimer() : startTimer(); drawTimer(); };
  app.querySelector('#treset').onclick = () => { stopTimer(); timer.left = p ? c.time2 : c.time1; drawTimer(); };
  app.querySelector('#fnext').onclick = () => {
    stopTimer(); openQ = -1;
    if (p === 0) { F.stage = 'p2'; timer.left = c.time2; } else F.stage = 'done';
    save(); showFM();
  };
}
function fmDone() {
  const F = S.fm, g = D.games[S.game], c = D.fastMoney, t1 = fmTotal(0), t2 = fmTotal(1), total = t1 + t2, hit = total >= c.target, award = total + (hit ? c.bonus : 0);
  const cell = (p, q) => {
    const k = F.picks[p][q], a = g.fast[q].a;
    const main = k.ans === null ? '<span class="miss">No answer</span>' : k.ans >= 0 ? `${esc(a[k.ans][0])} <b>${a[k.ans][1]}</b>` : '<span class="miss">No match</span>';
    return main + (k.said ? `<small>said: ${esc(k.said)}</small>` : '');
  };
  const team = esc(S.teams[F.team].name);
  return `<table class="ft"><thead><tr><th>Question</th><th>Player 1</th><th>Player 2</th></tr></thead>
    <tbody>${g.fast.map((f, q) => `<tr><td>${esc(f.q)}</td><td>${cell(0, q)}</td><td>${cell(1, q)}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td>Totals</td><td>${t1}</td><td>${t2}</td></tr></tfoot></table>
    <div class="verdict">${hit ? `🎉 ${total} points! Target of ${c.target} reached, +${c.bonus} bonus.` : `${total} points. ${c.target - total} short of the ${c.target} target.`}</div>
    <div class="row" style="justify-content:center">${F.applied === null
      ? `<button id="apply">Add ${award} to ${team}</button>`
      : `<span class="awarded">Added <b>${F.applied}</b> to <b>${team}</b><button class="ghost sm" id="unapply">Undo</button></span>`}
    <button class="ghost" id="edit">← Edit answers</button><button id="fin">Final scores →</button></div>`;
}
function bindDone() {
  const F = S.fm, c = D.fastMoney, total = fmTotal(0) + fmTotal(1), award = total + (total >= c.target ? c.bonus : 0);
  const a = app.querySelector('#apply'), u = app.querySelector('#unapply');
  if (a) a.onclick = () => { S.teams[F.team].score += award; F.applied = award; save(); ding(); showFM(); };
  if (u) u.onclick = () => { S.teams[F.team].score -= F.applied; F.applied = null; save(); showFM(); };
  app.querySelector('#edit').onclick = () => { F.stage = 'p2'; timer.left = c.time2; save(); showFM(); };
  app.querySelector('#fin').onclick = () => { S.phase = 'final'; save(); render(); };
}

/* ---------- final ---------- */
function showFinal() {
  const sorted = S.teams.map((t, i) => ({ ...t, i })).sort((a, b) => b.score - a.score), top = sorted[0].score, w = sorted.filter(t => t.score === top);
  app.innerHTML = `<div class="setup"><h1>Final scores</h1>
    <div class="win">🏆 ${w.map(t => esc(t.name)).join(' & ')}${w.length > 1 ? ' tie!' : ' wins!'}</div>
    <ol class="rank">${sorted.map(t => `<li><span>${esc(t.name)}</span><b>${t.score}</b></li>`).join('')}</ol>
    <div class="row"><button id="again">Play another game</button><button class="ghost" id="back">← Back</button></div><a href="../../">All games</a></div>`;
  app.querySelector('#again').onclick = () => { const names = S.teams.map(t => ({ name: t.name, score: 0 })); S = fresh(); S.teams = names; save(); render(); };
  app.querySelector('#back').onclick = () => { S.phase = S.fm ? 'fm' : 'round'; save(); render(); };
}

Host.gate(() => { render(); Host.init(() => S.teams, () => { render(); publishBoard(); }); window.addEventListener('fg-roster', paintTeamWait); });
