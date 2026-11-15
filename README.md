# RAG Quiz — joc tipus Kahoot (Verdader/Fals)

Joc en temps real per a l'aula basat en la presentació «La Prueba del Algodón: ¿Qué es (y qué NO es) un RAG?» (Sessió 7 - Taller de IA).

- Els alumnes entren des del mòbil amb un **PIN** + **nickname** i trien un **avatar** (forma + color, estil Kahoot).
- Cada pregunta té **30 segons** de compte enrere.
- La resposta (**VERDADER/FALSO**) no es revela fins que **han respost tots** o s'acaba el temps.
- En revelar-se: resposta, explicació («Per què» / «Com funciona»), marcador en directe i ratxes (streaks).
- Puntuació: 500 pts base + fins a 500 segons la velocitat de resposta.
- Pantalla final amb podi i classificació completa.

## Com fer-lo anar a l'aula

```bash
npm install
npm start
```

1. **Projector**: obre `http://localhost:3000/teacher.html` — hi veuràs el PIN i un codi QR.
2. **Alumnes**: escanen el QR o entren a `http://<IP-del-teu-ordinador>:3000` (mateixa xarxa WiFi), escriuen el PIN i el nickname.
3. Prem **Començar partida**. En cada revelació, prem **Següent pregunta**.
4. Al final: podi i classificació. **Tornar a jugar** reinicia les puntuacions.

Per saber la teva IP: `ip addr` o `ipconfig` (Windows). Si el firewall bloqueja el port 3000, permet-lo temporalment.

## Configuració

- **Preguntes**: edita `questions.js` (escenari, resposta `true`/`false`, «why» i «how»).
- **Segons per pregunta**: `QUESTION_SECONDS` a `server.js`.
- **Puntuació**: `BASE_POINTS` i `SPEED_POINTS` a `server.js`.

## Desplegament en línia (opcional)

Funciona a qualsevol host amb Node (Render, Railway, Fly.io...): comanda `npm start`, port de la variable d'entorn `PORT`. En aquest cas els alumnes entraran amb la URL pública i no caldrà la mateixa WiFi.

## Proves

```bash
npm test
```

Test de fum que simula professor + 2 alumnes i recorre les 17 preguntes verificant: PIN, nicknames duplicats, temporitzador, ocultació de la resposta fins que responguin tots, puntuació, classificació final i reinici.

## Alternativa Kahoot!

A `data/kahoot-import.csv` hi ha les mateixes 17 preguntes en format d'importació de Kahoot! (Verdader/Fals, 30 s), per si prefereixes usar la seva plataforma.
