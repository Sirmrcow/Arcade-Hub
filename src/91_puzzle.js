/* ===================== PUZZLE & BOARD PACK ===================== */
GAMES.push({
  id:'minesweep', title:'Mine Sweep', tag:'2D', cat:'Puzzle', emoji:'💣', bg:'linear-gradient(135deg,#8e9eab,#2c3e50)',
  desc:'Classic minesweeper. Read the numbers, flag the mines, clear the field.',
  bestLabel:'Best', fmt: v => v+'s',
  start(ctx){
    const root = ctx.dom();
    root.innerHTML = `<div class="stats"><button class="gbtn on" data-d="0">Easy</button><button class="gbtn" data-d="1">Medium</button><button class="gbtn" data-d="2">Hard</button></div>
      <div class="stats"><div class="stat"><small>MINES</small><span id="msM">0</span></div><div class="stat"><small>TIME</small><span id="msT">0</span></div><button class="gbtn" id="msF">⛏ Dig</button></div>
      <div id="msB" style="display:grid;gap:2px;background:#2b2740;padding:6px;border-radius:10px;touch-action:manipulation"></div>
      <div style="font-size:12px;opacity:.55">${isTouch?'Tap to dig · switch to 🚩 mode (or long-press) to flag':'Left click dig · right click flag'}</div>`;
    const D = [[9,9,10],[14,14,32],[16,22,70]];
    const B = root.querySelector('#msB'), M = root.querySelector('#msM'), Tm = root.querySelector('#msT'), F = root.querySelector('#msF');
    let W, H, N, cells, first, over, flagMode = false, t0 = 0, timer = 0, diff = 0, flags = 0;
    const NC = ['','#4a90e2','#3ddc84','#ff5566','#b56bff','#ff9a3d','#2ec4b6','#ddd','#999'];
    function build(){
      [W, H, N] = D[diff]; first = true; over = false; flags = 0; timer = 0; t0 = 0; Tm.textContent = 0;
      const size = Math.floor(Math.min((ctx.el.clientWidth - 40)/W, (ctx.el.clientHeight - 230)/H, 36));
      B.style.gridTemplateColumns = `repeat(${W}, ${size}px)`; B.innerHTML = '';
      cells = [];
      for (let i=0;i<W*H;i++){
        const d = document.createElement('div'); d.style.cssText = `width:${size}px;height:${size}px;border-radius:4px;background:#4b4670;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${size*0.55}px;cursor:pointer;user-select:none`;
        const c = {i, x:i%W, y:Math.floor(i/W), mine:false, open:false, flag:false, n:0, d};
        let lp = null;
        d.addEventListener('pointerdown', e => { audioInit(); if (e.pointerType !== 'mouse') lp = setTimeout(() => { lp = 'done'; toggle(c); }, 380); });
        d.addEventListener('pointerup', e => { if (lp === 'done'){ lp = null; return; } clearTimeout(lp); lp = null; if (e.button === 2) return; flagMode ? toggle(c) : dig(c); });
        d.addEventListener('pointerleave', () => { if (lp && lp !== 'done') clearTimeout(lp); lp = null; });
        d.addEventListener('contextmenu', e => { e.preventDefault(); toggle(c); });
        B.appendChild(d); cells.push(c);
      }
      M.textContent = N;
    }
    const nb = c => { const r = []; for (let dy=-1;dy<=1;dy++) for (let dx=-1;dx<=1;dx++){ if (!dx && !dy) continue; const x = c.x+dx, y = c.y+dy; if (x>=0&&y>=0&&x<W&&y<H) r.push(cells[y*W+x]); } return r; };
    function plant(safe){ const bad = new Set([safe, ...nb(safe)]); let k = 0; while (k < N){ const c = cells[randi(0, W*H-1)]; if (c.mine || bad.has(c)) continue; c.mine = true; k++; } cells.forEach(c => c.n = nb(c).filter(o => o.mine).length); }
    function paint(c){ const d = c.d; if (c.open){ d.style.background = c.mine ? '#ff4d6d' : '#1d1a2e'; d.textContent = c.mine ? '💣' : c.n || ''; d.style.color = NC[c.n]; } else { d.style.background = '#4b4670'; d.textContent = c.flag ? '🚩' : ''; } }
    function toggle(c){ if (over || c.open) return; c.flag = !c.flag; flags += c.flag ? 1 : -1; M.textContent = N - flags; paint(c); beep(c.flag ? 700 : 500, .04, 'square', .04); }
    function dig(c){
      if (over || c.flag) return;
      if (first){ plant(c); first = false; t0 = performance.now(); }
      if (c.open){ // chord
        if (c.n && nb(c).filter(o => o.flag).length === c.n) nb(c).forEach(o => !o.open && !o.flag && dig(o));
        return;
      }
      if (c.mine){ over = true; cells.forEach(o => { if (o.mine){ o.open = true; paint(o); } }); noise(.4,.2,0,200); ctx.intro('Boom!', '<p>You hit a mine.</p>', build, 'Try again'); return; }
      const stack = [c];
      while (stack.length){ const o = stack.pop(); if (o.open || o.flag) continue; o.open = true; paint(o); if (!o.n) nb(o).forEach(q => !q.open && stack.push(q)); }
      beep(400 + Math.random()*100, .03, 'triangle', .04);
      if (cells.every(o => o.mine || o.open)){ over = true; const s = Math.round((performance.now()-t0)/1000); [523,659,784].forEach((f,i)=>beep(f,.15,'triangle',.08,0,i*.1)); ctx.over('minesweep', s, build, {lower:true, title:'Cleared!', fmt: v => v+'s'}); }
    }
    F.onclick = () => { flagMode = !flagMode; F.textContent = flagMode ? '🚩 Flag' : '⛏ Dig'; F.classList.toggle('on', flagMode); };
    root.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { diff = +b.dataset.d; root.querySelectorAll('[data-d]').forEach(x => x.classList.toggle('on', x === b)); build(); });
    build();
    ctx.loop(() => { if (!first && !over) Tm.textContent = Math.floor((performance.now()-t0)/1000); });
  }
});

