const D = window.JEOPARDY, app = document.getElementById('app'), KEY = 'fg-jeopardy-v2';
const fmt = n => (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString();
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const fresh = () => ({ phase: 'setup', teams: [], round: 0, used: {}, control: -1, fstage: 0, wagers: [], fdone: [] });
let S = fresh();
try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.phase) S = Object.assign(fresh(), s); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
function newGame() { if (!confirm('Start a new game? Teams and scores will be cleared.')) return; S = fresh(); save(); render(); }
function render() { document.querySelectorAll('.modal').forEach(m => m.remove()); ({ setup: showSetup, board: showBoard, final: showFinal, results: showResults })[S.phase](); }

/* ---------- setup ---------- */
function showSetup(names) {
  names = names || D.teams.slice(0, 4);
  app.innerHTML = `<div class="setup"><h1>${esc(D.title)}</h1><p>Enter your team names. Add as many as you need (up to 8).</p>
    <div id="tl">${names.map((n, i) => `<div class="trow"><input aria-label="Team ${i + 1} name" value="${esc(n)}" placeholder="Team ${i + 1}"><button class="ghost" data-x="${i}" aria-label="Remove team ${i + 1}">✕</button></div>`).join('')}</div>
    <div class="row"><button class="ghost" id="add">Add team</button><button id="go">Start game</button></div><a href="../../">All games</a></div>`;
  const read = () => [...app.querySelectorAll('#tl input')].map(i => i.value);
  app.querySelector('#add').onclick = () => { const n = read(); if (n.length < 8) { n.push(''); showSetup(n); } };
  app.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { const n = read(); n.splice(+b.dataset.x, 1); showSetup(n.length ? n : ['']); });
  app.querySelector('#go').onclick = () => {
    const n = read().map(s => s.trim()).filter(Boolean);
    if (!n.length) { alert('Add at least one team name.'); return; }
    S = fresh(); S.teams = n.map(name => ({ name, score: 0 })); S.phase = 'board'; save(); render();
  };
}

/* ---------- scores ---------- */
function scoreBar() {
  return `<div class="scores">${S.teams.map((t, i) => `<div class="team ${i === S.control ? 'ctrl' : ''}">
    <button class="nm" data-c="${i}" title="Mark as picking next">${esc(t.name)}</button>
    <div class="sc"><button class="adj" data-i="${i}" data-d="-100" aria-label="Subtract 100 from ${esc(t.name)}">−</button>
    <button class="val ${t.score < 0 ? 'neg' : ''}" data-i="${i}" title="Click to set score">${fmt(t.score)}</button>
    <button class="adj" data-i="${i}" data-d="100" aria-label="Add 100 to ${esc(t.name)}">+</button></div></div>`).join('')}</div>`;
}
function bindScores() {
  app.querySelectorAll('.adj').forEach(b => b.onclick = () => { S.teams[+b.dataset.i].score += +b.dataset.d; save(); refreshScores(); });
  app.querySelectorAll('.val').forEach(b => b.onclick = () => {
    const i = +b.dataset.i, v = prompt('Set score for ' + S.teams[i].name, S.teams[i].score);
    if (v !== null && v.trim() !== '' && !isNaN(+v)) { S.teams[i].score = +v; save(); refreshScores(); }
  });
  app.querySelectorAll('.nm').forEach(b => b.onclick = () => { S.control = +b.dataset.c; save(); refreshScores(); });
}
function refreshScores() { app.querySelector('.scores').outerHTML = scoreBar(); bindScores(); }
const tools = `<div class="tools"><a href="../../">All games</a><button class="ghost sm" id="reset">New game</button></div>`;

/* ---------- board ---------- */
function showBoard() {
  const r = D.rounds[S.round], last = S.round === D.rounds.length - 1; let left = 0;
  let h = `<div class="top"><h1>${esc(r.name)}</h1>${tools}</div><div class="board" style="grid-template-columns:repeat(${r.categories.length},1fr)">`;
  r.categories.forEach(c => h += `<div class="cat">${esc(c.name)}</div>`);
  r.values.forEach((v, row) => r.categories.forEach((c, col) => {
    const u = S.used[`${S.round}-${col}-${row}`]; if (!u) left++;
    h += `<button class="cell${u ? ' used' : ''}" data-c="${col}" data-r="${row}"${u ? ' disabled' : ''}>${u ? '' : fmt(v)}</button>`;
  }));
  h += `</div>${scoreBar()}<div class="footer"><span class="hint">Tap a team name to mark who picks next. Use − and + to adjust by $100, or tap a score to type it.</span>
    <button class="${left ? 'ghost' : ''}" id="next">${last ? 'Go to Final Jeopardy' : 'Next round'}</button></div>`;
  app.innerHTML = h; bindScores();
  app.querySelectorAll('.cell').forEach(b => b.onclick = () => openClue(+b.dataset.c, +b.dataset.r));
  app.querySelector('#reset').onclick = newGame;
  app.querySelector('#next').onclick = () => { if (last) { S.phase = 'final'; S.fstage = 0; } else S.round++; save(); render(); };
}
const awardRow = () => `<div class="award">${S.teams.map((t, i) =>
  `<div><span>${esc(t.name)}</span><button class="ok" data-i="${i}" data-s="1">Right</button><button class="no" data-i="${i}" data-s="-1">Wrong</button></div>`).join('')}</div>`;

