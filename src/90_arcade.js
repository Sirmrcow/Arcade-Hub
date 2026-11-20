/* ===================== ARCADE PACK ===================== */
GAMES.push({
  id:'flutter', title:'Flutter', tag:'2D', cat:'Arcade', emoji:'🐦', bg:'linear-gradient(135deg,#4ec0ff,#ffe066)',
  desc:'Tap to flap through the gaps. Easy to learn, hard to put down.',
  start(ctx){
    const v = ctx.virtual(400, 640, '#0b0c18'), g = v.g, keys = ctx.keys(), GAP = 150, BX = 110;
    let b, pipes, score, t, state = 'menu', gx = 0, wing = 0;
    const reset = () => { b = {y:300, vy:0}; pipes = []; score = 0; t = 0.8; state = 'play'; };
    const flap = () => { if (state !== 'play') return; b.vy = -380; wing = 1; beep(700,.06,'triangle',.06,200); };
    const die = () => { if (state !== 'play') return; state = 'over'; noise(.2,.12,0,500); beep(200,.3,'sawtooth',.08,-100); ctx.over('flutter', score, reset); };
    ctx.on(v.cv, 'pointerdown', e => { e.preventDefault(); flap(); });
    ctx.intro('Flutter', `<p>Flap through the gaps between the pillars. One touch and it's over.</p><div class="keys">${isTouch?'Tap to flap':'Space, ↑ or click to flap'}</div>`, reset);
    b = {y:300, vy:0}; pipes = [];
    ctx.loop((dt, time) => {
      if (state === 'play'){
        if (keys.hit('Space') || keys.hit('ArrowUp')) flap();
        b.vy = Math.min(b.vy + 1250*dt, 700); b.y += b.vy*dt; gx = (gx + 150*dt) % 24;
        t -= dt; if (t <= 0){ t = 1.45; pipes.push({x:420, gap:rand(150, 430), passed:false}); }
        for (const p of pipes){
          p.x -= 150*dt;
          if (!p.passed && p.x + 64 < BX){ p.passed = true; score++; beep(880,.08,'sine',.08); }
          if (BX+13 > p.x && BX-13 < p.x+64 && (b.y-13 < p.gap-GAP/2 || b.y+13 > p.gap+GAP/2)) die();
        }
        pipes = pipes.filter(p => p.x > -80);
        if (b.y > 640-70-13 || b.y < -40) die();
      } else if (state === 'menu') b.y = 300 + Math.sin(time*3)*12;
      wing = Math.max(0, wing - dt*5);
      v.begin();
      const sky = g.createLinearGradient(0,0,0,640); sky.addColorStop(0,'#5ec8ff'); sky.addColorStop(1,'#c9f0ff'); g.fillStyle = sky; g.fillRect(0,0,400,640);
      g.fillStyle = 'rgba(255,255,255,.7)'; [[60,120],[250,80],[330,200]].forEach(([x,y],i) => { const cx = ((x - time*(8+i*4)) % 480 + 480) % 480 - 40; g.beginPath(); g.arc(cx,y,22,0,7); g.arc(cx+24,y-8,26,0,7); g.arc(cx+50,y,20,0,7); g.fill(); });
      for (const p of pipes){
        g.fillStyle = '#3fb24f'; g.fillRect(p.x, 0, 64, p.gap-GAP/2); g.fillRect(p.x, p.gap+GAP/2, 64, 640);
        g.fillStyle = '#2f8f3c'; g.fillRect(p.x-4, p.gap-GAP/2-22, 72, 22); g.fillRect(p.x-4, p.gap+GAP/2, 72, 22);
        g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(p.x+8, 0, 6, p.gap-GAP/2-22); g.fillRect(p.x+8, p.gap+GAP/2+22, 6, 640);
      }
      g.fillStyle = '#e2c27a'; g.fillRect(0, 570, 400, 70); g.fillStyle = '#7bc04a'; g.fillRect(0, 570, 400, 12);
      g.fillStyle = '#c9a65e'; for (let x = -gx; x < 400; x += 24) g.fillRect(x, 590, 12, 4);
      g.save(); g.translate(BX, b.y); g.rotate(clamp(b.vy/600, -0.5, 1.1));
      g.fillStyle = '#ffd23f'; g.beginPath(); g.ellipse(0,0,17,14,0,0,7); g.fill();
      g.fillStyle = '#ff9f1c'; g.beginPath(); g.moveTo(12,-2); g.lineTo(26,3); g.lineTo(12,8); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(6,-5,6,0,7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(8,-5,3,0,7); g.fill();
      g.fillStyle = '#f5b700'; g.beginPath(); g.ellipse(-5, 2 - wing*8, 9, 6, -0.3, 0, 7); g.fill();
      g.restore();
      if (state !== 'menu') v.text(score, 200, 80, 52, '#fff');
      v.end();
    });
  }
});

GAMES.push({
  id:'stackfall', title:'Stackfall', tag:'2D', cat:'Puzzle', emoji:'🟪', bg:'linear-gradient(135deg,#6a3df0,#21d4fd)',
  desc:'Falling-block puzzler. Rotate, slide and clear full lines before the stack hits the top.',
  start(ctx){
    const v = ctx.virtual(430, 640, '#0e0b1c'), g = v.g, keys = ctx.keys();
    const CW = 28, BX = 18, BY = 48, COLS = 10, ROWS = 20;
    const SHAPES = { I:[[1,1,1,1]], O:[[1,1],[1,1]], T:[[0,1,0],[1,1,1]], S:[[0,1,1],[1,1,0]], Z:[[1,1,0],[0,1,1]], J:[[1,0,0],[1,1,1]], L:[[0,0,1],[1,1,1]] };
    const COL = { I:'#4ad8ff', O:'#ffd23f', T:'#b56bff', S:'#5be37d', Z:'#ff4d6d', J:'#4a7dff', L:'#ff9a3d' };
    let board, cur, next, bag, score, lines, level, acc, state = 'menu', hold = {}, flash = [];
    const rot = m => m[0].map((_, i) => m.map(r => r[i]).reverse());
    function draw7(){ if (!bag || !bag.length){ bag = Object.keys(SHAPES).sort(() => Math.random()-.5); } return bag.pop(); }
    const mk = k => ({ k, m: SHAPES[k].map(r => [...r]), x: Math.floor((COLS - SHAPES[k][0].length)/2), y: 0 });
    function hit(m, x, y){ for (let r=0;r<m.length;r++) for (let c=0;c<m[r].length;c++) if (m[r][c]){ const X=x+c, Y=y+r; if (X<0||X>=COLS||Y>=ROWS) return true; if (Y>=0 && board[Y][X]) return true; } return false; }
    function spawn(){ cur = next; next = mk(draw7()); if (hit(cur.m, cur.x, cur.y)) end(); }
    function reset(){ board = [...Array(ROWS)].map(() => Array(COLS).fill(null)); bag = []; next = mk(draw7()); score = 0; lines = 0; level = 0; acc = 0; flash = []; state = 'play'; spawn(); }
    function end(){ state = 'over'; beep(150,.5,'sawtooth',.1,-80); ctx.over('stackfall', score, reset, {extra: lines + ' lines'}); }
    function lock(){
      cur.m.forEach((row, r) => row.forEach((c, cc) => { if (c && cur.y+r >= 0) board[cur.y+r][cur.x+cc] = COL[cur.k]; }));
      if (cur.m.some((row, r) => row.some(c => c) && cur.y + r < 0)) return end();
      let n = 0;
      for (let r = ROWS-1; r >= 0; r--){ if (board[r].every(Boolean)){ board.splice(r,1); board.unshift(Array(COLS).fill(null)); n++; flash.push({r, t:.3}); r++; } }
      if (n){ score += [0,100,300,500,800][n]*(level+1); lines += n; level = Math.floor(lines/10); [523,659,784,1047].slice(0,n).forEach((f,i)=>beep(f,.1,'square',.06,0,i*.05)); }
      else beep(160,.05,'triangle',.06);
      spawn();
    }
    const move = dx => { if (state==='play' && !hit(cur.m, cur.x+dx, cur.y)){ cur.x += dx; beep(300,.02,'sine',.03); } };
    const turn = () => { if (state!=='play') return; const m = rot(cur.m); for (const k of [0,-1,1,-2,2]) if (!hit(m, cur.x+k, cur.y)){ cur.m = m; cur.x += k; beep(420,.03,'sine',.04); return; } };
    const drop = () => { if (state!=='play') return; let d = 0; while (!hit(cur.m, cur.x, cur.y+1)){ cur.y++; d++; } score += d*2; lock(); };
    const fall = () => { if (!hit(cur.m, cur.x, cur.y+1)) cur.y++; else lock(); };
    // touch: drag sideways to move, flick down to drop, tap to rotate
    let px = null, py = 0, pt = 0, moved = false;
    ctx.on(v.cv, 'pointerdown', e => { audioInit(); px = e.clientX; py = e.clientY; pt = performance.now(); moved = false; });
    ctx.on(v.cv, 'pointermove', e => { if (px == null) return; const step = CW*v.sc*0.9; while (e.clientX - px > step){ move(1); px += step; moved = true; } while (px - e.clientX > step){ move(-1); px -= step; moved = true; } if (e.clientY - py > step*1.2 && state==='play'){ fall(); py += step; moved = true; } });
    ctx.on(v.cv, 'pointerup', e => { if (px == null) return; const dy = e.clientY - py, dtm = performance.now() - pt; if (!moved && Math.abs(dy) < 12) turn(); else if (dy > 60 && dtm < 250) drop(); px = null; });
    ctx.intro('Stackfall', `<p>Fit the falling pieces together. Fill a whole row to clear it. Speeds up every 10 lines.</p><div class="keys">${isTouch?'Tap rotate · Drag left/right move · Drag down soft drop · Flick down hard drop':'←/→ move · ↑ rotate · ↓ soft drop · Space hard drop'}</div>`, reset);
    board = [...Array(ROWS)].map(() => Array(COLS).fill(null));
    function cell(x, y, col, a=1){ g.globalAlpha = a; g.fillStyle = col; g.fillRect(x+1, y+1, CW-2, CW-2); g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(x+1, y+1, CW-2, 4); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x+1, y+CW-5, CW-2, 4); g.globalAlpha = 1; }
    ctx.loop(dt => {
      if (state === 'play'){
        for (const [code, dx] of [['ArrowLeft',-1],['ArrowRight',1],['KeyA',-1],['KeyD',1]]){
          if (keys.down(code)){ hold[code] = (hold[code] || 0) + dt; if (hold[code] === dt) move(dx); else if (hold[code] > 0.17){ hold[code] -= 0.05; move(dx); } } else hold[code] = 0;
        }
        if (keys.hit('ArrowUp') || keys.hit('KeyW') || keys.hit('KeyX')) turn();
        if (keys.hit('Space')) drop();
        acc += dt;
        const iv = (keys.down('ArrowDown') || keys.down('KeyS')) ? 0.04 : Math.max(0.06, 0.8*Math.pow(0.84, level));
        while (acc > iv && state === 'play'){ acc -= iv; fall(); if (iv === 0.04) score += 1; }
      }
      v.begin();
      g.fillStyle = '#17132b'; g.fillRect(BX, BY, COLS*CW, ROWS*CW);
      g.strokeStyle = 'rgba(255,255,255,.05)'; for (let i=0;i<=COLS;i++){ g.beginPath(); g.moveTo(BX+i*CW,BY); g.lineTo(BX+i*CW,BY+ROWS*CW); g.stroke(); } for (let i=0;i<=ROWS;i++){ g.beginPath(); g.moveTo(BX,BY+i*CW); g.lineTo(BX+COLS*CW,BY+i*CW); g.stroke(); }
      board.forEach((row, r) => row.forEach((c, cc) => c && cell(BX+cc*CW, BY+r*CW, c)));
      flash.forEach(f => { f.t -= dt; g.fillStyle = `rgba(255,255,255,${Math.max(0,f.t)*2})`; g.fillRect(BX, BY+f.r*CW, COLS*CW, CW); }); flash = flash.filter(f => f.t > 0);
      if (state === 'play' && cur){
        let gy = cur.y; while (!hit(cur.m, cur.x, gy+1)) gy++;
        cur.m.forEach((row, r) => row.forEach((c, cc) => { if (c){ if (gy+r >= 0){ g.strokeStyle = COL[cur.k]; g.globalAlpha = .45; g.strokeRect(BX+(cur.x+cc)*CW+2, BY+(gy+r)*CW+2, CW-4, CW-4); g.globalAlpha = 1; } if (cur.y+r >= 0) cell(BX+(cur.x+cc)*CW, BY+(cur.y+r)*CW, COL[cur.k]); } }));
      }
      g.strokeStyle = 'rgba(160,140,255,.6)'; g.lineWidth = 2; g.strokeRect(BX, BY, COLS*CW, ROWS*CW); g.lineWidth = 1;
      const sx = BX + COLS*CW + 16;
      v.text('NEXT', sx, BY+14, 13, '#9b93c9', 'left');
      if (next) next.m.forEach((row, r) => row.forEach((c, cc) => c && cell(sx + cc*CW*0.8, BY+28 + r*CW*0.8, COL[next.k])));
      [['SCORE', score], ['LINES', lines], ['LEVEL', level+1], ['BEST', Store.get('best_stackfall', 0)]].forEach(([k, val], i) => { v.text(k, sx, BY+140+i*62, 13, '#9b93c9', 'left'); v.text(val ?? 0, sx, BY+166+i*62, 24, '#fff', 'left'); });
      v.end();
    });
  }
});