GAMES.push({
  id:'memory', title:'Memory Pairs', tag:'2D', cat:'Puzzle', emoji:'🃏', bg:'linear-gradient(135deg,#ff9a9e,#a18cd1)',
  desc:'Flip cards two at a time and match every pair in as few moves as you can.',
  bestLabel:'Fewest moves',
  start(ctx){
    const root = ctx.dom();
    root.innerHTML = `<div class="stats"><div class="stat"><small>MOVES</small><span id="mmM">0</span></div><div class="stat"><small>PAIRS</small><span id="mmP">0/8</span></div><button class="gbtn" id="mmN">New</button></div><div id="mmB" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;perspective:800px"></div>`;
    const ICONS = ['🍉','🚀','🌵','🎸','🦊','🍩','⚡','🌙','🐙','🎈','🍄','🧊'];
    const Bd = root.querySelector('#mmB'), Mv = root.querySelector('#mmM'), Pr = root.querySelector('#mmP');
    let open = [], moves = 0, pairs = 0, lock = false;
    function deal(){
      const size = Math.floor(Math.min((ctx.el.clientWidth - 60)/4, (ctx.el.clientHeight - 200)/4, 110));
      const set = ICONS.sort(() => Math.random()-.5).slice(0, 8), deck = [...set, ...set].sort(() => Math.random()-.5);
      Bd.innerHTML = ''; open = []; moves = 0; pairs = 0; lock = false; Mv.textContent = 0; Pr.textContent = '0/8';
      deck.forEach(ic => {
        const c = document.createElement('div');
        c.style.cssText = `width:${size}px;height:${size}px;position:relative;transform-style:preserve-3d;transition:transform .3s;cursor:pointer`;
        c.innerHTML = `<div style="position:absolute;inset:0;border-radius:12px;background:linear-gradient(135deg,#6a5acd,#b06ab3);backface-visibility:hidden;display:flex;align-items:center;justify-content:center;font-size:${size*.3}px;opacity:.9">?</div><div style="position:absolute;inset:0;border-radius:12px;background:#f7f4ff;backface-visibility:hidden;transform:rotateY(180deg);display:flex;align-items:center;justify-content:center;font-size:${size*.5}px">${ic}</div>`;
        c.dataset.ic = ic;
        c.onclick = () => flip(c);
        Bd.appendChild(c);
      });
    }
    function flip(c){
      audioInit();
      if (lock || c.dataset.done || open.includes(c)) return;
      c.style.transform = 'rotateY(180deg)'; open.push(c); beep(500,.04,'sine',.05);
      if (open.length < 2) return;
      moves++; Mv.textContent = moves;
      const [a, b] = open;
      if (a.dataset.ic === b.dataset.ic){ a.dataset.done = b.dataset.done = 1; open = []; pairs++; Pr.textContent = pairs + '/8'; beep(880,.1,'triangle',.08); beep(1100,.1,'triangle',.06,0,.08);
        if (pairs === 8) setTimeout(() => ctx.over('memory', moves, deal, {lower:true, title:'All matched!', fmt: v => v + ' moves'}), 400); }
      else { lock = true; setTimeout(() => { a.style.transform = b.style.transform = ''; open = []; lock = false; }, 750); }
    }
    root.querySelector('#mmN').onclick = deal;
    deal();
  }
});

