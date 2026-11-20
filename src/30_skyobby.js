GAMES.push({
  id:'skyobby', title:'Sky Obby', tag:'3D', emoji:'🧗',
  bg:'linear-gradient(135deg,#46c2ff,#7dff9b)',
  desc:'3D obstacle course in the clouds. Dodge kill bricks, ride moving platforms, hit every checkpoint.',
  bestLabel:'Best time', fmt: v => v.toFixed(1)+'s',
  start(ctx){
    const T = ctx.three(); if (!T) return;
    const { renderer, camera, scene } = T;
    scene.background = new THREE.Color('#9ad4ff');
    scene.fog = new THREE.Fog('#9ad4ff', 45, 160);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.85));
    const sun = new THREE.DirectionalLight(0xffffff, 0.55); sun.position.set(-0.5,1,0.3); scene.add(sun);

    const boxGeo = new THREE.BoxGeometry(1,1,1);
    const matCache = {};
    const mat = (color, emissive=0) => {
      const k = color+'_'+emissive;
      return matCache[k] || (matCache[k] = new THREE.MeshLambertMaterial({color, emissive}));
    };
    const pastel = ['#f7f3ea','#e8e3f7','#e3f1f7','#f2ece0'];
    const plats = [], kills = [], spinners = [];
    let checkIdx = 0;
    function add(x, top, z, w, h, d, type='normal'){
      let m;
      if (type==='kill') m = mat('#ff2a3d', 0x660000);
      else if (type==='check') m = mat('#3ddc84', 0x0b3a1f);
      else if (type==='win') m = mat('#ffd23f', 0x5a4300);
      else if (type==='move') m = mat('#4aa3ff');
      else m = mat(pastel[plats.length % pastel.length]);
      const mesh = new THREE.Mesh(boxGeo, m); mesh.scale.set(w,h,d); mesh.position.set(x, top-h/2, z); scene.add(mesh);
      const p = { mesh, x, y: top-h/2, z, w, h, d, type, dx:0, dz:0 };
      if (type==='kill') kills.push(p); else plats.push(p);
      if (type==='check'){ p.idx = ++checkIdx; }
      return p;
    }
    // ---------- course ----------
    const st = { x:0, y:0, z:-5 };
    function pad(w, d, type, gap=0, dx=0, dy=0){
      const nx = clamp(st.x+dx, -9, 9);
      const p = add(nx, st.y+dy, st.z+gap+d/2, w, 1, d, type);
      st.x = nx; st.y += dy; st.z += gap + d;
      return p;
    }
    const stones = (n, g0, g1) => { for (let i=0;i<n;i++) pad(2.2, 2.2, 'normal', rand(g0,g1), rand(-2.2,2.2), rand(-0.4,0.8)); };
    const check = () => pad(5, 5, 'check', rand(2,2.8));
    const killFloor = () => { const f = pad(5, 16, 'normal', 2.5); for (let z=f.z-5.5; z<=f.z+5.5; z+=3.6) add(f.x, st.y+0.3, z, 5, 0.3, 0.7, 'kill'); };
    const hurdles = () => { const f = pad(4, 18, 'normal', 2.5); for (let z=f.z-6; z<=f.z+6; z+=4) add(f.x, st.y+1, z, 4, 1, 0.8, 'kill'); };
    const movers = n => { for (let i=0;i<n;i++){ const p = pad(2.6, 2.6, 'move', 3.0); p.move = { amp: rand(2,3.5), spd: rand(1,1.7), ph: rand(0,6), base: p.x }; } };
    const beam = (len, dx=0) => pad(1.1, len, 'normal', 2.3, dx);
    const tower = () => { for (let i=0;i<7;i++) pad(2.2, 2.2, 'normal', 1.0, i%2 ? 3 : -3, 1.3); };
    const gapjump = () => pad(3, 3, 'normal', 4.0, rand(-1,1));
    const spinner = () => {
      const f = pad(11, 11, 'normal', 2.5);
      const bar = new THREE.Mesh(boxGeo, mat('#ff2a3d', 0x660000)); bar.scale.set(10, 0.6, 0.6); bar.position.set(f.x, st.y+0.5, f.z); scene.add(bar);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.4,1.4,12), mat('#555566')); pole.position.set(f.x, st.y+0.7, f.z); scene.add(pole);
      plats.push({ mesh: pole, x:f.x, y:st.y+0.7, z:f.z, w:0.8, h:1.4, d:0.8, type:'normal', dx:0, dz:0 });
      spinners.push({ x:f.x, z:f.z, top:st.y, L:10, ang:rand(0,3), spd: rand(1.3,1.9)*(Math.random()<.5?-1:1), mesh:bar });
    };
    pad(8, 8, 'normal');
    stones(5, 1.8, 2.4); check();
    killFloor(); stones(3, 2, 2.6); check();
    movers(3); pad(3, 3, 'normal', 3); check();
    beam(10); beam(8, 2); check();
    tower(); check();
    spinner(); check();
    hurdles(); gapjump(); gapjump(); check();
    movers(4); stones(4, 2.4, 3.0); check();
    tower(); beam(12, -2); spinner();
    const goal = pad(7, 7, 'win', 3);
    const TOTAL = checkIdx;
    // decorative clouds
    const cm = new THREE.MeshLambertMaterial({color:0xffffff, transparent:true, opacity:0.85});
    for (let i=0;i<40;i++){ const c = new THREE.Mesh(new THREE.SphereGeometry(rand(3,7), 10, 8), cm); c.scale.y = 0.45; c.position.set(rand(-60,60), rand(-30,-12), rand(-20, st.z+40)); scene.add(c); }
    // goal flag
    const flag = new THREE.Group();
    const fpole = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,5,8), mat('#ffffff')); fpole.position.y = 2.5; flag.add(fpole);
    const fcloth = new THREE.Mesh(boxGeo, mat('#ff5fa2')); fcloth.scale.set(1.8,1.1,0.1); fcloth.position.set(0.9,4.3,0); flag.add(fcloth);
    flag.position.set(goal.x, goal.y+0.5, goal.z); scene.add(flag);

    // ---------- player ----------
    const avatar = new THREE.Group();
    const bodyMat = mat('#ff7ab8');
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.42,0.95,16), bodyMat); body.position.y = 0.9; avatar.add(body);
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.42,16,12), bodyMat); top.position.y = 1.38; avatar.add(top);
    const bot = new THREE.Mesh(new THREE.SphereGeometry(0.42,16,12), bodyMat); bot.position.y = 0.42; avatar.add(bot);
    const visor = new THREE.Mesh(boxGeo, mat('#1c2a4a', 0x0a1430)); visor.scale.set(0.55,0.28,0.2); visor.position.set(0,1.3,0.36); avatar.add(visor);
    const pack = new THREE.Mesh(boxGeo, mat('#d9558f')); pack.scale.set(0.45,0.5,0.2); pack.position.set(0,0.95,-0.45); avatar.add(pack);
    scene.add(avatar);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.45, 20), new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity:0.3, depthWrite:false}));
    shadow.rotation.x = -Math.PI/2; scene.add(shadow);

    const HW = 0.38, PH = 1.8;
    const pos = new THREE.Vector3(0, 0.01, 0), vel = new THREE.Vector3();
    let yaw = Math.PI, pitch = 0.35, grounded = false, groundP = null, coyote = 0, buffer = 0, facing = 0;
    let checkpoint = plats[0], stage = 0, deaths = 0, time = 0, playing = false, finished = false;

    const overlap = p => pos.x+HW > p.x-p.w/2 && pos.x-HW < p.x+p.w/2 && pos.y+PH > p.y-p.h/2 && pos.y < p.y+p.h/2 && pos.z+HW > p.z-p.d/2 && pos.z-HW < p.z+p.d/2;
    function hit(){ for (const p of plats) if (overlap(p)) return p; return null; }
    function moveAxis(a, d){
      pos[a] += d;
      const p = hit(); if (!p) return;
      if (a === 'y'){
        if (d < 0){ pos.y = p.y + p.h/2; grounded = true; groundP = p; } else pos.y = p.y - p.h/2 - PH - 0.001;
        vel.y = 0;
      } else pos[a] -= d;
    }
    function respawn(){
      deaths++; beep(220,.3,'sawtooth',.08,-120);
      pos.set(checkpoint.x, checkpoint.y + checkpoint.h/2 + 0.01, checkpoint.z); vel.set(0,0,0);
    }

    // ---------- UI ----------
    const hud = ctx.div('hud',''); hud.style.cssText = 'top:14px;left:50%;transform:translateX(-50%);font-size:18px;text-align:center';
    const flash = ctx.div('hud',''); flash.style.cssText = 'top:30%;left:50%;transform:translateX(-50%);font-size:34px;opacity:0;transition:opacity .4s';
    const showFlash = (txt, color) => { flash.textContent = txt; flash.style.color = color; flash.style.opacity = 1; clearTimeout(showFlash.t); showFlash.t = setTimeout(() => flash.style.opacity = 0, 1100); };
    const keys = ctx.keys();
    const pad2 = ctx.touchPad(['Jump']);
    const panel = ctx.panel();
    const look = ctx.mouseLook(renderer.domElement, (dx,dy) => { yaw -= dx*0.003; pitch = clamp(pitch + dy*0.003, -0.2, 1.2); }, locked => { if (!locked && playing && !finished) pause(); });
    function pause(){ playing = false; panel.show({ title:'Paused', button:'Resume', onClick(){ panel.hide(); playing = true; if (!isTouch) look.lock(); } }); }
    panel.show({ title:'Sky Obby', html:`<p>Reach the golden flag. Red bricks reset you to your last green checkpoint. ${TOTAL} checkpoints, one clock.</p><div class="keys">${isTouch?'Left thumb move · Drag right side to look · Jump button':'WASD move · Mouse look · Space jump · R respawn'}</div>`, button:'Start', onClick(){ panel.hide(); playing = true; if (!isTouch) look.lock(); } });
    ctx.on(renderer.domElement, 'mousedown', () => { if (playing && !look.locked && !isTouch) look.lock(); });

    // ---------- loop ----------
    ctx.loop((dt, t) => {
      // world motion
      for (const p of plats) if (p.move){ const nx = p.move.base + Math.sin(t*p.move.spd + p.move.ph)*p.move.amp; p.dx = nx - p.x; p.x = nx; p.mesh.position.x = nx; }
      for (const s of spinners){ s.ang += s.spd*dt; s.mesh.rotation.y = s.ang; }
      fcloth.rotation.y = Math.sin(t*3)*0.2;

      if (playing && !finished){
        time += dt;
        yaw -= pad2.lx*0.007; pitch = clamp(pitch + pad2.ly*0.007, -0.2, 1.2); pad2.lx = pad2.ly = 0;
        if (keys.hit('KeyR')) respawn();
        // carry on movers
        if (grounded && groundP && groundP.move) pos.x += groundP.dx;
        let f = (keys.down('KeyW')||keys.down('ArrowUp')?1:0) - (keys.down('KeyS')||keys.down('ArrowDown')?1:0) - pad2.my;
        let s = (keys.down('KeyD')||keys.down('ArrowRight')?1:0) - (keys.down('KeyA')||keys.down('ArrowLeft')?1:0) + pad2.mx;
        const m = Math.hypot(f,s); if (m > 1){ f/=m; s/=m; }
        const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
        const tx = (fx*f + rx*s)*8.5, tz = (fz*f + rz*s)*8.5;
        const acc = grounded ? 14 : 6;
        vel.x = lerp(vel.x, tx, Math.min(1, acc*dt)); vel.z = lerp(vel.z, tz, Math.min(1, acc*dt));
        if (Math.hypot(tx,tz) > 0.5) facing = Math.atan2(tx, tz);
        if (keys.hit('Space') || pad2.take('Jump')) buffer = 0.14;
        coyote = grounded ? 0.12 : coyote - dt; buffer -= dt;
        if (buffer > 0 && coyote > 0){ vel.y = 12.2; coyote = 0; buffer = 0; beep(520,.08,'triangle',.06,200); }
        vel.y = Math.max(vel.y - 32*dt, -45);
        grounded = false; groundP = null;
        const n = Math.max(1, Math.ceil(Math.max(Math.abs(vel.x),Math.abs(vel.y),Math.abs(vel.z))*dt/0.3));
        for (let i=0;i<n;i++){ moveAxis('x', vel.x*dt/n); moveAxis('z', vel.z*dt/n); moveAxis('y', vel.y*dt/n); }
        // hazards
        let dead = pos.y < -30;
        for (const k of kills) if (overlap(k)) dead = true;
        for (const sp of spinners){
          const rx2 = pos.x - sp.x, rz2 = pos.z - sp.z, c = Math.cos(sp.ang), sn = Math.sin(sp.ang);
          const lx = rx2*c - rz2*sn, lz = rx2*sn + rz2*c;
          if (Math.abs(lx) < sp.L/2 + HW && Math.abs(lz) < 0.3 + HW && pos.y < sp.top + 0.8 && pos.y + PH > sp.top + 0.2) dead = true;
        }
        if (dead) respawn();
        if (grounded && groundP){
          if (groundP.type === 'check' && groundP.idx > stage){ stage = groundP.idx; checkpoint = groundP; showFlash('Checkpoint '+stage+'/'+TOTAL, '#7dffb2'); [660,880].forEach((fr,i)=>beep(fr,.12,'sine',.1,0,i*.08)); }
          if (groundP.type === 'win'){
            finished = true; playing = false;
            if (document.pointerLockElement) document.exitPointerLock();
            const r = Store.best('skyobby', +time.toFixed(1), true);
            [523,659,784,1047].forEach((fr,i)=>beep(fr,.25,'triangle',.12,0,i*.12));
            panel.show({ title:'You made it!', html:`<div class="big">${time.toFixed(1)}s</div><p>${deaths} respawn${deaths===1?'':'s'} · ${r.isNew ? 'New best time!' : 'Best: '+r.best.toFixed(1)+'s'}</p>`, button:'Run it again', onClick(){
              panel.hide(); finished = false; playing = true; time = 0; deaths = 0; stage = 0; checkpoint = plats[0]; pos.set(0,0.01,0); vel.set(0,0,0); if (!isTouch) look.lock(); } });
          }
        }
      }
      // avatar + shadow
      avatar.position.copy(pos);
      let dr = facing - avatar.rotation.y; while (dr > Math.PI) dr -= Math.PI*2; while (dr < -Math.PI) dr += Math.PI*2;
      avatar.rotation.y += dr*Math.min(1, dt*12);
      const sq = grounded ? 1 : 1 + clamp(vel.y*0.01, -0.08, 0.08); avatar.scale.set(1/sq, sq, 1/sq);
      let sy = -999;
      for (const p of plats){ const tp = p.y + p.h/2; if (tp <= pos.y + 0.05 && tp > sy && Math.abs(pos.x-p.x) < p.w/2 && Math.abs(pos.z-p.z) < p.d/2) sy = tp; }
      shadow.visible = sy > -999; shadow.position.set(pos.x, sy + 0.02, pos.z);
      const sc = clamp(1 - (pos.y - sy)*0.08, 0.4, 1); shadow.scale.set(sc, sc, sc);
      // camera
      const dist = 9;
      camera.position.set(pos.x + Math.sin(yaw)*Math.cos(pitch)*dist, pos.y + 1.5 + Math.sin(pitch)*dist, pos.z + Math.cos(yaw)*Math.cos(pitch)*dist);
      camera.lookAt(pos.x, pos.y + 1.5, pos.z);
      hud.innerHTML = `Stage ${stage}/${TOTAL} &nbsp;·&nbsp; ${time.toFixed(1)}s &nbsp;·&nbsp; ☠ ${deaths}`;
      renderer.render(scene, camera);
    });
  }
});
