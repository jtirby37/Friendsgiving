const D = window.JEOPARDY, app = document.getElementById('app'), KEY = 'fg-jeopardy-v2';
const fmt = n => (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString();
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const fresh = () => ({ phase: 'setup', teams: [], round: 0, used: {}, control: -1, fstage: 0, wagers: [], fdone: [] });
let S = fresh();
try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.phase) S = Object.assign(fresh(), s); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} syncTeams(); publishPublic(); };
function newGame() {
  if (!confirm('Start a new game? Teams and scores will be cleared.')) return;
  S = fresh(); save();
  if (room) { Buzz.r('assign').remove(); Buzz.r('buzzes').remove(); Buzz.r('finalSubmissions').remove(); setState(false, true); }
  render();
}
function render() { document.querySelectorAll('.modal').forEach(m => m.remove()); ({ setup: showSetup, board: showBoard, final: showFinal, results: showResults })[S.phase](); }

/* ---------- buzz-in (optional; needs Firebase config) ---------- */
let room = null, players = {}, assign = {}, roster = {}, attempt = Date.now(), curRef = null, buzzErr = '';
const setState = (open, fresh) => { if (!room) return; if (fresh) attempt = Date.now(); Buzz.r('state').update({ open, attempt: 'a' + attempt, phase: S.phase === 'final' ? 'final' : 'play', teamIds:Object.keys(roster) }); };
const syncTeams = () => { if (room) Buzz.r('teams').set(S.teams.map(t => ({ name: t.name, score: t.score }))).catch(() => {}); };
function publishPublic(extra={}) { if (!room) return; const r=S.round, rd=D.rounds[r]; const pub={game:'jeopardy',phase:S.phase,teams:S.teams.map(t=>({name:t.name,score:t.score})),roundName:rd?.name||'Final Jeopardy',categories:rd?.categories.map(c=>c.name)||[],values:rd?.values||[],used:S.used,round:r,...extra}; Buzz.r('publicState').set(pub).catch(()=>{}); }
const joinUrl = () => new URL('../../play/?room=' + room, location.href).href;
const boardUrl = () => new URL('../../board/?room=' + room, location.href).href;
async function initBuzz() {
  if (!Buzz.configured()) return;
  try {
    await Buzz.init(); room = await Buzz.createRoom(localStorage.getItem('fg-room')); localStorage.setItem('fg-room', room);
    Buzz.r('players').on('value', s => { players = s.val() || {}; paintPlayers(); paintSetupTeams(); });
    Buzz.r('assign').on('value', s => { assign = s.val() || {}; paintPlayers(); });
    Buzz.r('teamRoster').on('value', s => { roster = s.val() || {}; paintPlayers(); paintSetupTeams(); });
    setState(false, true); syncTeams(); publishPublic();
  } catch (e) { console.error(e); buzzErr = 'Buzz-in setup failed: ' + e.message; }
  paintJoin(); if (S.phase !== 'setup') render();
}
function qr(id) { const n = document.getElementById(id); if (n && window.QRCode) { n.innerHTML = ''; new QRCode(n, { text: joinUrl(), width: 120, height: 120 }); } }
function paintJoin() {
  const b = document.getElementById('joinbox'); if (!b) return;
  if (!Buzz.configured()) { b.innerHTML = '<p class="hint">Phone buzzers are off. See SETUP-BUZZERS.md to turn them on. You can still run the game by hand.</p>'; return; }
  if (!room) { b.innerHTML = `<p class="hint">${esc(buzzErr || 'Connecting buzzers…')}</p>`; return; }
  b.innerHTML = `<div class="join"><div id="qr"></div><div><div class="hint">Players open</div><b>${esc(joinUrl().split('?')[0])}</b><div class="hint">Room code</div><div class="code">${room}</div></div></div>`;
  qr('qr');
}
function showPlayers() { if (document.getElementById('pp')) return; const m = document.createElement('div'); m.className = 'modal'; m.id = 'pp'; document.body.appendChild(m); paintPlayers(); }
function paintPlayers() {
  const ids=Object.keys(players), c=document.getElementById('pcount'); if(c)c.textContent=ids.length;
  const m=document.getElementById('pp'); if(!m)return;
  const teamList=Object.entries(roster);
  m.innerHTML=`<div class="meta">Room ${room} · ${ids.length} player${ids.length===1?'':'s'}</div><p class="hint">Players choose or create their own teams on their phones.</p><div class="plist">${teamList.map(([id,t])=>`<div class="prow"><b>${esc(t.name)}</b><span>${ids.filter(pid=>players[pid]?.teamId===id).map(pid=>esc(players[pid].name)).join(', ')||'No players yet'}</span></div>`).join('')||'<p class="hint">Waiting for teams…</p>'}</div><button class="ghost" id="pclose">Done</button>`;
  m.querySelector('#pclose').onclick=()=>m.remove();
}
function showSetup() {
  app.innerHTML=`<div class="setup"><h1>${esc(D.title)}</h1><div id="joinbox"></div><p>Share the 4-digit room code with players. They enter their names and create or join teams from their phones.</p><p class="hint">Start once everyone has joined and chosen a team.</p><div id="teamwait" class="card">Loading teams…</div><div class="row"><button id="go">Start game</button></div><a href="../../">All games</a></div>`;
  paintJoin(); paintSetupTeams();
  app.querySelector('#go').onclick=async()=>{
    const entries=Object.entries(roster); if(!entries.length){alert('Have players create at least one team first.');return;}
    S=fresh(); S.teams=entries.map(([,t])=>({name:t.name,score:0}));
    const index={}; entries.forEach(([id],i)=>index[id]=i);
    Object.entries(players).forEach(([pid,p])=>{if(p.teamId && index[p.teamId]!==undefined) Buzz.r('assign/'+pid).set(index[p.teamId]);});
    S.phase='board';save();render();
  };
}
function paintSetupTeams(){const box=document.getElementById('teamwait');if(!box)return;const rows=Object.entries(roster);box.innerHTML=rows.length?rows.map(([id,t])=>`<div class="prow"><b>${esc(t.name)}</b><span>${Object.values(players).filter(p=>p.teamId===id).length} players</span></div>`).join(''):'Waiting for players to create teams…';}

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
const tools = () => `<div class="tools"><a href="../../">All games</a>${room ? `<a target="_blank" href="${boardUrl()}">Public TV board</a><button class="ghost sm" id="players">Players (<span id="pcount">${Object.keys(players).length}</span>)</button>` : ''}<button class="ghost sm" id="reset">New game</button></div>`;
function bindTools() { app.querySelector('#reset').onclick = newGame; const p = app.querySelector('#players'); if (p) p.onclick = showPlayers; }

