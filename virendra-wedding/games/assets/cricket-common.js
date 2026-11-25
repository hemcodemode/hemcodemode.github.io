/* Shared bits for Virendra's gully-cricket games: canvas fit, Virendra rig, tape ball, kids, sounds, particles. */
const CC = (() => {
  const W = 960, H = 540;
  const face = new Image();
  face.src = '../assets/virendra-face.png';

  /* ---------- canvas ---------- */
  function setupCanvas(cv) {
    const ctx = cv.getContext('2d');
    const view = { ctx, sc: 1, ox: 0, oy: 0 };
    function fit() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth, h = window.innerHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      cv.style.width = w + 'px'; cv.style.height = h + 'px';
      view.sc = Math.min(w / W, h / H);
      view.ox = (w - W * view.sc) / 2; view.oy = (h - H * view.sc) / 2;
      view.dpr = dpr;
    }
    view.begin = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.setTransform(view.dpr * view.sc, 0, 0, view.dpr * view.sc, view.dpr * view.ox, view.dpr * view.oy);
    };
    // visible world rect (scene is drawn past 960x540 so there are no black bars)
    view.bounds = () => ({ x0: -view.ox / view.sc, y0: -view.oy / view.sc, x1: (window.innerWidth - view.ox) / view.sc, y1: (window.innerHeight - view.oy) / view.sc });
    window.addEventListener('resize', fit); fit();
    return view;
  }

  /* ---------- helpers ---------- */
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function limb(ctx, pts, w, col) {
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

  /* ---------- the tape ball ---------- */
  function tapeBall(ctx, x, y, r, rot) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath(); ctx.arc(0, 0, r + 1, 0, 7); ctx.fill();
    ctx.rotate(rot);
    ctx.fillStyle = '#E9E2CF'; // plastic
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.clip();
    ctx.fillStyle = '#1F4FD8'; ctx.fillRect(-r, -r * .55, r * 2, r * .5);   // blue electric tape
    ctx.fillStyle = '#D62828'; ctx.fillRect(-r * .3, -r, r * .5, r * 2);   // red tape
    ctx.fillStyle = '#1F4FD8'; ctx.fillRect(-r, r * .25, r * 2, r * .4);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath(); ctx.arc(-r * .35, -r * .35, r * .3, 0, 7); ctx.fill();
    ctx.restore();
  }

  /* ---------- Virendra ---------- */
  // feet centre at (x,y), facing right. o: {crouch, batA, bat:'ruler'|'thapi', mood, bob, throwP, hold}
  function rig(x, y, s, o) {
    const c = o.crouch || 0;
    const hipH = 96 - 46 * c, lean = (6 + 48 * c) * Math.PI / 180, T = 72;
    const hip = { x: -4, y: -hipH + (o.bob || 0) };
    const sh = { x: hip.x + Math.sin(lean) * T, y: hip.y - Math.cos(lean) * T };
    let hands = { x: sh.x + 16 + 6 * c, y: sh.y + 44 - 6 * c };
    const a = o.batA ?? 1.9;
    hands = { x: hands.x + Math.cos(a) * 9, y: hands.y + Math.sin(a) * 5 - 4 };
    const L = o.bat === 'thapi' ? 74 : 42;
    const w = p => ({ x: x + p.x * s, y: y + p.y * s });
    const tip = { x: hands.x + Math.cos(a) * L, y: hands.y + Math.sin(a) * L };
    const sweet = { x: hands.x + Math.cos(a) * L * .72, y: hands.y + Math.sin(a) * L * .72 };
    return { c, hipH, lean, T, hip, sh, hands, a, L, w, tip, sweet, world: { hands: w(hands), tip: w(tip), sweet: w(sweet), head: w({ x: sh.x + 10, y: sh.y - 40 }) } };
  }

  function drawBat(ctx, kind, L) {
    if (kind === 'thapi') {          // kapde dhone wali thapi
      ctx.fillStyle = '#7A4B23'; rr(ctx, -3, -4, 26, 8, 4); ctx.fill();
      ctx.fillStyle = '#B9874E'; rr(ctx, 20, -10, L - 20, 20, 8); ctx.fill();
      ctx.strokeStyle = 'rgba(90,50,20,.45)'; ctx.lineWidth = 1.2;
      for (let i = 30; i < L - 4; i += 9) { ctx.beginPath(); ctx.moveTo(i, -8); ctx.lineTo(i + 3, 8); ctx.stroke(); }
    } else {                         // 15 cm school ruler
      ctx.fillStyle = '#F2C94C'; rr(ctx, -3, -4.5, L + 3, 9, 1.5); ctx.fill();
      ctx.strokeStyle = '#8C6A1C'; ctx.lineWidth = .8; ctx.stroke();
      ctx.strokeStyle = '#3b2a10'; ctx.lineWidth = .7;
      for (let i = 0; i <= 15; i++) { const xx = 2 + i * (L - 4) / 15; ctx.beginPath(); ctx.moveTo(xx, -4.5); ctx.lineTo(xx, i % 5 === 0 ? 0 : -2); ctx.stroke(); }
    }
  }

  function drawVirendra(ctx, x, y, s, o = {}) {
    const R = rig(x, y, s, o);
    const { c, hip, sh, hands, a, L } = R;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(2, 2, 46, 8, 0, 0, 7); ctx.fill();
    const bf = { x: -24, y: -3 }, ff = { x: 26, y: -3 };
    const knee = (f, k) => ({ x: (hip.x + f.x) / 2 + k * (5 + 20 * c), y: (hip.y + f.y) / 2 + 4 * c });
    // legs (black track pants)
    limb(ctx, [hip, knee(bf, .6), bf], 16, '#15161F');
    limb(ctx, [hip, knee(ff, 1), ff], 16, '#1E202C');
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1.5;
    // white shoes
    ctx.fillStyle = '#F4F4F2';
    rr(ctx, bf.x - 10, -8, 24, 10, 5); ctx.fill();
    rr(ctx, ff.x - 8, -8, 26, 10, 5); ctx.fill();
    ctx.fillStyle = '#c9c9c6'; ctx.fillRect(bf.x - 10, -2, 24, 2); ctx.fillRect(ff.x - 8, -2, 26, 2);

    // back arm
    const throwing = o.throwP != null;
    const elbow = (h, k) => ({ x: (sh.x + h.x) / 2 - 6 + k, y: (sh.y + h.y) / 2 + 6 });
    let backHand = hands;
    if (throwing) backHand = { x: sh.x + 4, y: sh.y + 46 };
    limb(ctx, [sh, elbow(backHand, -4), backHand], 13, '#18234D');

    // torso: navy track jacket
    ctx.save(); ctx.translate(hip.x, hip.y); ctx.rotate(R.lean);
    ctx.fillStyle = '#1E2B5E'; rr(ctx, -19, -R.T - 6, 38, R.T + 14, 14); ctx.fill();
    ctx.strokeStyle = '#d7dbe8'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(4, -R.T); ctx.lineTo(4, 4); ctx.stroke(); // zip
    ctx.fillStyle = '#E9EBF2'; ctx.beginPath(); ctx.arc(10, -R.T + 24, 4.2, 0, 7); ctx.fill();               // emblem
    ctx.fillStyle = '#16224A'; rr(ctx, -12, -R.T - 10, 26, 12, 5); ctx.fill();                              // collar
    ctx.restore();

    // head (photo), turned to face right
    const hc = { x: sh.x + 9 + 4 * c, y: sh.y - 38 + 6 * c };
    if (face.complete && face.naturalWidth) {
      const fh = 84, fw = fh * face.naturalWidth / face.naturalHeight;
      ctx.save(); ctx.translate(hc.x, hc.y);
      ctx.rotate(o.mood === 'sad' ? .35 : o.mood === 'happy' ? -.12 : (c * .1));
      ctx.scale(-1, 1);
      ctx.drawImage(face, -fw / 2, -fh / 2, fw, fh);
      ctx.restore();
    } else { ctx.fillStyle = '#C68B62'; ctx.beginPath(); ctx.arc(hc.x, hc.y, 34, 0, 7); ctx.fill(); }

    // bat + front arm
    if (throwing) {
      // bat dangling in back hand
      ctx.save(); ctx.translate(backHand.x, backHand.y); ctx.rotate(1.75); drawBat(ctx, o.bat, L); ctx.restore();
      const ang = 3.6 - o.throwP * 4.3;            // underarm swing from behind to front
      const fh = { x: sh.x + Math.cos(ang) * 50, y: sh.y + 10 + Math.sin(ang) * 40 };
      limb(ctx, [sh, { x: (sh.x + fh.x) / 2, y: (sh.y + fh.y) / 2 + 6 }, fh], 13, '#22306A');
      ctx.fillStyle = '#C68B62'; ctx.beginPath(); ctx.arc(fh.x, fh.y, 6, 0, 7); ctx.fill();
      R.throwHand = { x: x + fh.x * s, y: y + fh.y * s };
      if (o.hold) tapeBall(ctx, fh.x + 4, fh.y - 2, 6.5, 0);
    } else {
      ctx.save(); ctx.translate(hands.x, hands.y); ctx.rotate(a); drawBat(ctx, o.bat, L); ctx.restore();
      limb(ctx, [sh, elbow(hands, 6), hands], 13, '#22306A');
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2; // sleeve stripe
      ctx.beginPath(); ctx.moveTo(sh.x + 2, sh.y + 4); ctx.lineTo((sh.x + hands.x) / 2 + 2, (sh.y + hands.y) / 2 + 8); ctx.stroke();
      ctx.fillStyle = '#C68B62'; ctx.beginPath(); ctx.arc(hands.x, hands.y, 6.5, 0, 7); ctx.fill();
    }
    ctx.restore();
    return R;
  }

  /* ---------- friends (cartoon kids) ---------- */
  function drawKid(ctx, x, y, s, o = {}) {
    const face = o.face ?? -1; // -1 faces left
    ctx.save(); ctx.translate(x, y); ctx.scale(s * face, s);
    // now +x is the direction the kid faces
    const crouch = o.crouch || 0;
    const hipH = 70 - 30 * crouch;
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(0, 2, 30, 6, 0, 0, 7); ctx.fill();
    const run = o.run ? Math.sin(o.run) * 10 : 0;
    limb(ctx, [{ x: 0, y: -hipH }, { x: -8 - run + 8 * crouch, y: -hipH / 2 }, { x: -12 - run, y: -3 }], 11, o.legs || '#2E3A59');
    limb(ctx, [{ x: 0, y: -hipH }, { x: 10 + run + 10 * crouch, y: -hipH / 2 }, { x: 12 + run, y: -3 }], 11, o.legs || '#34416A');
    ctx.fillStyle = '#222'; rr(ctx, -20 - run, -6, 15, 7, 3); ctx.fill(); rr(ctx, 6 + run, -6, 15, 7, 3); ctx.fill();
    // body
    ctx.save(); ctx.translate(0, -hipH); ctx.rotate(.15 + .5 * crouch);
    if (o.girl) { ctx.fillStyle = o.shirt; ctx.beginPath(); ctx.moveTo(-15, -50); ctx.lineTo(15, -50); ctx.lineTo(22, 8); ctx.lineTo(-22, 8); ctx.closePath(); ctx.fill(); }
    else { ctx.fillStyle = o.shirt; rr(ctx, -15, -52, 30, 56, 10); ctx.fill(); }
    if (o.dupatta) { ctx.strokeStyle = o.dupatta; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-12, -50); ctx.quadraticCurveTo(10, -25, 14, 0); ctx.stroke(); }
    // arm
    const aa = o.armA ?? 1.7;
    limb(ctx, [{ x: 0, y: -46 }, { x: Math.cos(aa) * 40, y: -46 + Math.sin(aa) * 40 }], 9, o.skin || '#C68B62');
    if (o.ball) tapeBall(ctx, Math.cos(aa) * 44, -46 + Math.sin(aa) * 44, 6, 0);
    if (o.hands2) limb(ctx, [{ x: 0, y: -40 }, { x: Math.cos(o.hands2) * 38, y: -40 + Math.sin(o.hands2) * 38 }], 9, o.skin || '#C68B62');
    // head
    const skin = o.skin || '#C68B62';
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(4, -72, 20, 0, 7); ctx.fill();
    ctx.fillStyle = o.hair || '#1b120c';
    ctx.beginPath(); ctx.arc(2, -78, 20, Math.PI * .95, Math.PI * 2.1); ctx.fill();
    if (o.girl) { ctx.beginPath(); ctx.arc(-16, -66, 7, 0, 7); ctx.fill(); limb(ctx, [{ x: -16, y: -64 }, { x: -20, y: -36 }], 6, o.hair || '#1b120c'); }
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(14, -74, 2.2, 0, 7); ctx.fill();
    ctx.strokeStyle = '#6b2f1d'; ctx.lineWidth = 2; ctx.beginPath();
    if (o.sad) ctx.arc(14, -60, 5, 3.6, 5.8); else ctx.arc(13, -66, 5, .3, 1.8); ctx.stroke();
    if (o.bindi) { ctx.fillStyle = '#d0142c'; ctx.beginPath(); ctx.arc(19, -80, 1.8, 0, 7); ctx.fill(); }
    ctx.restore();
    ctx.restore();
  }

  /* ---------- particles & pop text ---------- */
  const parts = [], pops = [];
  function burst(x, y, n, cols, sp = 260, g = 600, life = 1) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), v = rand(sp * .3, sp);
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * .3, g, life: rand(life * .5, life), t: 0, c: pick(cols), r: rand(1.5, 4), rot: rand(0, 6), vr: rand(-8, 8), shard: cols.shard });
    }
  }
  function pop(text, x, y, col = '#fff', size = 34, life = 1.3) { pops.push({ text, x, y, col, size, life, t: 0 }); }
  function updateFx(dt) {
    for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.t += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; if (p.t > p.life) parts.splice(i, 1); }
    for (let i = pops.length - 1; i >= 0; i--) { const p = pops[i]; p.t += dt; if (p.t > p.life) pops.splice(i, 1); }
  }
  function drawFx(ctx) {
    for (const p of parts) {
      ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.c;
      if (p.shard) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.beginPath(); ctx.moveTo(-p.r * 2, 0); ctx.lineTo(0, -p.r * 1.4); ctx.lineTo(p.r * 2, p.r); ctx.closePath(); ctx.fill(); ctx.restore(); }
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    for (const p of pops) {
      const k = p.t / p.life, sc = k < .15 ? .6 + k / .15 * .5 : 1.1 - Math.min(.1, (k - .15));
      ctx.save(); ctx.translate(p.x, p.y - k * 40); ctx.scale(sc, sc);
      ctx.globalAlpha = k > .75 ? (1 - k) / .25 : 1;
      ctx.font = `800 ${p.size}px "Baloo 2", system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(30,20,10,.85)'; ctx.lineJoin = 'round'; ctx.strokeText(p.text, 0, 0);
      ctx.fillStyle = p.col; ctx.fillText(p.text, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- sound (all synthesised) ---------- */
  let ac = null, muted = false;
  try { muted = localStorage.getItem('cc-muted') === '1'; } catch (e) { }
  function A() {
    if (!ac) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ac = new C(); }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(type, f0, f1, dur, vol, delay = 0) {
    const a = A(); if (!a || muted) return;
    const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .02);
  }
  function noise(dur, vol, freq, q = 1, delay = 0, attack = .005, type = 'bandpass') {
    const a = A(); if (!a || muted) return;
    const t = a.currentTime + delay, n = Math.floor(a.sampleRate * dur);
    const b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = a.createBufferSource(); s.buffer = b;
    const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = a.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f).connect(g).connect(a.destination); s.start(t); s.stop(t + dur + .02);
  }
  const sfx = {
    unlock() { A(); },
    tock(p = 1) { noise(.07, .5 * p, 1800, 2); tone('triangle', 900, 300, .09, .35 * p); },
    thwack(p = 1) { noise(.12, .7 * p, 900, 1.2); tone('sine', 220, 90, .14, .5 * p); },
    bounce() { tone('sine', 190, 90, .07, .22); },
    swish() { noise(.16, .12, 2600, .7, 0, .06, 'highpass'); },
    stumps() { [0, .05, .11].forEach((d, i) => { tone('square', 1300 - i * 200, 500, .05, .08, d); noise(.04, .25, 3000, 3, d); }); },
    bricks() { noise(.25, .6, 400, .8); tone('sine', 120, 60, .3, .4); noise(.2, .3, 900, 1, .08); },
    glass() { noise(.5, .5, 5000, .6, 0, .002, 'highpass'); for (let i = 0; i < 7; i++) tone('sine', rand(2500, 5200), rand(2000, 4000), rand(.15, .35), .07, i * .03); },
    cheer(big) { noise(big ? 1.8 : 1.1, big ? .28 : .16, 1400, .4, 0, .25); if (big) { tone('triangle', 660, 660, .12, .12, .05); tone('triangle', 880, 880, .18, .12, .18); } },
    aww() { tone('sawtooth', 300, 160, .5, .06); noise(.6, .08, 700, .6, 0, .1); },
    bark() { [0, .22].forEach(d => { tone('sawtooth', 520, 210, .12, .16, d); noise(.1, .2, 800, 2, d); }); },
    wall() { noise(.1, .5, 600, 1.5); tone('sine', 150, 70, .12, .4); },
    ding() { tone('sine', 1046, 1046, .25, .15); tone('sine', 1568, 1568, .35, .1, .08); },
    get muted() { return muted; },
    toggle() { muted = !muted; try { localStorage.setItem('cc-muted', muted ? '1' : '0'); } catch (e) { } return muted; }
  };

  return { W, H, face, setupCanvas, rand, pick, clamp, limb, rr, tapeBall, rig, drawVirendra, drawKid, drawBat, burst, pop, updateFx, drawFx, sfx, parts, pops };
})();
