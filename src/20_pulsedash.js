GAMES.push({
  id:'pulsedash', title:'Pulse Dash', tag:'2D', emoji:'🔷',
  bg:'linear-gradient(135deg,#1e6bff,#ff3df2)',
  desc:'Rhythm runner. Your cube dashes on its own. Jump over spikes and hit the pads to reach 100%.',
  bestLabel:'Best', fmt: v => v+'%',
  start(ctx){
    const C = ctx.canvas2d();
    const g = C.g;
    const keys = ctx.keys();
    const panel = ctx.panel();
    const SPEED = 10.4, GRAV = 100, JUMP = 21, PAD = 28;

    // ---------- level (seeded, same every attempt) ----------
    let seed = 90210;
    const rng = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const obs = [];
    const spike = (x,y=0) => obs.push({t:'spike',x,y});
    const block = (x,y=0) => obs.push({t:'block',x,y});
    const pad = (x,y=0) => obs.push({t:'pad',x,y});
    const P = {
      single: x => { spike(x); return x+1; },
      double: x => { spike(x); spike(x+1); return x+2; },
      triple: x => { spike(x); spike(x+1); spike(x+2); return x+3; },
      platform: x => { for (let i=0;i<4;i++) block(x+i); return x+4; },
      stairs: x => { block(x); block(x+1); block(x+3); block(x+3,1); block(x+4); block(x+4,1); return x+5; },
      padjump: x => { pad(x); for (let i=2;i<=4;i++) spike(x+i); return x+5; },
      padplat: x => { pad(x); spike(x+2); spike(x+3); for (let i=4;i<=6;i++){ block(x+i,1); spike(x+i); } return x+9; },
      spikedplat: x => { for (let i=0;i<5;i++) block(x+i); spike(x+2,1); return x+5; },
    };
    const tiers = [
      ['single','single','double','platform'],
      ['single','double','platform','stairs','padjump'],
      ['double','triple','stairs','padjump','padplat','spikedplat'],
      ['double','triple','padjump','padplat','stairs','spikedplat','triple'],
    ];
    let lx = 14;
    const N = 42;
    for (let i=0;i<N;i++){
      const tier = tiers[Math.min(3, Math.floor(i/10))];
      const name = tier[Math.floor(rng()*tier.length)];
      lx = P[name](lx);
      lx += 6 + Math.floor(rng()*3) - Math.min(1, Math.floor(i/20));
    }
    const END = lx + 8;
    obs.sort((a,b) => a.x - b.x);

    // ---------- state ----------
    let p, attempts = Store.get('pd_attempts', 0), state = 'menu', deathT = 0, parts = [], trail = [], bestPct = Store.get('best_pulsedash', 0);
    function reset(){ p = {x:0, y:0, vy:0, grounded:true, rot:0}; obs.forEach(o => o.used = false); parts = []; trail = []; attempts++; Store.set('pd_attempts', attempts); musicStart(); }

    // ---------- music ----------
    let nextNote = 0, step = 0, musicOn = false;
    const BPM = 132, bass = [55,55,65.4,73.4, 55,55,82.4,73.4];
    function musicStart(){ if (!AC) return; musicOn = true; nextNote = AC.currentTime + 0.05; step = 0; }
    function musicTick(){
      if (!AC || !musicOn) return;
      const s16 = 60/BPM/4;
      while (nextNote < AC.currentTime + 0.12){
        const w = nextNote - AC.currentTime;
        if (step % 4 === 0) beep(140, .16, 'sine', .22, -95, w);
        if (step % 4 === 2) noise(.04, .05, w, 7000);
        if (step % 8 === 4) noise(.1, .07, w, 1800);
        if (step % 2 === 0) beep(bass[(step/2|0)%8], .14, 'sawtooth', .045, 0, w);
        if (step % 16 === 14 || step % 16 === 11) beep(bass[(step/4|0)%8]*4, .1, 'square', .03, 0, w);
        nextNote += s16; step++;
      }
    }

    function die(){
      state = 'dead'; deathT = 0; musicOn = false;
      noise(.3, .18, 0, 400); beep(200,.35,'sawtooth',.1,-150);
      const S = tile();
      for (let i=0;i<30;i++){ const a = rand(0,6.28), s = rand(2,9); parts.push({x:p.x+.5, y:p.y+.5, vx:Math.cos(a)*s, vy:Math.sin(a)*s, life:rand(.4,.8)}); }
      const pct = Math.floor(progress()*100);
      if (pct > bestPct){ bestPct = pct; Store.set('best_pulsedash', pct); }
    }
    function win(){
      state = 'won'; musicOn = false;
      bestPct = 100; Store.set('best_pulsedash', 100);
      [523,659,784,1047].forEach((f,i) => beep(f,.25,'triangle',.12,0,i*.12));
      panel.show({ title:'Level complete!', html:`<div class="big">100%</div><p>Finished in ${attempts} attempt${attempts===1?'':'s'} total.</p>`, button:'Play again', onClick(){ attempts = 0; panel.hide(); reset(); state='play'; } });
    }
    const progress = () => clamp(p.x / END, 0, 1);
    const tile = () => clamp(C.H/11, 26, 60);

    function physics(dt){
      const sub = 4, h = dt/sub;
      for (let s=0;s<sub;s++){
        const held = keys.down('Space') || keys.down('ArrowUp') || keys.down('KeyW') || mouseHeld;
        if (held && p.grounded){ p.vy = JUMP; p.grounded = false; }
        const prevY = p.y;
        p.x += SPEED*h; p.vy -= GRAV*h; p.y += p.vy*h;
        p.grounded = false;
        if (p.y <= 0){ p.y = 0; p.vy = 0; p.grounded = true; }
        for (const o of obs){
          if (o.x > p.x + 2) break;
          if (o.x < p.x - 2) continue;
          if (o.t === 'block'){
            if (p.x+1 > o.x+0.04 && p.x < o.x+0.96 && p.y < o.y+1 && p.y+1 > o.y){
              if (prevY >= o.y+1-0.3 && p.vy <= 0){ p.y = o.y+1; p.vy = 0; p.grounded = true; }
              else { die(); return; }
            }
          } else if (o.t === 'spike'){
            if (p.x+0.85 > o.x+0.36 && p.x+0.15 < o.x+0.64 && p.y+0.1 < o.y+0.6 && p.y+0.9 > o.y){ die(); return; }
          } else if (o.t === 'pad' && !o.used){
            if (p.x+1 > o.x && p.x < o.x+1 && p.y < o.y+0.4){ o.used = true; p.vy = PAD; p.grounded = false; beep(880,.15,'triangle',.1,440); }
          }
        }
      }
      if (!p.grounded) p.rot += dt * 7.4;
      else { const q = Math.PI/2; p.rot = lerp(p.rot, Math.round(p.rot/q)*q, 0.5); }
      if (p.x >= END) win();
    }

    let mouseHeld = false;
    ctx.on(C.cv, 'pointerdown', e => { e.preventDefault(); audioInit(); mouseHeld = true; });
    ctx.on(window, 'pointerup', () => mouseHeld = false);
    ctx.on(window, 'pointercancel', () => mouseHeld = false);

    // ---------- draw ----------
    const bgSq = Array.from({length:24}, () => ({x:rand(0,1), y:rand(0,0.7), s:rand(30,90), z:rand(0.1,0.4)}));
    function draw(t){
      const W = C.W, H = C.H, S = tile(), gy = H*0.72;
      const camX = p.x - (W*0.3)/S;
      const pr = progress();
      const hue = 230 + pr*140 + Math.sin(t*0.3)*10;
      const beat = musicOn ? Math.max(0, 1 - ((AC ? AC.currentTime : 0) * BPM/60 % 1)*3) : 0;
      const bg = g.createLinearGradient(0,0,0,H);
      bg.addColorStop(0, `hsl(${hue},70%,${18+beat*5}%)`); bg.addColorStop(1, `hsl(${hue+40},70%,8%)`);
      g.fillStyle = bg; g.fillRect(0,0,W,H);
      g.fillStyle = `hsla(${hue+20},80%,70%,0.07)`;
      bgSq.forEach(b => { const x = ((b.x*W*2 - camX*S*b.z) % (W*1.5) + W*1.5) % (W*1.5) - W*0.25; g.fillRect(x, b.y*H, b.s, b.s); });
      // ground
      g.fillStyle = `hsl(${hue+30},60%,10%)`; g.fillRect(0, gy, W, H-gy);
      g.strokeStyle = `hsla(${hue},90%,80%,0.9)`; g.lineWidth = 2; g.beginPath(); g.moveTo(0,gy); g.lineTo(W,gy); g.stroke();
      g.fillStyle = `hsla(${hue},80%,60%,0.12)`;
      for (let i=Math.floor(camX); i<camX+W/S+1; i++){ if (i%2===0) g.fillRect((i-camX)*S, gy, S, H-gy); }
      const sx = x => (x-camX)*S, sy = y => gy - y*S;
      // attempt label
      g.fillStyle = 'rgba(255,255,255,.85)'; g.font = `700 ${Math.round(S*0.8)}px Space Grotesk, sans-serif`;
      g.fillText('Attempt ' + attempts, sx(3), sy(4));
      // end portal
      g.fillStyle = 'rgba(120,255,200,.25)'; g.fillRect(sx(END), 0, S*0.6, gy);
      // obstacles
      for (const o of obs){
        const x = sx(o.x); if (x < -S*2 || x > W+S) continue;
        const y = sy(o.y);
        if (o.t === 'block'){
          g.fillStyle = '#0d0d1c'; g.fillRect(x, y-S, S, S);
          g.strokeStyle = `hsl(${hue},90%,75%)`; g.lineWidth = 2; g.strokeRect(x+1, y-S+1, S-2, S-2);
          g.strokeStyle = `hsla(${hue},90%,75%,.35)`; g.strokeRect(x+S*.25, y-S*.75, S*.5, S*.5);
        } else if (o.t === 'spike'){
          g.fillStyle = '#0d0d1c'; g.strokeStyle = '#fff'; g.lineWidth = 2;
          g.beginPath(); g.moveTo(x+2, y); g.lineTo(x+S/2, y-S*0.95); g.lineTo(x+S-2, y); g.closePath(); g.fill(); g.stroke();
        } else if (o.t === 'pad'){
          g.fillStyle = o.used ? '#ffe9a0' : '#ffd23f'; g.shadowColor = '#ffd23f'; g.shadowBlur = 16;
          g.beginPath(); g.ellipse(x+S/2, y, S*0.45, S*0.22, 0, Math.PI, 0); g.fill(); g.shadowBlur = 0;
        }
      }
      // trail + player
      if (state === 'play'){ trail.push({x:p.x, y:p.y}); if (trail.length>14) trail.shift(); }
      trail.forEach((q,i) => { g.fillStyle = `rgba(80,240,255,${i/trail.length*0.35})`; const s = S*0.5*(i/trail.length); g.fillRect(sx(q.x)+S/2-s/2, sy(q.y)-S/2-s/2, s, s); });
      if (state !== 'dead'){
        g.save(); g.translate(sx(p.x)+S/2, sy(p.y)-S/2); g.rotate(p.rot);
        g.fillStyle = '#ffe14d'; g.fillRect(-S/2, -S/2, S, S);
        g.fillStyle = '#28e6ff'; g.fillRect(-S/2+S*.14, -S/2+S*.14, S*.72, S*.72);
        g.fillStyle = '#ffe14d'; g.fillRect(-S*.2, -S*.2, S*.4, S*.4);
        g.strokeStyle = '#000'; g.lineWidth = 2; g.strokeRect(-S/2, -S/2, S, S);
        g.restore();
      }
      parts.forEach(q => { g.fillStyle = `rgba(80,240,255,${q.life})`; g.fillRect(sx(q.x)-4, sy(q.y)-4, 8, 8); });
      // progress bar
      const bw = Math.min(W*0.5, 360);
      g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(W/2-bw/2, 18, bw, 10);
      g.fillStyle = '#7dffb2'; g.fillRect(W/2-bw/2, 18, bw*pr, 10);
      g.fillStyle = '#fff'; g.font = '700 14px Space Grotesk, sans-serif'; g.textAlign = 'left';
      g.fillText(Math.floor(pr*100)+'%', W/2+bw/2+10, 28);
      g.textAlign = 'center'; g.globalAlpha = .7; g.fillText('Best ' + bestPct + '%', W/2, 50); g.globalAlpha = 1; g.textAlign = 'left';
    }

    p = {x:0,y:0,vy:0,grounded:true,rot:0};
    panel.show({ title:'Pulse Dash', html:`<p>Your cube moves by itself. Jump over spikes, land on blocks, and hit the yellow pads to launch. Get to the end.</p><div class="keys">${isTouch?'Tap or hold to jump':'Space / ↑ / click to jump — hold to keep jumping'}</div>`, button:'Play', onClick(){ panel.hide(); attempts = 0; reset(); state = 'play'; } });

    ctx.loop((dt, t) => {
      if (state === 'play'){ physics(dt); musicTick(); }
      else if (state === 'dead'){ deathT += dt; if (deathT > 0.8){ reset(); state = 'play'; } }
      parts.forEach(q => { q.x += q.vx*dt; q.y += q.vy*dt; q.vy -= 20*dt; q.life -= dt; }); parts = parts.filter(q => q.life > 0);
      draw(t);
    });
    ctx.cleanup(() => { musicOn = false; });
  }
});
