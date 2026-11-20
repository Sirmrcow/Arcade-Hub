GAMES.push({
  id:'orbithop', title:'Orbit Hop', tag:'2D', emoji:'🪐',
  bg:'linear-gradient(135deg,#2b2a6b,#ff9ad5)',
  desc:'One-button space hopper. Fling off your orbit, catch the next planet, outrun the rising dark.',
  start(ctx){
    const C = ctx.canvas2d(), g = C.g;
    const panel = ctx.panel();
    const scoreEl = ctx.div('hud',''); scoreEl.style.cssText = 'top:58px;left:20px;font-size:36px';
    const PAL = [210,280,330,20,45,160,190];
    const stars = Array.from({length:160}, () => ({x:Math.random(), y:Math.random(), z:rand(.15,1), tw:rand(0,6.28)}));
    let planets, pl, camY, tideY, score, gems, parts, trail, state='menu', time=0, shake=0, ft=0, lastP=null;
    let best = Store.get('best_orbithop', 0);
    function mk(x,y,i){ const p = {x,y,r:rand(14,24),orbit:Math.max(44,rand(58,78)-Math.min(i*.35,14)),hue:PAL[randi(0,PAL.length-1)],visited:false,ring:Math.random()<.3,gem:null,pulse:0}; if (i>0 && Math.random()<.45) p.gem={a:rand(0,6.28),taken:false}; return p; }
    function addP(){ const l = planets[planets.length-1], i = planets.length, span = Math.min(C.W,520), left=(C.W-span)/2+80, right=(C.W+span)/2-80; let x, n=0; do { x = rand(left,right); } while (Math.abs(x-l.x)<60 && ++n<10); planets.push(mk(x, l.y - rand(150,210) - Math.min(i*1.5,60), i)); }
    function reset(){ planets=[mk(C.W/2,0,0)]; planets[0].visited=true; for(let i=0;i<8;i++) addP(); pl={mode:'orbit',p:planets[0],a:Math.PI/2,dir:1,x:0,y:0,vx:0,vy:0}; camY=-C.H*.68; tideY=260; score=0; gems=0; time=0; parts=[]; trail=[]; lastP=null; }
    const om = () => Math.min(1.9+score*.05, 3.6);
    const burst = (x,y,h,n=16,s=160) => { for(let i=0;i<n;i++){ const a=rand(0,6.28), v=rand(s*.3,s); parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rand(.4,.9),h}); } };
    function launch(){ if (state!=='play'||pl.mode!=='orbit') return; pl.vx=-Math.sin(pl.a)*pl.dir*560; pl.vy=Math.cos(pl.a)*pl.dir*560; lastP=pl.p; pl.mode='fly'; ft=0; beep(520,.1,'triangle',.12,260); }
    function over(msg){
      if (state!=='play') return; state='over'; shake=14; burst(pl.x,pl.y,0,40,260); beep(220,.5,'sawtooth',.12,-160);
      const r = Store.best('orbithop', score); best = r.best;
      setTimeout(() => panel.show({ title:msg, html:`<div class="big">${score}</div><p>${r.isNew && score>0 ? 'New best!' : 'Best '+best} · ◆ ${gems}</p>`, button:'Hop again', onClick: go }), 600);
    }
    function go(){ panel.hide(); reset(); state='play'; }
    reset(); state='idle';
    panel.show({ title:'Orbit Hop', html:'<p>You circle a planet. Tap to fling off in a straight line — catch the next orbit before you drift away, and stay ahead of the rising dark. ◆ gems are worth +3.</p><div class="keys">Tap · Click · Space</div>', button:'Play', onClick: go });
    ctx.on(C.cv, 'pointerdown', e => { e.preventDefault(); launch(); });
    ctx.on(window, 'keydown', e => { if (e.code==='Space'){ e.preventDefault(); if (state==='play') launch(); } });

    function update(dt){
      time += dt;
      if (state==='idle'){ pl.a += om()*dt; pl.x = pl.p.x+Math.cos(pl.a)*pl.p.orbit; pl.y = pl.p.y+Math.sin(pl.a)*pl.p.orbit; return; }
      if (state==='play'){
        if (pl.mode==='orbit'){ pl.a += pl.dir*om()*dt; pl.x = pl.p.x+Math.cos(pl.a)*pl.p.orbit; pl.y = pl.p.y+Math.sin(pl.a)*pl.p.orbit; }
        else {
          ft += dt; pl.x += pl.vx*dt; pl.y += pl.vy*dt;
          for (const p of planets){
            const dx=pl.x-p.x, dy=pl.y-p.y, d=Math.hypot(dx,dy);
            if (p===lastP && d < p.orbit+12) continue;
            if (d < p.r+3){ over('Crashed!'); return; }
            if (d < p.orbit+8){
              pl.dir = (dx*pl.vy - dy*pl.vx) >= 0 ? 1 : -1; pl.a = Math.atan2(dy,dx); pl.p = p; pl.mode='orbit'; p.pulse=1;
              if (!p.visited){ p.visited=true; score++; beep(660+Math.min(score,30)*18,.14,'sine',.16); burst(pl.x,pl.y,p.hue); } else beep(440,.08,'sine',.08);
              break;
            }
          }
          const sy = pl.y-camY;
          if (pl.mode==='fly' && (pl.x<-40||pl.x>C.W+40||sy<-60||sy>C.H+60||ft>2.2)){ over('Lost in space'); return; }
        }
        for (const p of planets){ if (!p.gem||p.gem.taken) continue; const gx=p.x+Math.cos(p.gem.a)*p.orbit, gy=p.y+Math.sin(p.gem.a)*p.orbit; if (Math.hypot(pl.x-gx,pl.y-gy)<16){ p.gem.taken=true; gems++; score+=3; burst(gx,gy,45,14,140); beep(990,.09,'square',.07); beep(1320,.1,'square',.06,0,.07); } }
        trail.push({x:pl.x,y:pl.y}); if (trail.length>26) trail.shift();
        camY = lerp(camY, (pl.mode==='orbit'?pl.p.y:pl.y) - C.H*.66, 1-Math.pow(.04,dt));
        tideY -= (16 + Math.min(score*2.2,70) + Math.min(time*.6,30))*dt;
        tideY = Math.min(tideY, camY+C.H+140);
        if (pl.y > tideY-4){ over('Swallowed by the dark'); return; }
        while (planets[planets.length-1].y > camY-C.H) addP();
        planets = planets.filter(p => p.y < tideY+300 || p===pl.p);
        planets.forEach(p => p.pulse = Math.max(0,p.pulse-dt*2));
      }
    }
    function draw(){
      const W=C.W, H=C.H;
      const bg=g.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#0a0b1e'); bg.addColorStop(1,'#120a22'); g.fillStyle=bg; g.fillRect(0,0,W,H);
      stars.forEach(s => { const y=((s.y*H - camY*s.z*.25)%H+H)%H; g.fillStyle=`rgba(220,225,255,${(.35+.35*Math.sin(time*2+s.tw))*s.z})`; g.fillRect(s.x*W,y,s.z*1.8,s.z*1.8); });
      g.save(); if (shake>0) g.translate(rand(-shake,shake),rand(-shake,shake)); g.translate(0,-camY);
      for (const p of planets){
        if (p.y-camY < -150 || p.y-camY > H+150) continue;
        g.beginPath(); g.arc(p.x,p.y,p.orbit,0,6.283); g.setLineDash([3,7]); g.strokeStyle=`hsla(${p.hue},80%,75%,${p===pl.p?.45:.18})`; g.lineWidth=1.5; g.stroke(); g.setLineDash([]);
        if (p.pulse>0){ g.beginPath(); g.arc(p.x,p.y,p.orbit+(1-p.pulse)*30,0,6.283); g.strokeStyle=`hsla(${p.hue},90%,75%,${p.pulse*.6})`; g.lineWidth=2; g.stroke(); }
        const gl=g.createRadialGradient(p.x,p.y,p.r*.5,p.x,p.y,p.r*3); gl.addColorStop(0,`hsla(${p.hue},90%,65%,.35)`); gl.addColorStop(1,'transparent'); g.fillStyle=gl; g.beginPath(); g.arc(p.x,p.y,p.r*3,0,6.283); g.fill();
        const bd=g.createRadialGradient(p.x-p.r*.4,p.y-p.r*.4,p.r*.1,p.x,p.y,p.r); bd.addColorStop(0,`hsl(${p.hue},85%,78%)`); bd.addColorStop(1,`hsl(${p.hue},65%,38%)`); g.fillStyle=bd; g.beginPath(); g.arc(p.x,p.y,p.r,0,6.283); g.fill();
        if (p.ring){ g.save(); g.translate(p.x,p.y); g.rotate(-.4); g.beginPath(); g.ellipse(0,0,p.r*1.7,p.r*.45,0,0,6.283); g.strokeStyle=`hsla(${p.hue+30},80%,80%,.6)`; g.lineWidth=2; g.stroke(); g.restore(); }
        if (p.gem && !p.gem.taken){ const gx=p.x+Math.cos(p.gem.a)*p.orbit, gy=p.y+Math.sin(p.gem.a)*p.orbit, s=6+Math.sin(time*5)*1.2; g.save(); g.translate(gx,gy); g.rotate(time*1.5); g.shadowColor='#ffd38a'; g.shadowBlur=14; g.fillStyle='#ffd38a'; g.beginPath(); g.moveTo(0,-s); g.lineTo(s*.7,0); g.lineTo(0,s); g.lineTo(-s*.7,0); g.closePath(); g.fill(); g.restore(); }
      }
      if (state==='play' && pl.mode==='orbit'){ const tx=-Math.sin(pl.a)*pl.dir, ty=Math.cos(pl.a)*pl.dir; const gr=g.createLinearGradient(pl.x,pl.y,pl.x+tx*90,pl.y+ty*90); gr.addColorStop(0,'rgba(255,255,255,.35)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.strokeStyle=gr; g.lineWidth=2; g.beginPath(); g.moveTo(pl.x,pl.y); g.lineTo(pl.x+tx*90,pl.y+ty*90); g.stroke(); }
      trail.forEach((t,i) => { const k=i/trail.length; g.fillStyle=`rgba(255,200,240,${k*.5})`; g.beginPath(); g.arc(t.x,t.y,1+k*3.5,0,6.283); g.fill(); });
      if (state!=='over'){ g.save(); g.shadowColor='#fff'; g.shadowBlur=18; g.fillStyle='#fff'; g.beginPath(); g.arc(pl.x,pl.y,6,0,6.283); g.fill(); g.restore(); }
      parts.forEach(q => { g.fillStyle=`hsla(${q.h},90%,75%,${q.life/.9})`; g.fillRect(q.x-2,q.y-2,4,4); });
      const tg=g.createLinearGradient(0,tideY-120,0,tideY+40); tg.addColorStop(0,'rgba(120,40,200,0)'); tg.addColorStop(.75,'rgba(120,40,200,.45)'); tg.addColorStop(1,'rgba(20,0,40,.95)'); g.fillStyle=tg; g.fillRect(0,tideY-120,W,160);
      g.fillStyle='rgba(20,0,40,.95)'; g.fillRect(0,tideY+40,W,H+400);
      g.beginPath(); g.moveTo(0,tideY); for (let x=0;x<=W;x+=12) g.lineTo(x,tideY+Math.sin(x*.04+time*3)*5); g.strokeStyle='rgba(200,120,255,.7)'; g.lineWidth=2; g.stroke();
      g.restore();
    }
    ctx.loop(dt => {
      update(dt);
      parts.forEach(q => { q.x+=q.vx*dt; q.y+=q.vy*dt; q.vx*=.96; q.vy*=.96; q.life-=dt; }); parts = parts.filter(q => q.life>0); shake = Math.max(0, shake-dt*40);
      draw();
      scoreEl.innerHTML = state==='play' ? `${score}<div style="font-size:13px;opacity:.7">◆ ${gems} · best ${best}</div>` : '';
    });
  }
});