function openClue(c, r) {
  const rd = D.rounds[S.round], cat = rd.categories[c], clue = cat.clues[r]; let value = rd.values[r];
  if (clue.dd) {
    const w = prompt('DAILY DOUBLE! Enter the wager:', value * 2);
    if (w !== null && w.trim() !== '' && !isNaN(+w) && +w >= 0) value = +w;
  }
  const m = document.createElement('div'); m.className = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
  m.innerHTML = `<div class="meta">${esc(cat.name)} for ${fmt(value)}${clue.dd ? ' · Daily Double' : ''}</div>
    <div class="clue">${clue.q}</div><div class="answer"></div><button id="rev">Reveal answer</button>${awardRow()}<button class="ghost" id="close">Close clue</button>`;
  document.body.appendChild(m);
  const ans = m.querySelector('.answer');
  m.querySelector('#rev').onclick = () => ans.innerHTML = clue.a;
  m.querySelectorAll('.award button').forEach(b => b.onclick = () => {
    const i = +b.dataset.i, s = +b.dataset.s;
    S.teams[i].score += value * s;
    if (s > 0) { S.control = i; ans.innerHTML = clue.a; }
    b.parentElement.querySelectorAll('button').forEach(x => x.disabled = true); save();
  });
  m.querySelector('#close').onclick = () => { S.used[`${S.round}-${c}-${r}`] = true; save(); m.remove(); render(); };
}

/* ---------- final jeopardy ---------- */
function showFinal() {
  const f = D.final, st = S.fstage; let b = `<div class="meta">${esc(f.category)}</div>`;
  if (st === 0) b += `<p>Each team secretly picks a wager up to its score. Enter them, then reveal the clue.</p><div class="wagers">${S.teams.map((t, i) =>
    `<label>${esc(t.name)} <small>(max ${fmt(Math.max(t.score, 0))})</small><input type="number" min="0" max="${Math.max(t.score, 0)}" value="${S.wagers[i] || 0}" data-i="${i}"></label>`).join('')}</div><button id="n">Lock wagers and reveal clue</button>`;
  if (st >= 1) b += `<div class="clue">${f.q}</div><div class="answer">${st >= 2 ? f.a : ''}</div>`;
  if (st === 1) b += `<button id="n">Reveal answer</button>`;
  if (st === 2) b += `<div class="award">${S.teams.map((t, i) => `<div><span>${esc(t.name)} <small>wagered ${fmt(S.wagers[i] || 0)}</small></span>
    <button class="ok" data-i="${i}" data-s="1"${S.fdone[i] ? ' disabled' : ''}>Right</button><button class="no" data-i="${i}" data-s="-1"${S.fdone[i] ? ' disabled' : ''}>Wrong</button></div>`).join('')}</div><button id="n">Show final scores</button>`;
  app.innerHTML = `<div class="top"><h1>Final Jeopardy!</h1>${tools}</div><div class="stage">${b}</div>${scoreBar()}`;
  bindScores(); app.querySelector('#reset').onclick = newGame;
  const n = app.querySelector('#n');
  if (st === 0) n.onclick = () => {
    S.wagers = [...app.querySelectorAll('.wagers input')].map((inp, i) => Math.min(Math.max(0, parseInt(inp.value, 10) || 0), Math.max(S.teams[i].score, 0)));
    S.fstage = 1; save(); render();
  };
  if (st === 1) n.onclick = () => { S.fstage = 2; save(); render(); };
  if (st === 2) {
    n.onclick = () => { S.phase = 'results'; save(); render(); };
    app.querySelectorAll('.award button').forEach(x => x.onclick = () => {
      const i = +x.dataset.i; S.teams[i].score += (S.wagers[i] || 0) * +x.dataset.s; S.fdone[i] = true; save(); render();
    });
  }
}

/* ---------- results ---------- */
function showResults() {
  const t = [...S.teams].sort((a, b) => b.score - a.score), top = t[0].score, w = t.filter(x => x.score === top).map(x => esc(x.name));
  app.innerHTML = `<div class="stage results"><h1>${w.length > 1 ? "It's a tie!" : 'Winner!'}</h1><h2 class="win">${w.join(' &amp; ')}</h2>
    <ol class="rank">${t.map(x => `<li><span>${esc(x.name)}</span><b>${fmt(x.score)}</b></li>`).join('')}</ol>
    <div class="row"><button id="again">Play again</button><a href="../../">All games</a></div></div>`;
  app.querySelector('#again').onclick = () => { S = fresh(); save(); render(); };
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelector('#close')?.click(); });
render();
