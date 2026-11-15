const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const QRCode = require('qrcode');
const { QUESTIONS } = require('./questions');

const PORT = process.env.PORT || 3000;
const QUESTION_SECONDS = 30;
const BASE_POINTS = 500;
const SPEED_POINTS = 500;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const game = {
  pin: String(Math.floor(100000 + Math.random() * 900000)),
  phase: 'lobby',
  index: -1,
  questionStartsAt: 0,
  questionEndsAt: 0,
  timer: null,
  lastReveal: null,
  lastFinal: null,
  players: new Map()
};

function countAnswered() {
  let n = 0;
  for (const p of game.players.values()) if (p.answer) n++;
  return n;
}

function answeredIds() {
  const ids = [];
  for (const p of game.players.values()) if (p.answer) ids.push(p.id);
  return ids;
}

function lobbyState() {
  return {
    pin: game.pin,
    phase: game.phase,
    total: QUESTIONS.length,
    players: [...game.players.values()].map(p => ({
      id: p.id, name: p.name, avatar: p.avatar, score: p.score, streak: p.streak
    }))
  };
}

function questionState() {
  const q = QUESTIONS[game.index];
  return {
    index: game.index,
    total: QUESTIONS.length,
    scenario: q.scenario,
    seconds: QUESTION_SECONDS,
    answeredCount: countAnswered(),
    answeredIds: answeredIds(),
    playerCount: game.players.size
  };
}

function sortedPlayers() {
  return [...game.players.values()].sort((a, b) => b.score - a.score);
}

function reveal() {
  clearTimeout(game.timer);
  if (game.phase !== 'question') return;
  const q = QUESTIONS[game.index];
  const results = [];
  for (const p of game.players.values()) {
    let earned = 0;
    let correct = false;
    if (p.answer && p.answer.choice === q.answer) {
      correct = true;
      const remaining = Math.max(0, game.questionEndsAt - p.answer.at);
      earned = BASE_POINTS + Math.round((SPEED_POINTS * remaining) / (QUESTION_SECONDS * 1000));
      p.streak += 1;
    } else {
      p.streak = 0;
    }
    p.lastEarned = earned;
    p.lastCorrect = p.answer ? correct : null;
    p.score += earned;
    results.push({
      id: p.id, name: p.name, avatar: p.avatar,
      correct, earned, streak: p.streak, score: p.score, answered: !!p.answer
    });
  }
  game.phase = 'reveal';
  game.lastReveal = {
    index: game.index,
    total: QUESTIONS.length,
    answer: q.answer,
    why: q.why,
    how: q.how,
    correctCount: results.filter(r => r.correct).length,
    answeredCount: results.filter(r => r.answered).length,
    playerCount: results.length,
    results,
    scoreboard: sortedPlayers().slice(0, 10).map(p => ({
      id: p.id, name: p.name, avatar: p.avatar, score: p.score,
      streak: p.streak, lastEarned: p.lastEarned, lastCorrect: p.lastCorrect
    }))
  };
  io.emit('reveal', game.lastReveal);
}

function startQuestion(i) {
  clearTimeout(game.timer);
  game.index = i;
  game.phase = 'question';
  game.lastReveal = null;
  game.questionStartsAt = Date.now();
  game.questionEndsAt = game.questionStartsAt + QUESTION_SECONDS * 1000;
  for (const p of game.players.values()) p.answer = null;
  io.emit('question', questionState());
  game.timer = setTimeout(reveal, QUESTION_SECONDS * 1000);
}

function goFinal() {
  clearTimeout(game.timer);
  game.phase = 'final';
  const ranking = sortedPlayers().map((p, i) => ({
    id: p.id, name: p.name, avatar: p.avatar, score: p.score, position: i + 1
  }));
  game.lastFinal = { podium: ranking.slice(0, 3), ranking };
  io.emit('final', game.lastFinal);
}

function resetGame() {
  clearTimeout(game.timer);
  game.phase = 'lobby';
  game.index = -1;
  game.lastReveal = null;
  game.lastFinal = null;
  for (const p of game.players.values()) {
    p.score = 0;
    p.streak = 0;
    p.answer = null;
    p.lastEarned = 0;
    p.lastCorrect = null;
  }
  io.emit('lobby', lobbyState());
}

io.on('connection', (socket) => {
  socket.emit('hello', {
    pin: game.pin,
    phase: game.phase,
    lobby: lobbyState(),
    question: game.phase === 'question' ? questionState() : null,
    reveal: game.phase === 'reveal' ? game.lastReveal : null,
    final: game.phase === 'final' ? game.lastFinal : null
  });

  socket.on('join', ({ pin, name, avatar }, cb) => {
    name = String(name || '').trim().slice(0, 15);
    if (!name) return cb({ error: 'Escriu un nickname' });
    if (String(pin || '').trim() !== game.pin) return cb({ error: 'PIN incorrecte' });
    if (game.phase === 'final') return cb({ error: 'La partida ja ha acabat' });
    const taken = [...game.players.values()].some(
      p => p.name.toLowerCase() === name.toLowerCase() && p.id !== socket.id
    );
    if (taken) return cb({ error: 'Aquest nickname ja està agafat' });
    let p = game.players.get(socket.id);
    if (!p) {
      p = { id: socket.id, name, avatar, score: 0, streak: 0, answer: null, lastEarned: 0, lastCorrect: null };
      game.players.set(socket.id, p);
    } else {
      p.name = name;
      p.avatar = avatar;
    }
    cb({ ok: true });
    io.emit('lobby', lobbyState());
    if (game.phase === 'question') socket.emit('question', questionState());
    else if (game.phase === 'reveal' && game.lastReveal) socket.emit('reveal', game.lastReveal);
  });

  socket.on('answer', ({ choice }) => {
    const p = game.players.get(socket.id);
    if (!p || game.phase !== 'question' || p.answer) return;
    p.answer = { choice: !!choice, at: Date.now() };
    io.emit('answered', {
      answeredCount: countAnswered(),
      playerCount: game.players.size,
      answeredIds: answeredIds()
    });
    if (game.players.size > 0 && countAnswered() === game.players.size) reveal();
  });

  socket.on('needQr', async ({ url }, cb) => {
    try {
      const dataUrl = await QRCode.toDataURL(String(url || ''), { width: 320, margin: 1 });
      cb({ qr: dataUrl });
    } catch {
      cb({ qr: null });
    }
  });

  socket.on('start', () => {
    if (game.phase === 'lobby' && game.players.size > 0) startQuestion(0);
  });

  socket.on('next', () => {
    if (game.phase !== 'reveal') return;
    if (game.index + 1 < QUESTIONS.length) startQuestion(game.index + 1);
    else goFinal();
  });

  socket.on('restart', () => {
    if (game.phase === 'final') resetGame();
  });

  socket.on('disconnect', () => {
    if (game.players.has(socket.id)) {
      game.players.delete(socket.id);
      io.emit('lobby', lobbyState());
      if (game.phase === 'question' && game.players.size > 0 && countAnswered() === game.players.size) {
        reveal();
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`RAG Quiz escoltant a http://localhost:${PORT}`);
  console.log(`Pantalla del professor: http://localhost:${PORT}/teacher.html`);
  console.log(`PIN de la partida: ${game.pin}`);
});
