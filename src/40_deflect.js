GAMES.push({
  id:'deflect', title:'Deflect', tag:'3D', emoji:'⚔️',
  bg:'linear-gradient(135deg,#ff4d4d,#3a1c71)',
  desc:'Arena duel. A homing ball hunts one player at a time. Parry it at the last second and send it faster.',
  bestLabel:'Wins',
  start(ctx){
    const T = ctx.three(); if (!T) return;
    const { renderer, camera, scene } = T;
    scene.background = new THREE.Color('#0d0b1e');
    scene.fog = new THREE.Fog('#0d0b1e', 40, 110);
    scene.add(new THREE.HemisphereLight(0xbcc4ff, 0x221133, 0.75));
    const dl = new THREE.DirectionalLight(0xffffff, 0.5); dl.position.set(0.3,1,0.5); scene.add(dl);
    const R = 22;
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 1, 64), new THREE.MeshLambertMaterial({color:0x1b1838}));
    floor.position.y = -0.5; scene.add(floor);
    const ringMat = new THREE.MeshBasicMaterial({color:0x8a6bff});
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.15, 8, 96), ringMat); ring.rotation.x = Math.PI/2; ring.position.y = 0.02; scene.add(ring);
    for (let r=5; r<R; r+=5){ const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.04, 6, 80), new THREE.MeshBasicMaterial({color:0x3a3270})); t.rotation.x = Math.PI/2; t.position.y = 0.01; scene.add(t); }
    for (let i=0;i<16;i++){ const a = i/16*Math.PI*2; const pil = new THREE.Mesh(new THREE.BoxGeometry(1,rand(4,9),1), new THREE.MeshLambertMaterial({color:0x2a2550, emissive:0x120a30})); pil.position.set(Math.cos(a)*(R+4), pil.geometry.parameters.height/2-0.5, Math.sin(a)*(R+4)); scene.add(pil); }

    // ---------- players ----------
    const NAMES = ['You','Nova','Pixel','Bolt','Echo','Rune'];
    const COLORS = ['#ff7ab8','#4aa3ff','#7dff9b','#ffd23f','#c58bff','#ff9a4a'];
    function bean(color){
      const g = new THREE.Group(), m = new THREE.MeshLambertMaterial({color});
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.42,0.95,14), m); b.position.y = 0.9; g.add(b);
      const t = new THREE.Mesh(new THREE.SphereGeometry(0.42,14,10), m); t.position.y = 1.38; g.add(t);
      const u = new THREE.Mesh(new THREE.SphereGeometry(0.42,14,10), m); u.position.y = 0.42; g.add(u);
      const v = new THREE.Mesh(new THREE.BoxGeometry(0.55,0.26,0.2), new THREE.MeshLambertMaterial({color:0x1c2a4a, emissive:0x0a1430})); v.position.set(0,1.3,0.36); g.add(v);
      const arm = new THREE.Group(); arm.position.set(0.5, 1.0, 0); g.add(arm);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.3), new THREE.MeshLambertMaterial({color:0xe8f0ff, emissive:0x334466})); blade.position.z = 0.65; arm.add(blade);
      const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.12), new THREE.MeshLambertMaterial({color:0x444444})); arm.add(hilt);
      arm.rotation.x = -0.6;
      g.userData.arm = arm;
      return g;
    }
    const tagLayer = ctx.div('hud',''); tagLayer.style.cssText = 'inset:0;font-size:12px';
    const players = NAMES.map((n,i) => {
      const mesh = bean(COLORS[i]); scene.add(mesh);
      const tag = document.createElement('div'); tag.style.cssText = 'position:absolute;transform:translate(-50%,-100%);white-space:nowrap;padding:2px 6px;border-radius:6px;background:rgba(0,0,0,.45)'; tag.textContent = n; tagLayer.appendChild(tag);
      return { name:n, color:COLORS[i], you:i===0, mesh, tag, pos:new THREE.Vector3(), vel:new THREE.Vector3(), alive:true, window:0, cd:0, swing:0, facing:0, wander:new THREE.Vector3(), wanderT:0, skill:rand(0.88,1), dashT:0, dashCd:0, grounded:true };
    });
    const you = players[0];

    // ---------- ball ----------
    const ballMat = new THREE.MeshBasicMaterial({color:0xffffff});
    const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 14), ballMat); scene.add(ballMesh);
    const glow = new THREE.PointLight(0xffffff, 1.2, 10); ballMesh.add(glow);
    const trailN = 18, trailPts = Array.from({length:trailN}, () => new THREE.Vector3());
    const trailGeo = new THREE.BufferGeometry().setFromPoints(trailPts);
    const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({color:0xffffff, transparent:true, opacity:0.5})); scene.add(trail);
    const marker = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.05, 32), new THREE.MeshBasicMaterial({color:0xff3344, side:THREE.DoubleSide, transparent:true, opacity:0.85}));
    marker.rotation.x = -Math.PI/2; scene.add(marker);
    const ball = { pos:new THREE.Vector3(), vel:new THREE.Vector3(), speed:0, target:null, live:false, hits:0 };

    // ---------- round ----------
    let state = 'menu', countdown = 0, wins = Store.get('best_deflect', 0), shake = 0, spectate = 0, place = 0;
    const range = () => 4 + ball.speed*0.075;
    function newRound(){
      players.forEach((p,i) => {
        const a = i/players.length*Math.PI*2;
        p.pos.set(Math.cos(a)*12, 0, Math.sin(a)*12); p.vel.set(0,0,0); p.alive = true; p.mesh.visible = true; p.tag.style.display = '';
        p.window = 0; p.cd = 0; p.wanderT = 0; p.facing = Math.atan2(-p.pos.x, -p.pos.z);
      });
      yaw = Math.atan2(you.pos.x, you.pos.z); pitch = 0.35;
      ball.live = false; ballMesh.visible = false; trail.visible = false; marker.visible = false;
      state = 'count'; countdown = 3;
    }
    function launchBall(){
      ball.pos.set(0, 2.5, 0); ball.speed = 18; ball.hits = 0;
      const alive = players.filter(p => p.alive);
      setTarget(alive[Math.floor(Math.random()*alive.length)]);
      ball.vel.set(0,1,0);
      ball.live = true; ballMesh.visible = true; trail.visible = true; trailPts.forEach(v => v.copy(ball.pos));
      beep(300,.3,'sawtooth',.08,300);
    }
    function setTarget(p){
      ball.target = p;
      if (!p.you){ p.reactDist = range()*rand(0.2, 0.85); const chance = clamp(1.02 - (ball.speed-18)*0.0065, 0.3, 0.97)*p.skill; p.willParry = Math.random() < chance; }
      if (p.you) beep(1200,.05,'square',.04);
    }
    function deflect(by){
      by.swing = 1; by.cd = 0; by.window = 0;
      ball.hits++; ball.speed = Math.min(170, ball.speed + 2.5 + ball.speed*0.05);
      const others = players.filter(p => p.alive && p !== by);
      let next;
      if (by.you){
        const fwd = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
        let bestD = -2;
        for (const o of others){ const d = o.pos.clone().sub(you.pos).setY(0).normalize().dot(fwd); if (d > bestD){ bestD = d; next = o; } }
        shake = 0.35;
      } else next = (you.alive && you !== by && Math.random() < 0.4) ? you : others[Math.floor(Math.random()*others.length)];
      const dir = next.pos.clone().add(new THREE.Vector3(0,1,0)).sub(ball.pos).normalize();
      ball.vel.copy(dir).add(new THREE.Vector3(rand(-.4,.4), 0.6, rand(-.4,.4))).normalize();
      setTarget(next);
      beep(500 + Math.min(ball.speed,170)*8, .12, 'triangle', .12, 200); noise(.05,.08,0,3000);
    }
    function eliminate(p){
      p.alive = false; p.mesh.visible = false; p.tag.style.display = 'none';
      noise(.35,.2,0,300); beep(160,.4,'sawtooth',.1,-100);
      const alive = players.filter(q => q.alive);
      if (p.you){ place = alive.length + 1; if (document.pointerLockElement) document.exitPointerLock(); }
      if (alive.length <= 1){ endRound(alive[0]); return; }
      ball.live = false; ballMesh.visible = false; trail.visible = false; marker.visible = false;
      state = 'count'; countdown = 2;
    }
    function endRound(winner){
      state = 'end'; ball.live = false; ballMesh.visible = false; trail.visible = false; marker.visible = false;
      if (document.pointerLockElement) document.exitPointerLock();
      if (winner && winner.you){ wins++; Store.set('best_deflect', wins); [523,659,784,1047].forEach((f,i)=>beep(f,.25,'triangle',.12,0,i*.12)); }
      const html = winner && winner.you ? `<div class="big">🏆</div><p>Last one standing. Total wins: ${wins}</p>` : `<p>${winner ? winner.name+' took the round.' : 'Nobody survived.'} You placed #${place || 1}.</p><p>Total wins: ${wins}</p>`;
      setTimeout(() => panel.show({ title: winner && winner.you ? 'Victory!' : 'Round over', html, button:'Next round', onClick(){ panel.hide(); newRound(); if (!isTouch) look.lock(); } }), 700);
    }

    // ---------- input ----------
    let yaw = 0, pitch = 0.35;
    const keys = ctx.keys();
    const pad = ctx.touchPad(['Parry','Jump','Dash']);
    const panel = ctx.panel();
    const look = ctx.mouseLook(renderer.domElement, (dx,dy) => { yaw -= dx*0.003; pitch = clamp(pitch + dy*0.003, 0.05, 1.1); }, locked => { if (!locked && (state==='live'||state==='count') && you.alive) pauseIt(); });
    let paused = false;
    function pauseIt(){ paused = true; panel.show({ title:'Paused', button:'Resume', onClick(){ panel.hide(); paused = false; if (!isTouch) look.lock(); } }); }
    function tryParry(){
      if (!you.alive || you.cd > 0 || you.window > 0) return;
      you.window = 0.28; you.swing = 1; beep(900,.05,'square',.03);
    }
    ctx.on(renderer.domElement, 'mousedown', e => { if (!look.locked){ if (!isTouch && state !== 'menu' && state !== 'end') look.lock(); return; } if (e.button === 0) tryParry(); });
    panel.show({ title:'Deflect', html:`<p>A homing ball targets one player at a time — it turns <b style="color:#ff5566">red</b> when it's coming for you. Parry just before it hits to send it at someone else, faster. Last one standing wins.</p><div class="keys">${isTouch?'Left thumb move · Drag to aim · Parry / Jump / Dash buttons':'WASD move · Mouse aim · Click or F to parry · Space jump · Shift dash'}<br>Your parry sends the ball at whoever you're facing.</div>`, button:'Enter arena', onClick(){ panel.hide(); newRound(); if (!isTouch) look.lock(); } });

    // ---------- HUD ----------
    const hud = ctx.div('hud',''); hud.style.cssText = 'top:14px;left:50%;transform:translateX(-50%);font-size:17px;text-align:center';
    const big = ctx.div('hud',''); big.style.cssText = 'top:38%;left:50%;transform:translate(-50%,-50%);font-size:64px';
    const cdBar = ctx.div('hud','<div></div>'); cdBar.style.cssText = 'bottom:26px;left:50%;transform:translateX(-50%);width:180px;height:10px;border-radius:5px;background:rgba(255,255,255,.15);overflow:hidden';
    const cdFill = cdBar.firstChild; cdFill.style.cssText = 'height:100%;width:100%;background:#7dffb2';
    const cdLabel = ctx.div('hud','PARRY'); cdLabel.style.cssText = 'bottom:40px;left:50%;transform:translateX(-50%);font-size:12px;letter-spacing:2px;opacity:.8';
    ctx.div('cross');

    const tmp = new THREE.Vector3();
    function movePlayer(p, mx, mz, speed, dt, jump){
      const acc = p.grounded ? 12 : 5;
      if (p.dashT > 0){ p.dashT -= dt; }
      else { p.vel.x = lerp(p.vel.x, mx*speed, Math.min(1,acc*dt)); p.vel.z = lerp(p.vel.z, mz*speed, Math.min(1,acc*dt)); }
      if (Math.hypot(mx,mz) > 0.2) p.facing = Math.atan2(mx, mz);
      if (jump && p.grounded){ p.vel.y = 10; p.grounded = false; }
      p.vel.y -= 28*dt;
      p.pos.addScaledVector(p.vel, dt);
      if (p.pos.y <= 0){ p.pos.y = 0; p.vel.y = 0; p.grounded = true; }
      const d = Math.hypot(p.pos.x, p.pos.z); if (d > R-1){ p.pos.x *= (R-1)/d; p.pos.z *= (R-1)/d; }
    }

    ctx.loop((dt, t) => {
      if (paused){ renderer.render(scene, camera); return; }
      ring.material.color.setHSL((t*0.05)%1, 0.7, 0.6);
      // ----- you -----
      yaw -= pad.lx*0.007; pitch = clamp(pitch + pad.ly*0.007, 0.05, 1.1); pad.lx = pad.ly = 0;
      if (state === 'live' || state === 'count'){
        if (you.alive){
          if (keys.hit('KeyF') || keys.hit('KeyE') || pad.take('Parry')) tryParry();
          let f = (keys.down('KeyW')||keys.down('ArrowUp')?1:0) - (keys.down('KeyS')||keys.down('ArrowDown')?1:0) - pad.my;
          let s = (keys.down('KeyD')||keys.down('ArrowRight')?1:0) - (keys.down('KeyA')||keys.down('ArrowLeft')?1:0) + pad.mx;
          const m = Math.hypot(f,s); if (m>1){ f/=m; s/=m; }
          const mx = -Math.sin(yaw)*f + Math.cos(yaw)*s, mz = -Math.cos(yaw)*f - Math.sin(yaw)*s;
          you.dashCd -= dt;
          if ((keys.hit('ShiftLeft') || pad.take('Dash')) && you.dashCd <= 0){
            const dx = Math.hypot(mx,mz) > 0.1 ? mx : -Math.sin(yaw), dz = Math.hypot(mx,mz) > 0.1 ? mz : -Math.cos(yaw), n = Math.hypot(dx,dz);
            you.vel.x = dx/n*28; you.vel.z = dz/n*28; you.dashT = 0.16; you.dashCd = 1.8; noise(.12,.06,0,1500);
          }
          movePlayer(you, mx, mz, 9, dt, keys.down('Space') || pad.take('Jump'));
          you.facing = yaw + Math.PI;
          if (you.window > 0){ you.window -= dt; if (you.window <= 0) you.cd = 0.75; }
          else if (you.cd > 0) you.cd -= dt;
        }
        // ----- bots -----
        for (const b of players){
          if (b.you || !b.alive) continue;
          b.wanderT -= dt;
          if (b.wanderT <= 0){ const a = rand(0,Math.PI*2), r = rand(3, R-3); b.wander.set(Math.cos(a)*r, 0, Math.sin(a)*r); b.wanderT = rand(1,3); }
          tmp.copy(b.wander).sub(b.pos).setY(0);
          const d = tmp.length(); let mx = 0, mz = 0; if (d > 1){ mx = tmp.x/d; mz = tmp.z/d; }
          movePlayer(b, mx, mz, 6.5, dt, Math.random() < 0.004);
          if (ball.live){ b.facing = Math.atan2(ball.pos.x - b.pos.x, ball.pos.z - b.pos.z); }
        }
      }
      // ----- state machine -----
      if (state === 'count'){
        countdown -= dt;
        big.textContent = countdown > 0 ? Math.ceil(countdown) : '';
        if (countdown <= 0){ state = 'live'; launchBall(); }
      } else big.textContent = '';
      if (state === 'live' && ball.live){
        const tg = ball.target;
        const tp = tmp.copy(tg.pos).add(new THREE.Vector3(0,1.1,0));
        const toT = tp.clone().sub(ball.pos), dist = toT.length();
        // parries
        if (tg.you && tg.window > 0 && dist < range()) deflect(tg);
        else if (!tg.you && tg.willParry && dist < tg.reactDist) deflect(tg);
        else {
          const desired = toT.normalize();
          const turn = (dist < 5 ? 40 : 3 + ball.speed*0.12) * dt;
          ball.vel.addScaledVector(desired, turn).normalize();
          const step = ball.speed*dt;
          if (step >= dist - 0.9){ eliminate(tg); }
          else ball.pos.addScaledVector(ball.vel, step);
          if (ball.pos.y < 0.5){ ball.pos.y = 0.5; ball.vel.y = Math.abs(ball.vel.y); }
        }
        if (ball.live){
          const mine = ball.target && ball.target.you;
          ballMat.color.set(mine ? 0xff3344 : 0xffffff); glow.color.set(mine ? 0xff3344 : 0xffffff); trail.material.color.set(mine ? 0xff3344 : 0xffffff);
          ballMesh.position.copy(ball.pos);
          trailPts.pop(); trailPts.unshift(ball.pos.clone()); trailGeo.setFromPoints(trailPts);
          marker.visible = true; marker.position.set(ball.target.pos.x, 0.03, ball.target.pos.z);
          marker.scale.setScalar(1 + Math.sin(t*12)*0.1);
        }
      }
      // ----- render players -----
      players.forEach(p => {
        p.mesh.position.copy(p.pos);
        let dr = p.facing - p.mesh.rotation.y; while (dr > Math.PI) dr -= Math.PI*2; while (dr < -Math.PI) dr += Math.PI*2;
        p.mesh.rotation.y += dr*Math.min(1, dt*14);
        p.swing = Math.max(0, p.swing - dt*4);
        p.mesh.userData.arm.rotation.y = -Math.sin(p.swing*Math.PI)*2.2;
        p.mesh.userData.arm.rotation.x = -0.6 + Math.sin(p.swing*Math.PI)*0.6;
        if (!p.alive){ return; }
        const sp = p.pos.clone().add(new THREE.Vector3(0,2.3,0)).project(camera);
        const vis = sp.z < 1 && (!p.you);
        p.tag.style.display = vis ? '' : 'none';
        if (vis){ p.tag.style.left = ((sp.x+1)/2*ctx.el.clientWidth)+'px'; p.tag.style.top = ((1-sp.y)/2*ctx.el.clientHeight)+'px'; p.tag.style.color = ball.live && ball.target === p ? '#ff6677' : '#fff'; }
      });
      // ----- camera -----
      shake = Math.max(0, shake - dt);
      if (you.alive){
        const dist = 7.5;
        camera.position.set(you.pos.x + Math.sin(yaw)*Math.cos(pitch)*dist, you.pos.y + 1.8 + Math.sin(pitch)*dist, you.pos.z + Math.cos(yaw)*Math.cos(pitch)*dist);
        camera.lookAt(you.pos.x - Math.sin(yaw)*4, you.pos.y + 1.6, you.pos.z - Math.cos(yaw)*4);
      } else {
        spectate += dt*0.25;
        camera.position.set(Math.sin(spectate)*30, 18, Math.cos(spectate)*30); camera.lookAt(0,0,0);
      }
      if (shake > 0) camera.position.add(new THREE.Vector3(rand(-1,1),rand(-1,1),rand(-1,1)).multiplyScalar(shake*0.6));
      // ----- HUD -----
      const alive = players.filter(p => p.alive).length;
      hud.innerHTML = `Alive ${alive}/${players.length} &nbsp;·&nbsp; Ball ${Math.round(ball.speed)} &nbsp;·&nbsp; Wins ${wins}${!you.alive && state!=='end' ? '<br><span style="font-size:13px;opacity:.7">Spectating…</span>' : ''}`;
      const ready = you.cd <= 0 && you.window <= 0;
      cdFill.style.width = (you.window > 0 ? 100 : ready ? 100 : (1 - you.cd/0.75)*100) + '%';
      cdFill.style.background = you.window > 0 ? '#ffd23f' : ready ? '#7dffb2' : '#ff5566';
      renderer.render(scene, camera);
    });
  }
});