GAMES.push({
  id:'tictactoe', title:'Tic Tac Toe', tag:'2D', cat:'Board', emoji:'❌', bg:'linear-gradient(135deg,#ff6b6b,#4ecdc4)',
  desc:'X versus O against an AI. Easy mode makes mistakes; Hard mode never loses.',
  bestLabel:'Wins',
  start(ctx){
    const root = ctx.dom();
    root.innerHTML = `<div class="stats"><button class="gbtn" data-l="0">Easy</button><button class="gbtn on" data-l="1">Hard</button></div><div class="stats"><div class="stat"><small>YOU</small><span id="tW">0</span></div><div class="stat"><small>DRAW</small><span id="tD">0</span></div><div class="stat"><small>AI</small><span id="tL">0</span></div></div><div id="tB" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px"></div><div id="tMsg" style="height:24px;font-weight:700"></div>`;
    const Bd = root.querySelector('#tB'), msg = root.querySelector('#tMsg');
    const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    let b, over, hard = true, rec = {w: Store.get('best_tictactoe', 0), d:0, l:0}, youStart = true;
    const win = s => { for (const [a,c,d] of LINES) if (s[a] && s[a]===s[c] && s[a]===s[d]) return {p:s[a], line:[a,c,d]}; return s.every(Boolean) ? {p:'draw'} : null; };
    function mm(s, me){ const w = win(s); if (w) return w.p === 'O' ? 10 : w.p === 'X' ? -10 : 0; let best = me ? -99 : 99; for (let i=0;i<9;i++) if (!s[i]){ s[i] = me ? 'O' : 'X'; const v = mm(s, !me); s[i] = null; best = me ? Math.max(best, v) : Math.min(best, v); } return best; }
    function ai(){ const free = b.map((v,i) => v ? null : i).filter(i => i !== null); if (!hard && Math.random() < 0.45) return free[randi(0, free.length-1)]; let bi = free[0], bv = -99; for (const i of free){ b[i] = 'O'; const v = mm(b, false); b[i] = null; if (v > bv){ bv = v; bi = i; } } return bi; }
    const cells = [];
    const size = Math.floor(Math.min(ctx.el.clientWidth - 60, ctx.el.clientHeight - 260, 330)/3);
    for (let i=0;i<9;i++){ const c = document.createElement('button'); c.style.cssText = `width:${size}px;height:${size}px;border-radius:14px;border:0;background:#262140;color:#fff;font-size:${size*.55}px;font-weight:700;transition:background .2s`; c.onclick = () => play(i); Bd.appendChild(c); cells.push(c); }
    function render(line){ cells.forEach((c,i) => { c.textContent = b[i] || ''; c.style.color = b[i] === 'X' ? '#ff6b6b' : '#4ecdc4'; c.style.background = line && line.includes(i) ? '#3d3566' : '#262140'; }); root.querySelector('#tW').textContent = rec.w; root.querySelector('#tD').textContent = rec.d; root.querySelector('#tL').textContent = rec.l; }
    function finish(w){
      over = true;
      if (w.p === 'X'){ rec.w++; Store.set('best_tictactoe', rec.w); msg.textContent = 'You win! 🎉'; [523,659,784].forEach((f,i)=>beep(f,.12,'triangle',.08,0,i*.08)); }
      else if (w.p === 'O'){ rec.l++; msg.textContent = 'AI wins'; beep(200,.3,'sawtooth',.06,-80); }
      else { rec.d++; msg.textContent = "It's a draw"; beep(400,.15,'sine',.06); }
      render(w.line); setTimeout(newGame, 1600);
    }
    function play(i){ audioInit(); if (over || b[i]) return; b[i] = 'X'; beep(600,.05,'square',.05); render(); let w = win(b); if (w) return finish(w); over = true; setTimeout(() => { over = false; b[ai()] = 'O'; beep(400,.05,'square',.05); render(); const w2 = win(b); if (w2) finish(w2); }, 300); }
    function newGame(){ b = Array(9).fill(null); over = false; const aiFirst = !youStart; youStart = !youStart; if (aiFirst) b[[0,2,4,6,8][randi(0,4)]] = 'O'; msg.textContent = aiFirst ? 'AI went first — your move (X)' : 'Your move (X)'; render(); }
    root.querySelectorAll('[data-l]').forEach(x => x.onclick = () => { hard = x.dataset.l === '1'; root.querySelectorAll('[data-l]').forEach(y => y.classList.toggle('on', y === x)); newGame(); });
    newGame();
  }
});

