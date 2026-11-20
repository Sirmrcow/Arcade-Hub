GAMES.push({
  id:'snake', title:'Neon Snake', tag:'2D', emoji:'🐍',
  bg:'linear-gradient(135deg,#0f3d2e,#39ff9f)',
  desc:'Classic snake with a glow-up. Eat, grow, speed up, and don\'t bite yourself.',
  start(ctx){
    const N = 20;
    let cell = 20, ox = 0, oy = 0;
    const C = ctx.canvas2d((W,H) => { cell = Math.floor(Math.min(W-24, H-110)/N); ox = Math.floor((W-cell*N)/2); oy = Math.floor((H-cell*N)/2)+20; });
    const g = C.g, panel = ctx.panel();
    let snake, dir, queue, food, bonus, score, best = Store.get('best_snake',0), state='menu', acc=0, parts=[];
    function place(){ let p; do { p = {x:randi(0,N-1), y:randi(0,N-1)}; } while (snake.some(s => s.x===p.x && s.y===p.y)); return p; }
    function reset(){ snake=[{x:8,y:10},{x:7,y:10},{x:6,y:10}]; dir={x:1,y:0}; queue=[]; score=0; food=place(); bonus=null; acc=0; parts=[]; }
    const interval = () => Math.max(0.055, 0.13 - score*0.0015);
    function turn(x,y){ const last = queue.length ? queue[queue.length-1] : dir; if (last.x === -x && last.y === -y) return; if (last.x===x && last.y===y) return; if (queue.length < 3) queue.push({x,y}); }
    function tick(){
      if (queue.length) dir = queue.shift();
      const h = {x:snake[0].x+dir.x, y:snake[0].y+dir.y};
      if (h.x<0||h.y<0||h.x>=N||h.y>=N||snake.some((s,i) => i<snake.length-1 && s.x===h.x && s.y===h.y)) return die();
      snake.unshift(h);
      if (h.x===food.x && h.y===food.y){ score++; food = place(); beep(520+score*6,.08,'square',.06); boom(h,'#39ff9f'); if (!bonus && Math.random()<.2) bonus = {...place(), t:6}; }
      else if (bonus && h.x===bonus.x && h.y===bonus.y){ score += 5; bonus = null; beep(880,.1,'triangle',.1); beep(1180,.12,'triangle',.08,0,.08); boom(h,'#ffd23f'); }
      else snake.pop();
    }
    function boom(c, col){ for (let i=0;i<12;i++){ const a=rand(0,6.28), v=rand(40,140); parts.push({x:ox+(c.x+.5)*cell, y:oy+(c.y+.5)*cell, vx:Math.cos(a)*v, vy:Math.sin(a)*v, life:.5, col}); } }
    function die(){
      state = 'over'; noise(.25,.15,0,500); beep(200,.35,'sawtooth',.1,-120);
      const r = Store.best('snake', score); best = r.best;
      panel.show({ title:'Game over', html:`<div class="big">${score}</div><p>${r.isNew && score>0 ? 'New best!' : 'Best '+best}</p>`, button:'Again', onClick: go });
    }
    function go(){ panel.hide(); reset(); state='play'; }
    reset();
    panel.show({ title:'Neon Snake', html:`<p>Eat the green dots. Gold ones are worth 5 but vanish fast. You speed up as you grow.</p><div class="keys">${isTouch?'Swipe to steer':'Arrow keys / WASD'}</div>`, button:'Play', onClick: go });
    ctx.on(window,'keydown', e => {
      const m = {ArrowUp:[0,-1],KeyW:[0,-1],ArrowDown:[0,1],KeyS:[0,1],ArrowLeft:[-1,0],KeyA:[-1,0],ArrowRight:[1,0],KeyD:[1,0]}[e.code];
      if (m){ e.preventDefault(); if (state==='play') turn(m[0],m[1]); }
      if (e.code==='Space' && state==='over') go();
    });
    let sx=0, sy=0;
    ctx.on(C.cv,'pointerdown', e => { sx=e.clientX; sy=e.clientY; });
    ctx.on(C.cv,'pointermove', e => { if (e.buttons===0 && e.pointerType==='mouse') return; const dx=e.clientX-sx, dy=e.clientY-sy; if (Math.hypot(dx,dy) > 24){ if (Math.abs(dx)>Math.abs(dy)) turn(Math.sign(dx),0); else turn(0,Math.sign(dy)); sx=e.clientX; sy=e.clientY; } });
    ctx.loop((dt,t) => {
      if (state==='play'){ acc += dt; while (acc > interval() && state==='play'){ acc -= interval(); tick(); } if (bonus){ bonus.t -= dt; if (bonus.t<=0) bonus=null; } }
      const W=C.W, H=C.H;
      g.fillStyle='#06110d'; g.fillRect(0,0,W,H);
      g.fillStyle='#0b1f17'; g.fillRect(ox,oy,cell*N,cell*N);
      g.strokeStyle='rgba(57,255,159,.06)'; g.lineWidth=1;
      for (let i=0;i<=N;i++){ g.beginPath(); g.moveTo(ox+i*cell,oy); g.lineTo(ox+i*cell,oy+N*cell); g.stroke(); g.beginPath(); g.moveTo(ox,oy+i*cell); g.lineTo(ox+N*cell,oy+i*cell); g.stroke(); }
      g.strokeStyle='#39ff9f'; g.lineWidth=2; g.strokeRect(ox,oy,cell*N,cell*N);
      const dot = (c,col,s=1) => { g.fillStyle=col; g.shadowColor=col; g.shadowBlur=14; g.beginPath(); g.arc(ox+(c.x+.5)*cell, oy+(c.y+.5)*cell, cell*.38*s, 0, 6.283); g.fill(); g.shadowBlur=0; };
      dot(food,'#39ff9f',1+Math.sin(t*6)*.12);
      if (bonus) dot(bonus,'#ffd23f',1+Math.sin(t*10)*.18);
      snake.forEach((s,i) => { const k = 1 - i/snake.length*.6; g.fillStyle = `hsla(${150-i*2},100%,${60*k+10}%,1)`; if (i===0){ g.shadowColor='#39ff9f'; g.shadowBlur=16; } const pad = i===0?1:2; g.fillRect(ox+s.x*cell+pad, oy+s.y*cell+pad, cell-pad*2, cell-pad*2); g.shadowBlur=0; });
      parts.forEach(p => { p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt; g.fillStyle=p.col; g.globalAlpha=Math.max(0,p.life*2); g.fillRect(p.x-2,p.y-2,4,4); g.globalAlpha=1; }); parts = parts.filter(p => p.life>0);
      g.fillStyle='#fff'; g.font='700 22px Space Grotesk, sans-serif'; g.textAlign='center'; g.fillText(score, W/2, oy-14);
      g.font='500 13px Space Grotesk, sans-serif'; g.globalAlpha=.6; g.fillText('best '+best, W/2, oy+N*cell+22); g.globalAlpha=1; g.textAlign='left';
    });
  }
});
