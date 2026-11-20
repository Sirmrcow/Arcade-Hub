GAMES.push({
  id:'bricks', title:'Brick Breaker', tag:'2D', emoji:'🧱',
  bg:'linear-gradient(135deg,#ff6a3d,#ffd23f)',
  desc:'Smash every brick. Catch power-ups for wide paddles and multi-ball. Levels get tougher.',
  start(ctx){
    let W=0, H=0, bw=0, bh=0, top=70, fieldX=0, FW=0, paddle=null;
    const COLS = 10;
    const C = ctx.canvas2d((w,h) => { W=w; H=h; FW = Math.min(w-20, 640); fieldX = (w-FW)/2; bw = FW/COLS; bh = Math.max(16, Math.min(26, h/30)); if (paddle) paddle.y = H-50; });
    const g = C.g, panel = ctx.panel(), keys = ctx.keys();
    let balls, bricks, drops, parts, level, lives, score, state='menu', best = Store.get('best_bricks',0), stuck = true;
    const COLORS = ['#ff4d6d','#ff8a3d','#ffd23f','#7dff9b','#4ad8ff','#9a7bff'];
    function buildLevel(){
      bricks = []; const rows = Math.min(5 + level, 9);
      for (let r=0;r<rows;r++) for (let c=0;c<COLS;c++){
        if (level % 3 === 2 && (r+c)%3===0) continue;
        if (level % 3 === 0 && level>0 && Math.abs(c-4.5) < r*0.6 - 1) continue;
        const hp = r < Math.floor(level/2) ? 2 : 1;
        bricks.push({ c, r, hp, max:hp, col: COLORS[r % COLORS.length] });
      }
      drops = []; resetBall();
    }
    const rectOf = b => ({ x: fieldX + b.c*bw + 2, y: top + b.r*bh + 2, w: bw-4, h: bh-4 });
    function resetBall(){ paddle.w = Math.min(FW*0.18, 110); balls = [{x:paddle.x, y:paddle.y-12, vx:0, vy:0, r:7}]; stuck = true; }
    function newGame(){ level = 0; lives = 3; score = 0; paddle = {x:W/2, y:H-50, w:100, wideT:0}; parts=[]; buildLevel(); state='play'; panel.hide(); }
    const speed = () => Math.min(420 + level*35, 700) * Math.max(0.8, Math.min(1.3, H/800));
    function serve(){ if (!stuck) return; stuck = false; const a = rand(-0.5, 0.5); balls[0].vx = Math.sin(a)*speed(); balls[0].vy = -Math.cos(a)*speed(); beep(440,.06,'square',.05); }
    function boom(x,y,col,n=10){ for (let i=0;i<n;i++){ const a=rand(0,6.28), v=rand(40,200); parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rand(.3,.6),col}); } }
    ctx.on(C.cv,'pointermove', e => { const r = C.cv.getBoundingClientRect(); if (paddle) paddle.x = e.clientX - r.left; });
    ctx.on(C.cv,'pointerdown', e => { audioInit(); const r = C.cv.getBoundingClientRect(); if (paddle) paddle.x = e.clientX - r.left; if (state==='play') serve(); });
    panel.show({ title:'Brick Breaker', html:`<p>Clear every brick to advance. Some take two hits. Catch falling power-ups: <b style="color:#4ad8ff">W</b> wide paddle, <b style="color:#ffd23f">M</b> multi-ball, <b style="color:#ff4d6d">♥</b> extra life.</p><div class="keys">${isTouch?'Drag to move · Tap to launch':'Mouse or ←/→ to move · Click or Space to launch'}</div>`, button:'Play', onClick: newGame });
    function lose(){
      lives--; noise(.2,.12,0,400); beep(180,.3,'sawtooth',.08,-80);
      if (lives <= 0){ state='over'; const r = Store.best('bricks', score); best = r.best; panel.show({ title:'Game over', html:`<div class="big">${score}</div><p>Reached level ${level+1} · ${r.isNew && score>0 ? 'New best!' : 'Best '+best}</p>`, button:'Play again', onClick:newGame }); }
      else resetBall();
    }
    ctx.loop(dt => {
      if (state==='play'){
        if (keys.down('ArrowLeft')||keys.down('KeyA')) paddle.x -= 700*dt;
        if (keys.down('ArrowRight')||keys.down('KeyD')) paddle.x += 700*dt;
        if (keys.hit('Space')) serve();
        if (paddle.wideT > 0){ paddle.wideT -= dt; paddle.w = lerp(paddle.w, Math.min(FW*0.3, 180), .2); } else paddle.w = lerp(paddle.w, Math.min(FW*0.18,110), .1);
        paddle.x = clamp(paddle.x, fieldX + paddle.w/2, fieldX + FW - paddle.w/2);
        paddle.y = H-50;
        if (stuck){ balls[0].x = paddle.x; balls[0].y = paddle.y - 12; }
        else {
          const sub = 3;
          for (let s=0;s<sub;s++){
            for (const b of balls){
              b.x += b.vx*dt/sub; b.y += b.vy*dt/sub;
              if (b.x < fieldX + b.r){ b.x = fieldX + b.r; b.vx = Math.abs(b.vx); }
              if (b.x > fieldX + FW - b.r){ b.x = fieldX + FW - b.r; b.vx = -Math.abs(b.vx); }
              if (b.y < top - 20 + b.r){ b.y = top - 20 + b.r; b.vy = Math.abs(b.vy); }
              // paddle
              if (b.vy > 0 && b.y + b.r > paddle.y - 7 && b.y - b.r < paddle.y + 7 && Math.abs(b.x - paddle.x) < paddle.w/2 + b.r){
                const off = clamp((b.x - paddle.x)/(paddle.w/2), -1, 1), a = off*1.05, sp = speed();
                b.vx = Math.sin(a)*sp; b.vy = -Math.cos(a)*sp; b.y = paddle.y - 7 - b.r; beep(330,.05,'square',.05);
              }
              // bricks
              for (const k of bricks){
                if (k.hp <= 0) continue;
                const rc = rectOf(k);
                const nx = clamp(b.x, rc.x, rc.x+rc.w), ny = clamp(b.y, rc.y, rc.y+rc.h);
                if ((b.x-nx)**2 + (b.y-ny)**2 < b.r*b.r){
                  const ovX = Math.min(b.x + b.r - rc.x, rc.x + rc.w - (b.x - b.r)), ovY = Math.min(b.y + b.r - rc.y, rc.y + rc.h - (b.y - b.r));
                  if (ovX < ovY) b.vx = -b.vx; else b.vy = -b.vy;
                  k.hp--; score += 10;
                  if (k.hp <= 0){ boom(rc.x+rc.w/2, rc.y+rc.h/2, k.col); beep(500 + k.r*60, .06, 'triangle', .07);
                    if (Math.random() < 0.13){ const t = ['W','M','♥'][Math.random()<.45?0:Math.random()<.75?1:2]; drops.push({x:rc.x+rc.w/2, y:rc.y, t}); } }
                  else beep(300,.05,'triangle',.05);
                  break;
                }
              }
            }
          }
          balls = balls.filter(b => b.y < H + 20);
          if (!balls.length) lose();
        }
        drops.forEach(d => { d.y += 160*dt; if (d.y > paddle.y-10 && d.y < paddle.y+10 && Math.abs(d.x-paddle.x) < paddle.w/2+10){ d.got = true; beep(880,.1,'sine',.1);
          if (d.t==='W') paddle.wideT = 12; else if (d.t==='♥') lives++; else if (!stuck){ const src = balls[0]; if (src) for (let i=0;i<2;i++){ const a = rand(-0.8,0.8); balls.push({x:src.x, y:src.y, vx:Math.sin(a)*speed(), vy:-Math.cos(a)*speed(), r:7}); } } } });
        drops = drops.filter(d => !d.got && d.y < H+20);
        if (state==='play' && bricks.every(k => k.hp <= 0)){ level++; score += 100; [523,659,784].forEach((f,i)=>beep(f,.15,'triangle',.1,0,i*.1)); buildLevel(); }
      }
      // draw
      g.fillStyle = '#120d1f'; g.fillRect(0,0,W,H);
      if (!paddle) return;
      g.fillStyle = '#1a1430'; g.fillRect(fieldX, top-20, FW, H-top+20);
      g.strokeStyle = 'rgba(255,255,255,.15)'; g.strokeRect(fieldX, top-20, FW, H-top+20);
      for (const k of bricks){ if (k.hp<=0) continue; const rc = rectOf(k); g.fillStyle = k.col; g.globalAlpha = k.hp < k.max ? .55 : 1; g.fillRect(rc.x, rc.y, rc.w, rc.h); g.globalAlpha = 1; g.fillStyle='rgba(255,255,255,.25)'; g.fillRect(rc.x, rc.y, rc.w, 3); if (k.max>1){ g.strokeStyle='#fff'; g.lineWidth=2; g.strokeRect(rc.x+1, rc.y+1, rc.w-2, rc.h-2); } }
      drops.forEach(d => { g.fillStyle = d.t==='W'?'#4ad8ff':d.t==='M'?'#ffd23f':'#ff4d6d'; g.beginPath(); g.arc(d.x,d.y,11,0,6.283); g.fill(); g.fillStyle='#120d1f'; g.font='700 12px Space Grotesk, sans-serif'; g.textAlign='center'; g.fillText(d.t, d.x, d.y+4); g.textAlign='left'; });
      g.fillStyle = '#eef0ff'; g.shadowColor = '#9fb4ff'; g.shadowBlur = 14; g.fillRect(paddle.x - paddle.w/2, paddle.y - 7, paddle.w, 14); g.shadowBlur = 0;
      balls.forEach(b => { g.fillStyle='#fff'; g.shadowColor='#fff'; g.shadowBlur=12; g.beginPath(); g.arc(b.x,b.y,b.r,0,6.283); g.fill(); g.shadowBlur=0; });
      parts.forEach(p => { p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt; g.globalAlpha=Math.max(0,p.life*2); g.fillStyle=p.col; g.fillRect(p.x-2,p.y-2,4,4); g.globalAlpha=1; }); parts = parts.filter(p=>p.life>0);
      g.fillStyle='#fff'; g.font='700 16px Space Grotesk, sans-serif'; g.textAlign='center';
      g.fillText(`Score ${score}   ·   Level ${level+1}   ·   ${'♥'.repeat(Math.max(0,lives))}`, W/2, 30);
      if (stuck && state==='play'){ g.globalAlpha=.7; g.font='500 14px Space Grotesk, sans-serif'; g.fillText(isTouch?'Tap to launch':'Click or Space to launch', W/2, paddle.y-40); g.globalAlpha=1; }
      g.textAlign='left';
    });
  }
});