GAMES.push({
  id:'fourrow', title:'Four in a Row', tag:'2D', cat:'Board', emoji:'🔴', bg:'linear-gradient(135deg,#ffd23f,#3a7bd5)',
  desc:'Drop discs and line up four before the AI does — across, down or diagonal.',
  bestLabel:'Wins',
  start(ctx){
    const root = ctx.dom();
    const CW = Math.floor(Math.min((ctx.el.clientWidth - 50)/7, (ctx.el.clientHeight - 200)/6, 70));
    root.innerHTML = `<div class="stats"><div class="stat"><small>YOU</small><span id="fW">0</span></div><div class="stat"><small>AI</small><span id="fL">0</span></div></div><canvas id="fC" width="${7*CW*2}" height="${6*CW*2}" style="width:${7*CW}px;height:${6*CW}px;border-radius:14px;cursor:pointer;touch-action:manipulation"></canvas><div id="fMsg" style="height:24px;font-weight:700">Your turn — you're 🟡</div>`;
    const cv = root.querySelector('#fC'), g = cv.getContext('2d'), msg = root.querySelector('#fMsg');
    g.scale(2,2);
    let B, turn, over, hover = 3, drops = [], winLine = null, wins = Store.get('best_fourrow', 0), losses = 0;
    const R = 6, C = 7;
    const reset = () => { B = [...Array(R)].map(() => Array(C).fill(0)); turn = 1; over = false; winLine = null; drops = []; msg.textContent = "Your turn — you're 🟡"; };
    const rowFor = (b, c) => { for (let r=R-1;r>=0;r--) if (!b[r][c]) return r; return -1; };
    function lineAt(b, p){ for (let r=0;r<R;r++) for (let c=0;c<C;c++) for (const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){ const pts = []; for (let k=0;k<4;k++){ const rr = r+dr*k, cc = c+dc*k; if (rr<0||rr>=R||cc<0||cc>=C||b[rr][cc]!==p) break; pts.push([rr,cc]); } if (pts.length===4) return pts; } return null; }
    function score(b){ let s = 0; for (let r=0;r<R;r++) if (b[r][3]===2) s += 3; else if (b[r][3]===1) s -= 3;
      for (let r=0;r<R;r++) for (let c=0;c<C;c++) for (const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){ let a = 0, h = 0, e = 0; for (let k=0;k<4;k++){ const rr = r+dr*k, cc = c+dc*k; if (rr<0||rr>=R||cc<0||cc>=C){ a = -1; break; } const v = b[rr][cc]; if (v===2) a++; else if (v===1) h++; else e++; } if (a < 0) continue; if (a && !h) s += a===3 ? 6 : a===2 ? 2 : 0; if (h && !a) s -= h===3 ? 8 : h===2 ? 2 : 0; } return s; }
    function negamax(b, d, al, be, p){
      if (lineAt(b, 3-p)) return -100000 - d;
      const moves = [3,2,4,1,5,0,6].filter(c => rowFor(b,c) >= 0);
      if (!moves.length) return 0;
      if (d === 0) return (p === 2 ? 1 : -1) * score(b);
      let best = -Infinity;
      for (const c of moves){ const r = rowFor(b,c); b[r][c] = p; const v = -negamax(b, d-1, -be, -al, 3-p); b[r][c] = 0; if (v > best) best = v; if (v > al) al = v; if (al >= be) break; }
      return best;
    }
    function aiMove(){ let bc = 3, bv = -Infinity; for (const c of [3,2,4,1,5,0,6]){ const r = rowFor(B,c); if (r < 0) continue; B[r][c] = 2; const v = -negamax(B, 4, -Infinity, Infinity, 1) + rand(0, 0.5); B[r][c] = 0; if (v > bv){ bv = v; bc = c; } } return bc; }
    function drop(c, p){
      const r = rowFor(B, c); if (r < 0) return false;
      B[r][c] = p; drops.push({c, r, y: -0.5, p}); beep(p===1 ? 520 : 380, .06, 'triangle', .07);
      const l = lineAt(B, p);
      if (l){ over = true; winLine = l; if (p===1){ wins++; Store.set('best_fourrow', wins); msg.textContent = 'You win! 🎉'; [523,659,784,1047].forEach((f,i)=>beep(f,.15,'triangle',.08,0,i*.1)); } else { losses++; msg.textContent = 'AI wins this one'; beep(200,.4,'sawtooth',.07,-80); } setTimeout(reset, 2200); }
      else if (B.every(row => row.every(Boolean))){ over = true; msg.textContent = 'Draw'; setTimeout(reset, 2000); }
      return true;
    }
    cv.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); hover = clamp(Math.floor((e.clientX - r.left)/CW), 0, 6); });
    cv.addEventListener('click', e => {
      audioInit(); if (over || turn !== 1) return;
      const r = cv.getBoundingClientRect(), c = clamp(Math.floor((e.clientX - r.left)/CW), 0, 6);
      if (!drop(c, 1) || over) return;
      turn = 2; msg.textContent = 'AI is thinking…';
      setTimeout(() => { if (!ctx.alive) return; drop(aiMove(), 2); turn = 1; if (!over) msg.textContent = 'Your turn'; }, 350);
    });
    reset();
    ctx.loop(dt => {
      root.querySelector('#fW').textContent = wins; root.querySelector('#fL').textContent = losses;
      g.fillStyle = '#2a4fbf'; g.fillRect(0,0,C*CW,R*CW);
      if (!over && turn === 1){ g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(hover*CW, 0, CW, R*CW); }
      drops.forEach(d => { d.y = Math.min(d.r, d.y + dt*14); });
      for (let r=0;r<R;r++) for (let c=0;c<C;c++){
        const anim = drops.find(d => d.c===c && d.r===r && d.y < d.r);
        g.fillStyle = '#121a3a'; g.beginPath(); g.arc(c*CW+CW/2, r*CW+CW/2, CW*0.38, 0, 7); g.fill();
        if (B[r][c] && !anim){ g.fillStyle = B[r][c]===1 ? '#ffd23f' : '#ff4d6d'; g.beginPath(); g.arc(c*CW+CW/2, r*CW+CW/2, CW*0.38, 0, 7); g.fill(); }
      }
      drops.filter(d => d.y < d.r).forEach(d => { g.fillStyle = d.p===1 ? '#ffd23f' : '#ff4d6d'; g.beginPath(); g.arc(d.c*CW+CW/2, d.y*CW+CW/2, CW*0.38, 0, 7); g.fill(); });
      if (winLine){ g.strokeStyle = '#fff'; g.lineWidth = 4; winLine.forEach(([r,c]) => { g.beginPath(); g.arc(c*CW+CW/2, r*CW+CW/2, CW*0.4, 0, 7); g.stroke(); }); }
    });
  }
});

