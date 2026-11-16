const socket = io();
const $ = (id) => document.getElementById(id);

let state = { phase: 'lobby' };

function show(id) {
  state.phase = id.replace('-screen', '');
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  $(id).classList.remove('hidden');
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function playerChip(p, dim) {
  return `<div class="player-chip${dim ? ' dim' : ''}">${avatarHTML(p.avatar, 26)}<span>${escapeHTML(p.name)}</span></div>`;
}

function renderLobby(data) {
  $('pin').textContent = data.pin;
  $('lobby-count').textContent = data.players.length === 0
    ? 'Esperant jugadors...'
    : `Jugadors connectats: ${data.players.length}`;
  $('players').innerHTML = data.players.map(p => playerChip(p, false)).join('');
  $('btn-start').disabled = data.players.length === 0;
  show('lobby-screen');
}

function renderQuestion(data) {
  totalQuestions = data.total;
  $('t-progress').textContent = `Pregunta ${data.index + 1} de ${data.total}`;
  $('t-scenario').textContent = data.scenario;
  $('t-answered').textContent = `Han respost 0 de ${data.playerCount}`;
  $('t-answered-avatars').innerHTML = '';
  startCountdown(data.seconds);
  show('question-screen');
}

function startCountdown(seconds) {
  const fill = $('t-timer-fill');
  const end = Date.now() + seconds * 1000;
  fill.style.transition = 'none';
  fill.style.width = '100%';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    fill.style.transition = `width ${seconds}s linear`;
    fill.style.width = '0%';
  }));
  const tick = () => {
    const screenVisible = !$('question-screen').classList.contains('hidden');
    if (!screenVisible) return;
    if (end - Date.now() > 0) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function renderReveal(data) {
  const banner = $('r-answer');
  banner.textContent = data.answer ? '✔ SÍ. ÉS UN RAG.' : '✘ NO. NO ÉS UN RAG.';
  banner.className = 'reveal-banner ' + (data.answer ? 'correct' : 'wrong');
  $('r-why').textContent = data.why;
  $('r-how').textContent = data.how;
  $('r-counts').textContent = `Correctes: ${data.correctCount} · Fallats: ${data.answeredCount - data.correctCount} · Sense respondre: ${data.playerCount - data.answeredCount}`;
  $('r-scoreboard').innerHTML = data.scoreboard.map((p, i) => `
    <div class="score-row">
      <span class="pos">${i + 1}</span>
      ${avatarHTML(p.avatar, 28)}
      <span>${escapeHTML(p.name)}</span>
      <span class="pts">${p.score}<span class="delta">+${p.lastEarned}</span></span>
    </div>`).join('');
  $('btn-next').textContent = data.index + 1 < data.total
    ? 'Següent pregunta →'
    : 'Veure resultats finals 🏆';
  show('reveal-screen');
}

function renderFinal(data) {
  const medals = ['🥇', '🥈', '🥉'];
  const heights = ['first', 'second', 'third'];
  $('f-podium').innerHTML = data.podium.map((p, i) => `
    <div class="step ${heights[i]}">
      <div class="medal">${medals[i]}</div>
      ${avatarHTML(p.avatar, 44)}
      <div>${escapeHTML(p.name)}</div>
      <div class="pts">${p.score}</div>
    </div>`).join('');
  $('f-ranking').innerHTML = data.ranking.map(r => `
    <li class="score-row">
      <span class="pos">${r.position}</span>
      ${avatarHTML(r.avatar, 28)}
      <span>${escapeHTML(r.name)}</span>
      <span class="pts">${r.score}</span>
    </li>`).join('');
  show('final-screen');
}

socket.on('hello', (data) => {
  totalQuestions = data.lobby.total;
  $('pin').textContent = data.pin;
  const local = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(location.hostname);
  const joinUrl = `${location.origin}/?pin=${data.pin}`;
  socket.emit('needQr', { url: joinUrl, local }, (res) => {
    if (res && res.url) $('join-url').textContent = res.url;
    if (res && res.qr) $('qr').src = res.qr;
  });
  if (data.question) renderQuestion(data.question);
  else if (data.reveal) renderReveal(data.reveal);
  else if (data.final) renderFinal(data.final);
  else renderLobby(data.lobby);
});

socket.on('lobby', (data) => {
  if (state.phase === 'lobby') renderLobby(data);
});


socket.on('question', (data) => renderQuestion(data));

socket.on('answered', (data) => {
  $('t-answered').textContent = `Han respost ${data.answeredCount} de ${data.playerCount}`;
  $('t-answered-avatars').innerHTML = data.answeredIds.map(id => `<div class="player-chip dim">✔</div>`).join('');
});

socket.on('reveal', (data) => renderReveal(data));
socket.on('final', (data) => renderFinal(data));

$('btn-start').onclick = () => socket.emit('start');
$('btn-next').onclick = () => socket.emit('next');
$('btn-restart').onclick = () => socket.emit('restart');