GAMES.push({
  id:'paddleduel', title:'Paddle Duel', tag:'2D', cat:'Arcade', emoji:'🏓', bg:'linear-gradient(135deg,#111,#3ddc84)',
  desc:'Two paddles, one ball, an AI that gets sharper every point. First to 7.',
  start(ctx){
    const v = ctx.virtual(800, 500, '#05070a'), g = v.g, keys = ctx.keys(), PH = 90;
    let p1, p2, ball, s1, s2, state = 'menu', serveT = 0, trail = [];
    const serve = dir => { ball = {x:400, y:250, vx:dir*360, vy:rand(-160,160)}; serveT = 0.8; trail = []; };
    const reset = () => { p1 = 205; p2 = 205; s1 = 0; s2 = 0; state = 'play'; serve(Math.random()<.5?1:-1); };
    ctx.on(v.cv, 'pointermove', e => { if (state==='play') p1 = clamp(v.local(e).y - PH/2, 0, 500-PH); });
    ctx.on(v.cv, 'pointerdown', e => { if (state==='play') p1 = clamp(v.local(e).y - PH/2, 0, 500-PH); });
    ctx.intro('Paddle Duel', `<p>Keep the ball in play and sneak it past the AI. Hit with the paddle edge for sharper angles. First to 7 wins.</p><div class="keys">${isTouch?'Drag up and down':'Mouse or W/S / ↑/↓'}</div>`, reset);
    p1 = p2 = 205; ball = {x:400, y:250, vx:0, vy:0};
    ctx.loop(dt => {
      if (state === 'play'){
        if (keys.down('KeyW')||keys.down('ArrowUp')) p1 -= 520*dt;
        if (keys.down('KeyS')||keys.down('ArrowDown')) p1 += 520*dt;
        p1 = clamp(p1, 0, 500-PH);
        const aiSpeed = 300 + (s1+s2)*18, target = ball.vx > 0 ? ball.y - PH/2 + Math.sin(performance.now()/300)*20 : 205;
        p2 += clamp(target - p2, -aiSpeed*dt, aiSpeed*dt); p2 = clamp(p2, 0, 500-PH);
        if (serveT > 0) serveT -= dt;
        else {
          ball.x += ball.vx*dt; ball.y += ball.vy*dt;
          if (ball.y < 8){ ball.y = 8; ball.vy = Math.abs(ball.vy); beep(260,.03,'square',.04); }
          if (ball.y > 492){ ball.y = 492; ball.vy = -Math.abs(ball.vy); beep(260,.03,'square',.04); }
          const paddle = (px, py, dir) => {
            if ((dir < 0 ? ball.x - 8 < px + 12 && ball.x > px : ball.x + 8 > px && ball.x < px + 12) && ball.y > py - 8 && ball.y < py + PH + 8 && Math.sign(ball.vx) === dir){
              const off = (ball.y - (py + PH/2)) / (PH/2), sp = Math.min(Math.hypot(ball.vx, ball.vy)*1.06, 1100);
              ball.vx = -dir*sp*Math.cos(off*0.9); ball.vy = sp*Math.sin(off*0.9); ball.x = dir < 0 ? px + 20 : px - 8; beep(440,.05,'square',.06);
            }
          };
          paddle(24, p1, -1); paddle(764, p2, 1);
          if (ball.x < -20){ s2++; beep(180,.3,'sawtooth',.08,-80); serve(-1); }
          if (ball.x > 820){ s1++; [660,880].forEach((f,i)=>beep(f,.1,'sine',.08,0,i*.08)); serve(1); }
          if (s1 >= 7 || s2 >= 7){ state = 'over'; const won = s1 > s2; ctx.over('paddleduel', s1, reset, {title: won ? 'You win!' : 'AI wins', extra: `${s1}–${s2}`}); }
        }
        trail.push({x:ball.x, y:ball.y}); if (trail.length > 10) trail.shift();
      }
      v.begin();
      g.fillStyle = 'rgba(255,255,255,.12)'; for (let y = 10; y < 500; y += 30) g.fillRect(398, y, 4, 16);
      v.text(s1 ?? 0, 330, 80, 64, 'rgba(255,255,255,.35)'); v.text(s2 ?? 0, 470, 80, 64, 'rgba(255,255,255,.35)');
      g.fillStyle = '#3ddc84'; g.shadowColor = '#3ddc84'; g.shadowBlur = 16; g.fillRect(24, p1, 12, PH);
      g.fillStyle = '#ff4d6d'; g.shadowColor = '#ff4d6d'; g.fillRect(764, p2, 12, PH); g.shadowBlur = 0;
      trail.forEach((t,i) => { g.fillStyle = `rgba(255,255,255,${i/trail.length*.3})`; g.beginPath(); g.arc(t.x, t.y, 6*i/trail.length, 0, 7); g.fill(); });
      g.fillStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = 14; g.beginPath(); g.arc(ball.x, ball.y, 8, 0, 7); g.fill(); g.shadowBlur = 0;
      v.text('YOU', 60, 490, 12, 'rgba(255,255,255,.4)'); v.text('AI', 740, 490, 12, 'rgba(255,255,255,.4)');
      v.end();
    });
  }
});

