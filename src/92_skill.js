/* ===================== SKILL PACK ===================== */
GAMES.push({
  id:'bopmole', title:'Bop the Mole', tag:'2D', cat:'Skill', emoji:'🔨', bg:'linear-gradient(135deg,#8bc34a,#795548)',
  desc:'30 seconds. Bop every mole that pops up, grab the golden ones, and never hit a bomb.',
  start(ctx){
    const v = ctx.virtual(480, 600, '#5b8c3a'), g = v.g;
    const holes = []; for (let r=0;r<3;r++) for (let c=0;c<3;c++) holes.push({x:90 + c*150, y:190 + r*150, t:null, up:0, life:0, hit:0});
    let score, time, state = 'menu', spawn = 0, pops = [], shake = 0, hammer = null;
    const reset = () => { score = 0; time = 30; spawn = 0.3; holes.forEach(h => { h.t = null; h.up = 0; }); state = 'play'; };
    ctx.on(v.cv, 'pointerdown', e => {
      if (state !== 'play') return;
      const p = v.local(e); hammer = {x:p.x, y:p.y, t:.15};
      for (const h of holes){
        if (h.t && h.up > 0.5 && !h.hit && Math.abs(p.x - h.x) < 55 && p.y > h.y - 90 && p.y < h.y + 30){
          h.hit = 0.25; h.life = Math.min(h.life, 0.25);
          if (h.t === 'bomb'){ score = Math.max(0, score - 5); shake = .3; noise(.3,.2,0,200); pops.push({x:h.x, y:h.y-60, s:'-5', c:'#ff4d4d', l:.8}); }
          else { const pts = h.t === 'gold' ? 5 : 1; score += pts; beep(h.t === 'gold' ? 1000 : 600, .08, 'square', .07, -200); pops.push({x:h.x, y:h.y-60, s:'+'+pts, c: h.t==='gold' ? '#ffd23f' : '#fff', l:.8}); }
          return;
        }
      }
      beep(140,.04,'sine',.04);
    });
    ctx.intro('Bop the Mole', `<p>Tap moles as they pop up: +1 each, +5 for gold ones. Bombs cost you 5. You have 30 seconds.</p>`, reset);
    ctx.loop(dt => {
      if (state === 'play'){
        time -= dt; spawn -= dt;
        if (spawn <= 0){ const free = holes.filter(h => !h.t); if (free.length){ const h = free[randi(0, free.length-1)]; const r = Math.random(); h.t = r < .12 ? 'bomb' : r < .2 ? 'gold' : 'mole'; h.life = rand(0.7, 1.3) * (0.6 + time/60); h.up = 0; h.hit = 0; } spawn = rand(0.25, 0.6) * (0.5 + time/60); }
        holes.forEach(h => { if (!h.t) return; h.life -= dt; h.up = h.life > 0 ? Math.min(1, h.up + dt*7) : h.up - dt*7; if (h.hit) h.hit = Math.max(0, h.hit - dt); if (h.up <= 0 && h.life <= 0) h.t = null; });
        if (time <= 0){ state = 'over'; ctx.over('bopmole', score, reset); }
      }
      shake = Math.max(0, shake - dt);
      v.begin();
      if (shake) g.translate(rand(-6,6), rand(-6,6));
      g.fillStyle = '#6aa84f'; g.fillRect(0, 0, 480, 600);
      g.fillStyle = 'rgba(255,255,255,.06)'; for (let i=0;i<40;i++) g.fillRect((i*97)%480, (i*53)%600, 3, 8);
      for (const h of holes){
        g.fillStyle = '#3b2a1a'; g.beginPath(); g.ellipse(h.x, h.y, 58, 20, 0, 0, 7); g.fill();
        if (h.t && h.up > 0){
          g.save(); g.beginPath(); g.rect(h.x - 70, h.y - 140, 140, 140); g.clip();
          const y = h.y + 10 - h.up*80;
          if (h.t === 'bomb'){ g.fillStyle = '#222'; g.beginPath(); g.arc(h.x, y, 30, 0, 7); g.fill(); g.fillStyle = '#ff9a3d'; g.fillRect(h.x - 3, y - 44, 6, 14); g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(h.x, y - 46, 5 + Math.random()*3, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '700 16px sans-serif'; g.textAlign = 'center'; g.fillText('☠', h.x, y + 6); }
          else { g.fillStyle = h.t === 'gold' ? '#f4c430' : '#8d6e63'; g.beginPath(); g.ellipse(h.x, y + 10, 34, 44, 0, 0, 7); g.fill(); g.fillStyle = h.t === 'gold' ? '#ffe68a' : '#bcaaa4'; g.beginPath(); g.ellipse(h.x, y + 22, 20, 18, 0, 0, 7); g.fill();
            g.fillStyle = '#222'; if (h.hit){ g.font = '700 16px sans-serif'; g.textAlign='center'; g.fillText('x  x', h.x, y - 2); } else { g.beginPath(); g.arc(h.x - 11, y - 6, 4, 0, 7); g.arc(h.x + 11, y - 6, 4, 0, 7); g.fill(); }
            g.fillStyle = '#ff8a80'; g.beginPath(); g.arc(h.x, y + 8, 6, 0, 7); g.fill(); }
          g.restore();
        }
        g.fillStyle = '#4a7a33'; g.beginPath(); g.ellipse(h.x, h.y + 6, 62, 14, 0, 0, Math.PI); g.fill();
      }
      pops.forEach(p => { p.y -= 50*dt; p.l -= dt; g.globalAlpha = Math.max(0, p.l); v.text(p.s, p.x, p.y, 28, p.c); g.globalAlpha = 1; }); pops = pops.filter(p => p.l > 0);
      if (hammer){ hammer.t -= dt; g.save(); g.translate(hammer.x, hammer.y); g.rotate(hammer.t > 0 ? -0.2 : -0.8); g.fillStyle = '#8d5524'; g.fillRect(-4, -10, 8, 60); g.fillStyle = '#555'; g.fillRect(-22, -30, 44, 24); g.restore(); if (hammer.t < -0.15) hammer = null; }
      v.text('Score ' + (score ?? 0), 24, 44, 26, '#fff', 'left');
      v.text(Math.max(0, Math.ceil(time ?? 30)) + 's', 456, 44, 26, (time ?? 30) < 6 ? '#ffd23f' : '#fff', 'right');
      v.end();
    });
  }
});

GAMES.push({
  id:'reflex', title:'Reflex', tag:'2D', cat:'Skill', emoji:'⚡', bg:'linear-gradient(135deg,#ff416c,#3ddc84)',
  desc:'Wait for green, then tap as fast as you can. Five rounds, average reaction time.',
  bestLabel:'Best avg', fmt: v => v + ' ms',
  start(ctx){
    const root = ctx.dom('cursor:pointer;transition:background .1s;text-align:center');
    root.innerHTML = '<div style="font-size:64px" id="rxI">⚡</div><h2 id="rxT" style="font-size:clamp(28px,6vw,46px)">Tap to start</h2><p id="rxS" style="opacity:.8;max-width:380px">When the screen turns green, tap as fast as you can. Five rounds.</p><div id="rxL" class="stats"></div>';
    const T = root.querySelector('#rxT'), Sx = root.querySelector('#rxS'), I = root.querySelector('#rxI'), L = root.querySelector('#rxL');
    let st = 'idle', t0 = 0, timer = null, times = [];
    const set = (bg, icon, title, sub) => { root.style.background = bg; I.textContent = icon; T.textContent = title; Sx.textContent = sub; };
    function arm(){ st = 'wait'; set('#b3263e', '⏳', 'Wait for green…', `Round ${times.length+1} of 5`); timer = setTimeout(() => { st = 'go'; t0 = performance.now(); set('#1fa463', '👆', 'TAP!', ''); beep(880,.08,'square',.08); }, rand(1400, 4000)); }
    function showList(){ L.innerHTML = times.map((t,i) => `<div class="stat"><small>#${i+1}</small>${t}</div>`).join(''); }
    ctx.cleanup(() => clearTimeout(timer));
    ctx.on(root, 'pointerdown', () => {
      audioInit();
      if (st === 'idle' || st === 'result'){ times = []; showList(); arm(); }
      else if (st === 'wait'){ clearTimeout(timer); st = 'early'; set('#5a3d8f', '🙈', 'Too soon!', 'Tap to try that round again'); beep(150,.2,'sawtooth',.06); }
      else if (st === 'early') arm();
      else if (st === 'go'){
        const ms = Math.round(performance.now() - t0); times.push(ms); showList();
        if (times.length < 5){ st = 'between'; set('#2a2350', '⏱', ms + ' ms', 'Tap for the next round'); }
        else { st = 'result'; const avg = Math.round(times.reduce((a,b) => a+b, 0)/5); const r = Store.best('reflex', avg, true); set('#2a2350', '🏁', avg + ' ms average', (r.isNew ? 'New best! ' : 'Best ' + r.best + ' ms. ') + 'Tap to go again.'); [523,659,784].forEach((f,i)=>beep(f,.12,'triangle',.08,0,i*.08)); }
      }
      else if (st === 'between') arm();
    });
  }
});

GAMES.push({
  id:'typestorm', title:'Type Storm', tag:'2D', cat:'Skill', emoji:'⌨️', bg:'linear-gradient(135deg,#0f2027,#2c5364)',
  desc:'Words rain down. Type them before they hit the ground. How many WPM can you hold?',
  start(ctx){
    const LIST = 'sun cat map fog ice owl jam key box web code lamp wave star rock fire leaf moon wind gold snow frog kite tree ship bird rain cloud storm river pixel laser rocket dragon planet garden silver castle tunnel jungle candle galaxy thunder crystal blanket compass lantern rainbow volcano diamond penguin journey mystery quantum keyboard elephant mountain treasure sunshine midnight starlight waterfall adventure butterfly'.split(' ');
    const v = ctx.virtual(640, 560, '#0b1620'), g = v.g;
    const inp = document.createElement('input'); inp.setAttribute('autocomplete','off'); inp.setAttribute('autocapitalize','off'); inp.setAttribute('spellcheck','false');
    inp.style.cssText = 'position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:22;width:min(320px,80vw);font:600 20px Space Grotesk, sans-serif;padding:10px 16px;border-radius:999px;border:2px solid #4ad8ff;background:#0b1620;color:#fff;text-align:center;outline:none';
    inp.placeholder = 'type here…'; ctx.el.appendChild(inp);
    let words, score, lives, typed, state = 'menu', spawn = 0, elapsed = 0, chars = 0, booms = [];
    const reset = () => { words = []; score = 0; lives = 5; spawn = 0; elapsed = 0; chars = 0; inp.value = ''; state = 'play'; setTimeout(() => inp.focus(), 50); };
    inp.addEventListener('input', () => {
      if (state !== 'play') return;
      const t = inp.value.trim().toLowerCase();
      const w = words.find(w => w.s === t);
      if (w){ words = words.filter(x => x !== w); score++; chars += t.length + 1; inp.value = ''; booms.push({x:w.x, y:w.y, l:.4, s:w.s}); beep(500 + w.s.length*60, .07, 'triangle', .07); }
    });
    ctx.on(v.cv, 'pointerdown', () => inp.focus());
    ctx.intro('Type Storm', '<p>Words fall from the sky. Type a word exactly to blast it. Five misses and the storm wins.</p>', reset);
    words = [];
    ctx.loop(dt => {
      const t = inp.value.trim().toLowerCase();
      if (state === 'play'){
        elapsed += dt; spawn -= dt;
        if (spawn <= 0){ const pool = LIST.filter(w => w.length <= 3 + Math.floor(elapsed/12)); const s = pool[randi(0, pool.length-1)]; g.font = '700 22px Space Grotesk, sans-serif'; const wdt = g.measureText(s).width; words.push({s, x: rand(20, 620 - wdt), y: -10, sp: rand(30, 45) + elapsed*0.9}); spawn = Math.max(0.7, 2.2 - elapsed*0.025); }
        words.forEach(w => w.y += w.sp*dt);
        const fell = words.filter(w => w.y > 480);
        if (fell.length){ lives -= fell.length; words = words.filter(w => w.y <= 480); noise(.2,.12,0,400); if (lives <= 0){ state = 'over'; inp.blur(); const wpm = Math.round(chars/5/(elapsed/60)); ctx.over('typestorm', score, reset, {extra: wpm + ' WPM'}); } }
      }
      v.begin();
      const sky = g.createLinearGradient(0,0,0,560); sky.addColorStop(0,'#0b1620'); sky.addColorStop(1,'#1b3a4b'); g.fillStyle = sky; g.fillRect(0,0,640,560);
      g.fillStyle = '#26475a'; g.fillRect(0, 480, 640, 80);
      g.font = '700 22px Space Grotesk, sans-serif';
      words.forEach(w => { const m = t && w.s.startsWith(t); g.fillStyle = 'rgba(0,0,0,.35)'; const wd = g.measureText(w.s).width; g.fillRect(w.x - 8, w.y - 22, wd + 16, 30); g.fillStyle = '#e8f4ff'; g.fillText(w.s, w.x, w.y); if (m){ g.fillStyle = '#4ad8ff'; g.fillText(t, w.x, w.y); } });
      booms.forEach(b => { b.l -= dt; g.globalAlpha = Math.max(0, b.l*2.5); g.fillStyle = '#4ad8ff'; g.fillText('✦ ' + b.s, b.x, b.y - (0.4 - b.l)*60); g.globalAlpha = 1; }); booms = booms.filter(b => b.l > 0);
      v.text('Score ' + (score ?? 0), 20, 32, 18, '#fff', 'left');
      v.text('♥'.repeat(Math.max(0, lives ?? 5)), 620, 32, 18, '#ff5566', 'right');
      if (state === 'play' && elapsed > 3) v.text(Math.round(chars/5/(elapsed/60)) + ' WPM', 320, 32, 16, '#9fd8ff');
      v.end();
    });
  }
});

GAMES.push({
  id:'targetrush', title:'Target Rush', tag:'2D', cat:'Skill', emoji:'🎯', bg:'linear-gradient(135deg,#ee0979,#ff6a00)',
  desc:'Aim trainer. Hit the shrinking targets fast for combo points. 30 seconds on the clock.',
  start(ctx){
    const v = ctx.virtual(800, 500, '#120a14'), g = v.g;
    let targets, score, combo, hits, shots, time, state = 'menu', spawn = 0, fx = [];
    const reset = () => { targets = []; score = 0; combo = 0; hits = 0; shots = 0; time = 30; spawn = 0; state = 'play'; };
    ctx.on(v.cv, 'pointerdown', e => {
      if (state !== 'play') return; const p = v.local(e); shots++;
      for (let i = targets.length - 1; i >= 0; i--){ const t = targets[i]; const r = t.r * (1 - t.age/t.life); if (Math.hypot(p.x - t.x, p.y - t.y) < r){ targets.splice(i, 1); hits++; combo++; const pts = Math.round(10 + combo*2 + (1 - t.age/t.life)*20); score += pts; fx.push({x:t.x, y:t.y, l:.5, s:'+'+pts}); beep(600 + Math.min(combo,20)*30, .06, 'square', .06); return; } }
      combo = 0; beep(120,.05,'sine',.05); fx.push({x:p.x, y:p.y, l:.3, s:'miss'});
    });
    ctx.intro('Target Rush', '<p>Click targets before they shrink away. Faster hits and unbroken combos score more. Misses break your combo.</p>', reset);
    targets = [];
    ctx.loop(dt => {
      if (state === 'play'){
        time -= dt; spawn -= dt;
        if (spawn <= 0 && targets.length < 4){ targets.push({x:rand(50,750), y:rand(60,460), r:rand(26, 40), age:0, life: Math.max(0.9, 1.8 - (30-time)*0.02)}); spawn = rand(0.25, 0.55); }
        targets.forEach(t => t.age += dt);
        const missed = targets.filter(t => t.age >= t.life).length; if (missed){ combo = 0; }
        targets = targets.filter(t => t.age < t.life);
        if (time <= 0){ state = 'over'; ctx.over('targetrush', score, reset, {extra: (shots ? Math.round(hits/shots*100) : 0) + '% accuracy'}); }
      }
      v.begin();
      g.strokeStyle = 'rgba(255,255,255,.04)'; for (let x=0;x<800;x+=40){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,500); g.stroke(); } for (let y=0;y<500;y+=40){ g.beginPath(); g.moveTo(0,y); g.lineTo(800,y); g.stroke(); }
      targets.forEach(t => { const r = t.r * (1 - t.age/t.life); [['#ff3d6e',1],['#fff',.66],['#ff3d6e',.33]].forEach(([c,k]) => { g.fillStyle = c; g.beginPath(); g.arc(t.x, t.y, Math.max(0.1, r*k), 0, 7); g.fill(); }); });
      fx.forEach(f => { f.l -= dt; g.globalAlpha = Math.max(0, f.l*2); v.text(f.s, f.x, f.y - (0.5-f.l)*40, 18, f.s === 'miss' ? '#888' : '#ffd23f'); g.globalAlpha = 1; }); fx = fx.filter(f => f.l > 0);
      v.text('Score ' + (score ?? 0), 20, 34, 20, '#fff', 'left');
      v.text((combo ?? 0) > 1 ? 'x' + combo + ' combo' : '', 400, 34, 20, '#ffd23f');
      v.text(Math.max(0, Math.ceil(time ?? 30)) + 's', 780, 34, 20, '#fff', 'right');
      v.end();
    });
  }
});

