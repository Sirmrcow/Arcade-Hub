GAMES.push({
  id:'blockworld', title:'BlockWorld', tag:'3D', emoji:'⛏️',
  bg:'linear-gradient(135deg,#4f9c3c,#7a5230)',
  desc:'Voxel sandbox on a floating island. Mine blocks, build anything, swim in the sea.',
  start(ctx){
    const T = ctx.three(); if (!T) return;
    const { renderer, camera, scene } = T;
    const SX=64, SY=40, SZ=64, WL=9;
    const world = new Uint8Array(SX*SY*SZ);
    const inB = (x,y,z) => x>=0&&x<SX&&y>=0&&y<SY&&z>=0&&z<SZ;
    const I = (x,y,z) => (y*SZ+z)*SX+x;
    const get = (x,y,z) => inB(x,y,z) ? world[I(x,y,z)] : 0;
    const set = (x,y,z,v) => { if (inB(x,y,z)) world[I(x,y,z)] = v; };

    const B = [null,
      {name:'Grass', c:'#8a5a33', c2:'#6e4526', grass:true},
      {name:'Dirt',  c:'#8a5a33', c2:'#6e4526'},
      {name:'Stone', c:'#8e8e8e', c2:'#6f6f6f'},
      {name:'Log',   c:'#7a5530', c2:'#5a3d20', stripes:true},
      {name:'Leaves',c:'#3f8f3a', c2:'#2a6a26', trans:true, leaves:true},
      {name:'Sand',  c:'#e2d18c', c2:'#cbb771'},
      {name:'Planks',c:'#b88a52', c2:'#93693a', planks:true},
      {name:'Brick', c:'#a8473a', c2:'#d8cfc2', brick:true},
      {name:'Glass', c:'#d6f0ff', c2:'#ffffff', trans:true, glass:true},
    ];
    // ---------- procedural pixel textures ----------
    function texCanvas(b, face){
      const c = document.createElement('canvas'); c.width = c.height = 16;
      const g = c.getContext('2d');
      if (b.glass){
        g.clearRect(0,0,16,16); g.fillStyle='rgba(210,240,255,0.25)'; g.fillRect(0,0,16,16);
        g.fillStyle='#ffffff'; g.fillRect(0,0,16,1); g.fillRect(0,15,16,1); g.fillRect(0,0,1,16); g.fillRect(15,0,1,16);
        g.fillRect(3,3,1,3); g.fillRect(4,3,1,1);
        return c;
      }
      const base = (b.grass && face==='top') ? '#5fa83a' : b.c;
      const spot = (b.grass && face==='top') ? '#4b8f2e' : b.c2;
      g.fillStyle = base; g.fillRect(0,0,16,16);
      for (let i=0;i<70;i++){ g.fillStyle = spot; g.fillRect(randi(0,15), randi(0,15), 1, 1); }
      if (b.grass && face==='side'){ g.fillStyle='#5fa83a'; g.fillRect(0,0,16,3); for (let x=0;x<16;x++) if (Math.random()<.5) g.fillRect(x,3,1,randi(1,2)); }
      if (b.stripes){ g.fillStyle=b.c2; for (let x=1;x<16;x+=4) g.fillRect(x,0,1,16); }
      if (b.planks){ g.fillStyle=b.c2; for (let y=3;y<16;y+=4) g.fillRect(0,y,16,1); g.fillRect(5,0,1,4); g.fillRect(11,4,1,4); g.fillRect(3,8,1,4); g.fillRect(9,12,1,4); }
      if (b.brick){ g.fillStyle=b.c2; for (let y=3;y<16;y+=4) g.fillRect(0,y,16,1); for (let r=0;r<4;r++){ const off = r%2?4:0; for (let x=off;x<16;x+=8) g.fillRect(x,r*4,1,3); } }
      if (b.leaves){ for (let i=0;i<30;i++){ g.clearRect(randi(0,15), randi(0,15), 1, 1); } }
      return c;
    }
    const mkTex = cv => { const t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; return t; };
    const icons = [];
    const mats = B.map((b,i) => {
      if (!b) return null;
      const opts = (cv) => ({ map: mkTex(cv), transparent: !!b.glass, alphaTest: b.leaves ? 0.5 : 0, side: b.leaves ? THREE.DoubleSide : THREE.FrontSide });
      if (b.grass){
        const side = texCanvas(b,'side'), top = texCanvas(b,'top'), bot = texCanvas(B[2]);
        icons[i] = side.toDataURL();
        const ms = new THREE.MeshLambertMaterial(opts(side)), mt = new THREE.MeshLambertMaterial(opts(top)), mb = new THREE.MeshLambertMaterial(opts(bot));
        return [ms, ms, mt, mb, ms, ms];
      }
      const cv = texCanvas(b); icons[i] = cv.toDataURL();
      return new THREE.MeshLambertMaterial(opts(cv));
    });

    // ---------- terrain ----------
    const L = new Float32Array(64*64).map(() => Math.random());
    const sm = t => t*t*(3-2*t);
    function vn(x, z){
      const xi = Math.floor(x), zi = Math.floor(z), xf = sm(x-xi), zf = sm(z-zi);
      const h = (a,b) => L[((a&63)*64) + (b&63)];
      return lerp(lerp(h(xi,zi), h(xi+1,zi), xf), lerp(h(xi,zi+1), h(xi+1,zi+1), xf), zf);
    }
    const heights = [];
    for (let x=0;x<SX;x++) for (let z=0;z<SZ;z++){
      const d = Math.hypot(x-SX/2, z-SZ/2)/(SX/2);
      let h = 9 + vn(x/14, z/14)*11 + vn(x/5+50, z/5+50)*3 - Math.max(0, d-0.55)*30;
      h = Math.floor(clamp(h, 2, SY-10));
      heights[x*SZ+z] = h;
      for (let y=0;y<=h;y++){
        let t;
        if (y === h) t = h <= WL ? 6 : 1;
        else if (y > h-3) t = h <= WL ? 6 : 2;
        else t = 3;
        set(x,y,z,t);
      }
    }
    // trees
    for (let n=0;n<60;n++){
      const x = randi(3,SX-4), z = randi(3,SZ-4), h = heights[x*SZ+z];
      if (get(x,h,z) !== 1 || h > SY-9) continue;
      const th = randi(4,5);
      for (let y=1;y<=th;y++) set(x,h+y,z,4);
      for (let dx=-2;dx<=2;dx++) for (let dz=-2;dz<=2;dz++) for (let dy=th-1;dy<=th+1;dy++){
        if (Math.abs(dx)+Math.abs(dz)+Math.max(0,dy-th)*2 > 3) continue;
        if (get(x+dx,h+dy,z+dz)===0) set(x+dx,h+dy,z+dz,5);
      }
      set(x,h+th+2,z,5);
    }

    // ---------- meshes ----------
    const geo = new THREE.BoxGeometry(1,1,1);
    const meshes = [], caps = [];
    const dummy = new THREE.Object3D();
    const dirs = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    function exposed(x,y,z,t){
      for (const [dx,dy,dz] of dirs){
        const nx=x+dx, ny=y+dy, nz=z+dz;
        if (ny < 0) continue;
        if (!inB(nx,ny,nz)) return true;
        const n = world[I(nx,ny,nz)];
        if (n === 0) return true;
        if (B[n].trans && n !== t) return true;
        if (n === 5 && t === 5) return true;
      }
      return false;
    }
    function rebuild(){
      const lists = B.map(() => []);
      for (let y=0;y<SY;y++) for (let z=0;z<SZ;z++) for (let x=0;x<SX;x++){
        const t = world[I(x,y,z)];
        if (t && exposed(x,y,z,t)) lists[t].push(x,y,z);
      }
      for (let t=1;t<B.length;t++){
        const n = lists[t].length/3;
        if (!meshes[t] || caps[t] < n){
          if (meshes[t]) { scene.remove(meshes[t]); meshes[t].dispose && meshes[t].dispose(); }
          caps[t] = Math.max(64, Math.ceil(n*1.5));
          meshes[t] = new THREE.InstancedMesh(geo, mats[t], caps[t]);
          meshes[t].frustumCulled = false;
          scene.add(meshes[t]);
        }
        const m = meshes[t], a = lists[t];
        for (let i=0;i<n;i++){ dummy.position.set(a[i*3]+.5, a[i*3+1]+.5, a[i*3+2]+.5); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); }
        m.count = n; m.instanceMatrix.needsUpdate = true;
      }
    }
    rebuild();

    // ---------- scene dressing ----------
    const sky = new THREE.Color('#8cc8ff');
    scene.background = sky; scene.fog = new THREE.Fog(sky, 35, 110);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x667788, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 0.6); sun.position.set(0.4,1,0.25); scene.add(sun);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(600,600), new THREE.MeshLambertMaterial({color:0x2f7fd8, transparent:true, opacity:0.65}));
    water.rotation.x = -Math.PI/2; water.position.set(SX/2, WL+0.85, SZ/2); scene.add(water);
    const clouds = [];
    const cmat = new THREE.MeshLambertMaterial({color:0xffffff, transparent:true, opacity:0.9});
    for (let i=0;i<14;i++){
      const c = new THREE.Mesh(new THREE.BoxGeometry(rand(8,18),1.5,rand(6,12)), cmat);
      c.position.set(rand(-60,SX+60), SY+6+rand(0,6), rand(-60,SZ+60)); scene.add(c); clouds.push(c);
    }
    const hl = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01,1.01,1.01)), new THREE.LineBasicMaterial({color:0x000000}));
    hl.visible = false; scene.add(hl);

    // ---------- UI ----------
    ctx.div('cross');
    const bar = ctx.div('hud','');
    bar.style.cssText = 'left:50%;bottom:16px;transform:translateX(-50%);display:flex;gap:6px;pointer-events:auto;z-index:28';
    const label = ctx.div('hud',''); label.style.cssText='left:50%;bottom:78px;transform:translateX(-50%);font-size:14px';
    let sel = 1;
    const slots = [];
    for (let i=1;i<B.length;i++){
      const s = document.createElement('div');
      s.style.cssText = `width:42px;height:42px;border-radius:8px;border:3px solid rgba(255,255,255,.25);background:url(${icons[i]}) center/cover;image-rendering:pixelated;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.4)`;
      s.addEventListener('pointerdown', e => { e.stopPropagation(); select(i); });
      bar.appendChild(s); slots[i] = s;
    }
    function select(i){ sel = i; slots.forEach((s,j) => s && (s.style.borderColor = j===i ? '#fff' : 'rgba(255,255,255,.25)')); label.textContent = B[i].name; }
    select(1);
    const tip = ctx.div('hud', isTouch ? '' : 'WASD move · Space jump · Shift sprint · Left click mine · Right click place · 1–9 / wheel pick block');
    tip.style.cssText = 'top:62px;right:16px;font-size:12px;opacity:.75;max-width:280px;text-align:right;font-weight:500';

    // ---------- player ----------
    const pos = new THREE.Vector3(SX/2+.5, heights[(SX/2)*SZ+SZ/2]+1.01, SZ/2+.5);
    // find a dry spawn
    for (let r=0;r<20 && get(Math.floor(pos.x), Math.floor(pos.y)-1, Math.floor(pos.z))===6;r++){ pos.x+=1; pos.y = heights[Math.floor(pos.x)*SZ+Math.floor(pos.z)]+1.01; }
    const vel = new THREE.Vector3();
    let yaw = Math.PI*0.25, pitch = -0.2, onGround = false;
    const HW = 0.3, PH = 1.8;
    const solid = (x,y,z) => {
      if (x<0||z<0||x>=SX||z>=SZ) return y < SY+4;
      if (y<0) return true;
      return get(x,y,z) > 0;
    };
    function collides(){
      for (let x=Math.floor(pos.x-HW); x<=Math.floor(pos.x+HW-1e-6); x++)
        for (let y=Math.floor(pos.y); y<=Math.floor(pos.y+PH-1e-6); y++)
          for (let z=Math.floor(pos.z-HW); z<=Math.floor(pos.z+HW-1e-6); z++)
            if (solid(x,y,z)) return true;
      return false;
    }
    function moveAxis(a, d){
      pos[a] += d;
      if (collides()){ pos[a] -= d; if (a==='y'){ if (d<0) onGround = true; vel.y = 0; } }
    }
    function cast(){
      const o = camera.position, d = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
      let x=Math.floor(o.x), y=Math.floor(o.y), z=Math.floor(o.z);
      const sx=Math.sign(d.x), sy=Math.sign(d.y), sz=Math.sign(d.z);
      const tdx = sx? Math.abs(1/d.x) : Infinity, tdy = sy? Math.abs(1/d.y) : Infinity, tdz = sz? Math.abs(1/d.z) : Infinity;
      let tx = sx>0 ? (x+1-o.x)*tdx : sx<0 ? (o.x-x)*tdx : Infinity;
      let ty = sy>0 ? (y+1-o.y)*tdy : sy<0 ? (o.y-y)*tdy : Infinity;
      let tz = sz>0 ? (z+1-o.z)*tdz : sz<0 ? (o.z-z)*tdz : Infinity;
      let px=x, py=y, pz=z, t=0;
      while (t < 6){
        if (get(x,y,z) > 0) return {x,y,z,px,py,pz};
        px=x; py=y; pz=z;
        if (tx < ty && tx < tz){ x+=sx; t=tx; tx+=tdx; }
        else if (ty < tz){ y+=sy; t=ty; ty+=tdy; }
        else { z+=sz; t=tz; tz+=tdz; }
      }
      return null;
    }
    function mine(){
      const h = cast(); if (!h) return;
      if (h.y === 0) { beep(120,.08,'square',.05); return; }
      set(h.x,h.y,h.z,0); rebuild(); noise(0.09, 0.12, 0, 1200); beep(180,.06,'triangle',.06,-60);
    }
    function place(){
      const h = cast(); if (!h) return;
      const {px,py,pz} = h;
      if (!inB(px,py,pz) || get(px,py,pz)) return;
      // don't place inside yourself
      if (px+1 > pos.x-HW && px < pos.x+HW && pz+1 > pos.z-HW && pz < pos.z+HW && py+1 > pos.y && py < pos.y+PH) return;
      set(px,py,pz,sel); rebuild(); beep(300,.07,'triangle',.08,80);
    }

    // ---------- input ----------
    const keys = ctx.keys();
    const pad = ctx.touchPad(['Jump','Mine','Place']);
    const panel = ctx.panel();
    const look = ctx.mouseLook(renderer.domElement, (dx,dy) => { yaw -= dx*0.0025; pitch = clamp(pitch - dy*0.0025, -1.55, 1.55); },
      locked => { if (!locked && ctx.alive) showPause(); });
    let playing = false;
    function showPause(first){
      playing = false;
      panel.show({ title: first ? 'BlockWorld' : 'Paused',
        html: first ? `<p>A little voxel island is yours. Dig down, chop trees, build a house.</p><div class="keys">${isTouch ? 'Left thumb: move · Drag right side: look · Buttons: jump / mine / place · Tap the hotbar to pick blocks' : 'WASD move · Mouse look · Space jump · Shift sprint<br>Left click mine · Right click place · 1–9 or wheel to pick a block'}</div>` : '',
        button: first ? 'Play' : 'Resume',
        onClick(){ panel.hide(); playing = true; if (!isTouch) look.lock(); }
      });
    }
    showPause(true);
    ctx.on(renderer.domElement, 'mousedown', e => {
      if (!look.locked){ if (playing && !isTouch) look.lock(); return; }
      if (e.button===0) mine(); else if (e.button===2) place();
    });
    ctx.on(renderer.domElement, 'contextmenu', e => e.preventDefault());
    ctx.on(window, 'wheel', e => { if (!playing) return; let s = sel + (e.deltaY>0?1:-1); if (s<1) s=B.length-1; if (s>=B.length) s=1; select(s); }, {passive:true});

    // ---------- loop ----------
    ctx.loop((dt, t) => {
      clouds.forEach(c => { c.position.x += dt*1.2; if (c.position.x > SX+80) c.position.x = -80; });
      if (playing){
        for (let i=1;i<=9;i++) if (keys.hit('Digit'+i) && B[i]) select(i);
        yaw -= pad.lx*0.006; pitch = clamp(pitch - pad.ly*0.006, -1.55, 1.55); pad.lx = pad.ly = 0;
        if (pad.take('Mine')) mine();
        if (pad.take('Place')) place();
        let f = (keys.down('KeyW')||keys.down('ArrowUp')?1:0) - (keys.down('KeyS')||keys.down('ArrowDown')?1:0) - pad.my;
        let s = (keys.down('KeyD')||keys.down('ArrowRight')?1:0) - (keys.down('KeyA')||keys.down('ArrowLeft')?1:0) + pad.mx;
        const m = Math.hypot(f,s); if (m>1){ f/=m; s/=m; }
        const inWater = pos.y < WL+0.8;
        const speed = (keys.down('ShiftLeft') ? 7.5 : 5) * (inWater ? 0.6 : 1);
        const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
        vel.x = (fx*f + rx*s)*speed; vel.z = (fz*f + rz*s)*speed;
        const jumpHeld = keys.down('Space') || pad.btn['Jump'];
        if (inWater){ vel.y -= 10*dt; vel.y = Math.max(vel.y, -4); if (jumpHeld) vel.y = 4; }
        else { vel.y -= 28*dt; vel.y = Math.max(vel.y, -40); if (jumpHeld && onGround) vel.y = 8.6; }
        const steps = Math.max(1, Math.ceil(Math.max(Math.abs(vel.x),Math.abs(vel.y),Math.abs(vel.z))*dt/0.25));
        onGround = false;
        for (let i=0;i<steps;i++){ moveAxis('x', vel.x*dt/steps); moveAxis('z', vel.z*dt/steps); moveAxis('y', vel.y*dt/steps); }
        if (pos.y < -10){ pos.set(SX/2, SY, SZ/2); vel.set(0,0,0); }
      }
      camera.position.set(pos.x, pos.y+1.62, pos.z);
      camera.rotation.order = 'YXZ'; camera.rotation.y = yaw; camera.rotation.x = pitch;
      const under = camera.position.y < WL+0.85;
      scene.fog.color.set(under ? '#1d5aa0' : '#8cc8ff'); scene.background.set(under ? '#1d5aa0' : '#8cc8ff');
      scene.fog.near = under ? 1 : 35; scene.fog.far = under ? 22 : 110;
      const h = playing ? cast() : null;
      hl.visible = !!h; if (h) hl.position.set(h.x+.5, h.y+.5, h.z+.5);
      renderer.render(scene, camera);
    });
  }
});