GAMES.push({
  id:'starsiege', title:'Star Siege', tag:'2D', cat:'Arcade', emoji:'👾', bg:'linear-gradient(135deg,#0b0033,#00e5a0)',
  desc:'Rows of invaders march down. Shoot them all before they land. Each wave is faster.',
  start(ctx){
    const v = ctx.virtual(480, 640, '#03020c'), g = v.g, keys = ctx.keys();
    const SPR = [['00100100','00011000','00111100','01011010','11111111','10100101','00100100','01000010'],['00011000','00111100','01111110','11011011','11111111','00100100','01011010','10100101'],['01000010','00100100','01111110','11011011','11111111','10111101','10000001','01100110']];
    const ACOL = ['#ff4dd2','#4ad8ff','#7dff9b'];
    let ship, shots, bombs, aliens, dir, wave, lives, score, state = 'menu', cd = 0, frame = 0, ft = 0, stars = Array.from({length:60}, () => ({x:rand(0,480), y:rand(0,640), s:rand(20,80)})), boom = [], held = false, inv = 0;
    function buildWave(){ aliens = []; for (let r=0;r<5;r++) for (let c=0;c<8;c++) aliens.push({x:50 + c*48, y:70 + r*40 + Math.min(wave,5)*8, r, alive:true}); dir = 1; shots = []; bombs = []; }
    const reset = () => { ship = {x:240}; wave = 0; lives = 3; score = 0; inv = 0; state = 'play'; buildWave(); };
    const fire = () => { if (cd > 0 || shots.length >= 2) return; shots.push({x:ship.x, y:580}); cd = 0.28; beep(900,.06,'square',.04,-500); };
    const sprite = (s, x, y, col, px=3) => { g.fillStyle = col; s.forEach((row, r) => { for (let c=0;c<8;c++) if (row[c]==='1') g.fillRect(x + (c-4)*px, y + (r-4)*px, px, px); }); };
    const explode = (x, y, col) => { for (let i=0;i<12;i++){ const a = rand(0,7), s = rand(40,160); boom.push({x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, l:.5, col}); } };
    ctx.on(v.cv, 'pointerdown', e => { held = true; if (state==='play') ship.x = clamp(v.local(e).x, 20, 460); });
    ctx.on(v.cv, 'pointermove', e => { if (state==='play' && (held || e.pointerType==='mouse')) ship.x = clamp(v.local(e).x, 20, 460); });
    ctx.on(window, 'pointerup', () => held = false);
    ctx.intro('Star Siege', `<p>Blast the invaders before they reach the ground. Dodge their bombs. Every cleared wave starts lower and faster.</p><div class="keys">${isTouch?'Hold and drag to move — you fire automatically':'←/→ or mouse to move · Space or click to fire'}</div>`, reset);
    aliens = []; shots = []; bombs = []; ship = {x:240};
    ctx.loop(dt => {
      stars.forEach(s => { s.y += s.s*dt; if (s.y > 640){ s.y = 0; s.x = rand(0,480); } });
      if (state === 'play'){
        cd -= dt; inv -= dt;
        if (keys.down('ArrowLeft')||keys.down('KeyA')) ship.x -= 300*dt;
        if (keys.down('ArrowRight')||keys.down('KeyD')) ship.x += 300*dt;
        ship.x = clamp(ship.x, 20, 460);
        if (keys.down('Space') || held) fire();
        const alive = aliens.filter(a => a.alive);
        const speed = 22 + (40 - alive.length)*2.2 + wave*7;
        ft += dt; if (ft > 0.5 - Math.min(0.35, (40-alive.length)*0.008)){ ft = 0; frame ^= 1; }
        let edge = false;
        alive.forEach(a => { a.x += dir*speed*dt; if (a.x > 455 || a.x < 25) edge = true; });
        if (edge){ dir = -dir; alive.forEach(a => { a.y += 16; a.x += dir*2; }); }
        if (Math.random() < dt*(0.8 + wave*0.25) && alive.length){
          const cols = {}; alive.forEach(a => { const k = Math.round(a.x); if (!cols[k] || cols[k].y < a.y) cols[k] = a; });
          const shooters = Object.values(cols), s = shooters[randi(0, shooters.length-1)]; bombs.push({x:s.x, y:s.y+12});
        }
        shots.forEach(s => s.y -= 560*dt);
        bombs.forEach(b => b.y += (200 + wave*15)*dt);
        for (const s of shots) for (const a of alive) if (a.alive && Math.abs(s.x - a.x) < 14 && Math.abs(s.y - a.y) < 12){ a.alive = false; s.y = -99; score += (3 - a.r%3)*10 + 10; explode(a.x, a.y, ACOL[a.r%3]); beep(200,.08,'square',.05,-120); }
        for (const b of bombs) if (inv <= 0 && Math.abs(b.x - ship.x) < 18 && b.y > 578 && b.y < 606){ b.y = 999; lives--; inv = 1.5; explode(ship.x, 590, '#fff'); noise(.3,.15,0,300); if (lives <= 0){ state = 'over'; ctx.over('starsiege', score, reset, {extra:'wave '+(wave+1)}); } }
        shots = shots.filter(s => s.y > -10); bombs = bombs.filter(b => b.y < 650);
        if (alive.some(a => a.alive && a.y > 560)){ state = 'over'; ctx.over('starsiege', score, reset, {title:'They landed!', extra:'wave '+(wave+1)}); }
        if (!aliens.some(a => a.alive)){ wave++; score += 100; [523,659,784].forEach((f,i)=>beep(f,.12,'triangle',.08,0,i*.08)); buildWave(); }
      }
      v.begin();
      stars.forEach(s => { g.fillStyle = `rgba(255,255,255,${s.s/100})`; g.fillRect(s.x, s.y, 2, 2); });
      aliens.forEach(a => a.alive && sprite(SPR[(a.r + frame) % 3], a.x, a.y, ACOL[a.r%3]));
      if (state !== 'menu' && (inv <= 0 || Math.floor(inv*10)%2)){ g.fillStyle = '#7dffb2'; g.beginPath(); g.moveTo(ship.x, 574); g.lineTo(ship.x+18, 602); g.lineTo(ship.x-18, 602); g.closePath(); g.fill(); g.fillRect(ship.x-3, 568, 6, 10); }
      g.fillStyle = '#fff'; shots.forEach(s => g.fillRect(s.x-2, s.y-8, 4, 12));
      g.fillStyle = '#ff5566'; bombs.forEach(b => { g.fillRect(b.x-2, b.y-6, 4, 10); });
      boom.forEach(p => { p.x += p.vx*dt; p.y += p.vy*dt; p.l -= dt; g.globalAlpha = Math.max(0,p.l*2); g.fillStyle = p.col; g.fillRect(p.x-2, p.y-2, 4, 4); g.globalAlpha = 1; }); boom = boom.filter(p => p.l > 0);
      g.fillStyle = 'rgba(125,255,178,.4)'; g.fillRect(0, 612, 480, 2);
      v.text(`SCORE ${score ?? 0}`, 16, 34, 16, '#fff', 'left'); v.text('WAVE ' + ((wave ?? 0)+1), 240, 34, 16, '#fff'); v.text('♥'.repeat(Math.max(0, lives ?? 0)), 464, 34, 18, '#ff5566', 'right');
      v.end();
    });
  }
});