GAMES.push({
  id:'mazemuncher', title:'Maze Muncher', tag:'2D', cat:'Arcade', emoji:'🟡', bg:'linear-gradient(135deg,#1a1aff,#ffd23f)',
  desc:'Eat every dot in the maze while three ghosts hunt you. Power pellets turn the tables.',
  start(ctx){
    const MAP = [
      '###################',
      '#........#........#',
      '#o##.###.#.###.##o#',
      '#.................#',
      '#.##.#.#####.#.##.#',
      '#....#...#...#....#',
      '####.###.#.###.####',
      '   #.#.......#.#   ',
      '####.#.##-##.#.####',
      '    ...#GGG#...    ',
      '####.#.#####.#.####',
      '   #.#.......#.#   ',
      '####.#.#####.#.####',
      '#........#........#',
      '#.##.###.#.###.##.#',
      '#o.#.....P.....#.o#',
      '##.#.#.#####.#.#.##',
      '#....#...#...#....#',
      '#.######.#.######.#',
      '#.................#',
      '###################'];
    const COLS = 19, ROWS = 21, TS = 24;
    const v = ctx.virtual(COLS*TS, ROWS*TS + 40, '#000'), g = v.g, keys = ctx.keys();
    let dots, pac, ghosts, score, lives, level, state = 'menu', fright = 0, want = null, mouth = 0, pause = 0, eatChain = 0;
    const wall = (x, y, ghost) => { if (y < 0 || y >= ROWS) return true; x = (x + COLS) % COLS; const c = MAP[y][x]; return c === '#' || (c === '-' && !ghost); };
    const DIRS = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
    function loadDots(){ dots = new Map(); MAP.forEach((row, y) => [...row].forEach((c, x) => { if (c === '.' || c === 'o') dots.set(x + ',' + y, c); })); }
    function place(){
      pac = {x:9, y:15, dir:{x:0,y:0}}; want = null;
      ghosts = [ {x:9, y:7, col:'#ff4d6d', mode:'chase', wait:0}, {x:8, y:9, col:'#ff9ae5', mode:'wait', wait:2.5}, {x:10, y:9, col:'#4ad8ff', mode:'wait', wait:5} ].map(gh => ({...gh, dir:{x:0,y:0}, hx:gh.x, hy:gh.y}));
      fright = 0; pause = 1.2;
    }
    const reset = () => { score = 0; lives = 3; level = 0; loadDots(); place(); state = 'play'; };
    function step(e, speed, dt, choose){
      let rem = speed*dt, guard = 0;
      while (rem > 1e-6 && guard++ < 8){
        const cx = Math.round(e.x), cy = Math.round(e.y);
        const off = Math.abs(e.x - cx) + Math.abs(e.y - cy);
        if (off < 1e-4){ e.x = cx; e.y = cy; choose(e, cx, cy); if (!e.dir.x && !e.dir.y) return; }
        let toNext = 1;
        if (off >= 1e-4){ const ahead = e.dir.x ? (cx - e.x)*e.dir.x : (cy - e.y)*e.dir.y; toNext = ahead > 1e-4 ? ahead : 1 + ahead; }
        const m = Math.min(rem, toNext);
        e.x += e.dir.x*m; e.y += e.dir.y*m; rem -= m;
        if (Math.abs(m - toNext) < 1e-6){ e.x = Math.round(e.x); e.y = Math.round(e.y); }
        if (e.x < -0.5) e.x += COLS; if (e.x > COLS - 0.5) e.x -= COLS;
      }
    }
    function choosePac(e, x, y){
      if (want && !wall(x + want.x, y + want.y)) e.dir = want;
      else if (wall(x + e.dir.x, y + e.dir.y)) e.dir = {x:0, y:0};
      const k = ((x + COLS) % COLS) + ',' + y;
      if (dots.has(k)){ const t = dots.get(k); dots.delete(k); if (t === 'o'){ score += 50; fright = Math.max(3, 7 - level); eatChain = 0; beep(300,.3,'sawtooth',.06,400); } else { score += 10; beep(mouth > 0.5 ? 700 : 620, .03, 'square', .03); } }
    }
    function chooseGhost(gh, x, y){
      if (gh.mode === 'exit' && x === 9 && y <= 7){ gh.mode = 'chase'; }
      const opts = DIRS.filter(d => !(d.x === -gh.dir.x && d.y === -gh.dir.y && (gh.dir.x || gh.dir.y)) && !wall(x + d.x, y + d.y, gh.mode === 'exit'));
      if (!opts.length){ gh.dir = {x:-gh.dir.x, y:-gh.dir.y}; return; }
      let tx = pac.x, ty = pac.y;
      if (gh.mode === 'exit'){ tx = 9; ty = 6; }
      else if (gh.col === '#ff9ae5'){ tx = pac.x + pac.dir.x*4; ty = pac.y + pac.dir.y*4; }
      else if (gh.col === '#4ad8ff' && Math.hypot(pac.x - x, pac.y - y) < 6){ tx = 1; ty = 19; }
      if ((fright > 0 && gh.mode !== 'exit') || (gh.mode !== 'exit' && Math.random() < 0.12)){ gh.dir = opts[randi(0, opts.length-1)]; return; }
      opts.sort((a, b) => Math.hypot(x+a.x-tx, y+a.y-ty) - Math.hypot(x+b.x-tx, y+b.y-ty));
      gh.dir = opts[0];
    }
    const setWant = (x, y) => { want = {x, y}; if (pac && x === -pac.dir.x && y === -pac.dir.y) pac.dir = want; };
    ctx.swipe(v.cv, setWant);
    ctx.intro('Maze Muncher', `<p>Eat every dot. Big dots let you chase the ghosts for a few seconds. Side tunnels wrap around.</p><div class="keys">${isTouch?'Swipe to steer':'Arrow keys / WASD'}</div>`, reset);
    loadDots(); place();
    ctx.loop((dt, t) => {
      for (const [c, d] of [['ArrowUp',[0,-1]],['KeyW',[0,-1]],['ArrowDown',[0,1]],['KeyS',[0,1]],['ArrowLeft',[-1,0]],['KeyA',[-1,0]],['ArrowRight',[1,0]],['KeyD',[1,0]]]) if (keys.hit(c)) setWant(d[0], d[1]);
      if (state === 'play'){
        if (pause > 0) pause -= dt;
        else {
          mouth = (mouth + dt*8) % 1;
          if (fright > 0) fright -= dt;
          step(pac, 6.5 + level*0.3, dt, choosePac);
          ghosts.forEach(gh => {
            if (gh.mode === 'wait'){ gh.wait -= dt; if (gh.wait <= 0){ gh.mode = 'exit'; gh.x = 9; gh.y = 9; gh.dir = {x:0, y:-1}; } return; }
            step(gh, (fright > 0 && gh.mode !== 'exit' ? 3.6 : 5.6 + level*0.35), dt, chooseGhost);
            if (Math.hypot(gh.x - pac.x, gh.y - pac.y) < 0.65 && gh.mode !== 'exit'){
              if (fright > 0){ eatChain++; const pts = 100 * 2**eatChain; score += pts; gh.x = 9; gh.y = 9; gh.mode = 'wait'; gh.wait = 2; beep(1200,.15,'square',.06,-600); }
              else { lives--; noise(.4,.15,0,300); beep(400,.6,'sawtooth',.08,-350); if (lives <= 0){ state = 'over'; ctx.over('mazemuncher', score, reset, {extra:'level ' + (level+1)}); } else place(); }
            }
          });
          if (!dots.size){ level++; [523,659,784,1047].forEach((f,i)=>beep(f,.12,'triangle',.08,0,i*.08)); loadDots(); place(); }
        }
      }
      v.begin();
      g.translate(0, 40);
      MAP.forEach((row, y) => [...row].forEach((c, x) => {
        if (c === '#'){ g.fillStyle = '#1b1bd1'; g.fillRect(x*TS+2, y*TS+2, TS-4, TS-4); g.fillStyle = '#0b0b5a'; g.fillRect(x*TS+6, y*TS+6, TS-12, TS-12); }
        else if (c === '-'){ g.fillStyle = '#ff9ae5'; g.fillRect(x*TS, y*TS + TS/2 - 2, TS, 4); }
      }));
      dots.forEach((tp, k) => { const [x, y] = k.split(',').map(Number); g.fillStyle = '#ffe1b8'; g.beginPath(); g.arc(x*TS+TS/2, y*TS+TS/2, tp === 'o' ? 6 + Math.sin(t*6) : 2.5, 0, 7); g.fill(); });
      // pac
      const ang = Math.atan2(pac.dir.y, pac.dir.x || (pac.dir.y ? 0 : 1)), mo = 0.05 + Math.abs(Math.sin(mouth*Math.PI))*0.35;
      g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(pac.x*TS+TS/2, pac.y*TS+TS/2); g.arc(pac.x*TS+TS/2, pac.y*TS+TS/2, TS*0.45, ang + mo*Math.PI, ang - mo*Math.PI + Math.PI*2); g.closePath(); g.fill();
      ghosts.forEach(gh => {
        const x = gh.x*TS+TS/2, y = gh.y*TS+TS/2, fr = fright > 0 && gh.mode !== 'exit' && gh.mode !== 'wait';
        g.fillStyle = fr ? (fright < 1.5 && Math.floor(t*6)%2 ? '#fff' : '#3b3bff') : gh.col;
        g.beginPath(); g.arc(x, y - 2, TS*0.42, Math.PI, 0); g.lineTo(x + TS*0.42, y + TS*0.4); for (let k=0;k<4;k++) g.lineTo(x + TS*0.42 - (k+0.5)*TS*0.21, y + TS*0.4 - (k%2 ? 0 : 5)); g.lineTo(x - TS*0.42, y + TS*0.4); g.closePath(); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 4, y - 3, 3.5, 0, 7); g.arc(x + 4, y - 3, 3.5, 0, 7); g.fill();
        if (!fr){ g.fillStyle = '#123'; g.beginPath(); g.arc(x - 4 + gh.dir.x*1.5, y - 3 + gh.dir.y*1.5, 1.8, 0, 7); g.arc(x + 4 + gh.dir.x*1.5, y - 3 + gh.dir.y*1.5, 1.8, 0, 7); g.fill(); }
      });
      g.translate(0, -40);
      v.text('SCORE ' + (score ?? 0), 10, 28, 16, '#fff', 'left'); v.text('LEVEL ' + ((level ?? 0)+1), COLS*TS/2, 28, 16, '#ffd23f');
      v.text('●'.repeat(Math.max(0, lives ?? 3)), COLS*TS - 10, 28, 16, '#ffd23f', 'right');
      if (state === 'play' && pause > 0) v.text('READY!', COLS*TS/2, 40 + 11.75*TS, 18, '#ffd23f');
      v.end();
    });
  }
});