GAMES.push({
  id:'sudoku', title:'Sudoku', tag:'2D', cat:'Puzzle', emoji:'9️⃣', bg:'linear-gradient(135deg,#3a6186,#89253e)',
  desc:'Fresh puzzles every time with a unique solution. Three difficulty levels and mistake highlighting.',
  bestLabel:'Best', fmt: v => Math.floor(v/60)+':'+String(v%60).padStart(2,'0'),
  start(ctx){
    const root = ctx.dom();
    const S = Math.floor(Math.min(ctx.el.clientWidth - 30, ctx.el.clientHeight - 260, 450)/9);
    root.innerHTML = `<div class="stats"><button class="gbtn on" data-l="38">Easy</button><button class="gbtn" data-l="30">Medium</button><button class="gbtn" data-l="25">Hard</button><div class="stat" style="min-width:60px"><small>TIME</small><span id="sdT">0:00</span></div></div><div id="sdB" style="display:grid;grid-template-columns:repeat(9,${S}px);background:#d9d4f0;gap:1px;border:3px solid #d9d4f0;border-radius:6px"></div><div id="sdP" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;max-width:${S*9+40}px"></div>`;
    const Bd = root.querySelector('#sdB'), P = root.querySelector('#sdP'), Tm = root.querySelector('#sdT');
    let sol, puz, cur, sel = -1, t0, done = false, givens = 38;
    const box = i => Math.floor(Math.floor(i/9)/3)*3 + Math.floor((i%9)/3);
    const ok = (g, i, n) => { const r = Math.floor(i/9), c = i%9; for (let k=0;k<9;k++){ if (g[r*9+k]===n || g[k*9+c]===n) return false; } const br = r - r%3, bc = c - c%3; for (let y=0;y<3;y++) for (let x=0;x<3;x++) if (g[(br+y)*9+bc+x]===n) return false; return true; };
    function fill(g){ const i = g.indexOf(0); if (i < 0) return true; for (const n of [1,2,3,4,5,6,7,8,9].sort(() => Math.random()-.5)){ if (ok(g,i,n)){ g[i] = n; if (fill(g)) return true; g[i] = 0; } } return false; }
    function count(g, lim){ const i = g.indexOf(0); if (i < 0) return 1; let n = 0; for (let v=1;v<=9 && n<lim;v++) if (ok(g,i,v)){ g[i] = v; n += count(g, lim-n); g[i] = 0; } return n; }
    function gen(){
      sol = Array(81).fill(0); fill(sol); puz = [...sol];
      const order = [...Array(81).keys()].sort(() => Math.random()-.5); let filled = 81;
      for (const i of order){ if (filled <= givens) break; const b = puz[i]; puz[i] = 0; if (count([...puz], 2) !== 1) puz[i] = b; else filled--; }
      cur = [...puz]; sel = -1; t0 = performance.now(); done = false; render();
    }
    const cells = [];
    for (let i=0;i<81;i++){ const d = document.createElement('div'); const r = Math.floor(i/9), c = i%9; d.style.cssText = `width:${S}px;height:${S}px;display:flex;align-items:center;justify-content:center;font-size:${S*.55}px;font-weight:700;cursor:pointer;${c%3===2&&c<8?'margin-right:2px;':''}${r%3===2&&r<8?'margin-bottom:2px;':''}`; d.onclick = () => { sel = i; render(); }; Bd.appendChild(d); cells.push(d); }
    for (let n=1;n<=10;n++){ const b = document.createElement('button'); b.className = 'gbtn'; b.style.cssText = `width:${Math.max(38, S)}px;height:${Math.max(38,S)}px;padding:0;font-size:18px`; b.textContent = n === 10 ? '⌫' : n; b.onclick = () => put(n === 10 ? 0 : n); P.appendChild(b); }
    function put(n){
      audioInit();
      if (sel < 0 || puz[sel] || done) return;
      cur[sel] = n; beep(n ? 420 + n*30 : 200, .04, 'sine', .05);
      if (n && n !== sol[sel]) beep(150, .12, 'sawtooth', .05);
      render();
      if (cur.every((v,i) => v === sol[i])){ done = true; const s = Math.round((performance.now()-t0)/1000); [523,659,784,1047].forEach((f,i)=>beep(f,.15,'triangle',.08,0,i*.1)); ctx.over('sudoku', s, gen, {lower:true, title:'Solved!', fmt: v => Math.floor(v/60)+':'+String(v%60).padStart(2,'0'), button:'New puzzle'}); }
    }
    function render(){
      const sv = sel >= 0 ? cur[sel] : 0;
      cells.forEach((d, i) => {
        const same = sel >= 0 && (Math.floor(i/9) === Math.floor(sel/9) || i%9 === sel%9 || box(i) === box(sel));
        d.textContent = cur[i] || '';
        d.style.background = i === sel ? '#7b6cf6' : (sv && cur[i] === sv) ? '#4a3f8f' : same ? '#2e2850' : '#1d1930';
        d.style.color = puz[i] ? '#eef0ff' : cur[i] && cur[i] !== sol[i] ? '#ff5d73' : '#8fd3ff';
      });
    }
    ctx.on(window, 'keydown', e => {
      if (/^Digit[1-9]$/.test(e.code)) put(+e.code.slice(5)); else if (e.code === 'Backspace' || e.code === 'Delete') put(0);
      const mv = {ArrowUp:-9, ArrowDown:9, ArrowLeft:-1, ArrowRight:1}[e.code]; if (mv){ e.preventDefault(); sel = clamp((sel < 0 ? 40 : sel) + mv, 0, 80); render(); }
    });
    root.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { givens = +b.dataset.l; root.querySelectorAll('[data-l]').forEach(x => x.classList.toggle('on', x === b)); gen(); });
    gen();
    ctx.loop(() => { if (!done){ const s = Math.floor((performance.now()-t0)/1000); Tm.textContent = Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); } });
  }
});