GAMES.push({
  id:'rockdrift', title:'Rock Drift', tag:'2D', cat:'Arcade', emoji:'☄️', bg:'linear-gradient(135deg,#232526,#ff8a3d)',
  desc:'Pilot a tiny ship through a rock storm. Thrust, drift, and shoot the rocks into smaller pieces.',
  start(ctx){
    const v = ctx.virtual(800, 600, '#020205'), g = v.g, keys = ctx.keys(), pad = ctx.touchPad(['Fire','Thrust']);
    let ship, bullets, rocks, wave, lives, score, state = 'menu', cd = 0, inv = 0, parts = [];
    const wrap = o => { o.x = (o.x + 800) % 800; o.y = (o.y + 600) % 600; };
    const mkRock = (x, y, r) => { const n = 11, pts = Array.from({length:n}, (_, i) => rand(0.7, 1.1)); const a = rand(0,7), s = rand(30, 90) * (48/r)**0.5; return {x, y, r, vx:Math.cos(a)*s, vy:Math.sin(a)*s, rot:0, vr:rand(-1,1), pts}; };
    function buildWave(){ rocks = []; for (let i=0;i<3+wave;i++){ let x, y; do { x = rand(0,800); y = rand(0,600); } while (Math.hypot(x-ship.x, y-ship.y) < 180); rocks.push(mkRock(x, y, 48)); } }
    const reset = () => { ship = {x:400, y:300, a:-Math.PI/2, vx:0, vy:0}; bullets = []; wave = 0; lives = 3; score = 0; inv = 2; state = 'play'; buildWave(); };
    const burst = (x, y, n, col='#ffbf80') => { for (let i=0;i<n;i++){ const a = rand(0,7), s = rand(30,180); parts.push({x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, l:rand(.3,.8), col}); } };
    ctx.intro('Rock Drift', `<p>Space has no brakes. Spin, thrust and shoot. Big rocks break into smaller, faster ones.</p><div class="keys">${isTouch?'Joystick left/right to turn · Thrust and Fire buttons':'←/→ or A/D turn · ↑ or W thrust · Space fire'}</div>`, reset);
    ship = {x:400, y:300, a:-Math.PI/2, vx:0, vy:0}; bullets = []; rocks = [];
    ctx.loop(dt => {
      if (state === 'play'){
        cd -= dt; inv -= dt;
        const turn = (keys.down('ArrowRight')||keys.down('KeyD')?1:0) - (keys.down('ArrowLeft')||keys.down('KeyA')?1:0) + pad.mx;
        ship.a += clamp(turn, -1, 1)*4.6*dt;
        const thrust = keys.down('ArrowUp') || keys.down('KeyW') || pad.btn['Thrust'];
        if (thrust){ ship.vx += Math.cos(ship.a)*300*dt; ship.vy += Math.sin(ship.a)*300*dt; if (Math.random() < .5) parts.push({x:ship.x - Math.cos(ship.a)*12, y:ship.y - Math.sin(ship.a)*12, vx:-Math.cos(ship.a)*120+rand(-30,30), vy:-Math.sin(ship.a)*120+rand(-30,30), l:.3, col:'#ffb347'}); }
        ship.vx *= Math.pow(0.6, dt); ship.vy *= Math.pow(0.6, dt);
        ship.x += ship.vx*dt; ship.y += ship.vy*dt; wrap(ship);
        if ((keys.down('Space') || pad.btn['Fire']) && cd <= 0){ cd = 0.2; bullets.push({x:ship.x + Math.cos(ship.a)*14, y:ship.y + Math.sin(ship.a)*14, vx:Math.cos(ship.a)*560 + ship.vx, vy:Math.sin(ship.a)*560 + ship.vy, l:0.9}); beep(820,.05,'square',.03,-400); }
        bullets.forEach(b => { b.x += b.vx*dt; b.y += b.vy*dt; b.l -= dt; wrap(b); });
        rocks.forEach(r => { r.x += r.vx*dt; r.y += r.vy*dt; r.rot += r.vr*dt; wrap(r); });
        const born = [];
        for (const b of bullets) for (const r of rocks) if (!r.dead && b.l > 0 && Math.hypot(b.x-r.x, b.y-r.y) < r.r){
          b.l = 0; r.dead = true; score += r.r > 40 ? 20 : r.r > 20 ? 50 : 100; burst(r.x, r.y, 10); noise(.12, .1, 0, r.r > 40 ? 300 : 900);
          if (r.r > 14) for (let k=0;k<2;k++) born.push(mkRock(r.x, r.y, r.r/2));
        }
        rocks = rocks.filter(r => !r.dead).concat(born); bullets = bullets.filter(b => b.l > 0);
        if (inv <= 0) for (const r of rocks) if (Math.hypot(ship.x-r.x, ship.y-r.y) < r.r + 9){
          lives--; burst(ship.x, ship.y, 30, '#fff'); noise(.4,.2,0,200); inv = 2.5; ship.x = 400; ship.y = 300; ship.vx = ship.vy = 0;
          if (lives <= 0){ state = 'over'; ctx.over('rockdrift', score, reset, {extra:'wave '+(wave+1)}); }
          break;
        }
        if (!rocks.length){ wave++; buildWave(); inv = 1.5; beep(660,.15,'triangle',.08); }
      }
      v.begin();
      g.strokeStyle = '#d8d8e8'; g.lineWidth = 2;
      rocks.forEach(r => { g.beginPath(); r.pts.forEach((k, i) => { const a = r.rot + i/r.pts.length*Math.PI*2; const px = r.x + Math.cos(a)*r.r*k, py = r.y + Math.sin(a)*r.r*k; i ? g.lineTo(px,py) : g.moveTo(px,py); }); g.closePath(); g.stroke(); });
      if (state !== 'menu' && (inv <= 0 || Math.floor(inv*10)%2)){
        g.save(); g.translate(ship.x, ship.y); g.rotate(ship.a); g.strokeStyle = '#7dffb2'; g.beginPath(); g.moveTo(14,0); g.lineTo(-10,9); g.lineTo(-6,0); g.lineTo(-10,-9); g.closePath(); g.stroke(); g.restore();
      }
      g.fillStyle = '#fff'; bullets.forEach(b => g.fillRect(b.x-2, b.y-2, 4, 4));
      parts.forEach(p => { p.x += p.vx*dt; p.y += p.vy*dt; p.l -= dt; g.globalAlpha = Math.max(0, p.l*1.5); g.fillStyle = p.col; g.fillRect(p.x-1.5, p.y-1.5, 3, 3); g.globalAlpha = 1; }); parts = parts.filter(p => p.l > 0);
      g.lineWidth = 1;
      v.text(`${score ?? 0}`, 20, 36, 22, '#fff', 'left'); v.text('▲ '.repeat(Math.max(0, lives ?? 0)), 780, 36, 16, '#7dffb2', 'right');
      v.end();
    });
  }
});