GAMES.push({
  id:'roadhopper', title:'Road Hopper', tag:'2D', cat:'Arcade', emoji:'🐸', bg:'linear-gradient(135deg,#56ab2f,#2193b0)',
  desc:'Hop across endless roads and rivers. Dodge traffic, ride the logs, keep moving forward.',
  start(ctx){
    const T = 42, COLS = 10, v = ctx.virtual(COLS*T, 640, '#000'), g = v.g, keys = ctx.keys();
    let rows, p, cam, best, state = 'menu', hop = 0, minCam = 0, splash = 0;
    function makeRow(i){
      if (i < 3) return {type:'grass', trees: []};
      const r = Math.random(), prev = rows[i-1] ? rows[i-1].type : 'grass';
      const diff = Math.min(1, i/120);
      if (r < 0.32 && prev !== 'water') return {type:'grass', trees: [...Array(COLS).keys()].filter(() => Math.random() < 0.18)};
      if (r < 0.7){ const dir = Math.random() < .5 ? 1 : -1, sp = rand(1.4, 2.6) + diff*2.2, w = Math.random() < .25 ? 2 : 1, n = randi(2, 3); const items = []; let x = rand(0, 4); for (let k=0;k<n;k++){ items.push({x, w}); x += w + rand(2.5, 5); } return {type:'road', dir, sp, items, len: Math.max(COLS + 4, x + 2), col: ['#ff4d6d','#4ad8ff','#ffd23f','#b56bff','#ff9a3d'][randi(0,4)]}; }
      const dir = Math.random() < .5 ? 1 : -1, sp = rand(1, 2) + diff*1.4, items = []; let x = rand(0, 2); for (let k=0;k<3;k++){ const w = randi(2, 4) - (diff > .6 ? 1 : 0); items.push({x, w}); x += w + rand(1.5, 3); }
      return {type:'water', dir, sp, items, len: Math.max(COLS + 4, x + 1)};
    }
    function ensure(n){ while (rows.length < n) rows.push(makeRow(rows.length)); }
    const reset = () => { rows = []; ensure(30); p = {x:4, y:0, fx:4, fy:0}; cam = 0; minCam = 0; best = 0; hop = 0; state = 'play'; };
    function move(dx, dy){
      if (state !== 'play' || hop > 0) return;
      const nx = Math.round(p.x) + dx, ny = p.y + dy;
      if (nx < 0 || nx >= COLS || ny < 0) return;
      ensure(ny + 30);
      const r = rows[ny]; if (r.type === 'grass' && r.trees.includes(nx)) return;
      p.fx = p.x; p.fy = p.y; p.x = rows[p.y].type === 'water' && dx === 0 ? p.x : nx; if (dx === 0 && rows[ny].type !== 'water') p.x = Math.round(p.x); if (dx !== 0) p.x = nx;
      p.y = ny; hop = 0.12; beep(dy > 0 ? 560 : 440, .04, 'triangle', .05);
      if (p.y > best){ best = p.y; }
    }
    const die = why => { if (state !== 'play') return; state = 'over'; if (why === 'water'){ splash = .6; noise(.3,.12,0,800); } else { noise(.3,.18,0,300); beep(200,.3,'sawtooth',.08,-120); } setTimeout(() => ctx.over('roadhopper', best, reset), 500); };
    ctx.swipe(v.cv, (dx, dy) => move(dx, -dy), () => move(0, 1));
    ctx.intro('Road Hopper', `<p>Hop forward as far as you can. Cars squash you, water drowns you — ride the logs across rivers. Don't dawdle: the edge of the screen catches up.</p><div class="keys">${isTouch?'Tap to hop forward · Swipe to hop any direction':'Arrow keys / WASD'}</div>`, reset);
    rows = []; ensure(30); p = {x:4, y:0, fx:4, fy:0}; cam = 0;
    ctx.loop((dt, t) => {
      if (state === 'play' || state === 'over') rows.forEach(r => { if (r.items){ r.items.forEach(it => { it.x += r.dir*r.sp*dt; if (r.dir > 0 && it.x > COLS + 1) it.x -= r.len; if (r.dir < 0 && it.x + it.w < -1) it.x += r.len; }); } });
      if (state === 'play'){
        if (keys.hit('ArrowUp') || keys.hit('KeyW')) move(0, 1); if (keys.hit('ArrowDown') || keys.hit('KeyS')) move(0, -1);
        if (keys.hit('ArrowLeft') || keys.hit('KeyA')) move(-1, 0); if (keys.hit('ArrowRight') || keys.hit('KeyD')) move(1, 0);
        hop = Math.max(0, hop - dt);
        const r = rows[p.y];
        if (hop === 0){
          if (r.type === 'water'){ const log = r.items.find(it => p.x + 0.5 > it.x + 0.1 && p.x + 0.5 < it.x + it.w - 0.1); if (!log) die('water'); else { p.x += r.dir*r.sp*dt; if (p.x < -0.4 || p.x > COLS - 0.6) die('water'); } }
          if (r.type === 'road' && r.items.some(it => p.x + 0.8 > it.x && p.x + 0.2 < it.x + it.w)) die('car');
        }
        minCam += dt * Math.min(0.25 + best*0.006, 0.8);
        cam = Math.max(lerp(cam, p.y - 3, Math.min(1, dt*5)), minCam);
        if (p.y < cam - 1.2) die('car');
      }
      splash = Math.max(0, splash - dt);
      v.begin();
      const scr = row => 640 - (row - cam + 1) * T;
      const first = Math.max(0, Math.floor(cam) - 2);
      ensure(first + 20);
      for (let i = first; i < first + 18; i++){
        const r = rows[i], y = scr(i);
        if (r.type === 'grass'){ g.fillStyle = i % 2 ? '#7ccf4a' : '#86d652'; g.fillRect(0, y, COLS*T, T); r.trees.forEach(x => { g.fillStyle = '#5b3a1e'; g.fillRect(x*T + 17, y + 24, 8, 14); g.fillStyle = '#2f8f3c'; g.beginPath(); g.arc(x*T + 21, y + 18, 14, 0, 7); g.fill(); }); }
        else if (r.type === 'road'){ g.fillStyle = '#3d3d4a'; g.fillRect(0, y, COLS*T, T); g.fillStyle = 'rgba(255,255,255,.25)'; for (let x = 0; x < COLS*T; x += 34) g.fillRect(x, y + T - 3, 16, 2);
          r.items.forEach(it => { const x = it.x*T; g.fillStyle = r.col; g.beginPath(); g.roundRect ? g.roundRect(x + 2, y + 7, it.w*T - 4, T - 14, 7) : g.rect(x+2, y+7, it.w*T-4, T-14); g.fill(); g.fillStyle = 'rgba(200,240,255,.8)'; g.fillRect(r.dir > 0 ? x + it.w*T - 16 : x + 6, y + 11, 10, T - 22); g.fillStyle = '#222'; g.fillRect(x + 6, y + 4, 10, 4); g.fillRect(x + it.w*T - 16, y + 4, 10, 4); g.fillRect(x + 6, y + T - 8, 10, 4); g.fillRect(x + it.w*T - 16, y + T - 8, 10, 4); }); }
        else { g.fillStyle = '#2f86c7'; g.fillRect(0, y, COLS*T, T); g.fillStyle = 'rgba(255,255,255,.15)'; for (let x = (t*20*r.dir) % 30 - 30; x < COLS*T; x += 30) g.fillRect(x, y + 10 + (Math.floor(x/30)%2)*14, 12, 2);
          r.items.forEach(it => { g.fillStyle = '#8a5a33'; g.beginPath(); g.roundRect ? g.roundRect(it.x*T + 2, y + 6, it.w*T - 4, T - 12, 10) : g.rect(it.x*T+2, y+6, it.w*T-4, T-12); g.fill(); g.fillStyle = '#6e4526'; for (let k=1;k<it.w;k++) g.fillRect(it.x*T + k*T, y + 9, 3, T - 18); }); }
      }
      // player
      const k = hop/0.12, px = lerp(p.x, p.fx, k) * T, py = scr(lerp(p.y, p.fy, k)) - Math.sin(k*Math.PI)*12;
      if (!(state === 'over' && splash > 0 && rows[p.y].type === 'water')){
        g.fillStyle = '#4caf50'; g.beginPath(); g.ellipse(px + T/2, py + T/2 + 2, 15, 13, 0, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(px + T/2 - 7, py + T/2 - 9, 6, 0, 7); g.arc(px + T/2 + 7, py + T/2 - 9, 6, 0, 7); g.fill();
        g.fillStyle = '#111'; g.beginPath(); g.arc(px + T/2 - 7, py + T/2 - 10, 3, 0, 7); g.arc(px + T/2 + 7, py + T/2 - 10, 3, 0, 7); g.fill();
      } else { g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 3; g.beginPath(); g.arc(px + T/2, py + T/2, (0.6-splash)*50, 0, 7); g.stroke(); g.lineWidth = 1; }
      v.text(best ?? 0, 16, 40, 30, '#fff', 'left');
      v.end();
    });
  }
});

GAMES.push({
  id:'lanerunner', title:'Lane Runner', tag:'3D', cat:'3D', emoji:'🏃', bg:'linear-gradient(135deg,#f7971e,#7b2ff7)',
  desc:'3D endless runner. Switch lanes, jump barriers, slide under bars and grab the coins.',
  start(ctx){
    const T3 = ctx.three(); if (!T3) return;
    const { renderer, camera, scene } = T3;
    scene.background = new THREE.Color('#ffb48a'); scene.fog = new THREE.Fog('#ffb48a', 40, 120);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x664455, 0.9));
    const sun = new THREE.DirectionalLight(0xffffff, 0.6); sun.position.set(-0.5, 1, 0.4); scene.add(sun);
    const LANES = [-2.4, 0, 2.4];
    const box = new THREE.BoxGeometry(1,1,1);
    const M = c => new THREE.MeshLambertMaterial({color:c});
    // track
    const track = new THREE.Group(); scene.add(track);
    for (let i=0;i<30;i++){ const s = new THREE.Mesh(box, M(i%2 ? 0x5a4e6e : 0x645878)); s.scale.set(8, 0.4, 6); s.position.set(0, -0.2, -i*6); track.add(s);
      [-1,1].forEach(side => { const rail = new THREE.Mesh(box, M(0x3a3048)); rail.scale.set(0.3, 0.6, 6); rail.position.set(side*4.1, 0.1, -i*6); track.add(rail); }); }
    const props = [];
    for (let i=0;i<24;i++){ const h = rand(4, 16); const b = new THREE.Mesh(box, M(new THREE.Color().setHSL(rand(0.7, 1.0), 0.4, rand(0.45, 0.65)))); b.scale.set(rand(3,6), h, rand(3,6)); b.position.set((i%2 ? 1 : -1)*rand(9, 16), h/2 - 0.5, -i*7); scene.add(b); props.push(b); }
    // runner
    const runner = new THREE.Group(); scene.add(runner);
    const bm = M(0x4ad8ff);
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.9, 12), bm); torso.position.y = 1.0; runner.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 10), M(0xffe0bd)); head.position.y = 1.75; runner.add(head);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 10, 0, Math.PI*2, 0, Math.PI/2), M(0xff4d6d)); cap.position.y = 1.8; runner.add(cap);
    const legs = [-0.17, 0.17].map(x => { const l = new THREE.Mesh(box, M(0x2c2c54)); l.scale.set(0.22, 0.6, 0.22); l.position.set(x, 0.3, 0); runner.add(l); return l; });
    const arms = [-0.5, 0.5].map(x => { const a = new THREE.Mesh(box, bm); a.scale.set(0.18, 0.6, 0.18); a.position.set(x, 1.05, 0); runner.add(a); return a; });
    let obs = [], coins = [], lane = 1, x = 0, y = 0, vy = 0, slide = 0, speed, dist, coinN, state = 'menu', spawnZ = 0, t0 = 0;
    const coinGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16), coinMat = new THREE.MeshLambertMaterial({color:0xffd23f, emissive:0x664400});
    function clear(){ obs.forEach(o => scene.remove(o.m)); coins.forEach(c => scene.remove(c.m)); obs = []; coins = []; }
    const reset = () => { clear(); lane = 1; x = 0; y = 0; vy = 0; slide = 0; speed = 16; dist = 0; coinN = 0; spawnZ = -40; state = 'play'; };
    function spawnRow(z){
      const pattern = randi(0, 5), free = randi(0, 2);
      LANES.forEach((lx, i) => {
        let type = null;
        if (pattern <= 1) type = i === free ? null : 'wall';
        else if (pattern === 2) type = 'low';
        else if (pattern === 3) type = 'high';
        else if (pattern === 4) type = i === free ? null : (Math.random() < .5 ? 'low' : 'high');
        else type = Math.random() < .4 ? ['low','high','wall'][randi(0,2)] : null;
        if (pattern <= 1 && i !== free && Math.random() < 0.3) type = 'low';
        if (!type){ for (let k=0;k<4;k++){ const c = new THREE.Mesh(coinGeo, coinMat); c.rotation.x = Math.PI/2; c.position.set(lx, 0.9, z - k*2.2); scene.add(c); coins.push({m:c, lane:i}); } return; }
        const m = new THREE.Mesh(box, M(type === 'wall' ? 0xff4d6d : type === 'low' ? 0xffd23f : 0x7b2ff7));
        if (type === 'wall'){ m.scale.set(1.9, 2.6, 1.2); m.position.set(lx, 1.3, z); }
        else if (type === 'low'){ m.scale.set(1.9, 0.8, 0.5); m.position.set(lx, 0.4, z); }
        else { m.scale.set(1.9, 0.5, 0.5); m.position.set(lx, 1.55, z); const p1 = new THREE.Mesh(box, M(0x444466)); p1.scale.set(0.15, 1.55, 0.15); p1.position.set(-0.95/1.9, -1.55, 0); }
        scene.add(m); obs.push({m, lane:i, type});
      });
      // at least one lane must be passable: walls never cover all three by construction
    }
    const go = d => { if (state === 'play'){ lane = clamp(lane + d, 0, 2); beep(500,.04,'sine',.04); } };
    const jump = () => { if (state === 'play' && y <= 0.001){ vy = 10.5; slide = 0; beep(620,.06,'triangle',.06,200); } };
    const duck = () => { if (state === 'play'){ slide = 0.65; if (y > 0) vy = -18; beep(300,.06,'triangle',.05,-100); } };
    const keys = ctx.keys();
    ctx.swipe(renderer.domElement, (dx, dy) => { if (dx) go(dx); else if (dy < 0) jump(); else duck(); }, () => jump());
    ctx.intro('Lane Runner', `<p>Run as far as you can. <b style="color:#ffd23f">Yellow</b> barriers: jump. <b style="color:#b98cff">Purple</b> bars: slide. <b style="color:#ff6b81">Red</b> blocks: switch lanes.</p><div class="keys">${isTouch?'Swipe left/right to switch · up to jump · down to slide':'←/→ or A/D switch lanes · ↑/W/Space jump · ↓/S slide'}</div>`, reset);
    const hud = ctx.div('hud', ''); hud.style.cssText = 'top:14px;left:50%;transform:translateX(-50%);font-size:20px;text-align:center';
    ctx.loop((dt, t) => {
      if (state === 'play'){
        if (keys.hit('ArrowLeft') || keys.hit('KeyA')) go(-1); if (keys.hit('ArrowRight') || keys.hit('KeyD')) go(1);
        if (keys.hit('ArrowUp') || keys.hit('KeyW') || keys.hit('Space')) jump(); if (keys.hit('ArrowDown') || keys.hit('KeyS')) duck();
        speed = Math.min(16 + dist*0.02, 34); dist += speed*dt;
        x = lerp(x, LANES[lane], Math.min(1, dt*14));
        vy -= 30*dt; y = Math.max(0, y + vy*dt); if (y === 0) vy = 0;
        slide = Math.max(0, slide - dt);
        const dz = speed*dt;
        spawnZ += dz; while (spawnZ > -60){ spawnRow(spawnZ - 60); spawnZ -= rand(14, 22) - Math.min(dist*0.002, 5); }
        track.children.forEach(s => { s.position.z += dz; if (s.position.z > 8) s.position.z -= 180; });
        props.forEach(p => { p.position.z += dz; if (p.position.z > 10) p.position.z -= 168; });
        const ph = slide > 0 ? 0.9 : 1.9;
        for (const o of obs){
          o.m.position.z += dz;
          if (Math.abs(o.m.position.z) < 0.6 && Math.abs(LANES[o.lane] - x) < 1.2){
            const hit = o.type === 'wall' || (o.type === 'low' && y < 0.75) || (o.type === 'high' && y + ph > 1.3);
            if (hit){ state = 'over'; noise(.4,.2,0,250); beep(160,.4,'sawtooth',.1,-80); const sc = Math.floor(dist/2) + coinN*10; ctx.over('lanerunner', sc, reset, {extra: coinN + ' coins'}); break; }
          }
        }
        for (const c of coins){ c.m.position.z += dz; c.m.rotation.z += dt*4; if (!c.got && Math.abs(c.m.position.z) < 0.8 && Math.abs(LANES[c.lane] - x) < 1 && y < 1.6){ c.got = true; c.m.visible = false; coinN++; beep(1200,.05,'square',.04); beep(1600,.06,'square',.03,0,.04); } }
        obs = obs.filter(o => { if (o.m.position.z > 6){ scene.remove(o.m); return false; } return true; });
        coins = coins.filter(c => { if (c.m.position.z > 6){ scene.remove(c.m); return false; } return true; });
      }
      // animate runner
      runner.position.set(x, y, 0);
      const run = state === 'play' && y === 0 && slide === 0 ? t*14 : 0;
      legs[0].rotation.x = Math.sin(run)*0.8; legs[1].rotation.x = -Math.sin(run)*0.8; arms[0].rotation.x = -Math.sin(run)*0.8; arms[1].rotation.x = Math.sin(run)*0.8;
      runner.rotation.x = slide > 0 ? -1.1 : 0; runner.position.y = y + (slide > 0 ? 0.3 : 0);
      runner.rotation.y = Math.PI;
      camera.position.set(x*0.5, 4.2, 7.5); camera.lookAt(x*0.3, 1.2, -6);
      hud.innerHTML = state === 'play' ? `${Math.floor(dist/2 + coinN*10)} <span style="font-size:14px;opacity:.8">· 🪙 ${coinN}</span>` : '';
      renderer.render(scene, camera);
    });
  }
});

