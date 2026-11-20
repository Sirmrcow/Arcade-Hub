GAMES.push({
  id:'merge', title:'Tile Merge', tag:'2D', emoji:'🔢',
  bg:'linear-gradient(135deg,#f6a04d,#b8578a)',
  desc:'Slide the board, merge matching tiles, chase 2048 and beyond.',
  start(ctx){
    const el = ctx.div('', '');
    el.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1a1220;gap:14px;touch-action:none';
    const S = () => Math.min(ctx.el.clientWidth - 32, ctx.el.clientHeight - 170, 460);
    el.innerHTML = `<div style="display:flex;gap:10px;align-items:center"><div class="sc" style="background:#2c2033;padding:8px 16px;border-radius:10px;text-align:center"><div style="font-size:11px;opacity:.6">SCORE</div><b id="mgS">0</b></div><div style="background:#2c2033;padding:8px 16px;border-radius:10px;text-align:center"><div style="font-size:11px;opacity:.6">BEST</div><b id="mgB">0</b></div><button class="btn" id="mgN" style="padding:9px 18px;font-size:14px">New</button></div><div id="mgBoard" style="position:relative;background:#3a2c40;border-radius:14px"></div><div style="font-size:13px;opacity:.55">${isTouch?'Swipe to slide':'Arrow keys / WASD to slide'}</div>`;
    const board = el.querySelector('#mgBoard'), sEl = el.querySelector('#mgS'), bEl = el.querySelector('#mgB');
    const panel = ctx.panel();
    let grid, score, best = Store.get('best_merge',0), tiles = new Map(), idc = 0, won = false, size, gap;
    const COL = {2:'#eee4da',4:'#ede0c8',8:'#f2b179',16:'#f59563',32:'#f67c5f',64:'#f65e3b',128:'#edcf72',256:'#edcc61',512:'#edc850',1024:'#edc53f',2048:'#edc22e'};
    function layout(){ size = S(); gap = size*0.025; board.style.width = board.style.height = size+'px'; render(true); }
    function empty(){ const e = []; for (let r=0;r<4;r++) for (let c=0;c<4;c++) if (!grid[r][c]) e.push([r,c]); return e; }
    function spawn(){ const e = empty(); if (!e.length) return; const [r,c] = e[randi(0,e.length-1)]; grid[r][c] = {v: Math.random()<.9?2:4, id: ++idc, isNew:true}; }
    function reset(){ grid = [...Array(4)].map(() => Array(4).fill(null)); score = 0; won = false; board.innerHTML=''; tiles.clear(); spawn(); spawn(); render(); panel.hide(); }
    function render(instant){
      const cs = (size - gap*5)/4;
      if (!board.querySelector('.bg')){ for (let i=0;i<16;i++){ const d = document.createElement('div'); d.className='bg'; board.appendChild(d); } }
      board.querySelectorAll('.bg').forEach((d,i) => { const r=i>>2, c=i&3; d.style.cssText = `position:absolute;left:${gap+c*(cs+gap)}px;top:${gap+r*(cs+gap)}px;width:${cs}px;height:${cs}px;border-radius:8px;background:#4b3a52`; });
      const seen = new Set();
      for (let r=0;r<4;r++) for (let c=0;c<4;c++){
        const t = grid[r][c]; if (!t) continue; seen.add(t.id);
        let d = tiles.get(t.id);
        if (!d){ d = document.createElement('div'); board.appendChild(d); tiles.set(t.id, d); d.style.cssText = 'position:absolute;display:flex;align-items:center;justify-content:center;border-radius:8px;font-weight:700;transition:left .1s,top .1s,transform .12s'; if (t.isNew){ d.style.transform='scale(0)'; requestAnimationFrame(() => requestAnimationFrame(() => d.style.transform='scale(1)')); } }
        if (t.merged){ d.style.transform='scale(1.15)'; setTimeout(() => d.style.transform='scale(1)', 110); t.merged = false; }
        t.isNew = false;
        d.style.left = (gap+c*(cs+gap))+'px'; d.style.top = (gap+r*(cs+gap))+'px'; d.style.width = d.style.height = cs+'px';
        d.style.background = COL[t.v] || '#3c3a32'; d.style.color = t.v <= 4 ? '#776e65' : '#fff';
        d.style.fontSize = (cs * (t.v < 100 ? .45 : t.v < 1000 ? .36 : .28))+'px'; d.textContent = t.v;
        d.style.zIndex = 2;
      }
      for (const [id,d] of tiles) if (!seen.has(id)){ d.style.zIndex = 1; const dd = d; setTimeout(() => dd.remove(), 110); tiles.delete(id); }
      sEl.textContent = score; bEl.textContent = Math.max(best, score);
    }
    function slide(dr, dc){
      let moved = false; const merged = [];
      const order = [0,1,2,3]; const rows = dr>0 ? [...order].reverse() : order, cols = dc>0 ? [...order].reverse() : order;
      for (const r of rows) for (const c of cols){
        const t = grid[r][c]; if (!t) continue;
        let nr = r, nc = c;
        while (true){
          const tr = nr+dr, tc = nc+dc;
          if (tr<0||tr>3||tc<0||tc>3) break;
          const o = grid[tr][tc];
          if (!o){ nr = tr; nc = tc; continue; }
          if (o.v === t.v && !merged.includes(o)){ grid[r][c] = null; o.v *= 2; o.merged = true; merged.push(o); score += o.v; moved = true;
            // keep the moving tile's element sliding into place then vanish
            const d = tiles.get(t.id); if (d){ const cs=(size-gap*5)/4; d.style.left=(gap+tc*(cs+gap))+'px'; d.style.top=(gap+tr*(cs+gap))+'px'; }
            nr = -1; break; }
          break;
        }
        if (nr === -1) continue;
        if (nr !== r || nc !== c){ grid[nr][nc] = t; grid[r][c] = null; moved = true; }
      }
      if (!moved) return;
      if (merged.length) beep(300 + Math.log2(Math.max(...merged.map(m=>m.v)))*60, .08, 'triangle', .08); else beep(200,.03,'sine',.03);
      spawn(); render();
      if (score > best){ best = score; Store.set('best_merge', best); }
      if (!won && merged.some(m => m.v === 2048)){ won = true; setTimeout(() => panel.show({ title:'2048!', html:'<p>You made it. Keep going for a bigger tile?</p>', button:'Keep going', onClick(){ panel.hide(); } }), 300); }
      if (!canMove()) setTimeout(() => panel.show({ title:'No moves left', html:`<div class="big">${score}</div><p>Best ${best}</p>`, button:'New game', onClick: reset }), 300);
    }
    function canMove(){ if (empty().length) return true; for (let r=0;r<4;r++) for (let c=0;c<4;c++){ const v = grid[r][c].v; if ((c<3 && grid[r][c+1].v===v) || (r<3 && grid[r+1][c].v===v)) return true; } return false; }
    ctx.on(window,'keydown', e => { const m = {ArrowUp:[-1,0],KeyW:[-1,0],ArrowDown:[1,0],KeyS:[1,0],ArrowLeft:[0,-1],KeyA:[0,-1],ArrowRight:[0,1],KeyD:[0,1]}[e.code]; if (m && !panel.visible){ e.preventDefault(); slide(m[0],m[1]); } });
    let sx=0, sy=0, down=false;
    ctx.on(el,'pointerdown', e => { down=true; sx=e.clientX; sy=e.clientY; audioInit(); });
    ctx.on(el,'pointerup', e => { if (!down) return; down=false; const dx=e.clientX-sx, dy=e.clientY-sy; if (Math.max(Math.abs(dx),Math.abs(dy)) < 30 || panel.visible) return; if (Math.abs(dx)>Math.abs(dy)) slide(0, Math.sign(dx)); else slide(Math.sign(dy), 0); });
    el.querySelector('#mgN').addEventListener('click', reset);
    ctx.on(window,'resize', layout);
    size = S(); gap = size*0.025; board.style.width = board.style.height = size+'px';
    reset();
  }
});
