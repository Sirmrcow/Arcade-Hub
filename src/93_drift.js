GAMES.push({
  id:'driftking', title:'Drift King', tag:'3D', cat:'3D', emoji:'🏎️', bg:'linear-gradient(135deg,#ff512f,#2b1d4a)',
  desc:'3D car drifting. Throw the car sideways through the corners, chain drifts for a multiplier, set the high score.',
  start(ctx){
    const T = ctx.three(); if (!T) return;
    const { renderer, camera, scene } = T;
    camera.far = 900; camera.updateProjectionMatrix();
    scene.background = new THREE.Color('#8fc0ec'); scene.fog = new THREE.Fog('#8fc0ec', 90, 380);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x4a6a3a, 0.85));
    const sun = new THREE.DirectionalLight(0xfff2dd, 0.75); sun.position.set(-0.6, 1, 0.4); scene.add(sun);

    // ---------- track ----------
    const RAW = [[0,0],[70,8],[118,46],[112,104],[60,118],[38,160],[82,206],[30,250],[-44,236],[-70,188],[-40,140],[-96,100],[-92,40],[-50,8]];
    const curve = new THREE.CatmullRomCurve3(RAW.map(([x,z]) => new THREE.Vector3(x*1.25, 0, z*1.25 - 150)), true, 'centripetal');
    const N = 520, P = curve.getSpacedPoints(N).slice(0, N), HW = 8.5, WALL = HW + 5;
    const NRM = P.map((p, i) => { const t = P[(i+1)%N].clone().sub(P[(i-1+N)%N]).normalize(); return new THREE.Vector3(t.z, 0, -t.x); });
    const TAN = P.map((p, i) => P[(i+1)%N].clone().sub(P[(i-1+N)%N]).normalize());
    function ribbon(off0, off1, y, colorFn){
      const pos = [], col = [];
      for (let i=0;i<N;i++){
        const j = (i+1)%N, c = new THREE.Color(colorFn(i));
        const a0 = P[i].clone().addScaledVector(NRM[i], off0), a1 = P[i].clone().addScaledVector(NRM[i], off1);
        const b0 = P[j].clone().addScaledVector(NRM[j], off0), b1 = P[j].clone().addScaledVector(NRM[j], off1);
        [a0,a1,b1, a0,b1,b0].forEach(v => { pos.push(v.x, y, v.z); col.push(c.r, c.g, c.b); });
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
      const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({vertexColors:true, side:THREE.DoubleSide})); scene.add(m); return m;
    }
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.MeshLambertMaterial({color:0x5f9a46})); ground.rotation.x = -Math.PI/2; ground.position.y = -0.02; scene.add(ground);
    ribbon(-HW-3.5, HW+3.5, 0.0, () => 0x8a7a5a);           // gravel run-off
    ribbon(-HW, HW, 0.02, i => (i % 2 ? 0x3b3c44 : 0x3f4048)); // asphalt
    ribbon(HW-1.2, HW, 0.03, i => (Math.floor(i/3) % 2 ? 0xe23b3b : 0xf4f4f4)); // kerbs
    ribbon(-HW, -HW+1.2, 0.03, i => (Math.floor(i/3) % 2 ? 0xe23b3b : 0xf4f4f4));
    ribbon(-0.15, 0.15, 0.03, i => (Math.floor(i/4) % 2 ? 0xf2f2f2 : 0x3f4048)); // centre dashes
    // start line
    const chk = document.createElement('canvas'); chk.width = 64; chk.height = 16; const cg = chk.getContext('2d');
    for (let x=0;x<16;x++) for (let y=0;y<4;y++){ cg.fillStyle = (x+y)%2 ? '#111' : '#fff'; cg.fillRect(x*4, y*4, 4, 4); }
    const tex = new THREE.CanvasTexture(chk); tex.magFilter = THREE.NearestFilter;
    const sl = new THREE.Mesh(new THREE.PlaneGeometry(HW*2, 3), new THREE.MeshBasicMaterial({map:tex})); sl.rotation.x = -Math.PI/2; sl.rotation.z = -Math.atan2(TAN[0].x, TAN[0].z); sl.position.set(P[0].x, 0.04, P[0].z); scene.add(sl);
    // tyre walls / barriers
    const bGeo = new THREE.BoxGeometry(1.2, 1.1, 2.1), nb = Math.floor(N/2)*2;
    const barriers = new THREE.InstancedMesh(bGeo, new THREE.MeshLambertMaterial(), nb);
    const dm = new THREE.Object3D(); let bi = 0;
    for (let i=0;i<N;i+=2) for (const s of [1,-1]){
      dm.position.copy(P[i]).addScaledVector(NRM[i], s*(WALL+0.6)); dm.position.y = 0.55; dm.rotation.set(0, Math.atan2(TAN[i].x, TAN[i].z), 0); dm.updateMatrix();
      barriers.setMatrixAt(bi, dm.matrix); barriers.setColorAt(bi, new THREE.Color(Math.floor(i/6)%2 ? 0xd8d8d8 : 0x2a6cff)); bi++;
    }
    scene.add(barriers);
    function nearest(x, z){ let bi = 0, bd = 1e9; for (let i=0;i<N;i++){ const dx = P[i].x - x, dz = P[i].z - z, d = dx*dx + dz*dz; if (d < bd){ bd = d; bi = i; } } return bi; }
    // trees + grandstand
    const treeN = 220, trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35,0.45,2.4,6), new THREE.MeshLambertMaterial({color:0x6b4a2b}), treeN), crown = new THREE.InstancedMesh(new THREE.ConeGeometry(2.4, 6, 7), new THREE.MeshLambertMaterial({color:0x2f7a3a}), treeN);
    for (let k=0;k<treeN;k++){
      let x, z, tries = 0; do { x = rand(-260, 260); z = rand(-300, 260); tries++; } while (tries < 40 && Math.hypot(P[nearest(x,z)].x - x, P[nearest(x,z)].z - z) < WALL + 10);
      const s = rand(0.8, 1.5); dm.rotation.set(0,0,0); dm.scale.set(s,s,s);
      dm.position.set(x, 1.2*s, z); dm.updateMatrix(); trunk.setMatrixAt(k, dm.matrix);
      dm.position.set(x, 5*s, z); dm.updateMatrix(); crown.setMatrixAt(k, dm.matrix);
    }
    dm.scale.set(1,1,1); scene.add(trunk, crown);
    const stand = new THREE.Mesh(new THREE.BoxGeometry(30, 6, 6), new THREE.MeshLambertMaterial({color:0x6a6f86})); const so = P[6].clone().addScaledVector(NRM[6], -(WALL+9)); stand.position.set(so.x, 3, so.z); stand.rotation.y = Math.atan2(TAN[6].x, TAN[6].z) + Math.PI/2; scene.add(stand);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(32, 0.5, 8), new THREE.MeshLambertMaterial({color:0xff4d6d})); roof.position.set(so.x, 7, so.z); roof.rotation.y = stand.rotation.y; scene.add(roof);

    // ---------- car ----------
    const COLORS = { Red:0xe8283c, Blue:0x2a6cff, Yellow:0xffc61a, White:0xf2f2f2, Black:0x1d1d24 };
    let carColor = Store.get('drift_color', 'Red');
    const car = new THREE.Group(); scene.add(car);
    const paint = new THREE.MeshLambertMaterial({color: COLORS[carColor] || COLORS.Red});
    const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); car.add(m); return m; };
    const B = (w,h,d) => new THREE.BoxGeometry(w,h,d);
    add(B(1.9, 0.5, 4.3), paint, 0, 0.6, 0);
    add(B(1.55, 0.48, 2.0), paint, 0, 1.08, -0.25);
    add(B(1.5, 0.4, 0.06), new THREE.MeshLambertMaterial({color:0x1a2433}), 0, 1.08, 0.76).rotation.x = -0.5;
    add(B(1.6, 0.06, 0.5), paint, 0, 1.15, -2.0);
    add(B(0.08, 0.35, 0.3), paint, 0.7, 0.95, -2.0); add(B(0.08, 0.35, 0.3), paint, -0.7, 0.95, -2.0);
    const lightM = new THREE.MeshBasicMaterial({color:0xfff6cc}), tailM = new THREE.MeshBasicMaterial({color:0xff2030});
    add(B(0.45, 0.16, 0.05), lightM, 0.6, 0.65, 2.16); add(B(0.45, 0.16, 0.05), lightM, -0.6, 0.65, 2.16);
    add(B(0.5, 0.14, 0.05), tailM, 0.6, 0.7, -2.16); add(B(0.5, 0.14, 0.05), tailM, -0.6, 0.7, -2.16);
    add(B(1.95, 0.08, 0.4), new THREE.MeshLambertMaterial({color:0x111111}), 0, 0.35, 2.05);
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.32, 14); wheelGeo.rotateZ(Math.PI/2);
    const tyre = new THREE.MeshLambertMaterial({color:0x151515}), rim = new THREE.MeshLambertMaterial({color:0xbfc4cc});
    const wheels = [[1,1.35],[-1,1.35],[1,-1.35],[-1,-1.35]].map(([sx, z]) => { const g = new THREE.Group(); g.position.set(sx*0.98, 0.4, z); const w = new THREE.Mesh(wheelGeo, tyre); g.add(w); const r = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.34,8).rotateZ(Math.PI/2), rim); g.add(r); car.add(g); return g; });
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 5), new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity:0.32, depthWrite:false})); blob.rotation.x = -Math.PI/2; scene.add(blob);

    // ---------- effects ----------
    const skidN = 900, skid = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.32, 0.9).rotateX(-Math.PI/2), new THREE.MeshBasicMaterial({color:0x111111, transparent:true, opacity:0.4, depthWrite:false}), skidN);
    dm.scale.set(0,0,0); dm.updateMatrix(); for (let i=0;i<skidN;i++) skid.setMatrixAt(i, dm.matrix); dm.scale.set(1,1,1); skid.frustumCulled = false; scene.add(skid);
    let skidI = 0;
    const smoke = Array.from({length:70}, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), new THREE.MeshBasicMaterial({color:0xe8e8e8, transparent:true, opacity:0, depthWrite:false})); m.visible = false; scene.add(m); return {m, life:0}; });
    let smokeI = 0;
    function puff(x, z, k){ const s = smoke[smokeI++ % smoke.length]; s.m.position.set(x + rand(-.3,.3), 0.4, z + rand(-.3,.3)); s.life = 1; s.k = k; s.m.visible = true; s.m.scale.setScalar(0.6); }
    function mark(x, z, ang){ dm.position.set(x, 0.045, z); dm.rotation.set(0, ang, 0); dm.updateMatrix(); skid.setMatrixAt(skidI++ % skidN, dm.matrix); skid.instanceMatrix.needsUpdate = true; }

    // ---------- state ----------
    const st = { x:0, z:0, th:0, vx:0, vz:0, w:0, steer:0 };
    let mode = 'attack', state = 'menu', time = 120, score = 0, combo = 0, comboT = 0, idleT = 0, lap = 0, lapT = 0, bestLap = Store.get('drift_bestlap', null), half = false, lastIdx = 0, camMode = 0, shake = 0, maxCombo = 0;
    function placeCar(){ st.x = P[4].x; st.z = P[4].z; st.th = Math.atan2(TAN[4].x, TAN[4].z); st.vx = st.vz = st.w = 0; lastIdx = 4; half = false; lapT = 0; lap = 0; }
    placeCar();

    // ---------- UI ----------
    const css = 'background:rgba(10,10,25,.55);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:8px 14px;';
    const top = ctx.div('hud', ''); top.style.cssText = 'top:58px;left:50%;transform:translateX(-50%);text-align:center;' + css;
    const spd = ctx.div('hud', ''); spd.style.cssText = 'left:16px;bottom:16px;' + css + 'min-width:120px';
    const drift = ctx.div('hud', ''); drift.style.cssText = 'left:50%;bottom:120px;transform:translateX(-50%);text-align:center;font-size:20px;transition:opacity .2s';
    const pop = ctx.div('hud', ''); pop.style.cssText = 'left:50%;top:32%;transform:translateX(-50%);font-size:34px;opacity:0;transition:opacity .3s,transform .3s';
    const lapEl = ctx.div('hud', ''); lapEl.style.cssText = 'right:16px;top:58px;text-align:right;font-size:13px;' + css;
    const showPop = (t, c) => { pop.textContent = t; pop.style.color = c; pop.style.opacity = 1; pop.style.transform = 'translateX(-50%) scale(1.1)'; clearTimeout(showPop.t); showPop.t = setTimeout(() => { pop.style.opacity = 0; pop.style.transform = 'translateX(-50%)'; }, 900); };
    const keys = ctx.keys();
    const pad = ctx.touchPad(['Gas','Brake','Drift']);
    const panel = ctx.panel();
    function menu(){
      state = 'menu';
      const sw = Object.keys(COLORS).map(c => `<button data-c="${c}" style="width:34px;height:34px;border-radius:50%;border:3px solid ${c===carColor?'#fff':'transparent'};background:#${COLORS[c].toString(16).padStart(6,'0')}"></button>`).join('');
      panel.show({ title:'Drift King', html:`<p>Slide the car sideways through the corners. The longer and wider your drift, the bigger the multiplier. Hit a wall or run off the track and you lose the combo.</p><div style="display:flex;gap:8px;justify-content:center">${sw}</div><div class="keys">${isTouch ? 'Joystick steer · Gas / Brake buttons · Drift = handbrake' : 'W/↑ gas · S/↓ brake & reverse · A/D steer · Space handbrake · C camera'}</div><button class="btn ghost" id="dkFree" style="margin-top:0">Free drive</button>`, button:'Drift Attack · 2 min', onClick(){ start('attack'); } });
      panel.el.querySelectorAll('[data-c]').forEach(b => b.onclick = e => { e.stopPropagation(); carColor = b.dataset.c; Store.set('drift_color', carColor); paint.color.setHex(COLORS[carColor]); panel.el.querySelectorAll('[data-c]').forEach(x => x.style.borderColor = x === b ? '#fff' : 'transparent'); });
      panel.el.querySelector('#dkFree').onclick = e => { e.stopPropagation(); audioInit(); start('free'); };
    }
    function start(m){ mode = m; panel.hide(); placeCar(); time = 120; score = 0; combo = 0; comboT = 0; maxCombo = 0; state = 'play'; }
    menu();

    // ---------- audio ----------
    let eng = null;
    function ensureAudio(){
      if (eng || !AC) return;
      try {
        const o = AC.createOscillator(), o2 = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain();
        o.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 900; g.gain.value = 0;
        o.connect(f); o2.connect(f); f.connect(g); g.connect(AC.destination); o.start(); o2.start();
        const n = AC.sampleRate*2, buf = AC.createBuffer(1, n, AC.sampleRate), d = buf.getChannelData(0); for (let i=0;i<n;i++) d[i] = Math.random()*2-1;
        const s = AC.createBufferSource(); s.buffer = buf; s.loop = true; const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 3; const sg = AC.createGain(); sg.gain.value = 0;
        s.connect(bp); bp.connect(sg); sg.connect(AC.destination); s.start();
        eng = { o, o2, g, sg };
      } catch(e){}
    }
    ctx.cleanup(() => { if (eng){ try { eng.o.stop(); eng.o2.stop(); eng.g.disconnect(); eng.sg.disconnect(); } catch(e){} } });

    // ---------- loop ----------
    const camPos = new THREE.Vector3(st.x, 6, st.z - 12), look = new THREE.Vector3();
    ctx.loop((dt, t) => {
      if (keys.hit('KeyC')) camMode = (camMode + 1) % 3;
      let thr = 0, brk = 0, steer = 0, hb = false;
      if (state === 'play'){
        thr = (keys.down('KeyW') || keys.down('ArrowUp') || pad.btn['Gas']) ? 1 : 0;
        brk = (keys.down('KeyS') || keys.down('ArrowDown') || pad.btn['Brake']) ? 1 : 0;
        steer = clamp((keys.down('KeyA') || keys.down('ArrowLeft') ? 1 : 0) - (keys.down('KeyD') || keys.down('ArrowRight') ? 1 : 0) - pad.mx, -1, 1);
        hb = keys.down('Space') || !!pad.btn['Drift'];
        if (isTouch && pad.my < -0.4) thr = 1;
      }
      st.steer = lerp(st.steer, steer, Math.min(1, dt*10));
      // --- physics ---
      const fx = Math.sin(st.th), fz = Math.cos(st.th), rx = Math.cos(st.th), rz = -Math.sin(st.th);
      let vl = st.vx*fx + st.vz*fz, vlat = st.vx*rx + st.vz*rz;
      const sp = Math.hypot(st.vx, st.vz);
      const velAng = sp > 0.5 ? Math.atan2(st.vx, st.vz) : st.th;
      let slip = velAng - st.th; while (slip > Math.PI) slip -= Math.PI*2; while (slip < -Math.PI) slip += Math.PI*2;
      if (vl < -0.5) slip = 0;
      const idx = nearest(st.x, st.z), off = (st.x - P[idx].x)*NRM[idx].x + (st.z - P[idx].z)*NRM[idx].z, onRoad = Math.abs(off) < HW + 0.6, onGravel = !onRoad;
      if (thr) vl += (vl < 0 ? 22 : 15 * (1 - Math.min(1, vl/52))) * dt;
      if (brk){ if (vl > 0.8) vl -= 26*dt; else vl = Math.max(vl - 9*dt, -10); }
      if (hb) vl -= Math.sign(vl) * Math.min(Math.abs(vl), 6*dt);
      vl -= (0.004*vl*Math.abs(vl) + 0.12*vl + (onGravel ? 1.6*vl : 0)) * dt;
      const sliding = Math.abs(slip) > 0.22;
      const powerOver = thr && sp > 13 && Math.abs(st.steer) > 0.6;
      let grip = hb ? 0.8 : onGravel ? 5 : sliding ? (thr ? 1.6 : 3) : powerOver ? 2.0 : 5.5;
      if (Math.abs(slip) > 1.05) grip = Math.max(grip, 4.5);
      const latLoss = vlat * (1 - Math.exp(-grip*dt));
      vlat -= latLoss;
      if (sliding && vl > 0) vl += Math.abs(latLoss) * (thr ? 0.55 : 0.3);
      const sf = Math.min(1, sp/5) * (vl < 0 ? -1 : 1);
      const rate = 2.3 / (1 + sp/60);
      let target = st.steer * rate * sf * (hb ? 1.25 : 1);
      if (sliding && thr) target += st.steer * 0.45 * Math.sign(vl);
      st.w = lerp(st.w, target, Math.min(1, dt * (sliding ? 3 : 8)));
      st.w += slip * 1.7 * dt * Math.min(1, sp/15) * (sliding && thr ? 0.55 : 1);
      if (Math.abs(slip) > 1.1) st.w *= Math.exp(-3*dt);
      st.th += st.w*dt;
      const nfx = Math.sin(st.th), nfz = Math.cos(st.th), nrx = Math.cos(st.th), nrz = -Math.sin(st.th);
      st.vx = nfx*vl + nrx*vlat; st.vz = nfz*vl + nrz*vlat;
      st.x += st.vx*dt; st.z += st.vz*dt;
      // walls
      const idx2 = nearest(st.x, st.z), off2 = (st.x - P[idx2].x)*NRM[idx2].x + (st.z - P[idx2].z)*NRM[idx2].z;
      if (Math.abs(off2) > WALL - 1){
        const s = Math.sign(off2), push = Math.abs(off2) - (WALL - 1);
        st.x -= NRM[idx2].x*push*s; st.z -= NRM[idx2].z*push*s;
        const vn = st.vx*NRM[idx2].x + st.vz*NRM[idx2].z;
        if (vn*s > 0){ st.vx -= NRM[idx2].x*vn*1.5; st.vz -= NRM[idx2].z*vn*1.5; st.vx *= 0.75; st.vz *= 0.75; if (Math.abs(vn) > 4){ shake = 0.4; noise(.18, .25, 0, 300); beep(90, .15, 'square', .1, -40); } if (combo > 0 && state === 'play'){ showPop('Combo lost', '#ff6b81'); combo = 0; comboT = 0; } }
      }
      // --- drift scoring ---
      const driftAng = Math.abs(slip), drifting = state === 'play' && sp > 9 && driftAng > 0.26 && driftAng < 1.75 && onRoad;
      if (drifting){
        comboT += dt; idleT = 0;
        const mult = Math.min(1 + Math.floor(comboT/1.6), 8);
        combo += dt * sp * driftAng * 6 * mult;
      } else if (combo > 0){
        idleT += dt;
        if (!onRoad && state === 'play'){ showPop('Off track!', '#ff6b81'); combo = 0; comboT = 0; }
        else if (idleT > 0.7){ const c = Math.round(combo); score += c; maxCombo = Math.max(maxCombo, c); showPop('+' + c.toLocaleString(), '#7dffb2'); beep(660,.08,'triangle',.08); beep(880,.1,'triangle',.08,0,.07); combo = 0; comboT = 0; }
      }
      // effects
      const skidding = (driftAng > 0.2 && sp > 6) || (hb && sp > 5) || (brk && vl > 14);
      if (skidding){
        for (const sx of [1,-1]){ const wx = st.x + nrx*sx*0.98 - nfx*1.35, wz = st.z + nrz*sx*0.98 - nfz*1.35; mark(wx, wz, st.th); if (Math.random() < 0.55) puff(wx, wz, driftAng); }
      }
      smoke.forEach(s => { if (s.life <= 0) return; s.life -= dt*0.9; s.m.position.y += dt*0.8; s.m.scale.multiplyScalar(1 + dt*1.6); s.m.material.opacity = Math.max(0, s.life*0.45); if (s.life <= 0) s.m.visible = false; });
      // laps
      if (state === 'play'){
        lapT += dt;
        if (idx > N*0.4 && idx < N*0.6) half = true;
        if (half && lastIdx > N*0.9 && idx < N*0.1){ lap++; half = false; if (bestLap == null || lapT < bestLap){ bestLap = lapT; Store.set('drift_bestlap', +lapT.toFixed(2)); showPop('Best lap ' + lapT.toFixed(2) + 's', '#ffd23f'); } lapT = 0; }
        lastIdx = idx;
        if (mode === 'attack'){ time -= dt; if (time <= 0){ time = 0; if (combo > 0){ score += Math.round(combo); combo = 0; } state = 'over'; if (document.pointerLockElement) document.exitPointerLock(); const r = Store.best('driftking', score); panel.show({ title:'Time!', html:`<div class="big">${score.toLocaleString()}</div><p>${r.isNew ? 'New high score!' : 'Best ' + r.best.toLocaleString()} · biggest combo ${maxCombo.toLocaleString()}</p>`, button:'Drift again', onClick(){ start('attack'); } }); } }
      }
      // --- render car ---
      car.position.set(st.x, 0, st.z); car.rotation.y = st.th;
      car.rotation.z = clamp(-vlat*0.012, -0.08, 0.08); car.rotation.x = clamp((thr ? -0.015 : 0) + (brk ? 0.03 : 0), -0.05, 0.05);
      wheels[0].rotation.y = wheels[1].rotation.y = st.steer*0.5;
      wheels.forEach(w => w.children[0].rotation.x += vl*dt/0.4);
      blob.position.set(st.x, 0.04, st.z); blob.rotation.z = -st.th;
      // camera
      shake = Math.max(0, shake - dt);
      const hd = sp > 4 ? Math.atan2(lerp(Math.sin(st.th), st.vx/sp, 0.35), lerp(Math.cos(st.th), st.vz/sp, 0.35)) : st.th;
      const dist = camMode === 1 ? 16 : 8.5, h = camMode === 1 ? 9 : 3.6;
      if (camMode === 2){ camera.position.set(st.x + nfx*0.4, 1.35, st.z + nfz*0.4); camera.lookAt(st.x + nfx*10, 1.1, st.z + nfz*10); }
      else {
        const want = new THREE.Vector3(st.x - Math.sin(hd)*dist, h, st.z - Math.cos(hd)*dist);
        camPos.lerp(want, 1 - Math.exp(-dt*5)); camera.position.copy(camPos);
        if (shake > 0 && !SET.reduceMotion) camera.position.add(new THREE.Vector3(rand(-1,1), rand(-1,1), rand(-1,1)).multiplyScalar(shake*0.5));
        look.set(st.x + nfx*3, 1.1, st.z + nfz*3); camera.lookAt(look);
      }
      camera.fov = 68 + Math.min(14, sp*0.25); camera.updateProjectionMatrix();
      // audio
      ensureAudio();
      if (eng && AC){
        const rpm = 0.25 + (Math.abs(vl) % 18)/18*0.6 + (thr ? 0.15 : 0);
        eng.o.frequency.setTargetAtTime(40 + rpm*110 + Math.abs(vl)*1.5, AC.currentTime, 0.05); eng.o2.frequency.setTargetAtTime((40 + rpm*110 + Math.abs(vl)*1.5)*0.5, AC.currentTime, 0.05);
        eng.g.gain.setTargetAtTime(state === 'menu' ? 0 : (0.035 + thr*0.03)*VOL(), AC.currentTime, 0.08);
        eng.sg.gain.setTargetAtTime(skidding && state !== 'menu' ? Math.min(0.09, driftAng*0.12 + 0.02)*VOL() : 0, AC.currentTime, 0.05);
      }
      // HUD
      const mult = Math.min(1 + Math.floor(comboT/1.6), 8);
      top.innerHTML = state === 'menu' ? '' : `<div style="font-size:26px">${score.toLocaleString()}</div><div style="font-size:12px;opacity:.75">${mode === 'attack' ? Math.ceil(time) + 's left' : 'Free drive'}</div>`;
      top.style.display = state === 'menu' ? 'none' : '';
      spd.innerHTML = `<div style="font-size:34px;line-height:1">${Math.round(sp*3.6)}</div><div style="font-size:11px;opacity:.7;letter-spacing:1px">KM/H · ${Math.round(driftAng*57)}°</div>`;
      drift.style.opacity = combo > 0 ? 1 : 0;
      drift.innerHTML = `<div style="font-size:14px;letter-spacing:3px;color:#ffd23f">DRIFT ×${mult}</div><div style="font-size:38px">${Math.round(combo).toLocaleString()}</div>`;
      lapEl.innerHTML = `Lap ${lap+1} · ${lapT.toFixed(1)}s<br><span style="opacity:.7">Best ${bestLap != null ? (+bestLap).toFixed(2) + 's' : '—'}</span><br><span style="opacity:.55">C: camera</span>`;
      lapEl.style.display = state === 'menu' ? 'none' : '';
      renderer.render(scene, camera);
    });
  }
});
