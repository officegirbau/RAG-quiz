const socket = io();
const $ = (id) => document.getElementById(id);

let me = null;
let pickedShape = AVATAR_SHAPES[Math.floor(Math.random() * AVATAR_SHAPES.length)];
let pickedColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
let answeredThisQuestion = false;
let state = { phase: 'lobby' };

function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  $(id).classList.remove('hidden');
}

function renderPicker() {
  const shapeRow = $('shape-row');
  shapeRow.innerHTML = '';
  AVATAR_SHAPES.forEach(shape => {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = avatarSVG(shape, pickedColor, 30);
    if (shape === pickedShape) b.classList.add('selected');
    b.onclick = () => { pickedShape = shape; renderPicker(); };
    shapeRow.appendChild(b);
  });

  const colorRow = $('color-row');
  colorRow.innerHTML = '';
  AVATAR_COLORS.forEach(color => {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `<span style="background:${color}"></span>`;
    if (color === pickedColor) b.classList.add('selected');
    b.onclick = () => { pickedColor = color; renderPicker(); };
    colorRow.appendChild(b);
  });

  $('avatar-preview').innerHTML = avatarSVG(pickedShape, pickedColor, 72);
}

function startCountdown(seconds) {
  const fill = $('timer-fill');
  const start = Date.now();
  const end = start + seconds * 1000;
  fill.style.transition = 'none';
  fill.style.width = '100%';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    fill.style.transition = `width ${seconds}s linear`;
    fill.style.width = '0%';
  }));
  const tick = () => {
    if (state.phase !== 'question') return;
    const remaining = Math.max(0, end - Date.now());
    if (remaining > 0) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

$('join-form').addEventListener('submit', (e) => {
  e.preventDefault();
  $('join-error').textContent = '';
  const pin = $('pin').value.trim();
  const name = $('nickname').value.trim();
  if (!pin || !name) {
    $('join-error').textContent = 'Cal el PIN i un nickname';
    return;
  }
  socket.emit('join', { pin, name, avatar: { shape: pickedShape, color: pickedColor } }, (res) => {
    if (res && res.error) {
      $('join-error').textContent = res.error;
      return;
    }
    me = { name, avatar: { shape: pickedShape, color: pickedColor } };
    $('my-avatar').innerHTML = avatarHTML(me.avatar, 84);
    $('my-name').textContent = me.name;
    show('wait-screen');
  });
});

socket.on('hello', (data) => {
  $('pin').value = data.pin || '';
  if (data.question) onQuestion(data.question);
  else if (data.reveal) onReveal(data.reveal);
  else if (data.final) onFinal(data.final);
});

socket.on('lobby', (data) => {
  if (!me) return;
  if (state.phase === 'lobby' || state.phase === 'wait') {
    $('wait-count').textContent = `Jugadors connectats: ${data.players.length}`;
    show('wait-screen');
  }
});

socket.on('question', (data) => onQuestion(data));

function onQuestion(data) {
  state = { phase: 'question' };
  answeredThisQuestion = false;
  $('q-progress').textContent = `Pregunta ${data.index + 1} de ${data.total}`;
  $('scenario').textContent = data.scenario;
  $('answered-info').textContent = '';
  $('btn-true').disabled = false;
  $('btn-false').disabled = false;
  $('btn-true').classList.remove('picked');
  $('btn-false').classList.remove('picked');
  show('question-screen');
  startCountdown(data.seconds);
}

function pick(choice, btn) {
  if (answeredThisQuestion || state.phase !== 'question') return;
  answeredThisQuestion = true;
  btn.classList.add('picked');
  $('btn-true').disabled = true;
  $('btn-false').disabled = true;
  $('answered-info').textContent = 'Resposta enviada! Esperant la resta de la classe...';
  socket.emit('answer', { choice });
}

$('btn-true').onclick = () => pick(true, $('btn-true'));
$('btn-false').onclick = () => pick(false, $('btn-false'));

socket.on('answered', (data) => {
  if (state.phase !== 'question') return;
  if (answeredThisQuestion) {
    $('answered-info').textContent = `Resposta enviada! Han respost ${data.answeredCount} de ${data.playerCount}...`;
  } else {
    $('answered-info').textContent = `Han respost ${data.answeredCount} de ${data.playerCount}...`;
  }
});

socket.on('reveal', (data) => onReveal(data));

function onReveal(data) {
  state = { phase: 'reveal' };
  const mine = me && data.results.find(r => r.name === me.name);
  const banner = $('reveal-result');
  if (!mine || !mine.answered) {
    banner.textContent = '⏰ Sense resposta';
    banner.className = 'reveal-banner wrong';
    $('reveal-points').textContent = '+0 punts';
  } else if (mine.correct) {
    banner.textContent = '✔ CORRECTE!';
    banner.className = 'reveal-banner correct';
    $('reveal-points').textContent = `+${mine.earned} punts` + (mine.streak > 1 ? ` · ratxa de ${mine.streak} 🔥` : '');
  } else {
    banner.textContent = '✘ Fallat';
    banner.className = 'reveal-banner wrong';
    $('reveal-points').textContent = '+0 punts';
  }
  $('reveal-score').textContent = mine ? `Puntuació total: ${mine.score}` : '';
  show('reveal-screen');
}

socket.on('final', (data) => onFinal(data));

function onFinal(data) {
  state = { phase: 'final' };
  const mine = me && data.ranking.find(r => r.name === me.name);
  $('my-final').innerHTML = mine
    ? `<p class="reveal-banner correct">${mine.position}è lloc</p><p>${mine.score} punts</p>`
    : '<p>Fora de la partida</p>';
  const ol = $('final-ranking');
  ol.innerHTML = '';
  data.ranking.forEach(r => {
    const li = document.createElement('li');
    li.className = 'score-row' + (me && r.name === me.name ? ' me' : '');
    li.innerHTML = `<span class="pos">${r.position}</span>${avatarHTML(r.avatar, 28)}<span>${escapeHTML(r.name)}</span><span class="pts">${r.score}</span>`;
    ol.appendChild(li);
  });
  show('final-screen');
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

renderPicker();
