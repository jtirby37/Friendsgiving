const code = new URLSearchParams(location.search).get('room');
const root = document.getElementById('screen');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(s) {
  if (!s) { root.textContent = 'Waiting for the presenter…'; return; }
  let html = '';
  if (s.game === 'feud') {
    html += '<h2>'+esc(s.title)+'</h2>';
    if(s.phase==='round') {
      html += '<div class="cluebox"><div class="meta">Round '+Number(s.round)+' · ×'+Number(s.multiplier)+'</div><div class="question">'+(s.questionVisible ? esc(s.question) : 'Top '+Number(s.answerCount || (s.slots||[]).length)+' answers on the board')+'</div></div><div class="tvgrid feudgrid">';
      (s.slots||[]).forEach((a,i)=>{html+='<div class="tvcell feudslot"><span>'+ (i+1)+'</span><span>'+ (a.revealed?esc(a.answer):'• • • • •')+'</span><span>'+ (a.revealed?Number(a.points):'')+'</span></div>';});
      html+='</div><h2>Bank: '+Number(s.bank)+' · <span style="color:#ff6464">'+ '✕ '.repeat(Math.min(3,Math.max(0,Number(s.strikes)||0)))+'</span></h2>';
    } else if(s.phase==='fm') {
      html+='<h2>Fast Money</h2>';
      if(s.stage==='done') {html+='<table class="feudresults"><thead><tr><th>Question</th><th>Player 1</th><th>Player 2</th></tr></thead><tbody>'; (s.results||[]).forEach(r=>{html+='<tr><td>'+esc(r.question)+'</td>'+r.players.map(p=>'<td>'+esc(p.answer)+' · '+Number(p.points)+'</td>').join('')+'</tr>';});html+='</tbody></table><h2>Total: '+Number(s.total)+'</h2>';}
      else html+='<div class="cluebox">'+(s.stage==='p1'?'Player 1':s.stage==='p2'?'Player 2':'Get ready!')+'</div>';
    } else if(s.phase==='final') {html+='<h2>Final scores</h2>';} else html+='<div class="cluebox">Waiting for the game to begin…</div>';
  } else if (s.clue) {
    html += '<section class="cluebox"><div class="meta">' + esc(s.clue.category) + ' · $' + Number(s.clue.value || 0).toLocaleString() + '</div>';
    html += '<div class="question">' + esc(s.clue.question) + '</div>';
    if (s.clue.answerVisible) html += '<div class="answer">' + esc(s.clue.answer) + '</div>';
    html += '</section>';
  } else if (s.phase === 'board') {
    const cats = s.categories || [], vals = s.values || [];
    html += '<h2>' + esc(s.roundName) + '</h2><div class="tvgrid" style="grid-template-columns:repeat(' + Math.max(1, cats.length) + ',1fr)">';
    cats.forEach(c => { html += '<div class="tvcat">' + esc(c) + '</div>'; });
    vals.forEach((v, r) => cats.forEach((c, col) => {
      const used = !!(s.used || {})[s.round + '-' + col + '-' + r];
      html += '<div class="tvcell' + (used ? ' used' : '') + '">' + (used ? '' : '$' + Number(v).toLocaleString()) + '</div>';
    }));
    html += '</div>';
  } else if (s.phase === 'final') {
    html += '<section class="cluebox"><h2>Final Jeopardy</h2><div class="question">' + esc(s.finalQuestion || 'Final round') + '</div>';
    if (s.answerVisible) html += '<div class="answer">' + esc(s.finalAnswer || '') + '</div>';
    html += '</section>';
  }
  html += '<div class="scores">' + (s.teams || []).map(t => '<div class="score"><span>' + esc(t.name) + '</span><b>' + Number(t.score || 0).toLocaleString() + '</b></div>').join('') + '</div>';
  root.innerHTML = html;
}
if (!/^\d{4}$/.test(code || '')) root.textContent = 'Missing 4-digit room code.';
else if (!window.FIREBASE_CONFIG?.apiKey) root.textContent = 'Firebase is not configured.';
else {
  firebase.initializeApp(window.FIREBASE_CONFIG);
  firebase.database().ref('rooms/' + code + '/publicState').on('value', snap => render(snap.val()));
}
