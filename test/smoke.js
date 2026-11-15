const { spawn } = require('child_process');
const { io } = require('socket.io-client');

const PORT = 3999;
const URL = `http://localhost:${PORT}`;

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

function waitFor(client, event, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout esperant '${event}'`)), timeout);
    client.once(event, (data) => { clearTimeout(t); resolve(data); });
  });
}

function emitAck(client, event, payload) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout a l'ack de '${event}'`)), 5000);
    client.emit(event, payload, (res) => { clearTimeout(t); resolve(res); });
  });
}

async function main() {
  const server = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'pipe' });
  server.stdout.on('data', d => process.stdout.write(`[server] ${d}`));
  server.stderr.on('data', d => process.stderr.write(`[server:err] ${d}`));
  await wait(800);

  const failures = [];
  const check = (cond, msg) => {
    if (cond) console.log(`  OK  ${msg}`);
    else { console.error(`  FAIL ${msg}`); failures.push(msg); }
  };

  try {
    const teacher = io(URL);
    const hello = await waitFor(teacher, 'hello');
    check(/^\d{6}$/.test(hello.pin), `PIN de 6 dígits (${hello.pin})`);
    check(hello.phase === 'lobby', 'fase inicial lobby');

    const s1 = io(URL);
    const s2 = io(URL);
    await wait(200);

    const pin = hello.pin;
    const bad = await emitAck(s1, 'join', { pin: '000000', name: 'Anna', avatar: { shape: 'star', color: '#e21b3c' } });
    check(bad && bad.error, 'PIN incorrecte rebutjat');

    const j1 = await emitAck(s1, 'join', { pin, name: 'Anna', avatar: { shape: 'star', color: '#e21b3c' } });
    const j2 = await emitAck(s2, 'join', { pin, name: 'Biel', avatar: { shape: 'circle', color: '#1368ce' } });
    check(j1.ok && j2.ok, 'dos jugadors connectats');

    const dup = await emitAck(s2, 'join', { pin, name: 'anna', avatar: { shape: 'star', color: '#1368ce' } });
    check(dup && dup.error, 'nickname duplicat rebutjat');

    const q1 = waitFor(s1, 'question');
    const q2 = waitFor(s2, 'question');
    teacher.emit('start');
    const q0 = await waitFor(teacher, 'question');
    await q1;
    await q2;
    check(q0.index === 0 && q0.total === 17, `pregunta 1 de ${q0.total}`);
    check(q0.seconds === 30, 'temporitzador de 30 s');

    let revealedEarly = false;
    const earlyHandler = () => { revealedEarly = true; };
    teacher.once('reveal', earlyHandler);
    const answeredP = waitFor(s2, 'answered');
    s1.emit('answer', { choice: false });
    const lobbyAfterOne = await answeredP;
    await wait(300);
    teacher.off('reveal', earlyHandler);
    check(lobbyAfterOne.answeredCount === 1, 'comptador de respostes en viu (1 de 2)');
    check(!revealedEarly, 'la resposta NO es revela amb només una resposta');

    const revealP = waitFor(teacher, 'reveal');
    s2.emit('answer', { choice: true });
    const rev = await revealP;
    check(rev.answeredCount === 2, 'revelació només quan han respost tots');
    const r1 = rev.results.find(r => r.name === 'Anna');
    const r2 = rev.results.find(r => r.name === 'Biel');
    check(r1.correct && r1.earned > 0, 'Anna (resposta correcta) guanya punts');
    check(!r2.correct && r2.earned === 0, 'Biel (resposta incorrecta) no guanya punts');
    check(rev.scoreboard[0].name === 'Anna', 'Anna primera del marcador');

    for (let i = 1; i < 17; i++) {
      const n1 = waitFor(s1, 'question');
      const n2 = waitFor(s2, 'question');
      const nT = waitFor(teacher, 'question');
      teacher.emit('next');
      const q = await nT;
      await n1;
      await n2;
      check(q.index === i, `pregunta ${i + 1} de 17`);
      const rv = waitFor(teacher, 'reveal');
      s1.emit('answer', { choice: true });
      s2.emit('answer', { choice: true });
      await rv;
    }

    const finP = waitFor(teacher, 'final');
    teacher.emit('next');
    const fin = await finP;
    check(fin.ranking.length === 2, 'classificació final amb 2 jugadors');
    check(fin.ranking[0].name === 'Anna', `Anna primera a la final — ${fin.ranking[0].name}`);

    const s3 = io(URL);
    const late = await emitAck(s3, 'join', { pin, name: 'Carla', avatar: { shape: 'diamond', color: '#26890c' } });
    check(late && late.error, 'no es pot entrar un cop acabada la partida');

    const lobbyP = waitFor(teacher, 'lobby');
    teacher.emit('restart');
    const lobby = await lobbyP;
    check(lobby.phase === 'lobby' && lobby.players.every(p => p.score === 0), 'restart: puntuacions a zero');
  } catch (err) {
    failures.push(err.message);
    console.error('ERROR:', err.message);
  }

  server.kill();
  process.exit(failures.length ? 1 : 0);
}

main();
