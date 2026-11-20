GAMES.push({
  id:'paintspill', title:'Paint Spill', tag:'2D', cat:'Puzzle', emoji:'🎨',
  bg:'linear-gradient(135deg,#ff5f6d,#ffc371 50%,#3ad7c4)',
  desc:'Pour colors from the corner and flood the whole board before you run out of moves.',
  bestLabel:'Best level',
  start(ctx){
    const VW = 480, VH = 640, v = ctx.virtual(VW, VH, '#15121f'), g = v.g;
    const PAL = ['#ff5f6d','#ffc145','#3ad7c4','#5b8cff','#b46bff','#7be05a'];
    let level, n, k, grid, owned, moves, limit, state = 'menu', flash = 0, ripple = [];
    const BX = 30, BY = 96, BS = 420;
    const btnY = 560, btnR = 28;
    const btnX = i => VW/2 + (i - (k-1)/2) * 70;

    function region(gr){
      const own = new Uint8Array(n*n), st = [0], c = gr[0]; own[0] = 1;
      while (st.length){ const p = st.pop(), x = p % n, y = (p / n) | 0;
        for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx = x+dx, ny = y+dy; if (nx<0||ny<0||nx>=n||ny>=n) continue; const q = ny*n+nx; if (!own[q] && gr[q] === c){ own[q] = 1; st.push(q); } } }
      return own;
    }
    function pour(gr, c){ const own = region(gr); for (let i=0;i<gr.length;i++) if (own[i]) gr[i] = c; return region(gr); }
    const count = own => own.reduce((a,b) => a+b, 0);
    // greedy solve so every level is guaranteed beatable within the limit
    function greedy(gr){
      gr = gr.slice(); let m = 0;
      while (count(region(gr)) < n*n && m < 200){
        let bc = -1, bn = -1;
        for (let c=0;c<k;c++){ if (c === gr[0]) continue; const t = gr.slice(); const s = count(pour(t, c)); if (s > bn){ bn = s; bc = c; } }
        pour(gr, bc); m++;
      }
      return m;
    }
    function build(){
      n = Math.min(8 + level, 16); k = Math.min(4 + Math.floor(level/2), 6);
      grid = Array.from({length:n*n}, () => randi(0, k-1));
      limit = greedy(grid) + Math.max(0, 4 - Math.floor(level/2));
      owned = region(grid); moves = 0; ripple = [];
    }
    function choose(c){
      if (state !== 'play' || c === grid[0] || c >= k) return;
      const before = count(owned);
      owned = pour(grid, c); moves++;
      const gained = count(owned) - before;
      beep(300 + c*70 + Math.min(gained,30)*8, .09, 'triangle', .07);
      ripple.push({ t:0, col:PAL[c] });
      if (count(owned) === n*n){
        state = 'won'; flash = 1;
        [523,659,784,1046].forEach((f,i) => beep(f,.14,'triangle',.08,0,i*.08));
        ctx.intro(`Level ${level} cleared`, `<p>${limit - moves} move${limit-moves===1?'':'s'} to spare.</p>`, () => { level++; build(); state = 'play'; }, 'Next level');
      } else if (moves >= limit){
        state = 'over'; beep(180,.35,'sawtooth',.08,-80);
        ctx.over('paintspill', level - 1, newRun, { title:'Out of paint', fmt: v => 'Level ' + v, extra:'reached level ' + level });
      }
    }
    function newRun(){ level = 1; build(); state = 'play'; }
    level = 1; build();
    ctx.intro('Paint Spill', `<p>Your paint starts in the top-left corner. Pick a color to pour: every touching tile of that color joins your spill. Cover the whole board before the moves run out.</p><div class="keys">${isTouch ? 'Tap a paint pot' : 'Click a paint pot or press 1–6'}</div>`, newRun);

    ctx.on(window, 'keydown', e => { const d = +e.key; if (d >= 1 && d <= 6) choose(d-1); });
    ctx.on(v.cv, 'pointerdown', e => {
      const p = v.local(e);
      for (let i=0;i<k;i++) if (Math.hypot(p.x - btnX(i), p.y - btnY) < btnR + 6) return choose(i);
      // tapping a board tile pours that tile's color
      const cs = BS / n, gx = Math.floor((p.x - BX) / cs), gy = Math.floor((p.y - BY) / cs);
      if (gx >= 0 && gy >= 0 && gx < n && gy < n) choose(grid[gy*n+gx]);
    });

    ctx.loop((dt, t) => {
      v.begin();
      g.fillStyle = '#15121f'; g.fillRect(0,0,VW,VH);
      v.text('Level ' + level, 30, 52, 26, '#fff', 'left');
      const left = limit - moves;
      v.text(left + ' move' + (left===1?'':'s') + ' left', VW-30, 52, 20, left <= 2 ? '#ff7a85' : '#cfc8e8', 'right', 600);
      g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(30, 66, VW-60, 8);
      g.fillStyle = PAL[grid[0]]; g.fillRect(30, 66, (VW-60) * count(owned)/(n*n), 8);

      const cs = BS / n;
      g.fillStyle = '#0d0b14'; g.fillRect(BX-6, BY-6, BS+12, BS+12);
      for (let y=0;y<n;y++) for (let x=0;x<n;x++){
        const i = y*n+x;
        g.fillStyle = PAL[grid[i]];
        g.globalAlpha = owned[i] ? 1 : .82;
        g.fillRect(BX + x*cs + .5, BY + y*cs + .5, cs - 1, cs - 1);
      }
      g.globalAlpha = 1;
      ripple.forEach(r => { r.t += dt; g.strokeStyle = r.col; g.globalAlpha = Math.max(0, 1 - r.t*2); g.lineWidth = 4; g.beginPath(); g.arc(BX, BY, r.t * BS * 2.4, 0, Math.PI/2); g.stroke(); });
      g.globalAlpha = 1; ripple = ripple.filter(r => r.t < .5);
      if (flash > 0){ flash -= dt; g.fillStyle = `rgba(255,255,255,${Math.max(0,flash)*.35})`; g.fillRect(BX, BY, BS, BS); }

      for (let i=0;i<k;i++){
        const x = btnX(i), cur = i === grid[0];
        g.fillStyle = PAL[i]; g.shadowColor = PAL[i]; g.shadowBlur = cur ? 0 : 14;
        g.globalAlpha = cur ? .35 : 1;
        g.beginPath(); g.arc(x, btnY + (cur ? 0 : Math.sin(t*3 + i)*2), btnR, 0, Math.PI*2); g.fill();
        g.shadowBlur = 0; g.globalAlpha = 1;
        if (!isTouch) v.text(String(i+1), x, btnY + 7, 18, 'rgba(0,0,0,.55)');
      }
      v.text('best: level ' + Store.get('best_paintspill', 0), VW/2, 620, 13, 'rgba(255,255,255,.45)', 'center', 500);
      v.end();
    });
  }
});
