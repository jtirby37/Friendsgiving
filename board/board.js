const code = new URLSearchParams(location.search).get('room');
const root = document.getElementById('screen');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(s) {
  if (!s) { root.textContent = 'Waiting for the presenter…'; return; }
  let html = '';
  if (s.clue) {
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