GAMES.push({
  id:'stacktower', title:'Stack Tower', tag:'3D', cat:'3D', emoji:'🏗️', bg:'linear-gradient(135deg,#fc5c7d,#6a82fb)',
  desc:'3D timing game. Drop each sliding slab right on top of the last. Overhangs get sliced off.',
  start(ctx){
    const T3 = ctx.three(); if (!T3) return;
    const { renderer, camera, scene } = T3;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444466, 0.7));
    const dl = new THREE.DirectionalLight(0xffffff, 0.7); dl.position.set(5, 10, 7); scene.add(dl);
    const box = new THREE.BoxGeometry(1,1,1), H = 1;
    let stack, moving, falling = [], level, state = 'menu', dir, axis, pos, speed, combo, camY = 4, hue0 = rand(0, 360);
    const col = i => new THREE.Color(`hsl(${(hue0 + i*7) % 360}, 65%, 60%)`);
    function slab(w, d, x, y, z, i){ const m = new THREE.Mesh(box, new THREE.MeshLambertMaterial({color: col(i)})); m.scale.set(w, H, d); m.position.set(x, y, z); scene.add(m); return m; }
    function clear(){ [...(stack||[]), ...falling].forEach(s => scene.remove(s.m || s)); if (moving) scene.remove(moving.m); }
    function reset(){ clear(); stack = []; falling = []; hue0 = rand(0, 360); const base = slab(10, 10, 0, -4, 0, 0); base.scale.y = 9; base.position.y = -4; stack.push({m:base, w:10, d:10, x:0, z:0, y:0}); level = 0; combo = 0; speed = 10; spawn(); state = 'play'; }
    function spawn(){
      const top = stack[stack.length-1]; level++;
      axis = level % 2 ? 'x' : 'z'; dir = 1; pos = -14;
      const m = slab(top.w, top.d, axis === 'x' ? pos : top.x, level*H, axis === 'z' ? pos : top.z, level);
      moving = {m, w:top.w, d:top.d, x: axis === 'x' ? pos : top.x, z: axis === 'z' ? pos : top.z};
      scene.background = new THREE.Color(`hsl(${(hue0 + level*7 + 180) % 360}, 35%, 18%)`);
    }
    function place(){
      if (state !== 'play') return;
      const top = stack[stack.length-1], mv = moving;
      const size = axis === 'x' ? mv.w : mv.d, delta = (axis === 'x' ? mv.x - top.x : mv.z - top.z);
      let overlap = size - Math.abs(delta);
      if (overlap <= 0){ falling.push({m: mv.m, vy: 0, vr: rand(-2,2)}); moving = null; state = 'over'; noise(.3,.12,0,400); beep(180,.4,'sawtooth',.08,-80); ctx.over('stacktower', level-1, reset); return; }
      if (Math.abs(delta) < 0.25){ // perfect
        combo++; if (axis === 'x') mv.x = top.x; else mv.z = top.z; overlap = size;
        beep(520 + Math.min(combo, 12)*60, .12, 'triangle', .09);
        if (combo >= 3){ if (axis === 'x') { mv.w = Math.min(10, mv.w + 0.4); } else { mv.d = Math.min(10, mv.d + 0.4); } overlap = axis === 'x' ? mv.w : mv.d; }
      } else {
        combo = 0; beep(300, .08, 'square', .06);
        const cut = size - overlap, sign = Math.sign(delta);
        if (axis === 'x'){ const nx = top.x + delta/2; const cx = nx + sign*(overlap/2 + cut/2); falling.push({m: slab(cut, mv.d, cx, level*H, mv.z, level), vy: 0, vr: sign*rand(1,2), ax:'z'}); mv.w = overlap; mv.x = nx; }
        else { const nz = top.z + delta/2; const cz = nz + sign*(overlap/2 + cut/2); falling.push({m: slab(mv.w, cut, mv.x, level*H, cz, level), vy: 0, vr: sign*rand(1,2), ax:'x'}); mv.d = overlap; mv.z = nz; }
      }
      mv.m.scale.set(mv.w, H, mv.d); mv.m.position.set(mv.x, level*H, mv.z);
      stack.push({m: mv.m, w: mv.w, d: mv.d, x: mv.x, z: mv.z});
      speed = Math.min(10 + level*0.35, 22);
      spawn();
    }
    const keys = ctx.keys();
    ctx.on(renderer.domElement, 'pointerdown', () => { audioInit(); place(); });
    ctx.intro('Stack Tower', '<p>A slab slides across the top of your tower. Tap to drop it. Whatever hangs over the edge gets sliced off, so your tower shrinks unless you\'re precise. Three perfect drops in a row make it grow back.</p><div class="keys">Tap, click or Space</div>', reset);
    const hud = ctx.div('hud', ''); hud.style.cssText = 'top:60px;left:50%;transform:translateX(-50%);font-size:56px';
    scene.background = new THREE.Color('#222244');
    ctx.loop(dt => {
      if (keys.hit('Space')) place();
      if (state === 'play' && moving){
        pos += dir*speed*dt; if (pos > 14){ pos = 14; dir = -1; } if (pos < -14){ pos = -14; dir = 1; }
        if (axis === 'x') moving.x = pos; else moving.z = pos;
        moving.m.position.set(moving.x, level*H, moving.z);
      }
      falling.forEach(f => { f.vy -= 30*dt; f.m.position.y += f.vy*dt; if (f.ax === 'z') f.m.rotation.z += f.vr*dt; else f.m.rotation.x += f.vr*dt; });
      falling = falling.filter(f => { if (f.m.position.y < (level||0)*H - 40){ scene.remove(f.m); return false; } return true; });
      camY = lerp(camY, (level || 0)*H + 6, Math.min(1, dt*3));
      const zoom = state === 'over' ? Math.max(1, (level||1)*0.12) : 1;
      camera.position.set(14*zoom, camY + 8*(zoom-1)*0.5 + 2, 14*zoom); camera.lookAt(0, camY - 4 - (zoom-1)*(level||0)*0.4, 0);
      hud.textContent = state === 'menu' ? '' : Math.max(0, (level||1) - 1);
      renderer.render(scene, camera);
    });
  }
});