GAMES.push({
  id:'fiveletters', title:'Five Letters', tag:'2D', cat:'Puzzle', emoji:'🟩', bg:'linear-gradient(135deg,#538d4e,#b59f3b)',
  desc:'Guess the hidden five-letter word in six tries. Colors tell you how close you are.',
  bestLabel:'Streak',
  start(ctx){
    const WORDS = 'about above actor adapt admit adult after again agent agree ahead alarm album alert alike alive allow alone along alter amber angel anger angle angry apart apple apply arena argue arise armor aside asset audio avoid award aware badge baker basic beach beard beast begin being below bench berry birth black blade blame blank blast blaze blend bless blind block bloom board boast bonus boost booth brain brake brand brave bread break brick bride brief bring broad brook brown brush build bunch burst cabin cable camel canal candy cargo carry catch cause chain chair chalk charm chart chase cheap check cheek cheer chess chest chief child chill choir civic claim class clean clear clerk click cliff climb clock close cloth cloud coach coast coral couch count court cover craft crane crash cream creek crisp crowd crown crust curve cycle daily dairy dance delay depth diary dizzy dough draft drama dream dress drift drink drive eager eagle early earth eight elbow elder empty enjoy enter equal error essay event exact exist extra fable faith false fancy feast fence fever field fifty fight final flame flash fleet float flock flood floor flour fluid flute focus force forge forum frame fresh front frost fruit funny gauge ghost giant glass globe glory glove grace grade grain grand grape grass great green greet grief grill group guard guess guest guide habit happy harsh heart heavy hedge hello hobby honey horse hotel house human humor hurry ideal image index inner input issue ivory jelly jewel joint judge juice knife knock label large laser later laugh layer learn lemon level light limit linen liver local lodge logic loose lucky lunar lunch magic major maple march match mayor medal melon mercy metal meter minor mixer model money month moral motor mount mouse mouth movie music naval nerve never night noble noise north novel nurse ocean offer olive onion opera orbit order other outer owner paint panel paper party pasta patch peace peach pearl pedal piano piece pilot pinch pizza place plain plane plant plate plaza point polar porch pound power press price pride prime print prize proof proud pulse punch pupil queen quest quick quiet quilt quote radar radio raise rally ranch range rapid raven reach react ready realm relax reply ridge rifle right rival river roast robin robot rocky rough round route royal ruler rural salad sauce scale scarf scene scent scout screw shade shake shape share shark sharp sheep shelf shell shift shine shirt shock shore short shout sight skill skirt slate sleep slice slide slope smart smile smoke snack snake solar solid solve sound south space spark speak speed spice spike spine spoon sport spray squad stack staff stage stair stamp stand stare start state steam steel steep stick still stone storm story stove straw strip study style sugar suite sunny super swamp sweet swift sword table taste teach thick thing think thorn three throw thumb tiger timer toast token topic torch total touch tower trace track trade trail train treat trend trial tribe trick truck trust truth tulip twist uncle under unity upper urban usual value vapor vault venue verse video vigor viral visit vital vivid vocal voice wagon waste watch water whale wheat wheel while whirl white whole world worry worth wound wrist yacht yield young youth zebra'.split(' ');
    const root = ctx.dom('gap:10px');
    const T = Math.floor(Math.min((ctx.el.clientWidth - 60)/5, (ctx.el.clientHeight - 300)/6, 62));
    root.innerHTML = `<div id="wlMsg" style="height:22px;font-weight:700"></div><div id="wlB" style="display:grid;grid-template-columns:repeat(5,${T}px);gap:6px"></div><div id="wlK" style="display:flex;flex-direction:column;gap:6px;align-items:center;width:100%;max-width:520px"></div>`;
    const Bd = root.querySelector('#wlB'), K = root.querySelector('#wlK'), msg = root.querySelector('#wlMsg');
    let answer, row, guess, done, keyState = {}, streak = Store.get('wl_streak', 0);
    const tiles = [];
    for (let i=0;i<30;i++){ const d = document.createElement('div'); d.style.cssText = `width:${T}px;height:${T}px;border:2px solid #3a3a4c;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:${T*.5}px;font-weight:700;text-transform:uppercase;transition:transform .25s,background .25s`; Bd.appendChild(d); tiles.push(d); }
    const keyEls = {};
    ['qwertyuiop','asdfghjkl','⏎zxcvbnm⌫'].forEach(r => { const rw = document.createElement('div'); rw.style.cssText = 'display:flex;gap:5px;width:100%;justify-content:center'; [...r].forEach(ch => { const b = document.createElement('button'); b.className = 'gbtn'; b.style.cssText = `flex:${ch==='⏎'||ch==='⌫'?1.5:1};max-width:${ch==='⏎'||ch==='⌫'?64:44}px;height:50px;padding:0;border-radius:8px;text-transform:uppercase;font-size:15px`; b.textContent = ch; b.onclick = () => key(ch === '⏎' ? 'Enter' : ch === '⌫' ? 'Backspace' : ch); rw.appendChild(b); keyEls[ch] = b; }); K.appendChild(rw); });
    const COLORS = {2:'#538d4e', 1:'#b59f3b', 0:'#3a3a4c'};
    function newGame(){ answer = WORDS[randi(0, WORDS.length-1)]; row = 0; guess = ''; done = false; keyState = {}; tiles.forEach(t => { t.textContent = ''; t.style.background = 'transparent'; t.style.borderColor = '#3a3a4c'; }); Object.values(keyEls).forEach(b => b.style.background = ''); msg.textContent = 'Streak ' + streak; }
    function draw(){ for (let i=0;i<5;i++){ const t = tiles[row*5+i]; t.textContent = guess[i] || ''; t.style.borderColor = guess[i] ? '#7a7a96' : '#3a3a4c'; } }
    function key(k){
      audioInit(); if (done) return;
      if (k === 'Enter'){
        if (guess.length < 5){ msg.textContent = 'Not enough letters'; beep(150,.1,'square',.05); return; }
        const res = Array(5).fill(0), left = {};
        for (let i=0;i<5;i++){ if (guess[i] === answer[i]) res[i] = 2; else left[answer[i]] = (left[answer[i]]||0) + 1; }
        for (let i=0;i<5;i++) if (res[i] !== 2 && left[guess[i]]){ res[i] = 1; left[guess[i]]--; }
        res.forEach((r, i) => { const t = tiles[row*5+i]; setTimeout(() => { t.style.transform = 'rotateX(90deg)'; setTimeout(() => { t.style.background = COLORS[r]; t.style.borderColor = COLORS[r]; t.style.transform = ''; beep(300 + r*200, .06, 'sine', .05); }, 120); }, i*150);
          const ch = guess[i]; if ((keyState[ch] ?? -1) < r){ keyState[ch] = r; setTimeout(() => keyEls[ch].style.background = COLORS[r], 900); } });
        const g = guess; guess = ''; row++;
        if (g === answer){ done = true; streak++; Store.set('wl_streak', streak); Store.best('fiveletters', streak); setTimeout(() => ctx.over('fiveletters', streak, newGame, {title:['Genius!','Magnificent!','Impressive!','Splendid!','Great!','Phew!'][row-1], button:'Next word', extra:'solved in ' + row}), 1100); }
        else if (row === 6){ done = true; streak = 0; Store.set('wl_streak', 0); setTimeout(() => ctx.intro('The word was', `<div class="big" style="text-transform:uppercase;letter-spacing:4px">${answer}</div>`, newGame, 'Next word'), 1100); }
        return;
      }
      if (k === 'Backspace'){ guess = guess.slice(0, -1); draw(); return; }
      if (/^[a-z]$/.test(k) && guess.length < 5){ guess += k; draw(); beep(500,.02,'sine',.03); }
    }
    ctx.on(window, 'keydown', e => { if (e.key === 'Enter' || e.key === 'Backspace') { e.preventDefault(); key(e.key); } else if (/^[a-zA-Z]$/.test(e.key)) key(e.key.toLowerCase()); });
    newGame();
  }
});

