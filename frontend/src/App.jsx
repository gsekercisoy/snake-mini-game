import React, { useEffect, useState } from 'react';
import { api } from './api.js';

export default function App() {
  return (
    <div className="app">
      <h1>🐍 Mini Yılan v2</h1>
      <p className="lead">Oyun React + Vite üzerinde çalışır; skorlar Java REST API'ye (H2 DB) kaydedilir.</p>
      <div className="layout">
        <Game />
        <Leaderboard />
      </div>
    </div>
  );
}

function Game() {
  const canvasRef = React.useRef(null);
  const [score, setScore] = useState(0);
  const [apples, setApples] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | running | over
  const [playing, setPlaying] = React.useState(false);

  // oyunun referans verileri (ref içi state, render dışı)
  const game = React.useRef({
    snake: null, dir: null, nextDir: null, food: null,
    timer: null, speed: 130, paused: false
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const grid = 20, cells = canvas.width / grid;
    const g = game.current;

    const draw = () => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(51,65,85,.35)';
      ctx.lineWidth = 1;
      for (let i = 1; i < cells; i++) {
        ctx.beginPath(); ctx.moveTo(i * grid, 0); ctx.lineTo(i * grid, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * grid); ctx.lineTo(canvas.width, i * grid); ctx.stroke();
      }
      if (g.food) {
        ctx.fillStyle = '#f87171';
        ctx.beginPath();
        ctx.arc(g.food.x * grid + grid / 2, g.food.y * grid + grid / 2, grid / 2 - 3, 0, Math.PI * 2);
        ctx.fill();
      }
      if (g.snake) {
        g.snake.forEach((seg, i) => {
          ctx.fillStyle = i === 0 ? '#86efac' : '#4ade80';
          ctx.shadowColor = '#22c55e';
          ctx.shadowBlur = i === 0 ? 12 : 0;
          ctx.fillRect(seg.x * grid + 1, seg.y * grid + 1, grid - 2, grid - 2);
          ctx.shadowBlur = 0;
        });
      }
      if (g.paused) {
        ctx.fillStyle = 'rgba(15,23,42,.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 26px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('DURAKLATILDI', canvas.width / 2, canvas.height / 2);
      }
    };

    const placeFood = () => {
      do {
        g.food = { x: Math.floor(Math.random() * cells), y: Math.floor(Math.random() * cells) };
      } while (g.snake.some(s => s.x === g.food.x && s.y === g.food.y));
    };

    const step = () => {
      if (g.paused) return;
      g.dir = g.nextDir;
      const head = { x: g.snake[0].x + g.dir.x, y: g.snake[0].y + g.dir.y };
      const hitWall = head.x < 0 || head.y < 0 || head.x >= cells || head.y >= cells;
      const hitSelf = g.snake.some(s => s.x === head.x && s.y === head.y);
      if (hitWall || hitSelf) return gameOver();

      g.snake.unshift(head);
      if (head.x === g.food.x && head.y === g.food.y) {
        setScore(s => s + 10);
        setApples(a => a + 1);
        g.speed = Math.max(60, g.speed - 2);
        clearInterval(g.timer);
        g.timer = setInterval(step, g.speed);
        placeFood();
      } else {
        g.snake.pop();
      }
      draw();
    };

    const gameOver = () => {
      clearInterval(g.timer);
      g.timer = null;
      draw();
      setPhase('over');
      setPlaying(false);
    };

    const startGame = () => {
      g.snake = [{ x: 9, y: 12 }, { x: 8, y: 12 }, { x: 7, y: 12 }];
      g.dir = { x: 1, y: 0 };
      g.nextDir = g.dir;
      g.speed = 130;
      g.paused = false;
      setScore(0);
      setApples(0);
      setPhase('running');
      setPlaying(true);
      placeFood();
      draw();
      clearInterval(g.timer);
      g.timer = setInterval(step, g.speed);
    };

    const setDir = (nx, ny) => {
      if (g.dir.x !== -nx || g.dir.y !== -ny) g.nextDir = { x: nx, y: ny };
    };

    const onKey = (e) => {
      const k = e.key;
      if (['ArrowUp', 'w', 'W'].includes(k)) setDir(0, -1);
      else if (['ArrowDown', 's', 'S'].includes(k)) setDir(0, 1);
      else if (['ArrowLeft', 'a', 'A'].includes(k)) setDir(-1, 0);
      else if (['ArrowRight', 'd', 'D'].includes(k)) setDir(1, 0);
      else if (k === ' ') {
        e.preventDefault();
        if (g.timer) { g.paused = !g.paused; draw(); }
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) e.preventDefault();
    };
    document.addEventListener('keydown', onKey);

    draw();

    // startGame'i ref'e koy ki buton erişsin
    game.current.startGame = startGame;
    game.current.draw = draw;

    return () => {
      document.removeEventListener('keydown', onKey);
      if (g.timer) clearInterval(g.timer);
    };
  }, []);

  const [submitState, setSubmitState] = useState(''); // '' | 'sending' | 'sent' | error-msg
  const [player, setPlayer] = useState(() => localStorage.getItem('snakePlayer') || '');
  const [scoresKey, setScoresKey] = useState(0); // leaderboard yenileme tetiği

  const submitScore = async () => {
    setSubmitState('sending');
    try {
      await api.post('/scores', { player: player.trim() || 'MISAFİR', score, apples });
      localStorage.setItem('snakePlayer', player.trim());
      setSubmitState('sent');
      setScoresKey(k => k + 1);
      setTimeout(() => setSubmitState(''), 2000);
    } catch (e) {
      setSubmitState(e.message);
    }
  };

  return (
    <div className="panel game-panel">
      <div className="hud">
        <span>Skor: <b>{score}</b></span>
        <span>Elma: <b>{apples}</b></span>
      </div>
      <canvas ref={canvasRef} width="480" height="480" />
      {phase !== 'running' && (
        <button className="btn primary" onClick={() => {
          setSubmitState('');
          game.current.startGame();
        }}>
          {phase === 'over' ? 'Tekrar Oyna' : 'Başla'}
        </button>
      )}
      {phase === 'over' && (
        <div className="submit">
          <b>Oyun bitti!</b>
          <div className="rowi">
            <input
              placeholder="Oyuncu adı"
              value={player}
              onChange={e => setPlayer(e.target.value)}
              maxLength={20}
            />
            <button className="btn primary" onClick={submitScore} disabled={submitState === 'sending'}>
              {submitState === 'sending' ? '…' : 'Skoru Kaydet'}
            </button>
          </div>
          {submitState === 'sent' && <div className="ok">Skor kaydedildi ✅</div>}
          {submitState !== '' && submitState !== 'sent' && submitState !== 'sending' && <div className="err">{submitState}</div>}
        </div>
      )}
      <p className="small">WASD / yön tuşları · Boşluk: duraklat</p>
    </div>
  );
}

function Leaderboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    api.get('/scores').then(d => { if (alive) setData(d); }).catch(e => { if (alive) setErr(e.message); });
    const t = setInterval(() => {
      api.get('/scores').then(d => { if (alive) setData(d); }).catch(() => {});
    }, 10000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  if (err) return <div className="panel"><div className="err">{err}</div></div>;
  if (!data) return <div className="panel">Yükleniyor…</div>;

  return (
    <div className="panel">
      <h2>🏆 Skor Tablosu (sunucudan)</h2>
      <table className="tbl">
        <thead><tr><th>#</th><th>Oyuncu</th><th>Skor</th><th>Elma</th></tr></thead>
        <tbody>
          {data.map((s, i) => (
            <tr key={s.id}>
              <td>{i + 1}</td>
              <td>{s.player}</td>
              <td className="num">{s.score}</td>
              <td className="muted">{s.apples}</td>
            </tr>
          ))}
          {data.length === 0 && <tr><td colSpan={4} className="muted">Henüz skor yok</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