/* ---------- board ---------- */
function showBoard() {
  const r = D.rounds[S.round], last = S.round === D.rounds.length - 1; let left = 0;
  let h = `<div class="top"><h1>${esc(r.name)}</h1>${tools()}</div><div class="board" style="grid-template-columns:repeat(${r.categories.length},1fr)">`;
  r.categories.forEach(c => h += `<div class="cat">${esc(c.name)}</div>`);
  r.values.forEach((v, row) => r.categories.forEach((c, col) => {
    const u = S.used[`${S.round}-${col}-${row}`]; if (!u) left++;
    h += `<button class="cell${u ? ' used' : ''}" data-c="${col}" data-r="${row}"${u ? ' disabled' : ''}>${u ? '' : fmt(v)}</button>`;
  }));
  h += `</div>${scoreBar()}<div class="footer"><span class="hint">Tap a team name to mark who picks next. Use − and + for $100 changes, or tap a score to type it.</span>
    <button class="${left ? 'ghost' : ''}" id="next">${last ? 'Go to Final Jeopardy' : 'Next round'}</button></div>`;
  app.innerHTML = h; bindScores(); bindTools(); publishPublic();
  app.querySelectorAll('.cell').forEach(b => b.onclick = () => openClue(+b.dataset.c, +b.dataset.r));
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
    <div class="clue">${clue.q}</div><div class="answer"></div><button id="rev">Reveal answer</button>
    ${room ? `<div class="buzzbar"><button id="bopen">Open buzzers</button><button class="ghost" id="block">Lock buzzers</button></div><div id="bz" class="bzlist"><span class="hint">Buzzers locked. Finish reading, then open them.</span></div>` : ''}
    ${awardRow()}<button class="ghost" id="close">Close clue</button>`;
  document.body.appendChild(m);
  const ans = m.querySelector('.answer'); publishPublic({clue:{category:cat.name,value,question:clue.q,answerVisible:false}});
  const score = (i, s) => { S.teams[i].score += value * s; if (s > 0) { S.control = i; ans.innerHTML = clue.a; setState(false); m.querySelectorAll('.award button').forEach(x => x.disabled = true); } save(); };
  m.querySelector('#rev').onclick = () => { ans.innerHTML = clue.a; publishPublic({clue:{category:cat.name,value,question:clue.q,answer:clue.a,answerVisible:true}}); };
  m.querySelectorAll('.award button').forEach(b => b.onclick = () => {
    score(+b.dataset.i, +b.dataset.s); b.parentElement.querySelectorAll('button').forEach(x => x.disabled = true);
  });
  if (room) {
    const box = m.querySelector('#bz');
    m.querySelector('#bopen').onclick = () => {
      setState(true, true); curRef && curRef.off(); curRef = Buzz.r('buzzes/a' + attempt);
      box.innerHTML = '<span class="hint">Buzzers open. Waiting for the first buzz…</span>';
      curRef.on('value', s => {
        const b = Object.entries(s.val() || {}).sort((x, y) => x[1] - y[1]); if (!b.length) return;
        box.innerHTML = b.map(([id, ts], k) => {
          const ti = assign[id], t = S.teams[ti];
          return `<div class="bz${k ? '' : ' first'}"><span><b>${k + 1}.</b> ${esc((players[id] || {}).name || 'Player')} <small>${t ? esc(t.name) : 'no team'} · ${k ? '+' + (ts - b[0][1]) + ' ms' : 'first'}</small></span>
            <span class="acts"><button class="ok" data-t="${ti}" data-s="1"${t ? '' : ' disabled'}>Right</button><button class="no" data-t="${ti}" data-s="-1"${t ? '' : ' disabled'}>Wrong</button></span></div>`;
        }).join('');
      });
    };
    m.querySelector('#block').onclick = () => setState(false);
    box.onclick = e => { const b = e.target.closest('button[data-t]'); if (b) { score(+b.dataset.t, +b.dataset.s); b.disabled = true; b.parentElement.querySelector(b.dataset.s === '1' ? '.no' : '.ok').disabled = true; } };
  }
  m.querySelector('#close').onclick = () => { curRef && curRef.off(); curRef = null; setState(false); publishPublic({clearClue:true}); S.used[`${S.round}-${c}-${r}`] = true; save(); m.remove(); render(); };
}

/* ---------- final jeopardy ---------- */
function showFinal() {
  const f=D.final, st=S.fstage; let b=`<div class="meta">${esc(f.category)}</div>`;
  if(st===0)b+=`<p>Players submit one wager and one typed answer per team from their phones. The host can monitor submissions here.</p><button id="n">Reveal Final Jeopardy clue and open submissions</button>`;
  if(st>=1)b+=`<div class="clue">${f.q}</div><p class="hint">Teams have one submission each. Submissions are locked when you reveal the answer.</p>`;
  if(st===1)b+=`<div id="submission-list" class="card">Waiting for team submissions…</div><button id="n">Lock submissions and reveal answer</button>`;
  if(st===2)b+=`<div class="answer">${f.a}</div><div class="award">${S.teams.map((t,i)=>`<div><span>${esc(t.name)} <small>wagered ${fmt(S.wagers[i]||0)}</small></span><button class="ok" data-i="${i}" data-s="1"${S.fdone[i]?' disabled':''}>Right</button><button class="no" data-i="${i}" data-s="-1"${S.fdone[i]?' disabled':''}>Wrong</button></div>`).join('')}</div><button id="n">Show final scores</button>`;
  app.innerHTML=`<div class="top"><h1>Final Jeopardy!</h1>${tools()}</div><div class="stage">${b}</div>${scoreBar()}`;
  bindScores();bindTools();
  publishPublic(st>=1?{finalQuestion:f.q,answerVisible:st>=2,...(st>=2?{finalAnswer:f.a}:{})}:{finalQuestion:'Final Jeopardy'});
  const n=app.querySelector('#n');
  if(st===0)n.onclick=()=>{S.wagers=S.teams.map(()=>0);S.fstage=1;if(room)Buzz.r('state').update({phase:'final',finalOpen:true,teamIds:Object.keys(roster),finalQuestion:f.q});save();render();};
  if(st===1){
    const ref=room?Buzz.r('finalSubmissions'):null;
    if(ref)ref.on('value',snap=>{const subs=snap.val()||{};const box=app.querySelector('#submission-list');if(!box)return;box.innerHTML=S.teams.map((t,i)=>{const id=Object.keys(roster)[i],sub=id?subs[id]:null;return `<p><b>${esc(t.name)}:</b> ${sub?`Submitted · wager ${fmt(sub.wager)} · ${esc(sub.answer)}`:'Not submitted'}</p>`;}).join('');});
    n.onclick=()=>{S.wagers=S.teams.map((t,i)=>{const id=Object.keys(roster)[i];return id?0:0;});if(room)Buzz.r('finalSubmissions').get().then(snap=>{const subs=snap.val()||{};S.wagers=S.teams.map((t,i)=>{const id=Object.keys(roster)[i];return id&&subs[id]?Number(subs[id].wager)||0:0;});S.fstage=2;Buzz.r('state').update({phase:'final',finalOpen:false,teamIds:Object.keys(roster)});save();render();});else{S.fstage=2;save();render();}};
  }
  if(st===2){
    n.onclick=()=>{S.phase='results';if(room)Buzz.r('state').update({phase:'play',finalOpen:false});save();render();};
    app.querySelectorAll('.award button').forEach(x=>x.onclick=()=>{const i=+x.dataset.i;S.teams[i].score+=(S.wagers[i]||0)*+x.dataset.s;S.fdone[i]=true;save();render();});
  }
}

/* ---------- results ---------- */
function showResults() {
  const t = [...S.teams].sort((a, b) => b.score - a.score), top = t[0].score, w = t.filter(x => x.score === top).map(x => esc(x.name));
  app.innerHTML = `<div class="stage results"><h1>${w.length > 1 ? "It's a tie!" : 'Winner!'}</h1><h2 class="win">${w.join(' &amp; ')}</h2>
    <ol class="rank">${t.map(x => `<li><span>${esc(x.name)}</span><b>${fmt(x.score)}</b></li>`).join('')}</ol>
    <div class="row"><button id="again">Play again</button><a href="../../">All games</a></div></div>`;
  app.querySelector('#again').onclick = () => { S = fresh(); save(); if (room) { Buzz.r('assign').remove(); Buzz.r('buzzes').remove(); Buzz.r('finalSubmissions').remove(); } render(); };
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') (document.querySelector('#close') || document.querySelector('#pclose'))?.click(); });

/* ---------- presenter password gate, then start ---------- */
function boot() { render(); initBuzz(); }
const PW = window.PRESENTER_PASSWORD;
if (!PW || sessionStorage.getItem('fg-pres') === '1') boot();
else {
  app.innerHTML = `<div class="setup"><h1>Presenter</h1><p>Enter the presenter password.</p><input id="pw" type="password" aria-label="Password" autofocus><button id="ok">Unlock</button><p class="hint" id="pe"></p></div>`;
  const tryPw = () => { if (app.querySelector('#pw').value === PW) { sessionStorage.setItem('fg-pres', '1'); boot(); } else app.querySelector('#pe').textContent = 'Wrong password.'; };
  app.querySelector('#ok').onclick = tryPw; app.querySelector('#pw').onkeydown = e => { if (e.key === 'Enter') tryPw(); };
}