GAMES.push({
  id:'slide15', title:'Slide Puzzle', tag:'2D', cat:'Puzzle', emoji:'🧩', bg:'linear-gradient(135deg,#43cea2,#185a9d)',
  desc:'The classic 15-puzzle. Slide the tiles back into order in as few moves as you can.',
  bestLabel:'Fewest moves',
  start(ctx){
    const root = ctx.dom();
    const S = Math.floor(Math.min(ctx.el.clientWidth - 40, ctx.el.clientHeight - 220, 400)/4);
    root.innerHTML = `<div class="stats"><div class="stat"><small>MOVES</small><span id="spM">0</span></div><div class="stat"><small>TIME</small><span id="spT">0</span></div><button class="gbtn" id="spN">Shuffle</button></div><div id="spB" style="position:relative;width:${S*4+6}px;height:${S*4+6}px;background:#1d1930;border-radius:12px"></div>`;
    const Bd = root.querySelector('#spB'), Mv = root.querySelector('#spM'), Tm = root.querySelector('#spT');
    let a, moves, t0, done, started;
    const els = [];
    for (let n=1;n<16;n++){ const d = document.createElement('div'); d.style.cssText = `position:absolute;width:${S-6}px;height:${S-6}px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:${S*.38}px;font-weight:700;cursor:pointer;transition:left .12s,top .12s;background:hsl(${170+n*8},60%,45%);box-shadow:inset 0 -4px 0 rgba(0,0,0,.2)`; d.textContent = n; d.onclick = () => tap(n); Bd.appendChild(d); els[n] = d; }
    function render(){ a.forEach((n, i) => { if (n) { els[n].style.left = (6 + (i%4)*S)+'px'; els[n].style.top = (6 + Math.floor(i/4)*S)+'px'; } }); Mv.textContent = moves; }
    function shuffle(){ a = [...Array(15).keys()].map(i => i+1).concat(0); let e = 15, last = -1; for (let k=0;k<300;k++){ const nb = [e-4, e+4, e%4 ? e-1 : -1, e%4 < 3 ? e+1 : -1].filter(x => x >= 0 && x < 16 && x !== last); const j = nb[randi(0, nb.length-1)]; a[e] = a[j]; a[j] = 0; last = e; e = j; } moves = 0; done = false; started = false; Tm.textContent = 0; render(); }
    function slideAt(i){ const e = a.indexOf(0); const r = Math.floor(i/4), c = i%4, er = Math.floor(e/4), ec = e%4; if (Math.abs(r-er) + Math.abs(c-ec) !== 1) return false; a[e] = a[i]; a[i] = 0; moves++; if (!started){ started = true; t0 = performance.now(); } beep(380,.03,'triangle',.05); render(); check(); return true; }
    function tap(n){ audioInit(); if (done) return; const i = a.indexOf(n), e = a.indexOf(0); // slide whole row/col
      if (Math.floor(i/4) === Math.floor(e/4) || i%4 === e%4){ const step = Math.floor(i/4) === Math.floor(e/4) ? (i > e ? 1 : -1) : (i > e ? 4 : -4); let cur = e; while (cur !== i){ slideAt(cur + step); cur += step; } } }
    function check(){ if (a.slice(0,15).every((n,i) => n === i+1)){ done = true; [523,659,784,1047].forEach((f,i)=>beep(f,.15,'triangle',.08,0,i*.1)); setTimeout(() => ctx.over('slide15', moves, shuffle, {lower:true, title:'Solved!', fmt: v => v + ' moves', extra: Math.round((performance.now()-t0)/1000)+'s'}), 300); } }
    ctx.on(window, 'keydown', e => { const e0 = a.indexOf(0); const m = {ArrowUp:4, ArrowDown:-4, ArrowLeft:1, ArrowRight:-1}[e.code]; if (m && !done){ e.preventDefault(); const j = e0 + m; if (j >= 0 && j < 16 && !(Math.abs(m) === 1 && Math.floor(j/4) !== Math.floor(e0/4))) slideAt(j); } });
    root.querySelector('#spN').onclick = shuffle;
    shuffle();
    ctx.loop(() => { if (started && !done) Tm.textContent = Math.floor((performance.now()-t0)/1000); });
  }
});