GAMES.push({
  id:'desertdash', title:'Desert Dash', tag:'2D', cat:'Arcade', emoji:'🏜️', bg:'linear-gradient(135deg,#f7b267,#f25c54)',
  desc:'Endless desert run. Jump the cacti, duck the birds, and see how far you get.',
  start(ctx){
    const v = ctx.virtual(800, 320, '#f4ecd8'), g = v.g, keys = ctx.keys(), GY = 260;
    let p, obs, speed, dist, state = 'menu', spawnT = 0, run = 0, night = 0, held = false;
    const reset = () => { p = {y:0, vy:0, duck:false}; obs = []; speed = 380; dist = 0; spawnT = 1; state = 'play'; };
    const jump = () => { if (state === 'play' && p.y === 0){ p.vy = 640; beep(560,.06,'square',.04,240); } };
    let sy = null;
    ctx.on(v.cv, 'pointerdown', e => { sy = e.clientY; held = true; });
    ctx.on(v.cv, 'pointermove', e => { if (sy != null && e.clientY - sy > 30) p && (p.duck = true); });
    ctx.on(window, 'pointerup', e => { if (sy != null && !(p && p.duck)) jump(); if (p) p.duck = false; sy = null; held = false; });
    ctx.intro('Desert Dash', `<p>Keep running. Jump over cacti and duck under the low-flying birds. It speeds up as you go.</p><div class="keys">${isTouch?'Tap to jump · Swipe down and hold to duck':'Space / ↑ jump · ↓ duck'}</div>`, reset);
    p = {y:0, vy:0, duck:false}; obs = []; speed = 0; dist = 0;
    ctx.loop(dt => {
      if (state === 'play'){
        if (keys.down('Space') || keys.down('ArrowUp') || keys.down('KeyW')) jump();
        if (!held) p.duck = keys.down('ArrowDown') || keys.down('KeyS');
        p.vy -= (p.duck && p.y > 0 ? 4200 : 2100)*dt; p.y = Math.max(0, p.y + p.vy*dt); if (p.y === 0) p.vy = 0;
        speed = Math.min(380 + dist*0.9, 900); dist += speed*dt/40; run += speed*dt;
        spawnT -= dt;
        if (spawnT <= 0){
          if (dist > 120 && Math.random() < 0.3) obs.push({x:820, t:'bird', y: Math.random() < .5 ? 26 : 60, w:40, h:24});
          else { const n = randi(1, dist > 200 ? 3 : 2); obs.push({x:820, t:'cactus', w:18*n + 6*(n-1), h: rand(36, 58), n}); }
          spawnT = rand(0.7, 1.5) * (500/speed) + 0.35;
        }
        const ph = p.duck ? 28 : 50, pw = p.duck ? 52 : 34;
        for (const o of obs){
          o.x -= speed*dt;
          const oy0 = o.t === 'bird' ? o.y : 0, oy1 = oy0 + (o.t === 'bird' ? o.h : o.h);
          if (90 + pw - 6 > o.x + 4 && 90 + 6 < o.x + o.w - 4 && p.y + 4 < oy1 && p.y + ph - 4 > oy0){
            state = 'over'; noise(.2,.12,0,600); beep(200,.3,'sawtooth',.08,-120); ctx.over('desertdash', Math.floor(dist), reset);
          }
        }
        obs = obs.filter(o => o.x > -80);
        night = (Math.floor(dist/700) % 2) ? Math.min(1, night + dt) : Math.max(0, night - dt);
      }
      v.begin();
      const sky = g.createLinearGradient(0,0,0,320); sky.addColorStop(0, night > .5 ? '#1a1f3d' : '#ffd9a8'); sky.addColorStop(1, night > .5 ? '#3a3360' : '#fff3df'); g.fillStyle = sky; g.fillRect(0,0,800,320);
      g.fillStyle = night > .5 ? '#f0f0ff' : '#ffb347'; g.beginPath(); g.arc(660, 70, 28, 0, 7); g.fill();
      g.fillStyle = night > .5 ? '#2b2650' : '#f2c18a'; g.beginPath(); g.moveTo(0, GY); for (let x=0;x<=800;x+=40) g.lineTo(x, GY - 40 - Math.sin((x + run*0.2)/90)*22); g.lineTo(800, GY); g.fill();
      g.fillStyle = night > .5 ? '#463d6b' : '#e3b37a'; g.fillRect(0, GY, 800, 60);
      g.fillStyle = 'rgba(0,0,0,.15)'; for (let x = -(run % 60); x < 800; x += 60) g.fillRect(x, GY + 14, 18, 3);
      for (const o of obs){
        if (o.t === 'cactus'){ g.fillStyle = '#2f9e44'; for (let k=0;k<o.n;k++){ const cx = o.x + k*24; g.fillRect(cx, GY - o.h, 18, o.h); g.fillRect(cx - 6, GY - o.h*0.65, 6, 4); g.fillRect(cx - 6, GY - o.h*0.65 - 12, 4, 14); g.fillRect(cx + 18, GY - o.h*0.5, 6, 4); g.fillRect(cx + 20, GY - o.h*0.5 - 10, 4, 12); } }
        else { const f = Math.floor(run/40) % 2; g.fillStyle = '#5c4b8a'; g.beginPath(); g.ellipse(o.x+20, GY - o.y - 12, 16, 8, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(o.x+12, GY - o.y - 12); g.lineTo(o.x+24, GY - o.y - (f ? 30 : 0)); g.lineTo(o.x+30, GY - o.y - 12); g.fill(); g.fillStyle = '#ffb347'; g.fillRect(o.x, GY - o.y - 14, 6, 4); }
      }
      // runner
      const ph = p.duck ? 28 : 50, by = GY - p.y;
      g.fillStyle = '#ff7a59'; g.beginPath(); g.roundRect ? g.roundRect(90, by - ph, p.duck ? 52 : 34, ph - 8, 8) : g.rect(90, by - ph, 34, ph-8); g.fill();
      g.fillStyle = '#fff'; g.fillRect(p.duck ? 128 : 112, by - ph + 8, 8, 8); g.fillStyle = '#222'; g.fillRect(p.duck ? 132 : 116, by - ph + 10, 4, 4);
      const leg = p.y > 0 ? 0 : Math.floor(run/30) % 2;
      g.fillStyle = '#c4553b'; g.fillRect(96 + leg*6, by - 10, 8, 10); g.fillRect(112 - leg*6, by - 10, 8, 10);
      v.text(String(Math.floor(dist ?? 0)).padStart(5, '0'), 780, 34, 20, night > .5 ? '#fff' : '#5a4630', 'right');
      v.text('HI ' + String(Store.get('best_desertdash', 0)).padStart(5,'0'), 640, 34, 16, night > .5 ? '#aaa' : '#a08868', 'right');
      v.end();
    });
  }
});

GAMES.push({
  id:'cavecopter', title:'Cave Copter', tag:'2D', cat:'Arcade', emoji:'🚁', bg:'linear-gradient(135deg,#1d2b3a,#5ee7df)',
  desc:'Hold to climb, let go to drop. Thread your copter through a cave that keeps closing in.',
  start(ctx){
    const v = ctx.virtual(800, 450, '#0a0f14'), g = v.g, keys = ctx.keys(), SEG = 20, PX = 160;
    let segs, blocks, c, dist, state = 'menu', held = false, smoke = [], mid, gapW;
    function addSeg(){ const last = segs[segs.length-1]; gapW = Math.max(170, 320 - dist*0.06); mid = clamp(last.mid + rand(-14, 14) + (225 - last.mid)*0.02, gapW/2 + 10, 450 - gapW/2 - 10); segs.push({x: last.x + SEG, mid, gap: gapW}); }
    const reset = () => { segs = [{x:0, mid:225, gap:320}]; dist = 0; for (let i=0;i<50;i++) addSeg(); blocks = []; c = {y:225, vy:0}; state = 'play'; smoke = []; };
    ctx.on(v.cv, 'pointerdown', e => { e.preventDefault(); held = true; });
    ctx.on(window, 'pointerup', () => held = false);
    ctx.intro('Cave Copter', `<p>Hold to climb, release to fall. Don't touch the walls or the rocks. The cave gets narrower the further you fly.</p><div class="keys">${isTouch?'Hold the screen to climb':'Hold Space or the mouse button to climb'}</div>`, reset);
    reset(); state = 'menu';
    ctx.loop(dt => {
      if (state === 'play'){
        const up = held || keys.down('Space') || keys.down('ArrowUp');
        c.vy += (up ? -1300 : 1000)*dt; c.vy = clamp(c.vy, -420, 480); c.y += c.vy*dt;
        const spd = 240 + Math.min(dist*0.05, 160); dist += spd*dt/10;
        segs.forEach(s => s.x -= spd*dt); blocks.forEach(b => b.x -= spd*dt);
        while (segs[0].x < -SEG*2) segs.shift();
        while (segs[segs.length-1].x < 820) addSeg();
        if (Math.random() < dt*0.7 && (!blocks.length || blocks[blocks.length-1].x < 560)){ const s = segs[segs.length-1]; blocks.push({x:820, y: s.mid + rand(-s.gap/2 + 50, s.gap/2 - 110), h: 60}); }
        blocks = blocks.filter(b => b.x > -40);
        if (Math.random() < .5) smoke.push({x:PX-20, y:c.y, l:.6});
        const s = segs.find(s => s.x <= PX && s.x + SEG > PX) || segs[0];
        let dead = c.y - 10 < s.mid - s.gap/2 || c.y + 10 > s.mid + s.gap/2;
        for (const b of blocks) if (PX + 20 > b.x && PX - 20 < b.x + 26 && c.y + 9 > b.y && c.y - 9 < b.y + b.h) dead = true;
        if (dead){ state = 'over'; noise(.4,.2,0,250); beep(160,.4,'sawtooth',.1,-80); ctx.over('cavecopter', Math.floor(dist), reset); }
      }
      smoke.forEach(p => { p.x -= 200*dt; p.l -= dt; }); smoke = smoke.filter(p => p.l > 0);
      v.begin();
      g.fillStyle = '#0f1d26'; g.fillRect(0,0,800,450);
      g.fillStyle = '#2e8f7a';
      g.beginPath(); g.moveTo(segs[0].x, 0); segs.forEach(s => g.lineTo(s.x, s.mid - s.gap/2)); g.lineTo(segs[segs.length-1].x, 0); g.fill();
      g.beginPath(); g.moveTo(segs[0].x, 450); segs.forEach(s => g.lineTo(s.x, s.mid + s.gap/2)); g.lineTo(segs[segs.length-1].x, 450); g.fill();
      g.fillStyle = '#5ee7df'; blocks.forEach(b => g.fillRect(b.x, b.y, 26, b.h));
      smoke.forEach(p => { g.fillStyle = `rgba(200,220,230,${p.l*.5})`; g.beginPath(); g.arc(p.x, p.y, 6*(1.2-p.l), 0, 7); g.fill(); });
      g.save(); g.translate(PX, c.y); g.rotate(clamp(c.vy/1600, -0.25, 0.25));
      g.fillStyle = '#ffcc33'; g.beginPath(); g.ellipse(0, 0, 18, 11, 0, 0, 7); g.fill(); g.fillRect(-34, -3, 20, 5); g.fillRect(-36, -9, 4, 12);
      g.fillStyle = '#9fe8ff'; g.beginPath(); g.ellipse(7, -2, 8, 6, 0, 0, 7); g.fill();
      g.fillStyle = '#333'; g.fillRect(-2, -16, 4, 6); const blade = Math.sin(performance.now()/30)*22; g.fillRect(-Math.abs(blade), -18, Math.abs(blade)*2, 3);
      g.restore();
      v.text(Math.floor(dist ?? 0) + ' m', 780, 34, 20, '#fff', 'right');
      v.end();
    });
  }
});

GAMES.push({
  id:'bounceup', title:'Bounce Up', tag:'2D', cat:'Arcade', emoji:'🦘', bg:'linear-gradient(135deg,#a8e063,#56ab2f)',
  desc:'Bounce from platform to platform and climb as high as you can. Watch out for crumbly ones.',
  start(ctx){
    const v = ctx.virtual(400, 640, '#f7f3e3'), g = v.g, keys = ctx.keys();
    let p, plats, cam, best, state = 'menu', dirTouch = 0;
    function addPlat(y){ const h = -y; const r = Math.random(); const t = h > 1500 && r < .18 ? 'move' : h > 800 && r < .32 ? 'break' : r > .93 ? 'spring' : 'norm'; plats.push({x: rand(10, 330), y, w: 60, t, vx: t === 'move' ? rand(50, 110)*(Math.random()<.5?-1:1) : 0, gone:false}); }
    const reset = () => { p = {x:200, y:560, vx:0, vy:-600}; plats = [{x:170, y:600, w:60, t:'norm', vx:0}]; for (let y = 540; y > -600; y -= rand(55, 85)) addPlat(y); cam = 0; best = 0; state = 'play'; };
    ctx.on(v.cv, 'pointerdown', e => { dirTouch = v.local(e).x < 200 ? -1 : 1; });
    ctx.on(v.cv, 'pointermove', e => { if (e.buttons) dirTouch = v.local(e).x < 200 ? -1 : 1; });
    ctx.on(window, 'pointerup', () => dirTouch = 0);
    ctx.intro('Bounce Up', `<p>You bounce automatically — steer onto the platforms and climb. Brown ones crumble, springs launch you, and you can wrap around the sides.</p><div class="keys">${isTouch?'Hold the left or right side of the screen to steer':'←/→ or A/D to steer'}</div>`, reset);
    p = {x:200, y:560}; plats = []; cam = 0;
    ctx.loop(dt => {
      if (state === 'play'){
        const d = (keys.down('ArrowRight')||keys.down('KeyD')?1:0) - (keys.down('ArrowLeft')||keys.down('KeyA')?1:0) + dirTouch;
        p.vx = lerp(p.vx, clamp(d,-1,1)*320, Math.min(1, dt*10)); p.x += p.vx*dt; if (p.x < -15) p.x = 415; if (p.x > 415) p.x = -15;
        const prev = p.y; p.vy += 1250*dt; p.y += p.vy*dt;
        if (p.vy > 0) for (const q of plats){
          if (q.gone) continue;
          if (prev + 14 <= q.y && p.y + 14 >= q.y && p.x + 12 > q.x && p.x - 12 < q.x + q.w){
            if (q.t === 'break'){ q.gone = true; noise(.1,.08,0,800); continue; }
            p.y = q.y - 14; p.vy = q.t === 'spring' ? -1050 : -620; beep(q.t === 'spring' ? 900 : 520, .07, 'sine', .07, 180); break;
          }
        }
        plats.forEach(q => { if (q.vx){ q.x += q.vx*dt; if (q.x < 0 || q.x > 340) q.vx = -q.vx; } });
        if (p.y - cam < 260) cam = p.y - 260;
        best = Math.max(best, Math.floor((560 - p.y)/10));
        plats = plats.filter(q => q.y - cam < 680);
        let top = Math.min(...plats.map(q => q.y)); while (top > cam - 100){ top -= rand(55, 85) + Math.min(best/40, 30); addPlat(top); }
        if (p.y - cam > 680){ state = 'over'; beep(400,.5,'sine',.1,-350); ctx.over('bounceup', best, reset); }
      }
      v.begin();
      g.strokeStyle = 'rgba(80,120,200,.12)'; for (let y = -((-cam) % 24) ; y < 640; y += 24){ g.beginPath(); g.moveTo(0,y); g.lineTo(400,y); g.stroke(); } for (let x = 0; x < 400; x += 24){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,640); g.stroke(); }
      for (const q of plats){ if (q.gone) continue; const y = q.y - cam; g.fillStyle = q.t === 'break' ? '#a0703c' : q.t === 'move' ? '#4a90e2' : '#5bbf3a'; g.beginPath(); g.roundRect ? g.roundRect(q.x, y, q.w, 12, 6) : g.rect(q.x, y, q.w, 12); g.fill(); if (q.t === 'spring'){ g.fillStyle = '#999'; g.fillRect(q.x + 24, y - 10, 12, 10); g.fillStyle = '#e33'; g.fillRect(q.x + 22, y - 12, 16, 4); } if (q.t === 'break'){ g.strokeStyle = '#6d4824'; g.beginPath(); g.moveTo(q.x+20, y); g.lineTo(q.x+28, y+12); g.moveTo(q.x+40, y); g.lineTo(q.x+34, y+12); g.stroke(); } }
      if (p){ const y = p.y - cam; g.fillStyle = '#ffb000'; g.beginPath(); g.ellipse(p.x, y, 14, 15, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(p.x - 5 + Math.sign(p.vx||0)*2, y - 4, 4, 0, 7); g.arc(p.x + 5 + Math.sign(p.vx||0)*2, y - 4, 4, 0, 7); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.arc(p.x - 4 + Math.sign(p.vx||0)*3, y - 4, 2, 0, 7); g.arc(p.x + 6 + Math.sign(p.vx||0)*3, y - 4, 2, 0, 7); g.fill(); }
      v.text(best ?? 0, 20, 36, 26, '#333', 'left');
      v.end();
    });
  }
});
