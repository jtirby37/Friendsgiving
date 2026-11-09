const el = document.getElementById('p'), Q = new URLSearchParams(location.search);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => (n < 0 ? '-$' : '$') + Math.abs(n || 0).toLocaleString();
let st = {}, teams = {}, scoreTeams = [], assign = null, bz = {}, submissions = {}, pending = false, me = null, watchAtt = null, watchRef = null, watchSubmissionId = null, watchSubmissionRef = null, myName = '', roomCode = '', myTeamId = null; 
function joinScreen(msg='') {
  el.innerHTML = `<h1>Friendsgiving Buzzer</h1>${msg ? `<p class="err">${esc(msg)}</p>` : ''}<input id="c" inputmode="numeric" autocomplete="one-time-code" placeholder="4-digit room code" maxlength="4" value="${esc(Q.get('room') || localStorage.getItem('fg-p-room') || '')}"><input id="n" placeholder="Your name" maxlength="20" value="${esc(localStorage.getItem('fg-p-name') || '')}"><button id="go">Continue</button>`;
  el.querySelector('#go').onclick = () => connect(el.querySelector('#c').value, el.querySelector('#n').value);
}
async function connect(code, name) {
  code = code.trim(); name = name.trim();
  if (!/^\d{4}$/.test(code) || !name) return joinScreen('Enter the 4-digit code and your name.');
  if (!Buzz.configured()) return joinScreen('The host has not configured phone buzzers yet.');
  try {
    await Buzz.init(); Buzz.room = code; me = Buzz.uid(); roomCode = code; myName = name;
    if (!(await Buzz.r('host').get()).exists()) return joinScreen('Room not found. Check the code.');
    const prior = (await Buzz.r('players/' + me).get()).val() || {};
    await Buzz.r('players/' + me).update({name, joinedAt: Buzz.ts()});
    localStorage.setItem('fg-p-room', code); localStorage.setItem('fg-p-name', name);
    Buzz.r('state').on('value', s => { const n=s.val()||{}; if(n.attempt!==st.attempt) pending=false; st=n; watch(); paint(); });
    Buzz.r('teamRoster').on('value', s => { teams=s.val()||{}; paint(); });
    Buzz.r('teams').on('value', s => { scoreTeams=s.val()||[]; paint(); });
    
    Buzz.r('assign/' + me).on('value', s => { assign=s.val(); paint(); });
    if (prior.teamId) myTeamId=prior.teamId;
    paint();
  } catch(e) { joinScreen('Could not join: ' + e.message + (e.code==='auth/admin-restricted-operation' ? ' Enable Anonymous sign-in in Firebase Authentication.' : '')); }
}
async function assignTeam(id) { myTeamId=id; await Buzz.r('players/' + me + '/teamId').set(id); paint(); }
function teamScreen() {
  const rows=Object.entries(teams);
  el.innerHTML=`<h1>Choose your team</h1><p>Welcome, ${esc(myName)}. Create a team or join one.</p><div class="teamchoices">${rows.map(([id,t])=>`<button class="teamchoice" data-team="${esc(id)}">Join ${esc(t.name)}</button>`).join('')}</div><input id="newteam" maxlength="24" placeholder="New team name"><button id="create">Create team</button><p class="hint">Everyone on the same team shares one Final Jeopardy submission.</p>`;
  el.querySelectorAll('[data-team]').forEach(b=>b.onclick=()=>assignTeam(b.dataset.team));
  el.querySelector('#create').onclick=async()=>{const name=el.querySelector('#newteam').value.trim();if(!name)return;const ref=Buzz.r('teamRoster').push();await ref.set({name,createdAt:Buzz.ts()});await assignTeam(ref.key);};
}
function watch(){if(!st.attempt||st.attempt===watchAtt)return;watchRef&&watchRef.off();watchAtt=st.attempt;bz={};watchRef=Buzz.r('buzzes/'+st.attempt);watchRef.on('value',s=>{bz=s.val()||{};paint();});}
function paint(){
  if(assign===null || assign===undefined){ if(!myTeamId || !teams[myTeamId]) return teamScreen(); }
  const teamIndex=typeof assign==='number'?assign:(st.teamIds||[]).indexOf(myTeamId);
  const teamId=typeof assign==='number'?(st.teamIds||[])[assign]:myTeamId;
  const team=(typeof assign==='number'?{...(teams[teamId]||{}),...(scoreTeams[assign]||{})}:teams[myTeamId]); const phase=st.phase||'play';
  if(phase==='final' && st.finalOpen){
    const finalTeamId=st.teamIds?.[teamIndex] || teamId; if(finalTeamId && watchSubmissionId!==finalTeamId){watchSubmissionRef&&watchSubmissionRef.off();watchSubmissionId=finalTeamId;watchSubmissionRef=Buzz.r('finalSubmissions/'+finalTeamId);watchSubmissionRef.on('value',snap=>{submissions[finalTeamId]=snap.val();paint();});} const already=!!(finalTeamId && submissions[finalTeamId]);
    el.innerHTML=`<h1>Final Jeopardy</h1><div class="card"><h2>${esc(team.name)}</h2><p>One submission per team. Agree on one wager and one answer.</p>${already?'<p class="okmsg">Your team has submitted.</p>':`<input id="wager" type="number" min="0" max="${Math.max(0,Number(team.score)||0)}" placeholder="Wager (max ${fmt(Math.max(0,Number(team.score)||0))})"><textarea id="answer" rows="3" maxlength="300" placeholder="Your team answer"></textarea><button id="submit">Submit for team</button>`}</div>`;
    const btn=el.querySelector('#submit');if(btn)btn.onclick=async()=>{const wager=Number(el.querySelector('#wager').value),answer=el.querySelector('#answer').value.trim();if(!Number.isInteger(wager)||wager<0||wager>Math.max(0,Number(team.score)||0)||!answer)return alert('Enter a valid wager and answer.');const finalTeamId=st.teamIds?.[teamIndex] || teamId; if(!finalTeamId)return alert('Team link is not ready. Ask the host.'); const ref=Buzz.r('finalSubmissions/'+finalTeamId);const tx=await ref.transaction(v=>v===null?{wager,answer,submittedAt:Date.now(),submittedBy:me}:undefined);if(!tx.committed)alert('Your team has already submitted.');paint();};return;
  }
  const rank=Object.entries(bz).sort((a,b)=>a[1]-b[1]).findIndex(e=>e[0]===me)+1;
  const active=!!st.open;
  el.innerHTML=`<div class="who">${esc(myName)} · ${esc(team.name)}</div><button id="buzz" class="${rank||pending?'got':active?'go':'off'}" ${active&&!rank&&!pending?'':'disabled'}>${rank?'Buzzed #'+rank:pending?'Buzzed!':active?'BUZZ!':'Locked'}</button><div class="card"><div class="big">${fmt(team.score)}</div><div>Team score</div></div>${st.phase==='final'?'<p class="hint">Final Jeopardy submissions are not open yet.</p>':''}`;
  const b=el.querySelector('#buzz');if(b&&active&&!rank&&!pending)b.onclick=()=>{pending=true;paint();Buzz.r('buzzes/'+st.attempt+'/'+me).set(Buzz.ts()).catch(()=>{pending=false;paint();});};
}
joinScreen();