GAMES.push({
  id:'echopads', title:'Echo Pads', tag:'2D', cat:'Skill', emoji:'🎵', bg:'linear-gradient(135deg,#f953c6,#b91d73)',
  desc:'Watch the pads light up, then play the pattern back. One more note every round.',
  start(ctx){
    const root = ctx.dom();
    const S = Math.floor(Math.min(ctx.el.clientWidth - 60, ctx.el.clientHeight - 200, 380)/2);
    root.innerHTML = `<div class="stats"><div class="stat"><small>ROUND</small><span id="epR">0</span></div><div class="stat"><small>BEST</small><span id="epB">${Store.get('best_echopads',0)}</span></div></div><div id="epG" style="display:grid;grid-template-columns:repeat(2,${S}px);gap:12px"></div><div id="epMsg" style="height:22px;font-weight:700"></div>`;
    const G = root.querySelector('#epG'), msg = root.querySelector('#epMsg');
    const PADS = [['#2ecc71',330],['#e74c3c',392],['#f1c40f',494],['#3498db',587]];
    const pads = PADS.map(([col, f], i) => { const d = document.createElement('button'); d.style.cssText = `width:${S}px;height:${S}px;border:0;border-radius:${['80px 18px 18px 18px','18px 80px 18px 18px','18px 18px 18px 80px','18px 18px 80px 18px'][i]};background:${col};opacity:.4;transition:opacity .1s,transform .1s`; d.onclick = () => press(i); G.appendChild(d); return d; });
    let seq = [], pos = 0, input = false;
    const light = (i, ms=300) => { pads[i].style.opacity = 1; pads[i].style.transform = 'scale(.97)'; beep(PADS[i][1], ms/1000, 'triangle', .14); setTimeout(() => { pads[i].style.opacity = .4; pads[i].style.transform = ''; }, ms); };
    function playSeq(){ input = false; msg.textContent = 'Watch…'; root.querySelector('#epR').textContent = seq.length; const gap = Math.max(250, 600 - seq.length*25); seq.forEach((p, k) => setTimeout(() => ctx.alive && light(p, gap*0.7), 600 + k*gap)); setTimeout(() => { input = true; pos = 0; msg.textContent = 'Your turn'; }, 600 + seq.length*gap); }
    function next(){ seq.push(randi(0,3)); playSeq(); }
    function press(i){ audioInit(); if (!input) return; light(i, 200); if (i !== seq[pos]){ input = false; noise(.3,.15,0,300); beep(110,.5,'sawtooth',.1); const sc = seq.length - 1; ctx.over('echopads', sc, start, {extra:'rounds'}); root.querySelector('#epB').textContent = Store.get('best_echopads',0); return; } pos++; if (pos === seq.length){ input = false; msg.textContent = 'Nice!'; setTimeout(next, 700); } }
    function start(){ seq = []; next(); }
    ctx.intro('Echo Pads', '<p>The pads play a pattern. Repeat it in the same order. Each round adds one more note and plays a little faster.</p>', start);
  }
});
