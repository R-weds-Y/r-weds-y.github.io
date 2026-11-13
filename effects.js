/* Ruchira & Yash — visual effects
   1. Ink that draws itself      (line art, names, the "&", florals bleeding in)
   2. Afternoon → dusk → night   (one steady progression behind the celebrations, fireworks at night)
   3. Generative rangoli         (unique to each guest's name, on RSVP)
   4. The Yamuna with diyas      (canvas; tap the water to float one)
   5. Marigold toran             (verlet rope physics; sways with scroll and touch)
   Everything animates only while visible and falls back to static under reduced motion. */
(function () {
  'use strict';
  const C = window.WEDDING || {};
  const doc = document, root = doc.documentElement;
  const $ = (s, el) => (el || doc).querySelector(s);
  const $$ = (s, el) => Array.from((el || doc).querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const SVGNS = 'http://www.w3.org/2000/svg';
  const DPR = () => Math.min(window.devicePixelRatio || 1, 2);
  const onVisible = (el, cb, opts) => {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(es => es.forEach(e => cb(e.isIntersecting)), opts || { rootMargin: '120px 0px' }).observe(el);
  };

  /* =====================================================================
     1. INK — inline the <use> line art so each stroke can be drawn
     ===================================================================== */
  function inlineSymbol(svg) {
    const use = $('use', svg); if (!use) return;
    const sym = doc.getElementById((use.getAttribute('href') || '').slice(1)); if (!sym) return;
    svg.setAttribute('viewBox', sym.getAttribute('viewBox'));
    svg.removeChild(use);
    Array.from(sym.childNodes).forEach(n => svg.appendChild(n.cloneNode(true)));
  }
  function prepInk(svg) {
    inlineSymbol(svg);
    svg.classList.add('ink');
    let i = 0;
    $$('path, circle, rect, ellipse, line, polyline', svg).forEach(el => {
      const fill = el.getAttribute('fill') || (el.closest('[fill]') || {}).getAttribute && el.closest('[fill]').getAttribute('fill');
      if (fill && fill !== 'none') el.classList.add('ink-f');
      else { el.setAttribute('pathLength', '1'); el.classList.add('ink-s'); el.style.setProperty('--i', i++); }
    });
  }
  function drawWhenVisible(el) {
    if (reduced) { el.classList.add('drawn'); return; }
    if (!('IntersectionObserver' in window)) { el.classList.add('drawn'); return; }
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { el.classList.add('drawn'); io.disconnect(); }
    }), { rootMargin: '0px 0px -12% 0px' });
    io.observe(el);
  }
  function splitLetters(el) {
    let i = 0;
    $$('[data-cfg="bride"], [data-cfg="groom"]', el).forEach(n => {
      const t = n.textContent;
      n.setAttribute('aria-label', t);
      n.innerHTML = Array.from(t).map(ch => '<span class="ltr" aria-hidden="true" style="--i:' + (i++) + '">' + ch + '</span>').join('');
      if (n.getAttribute('data-cfg') === 'bride') i += 2; // leave a beat for the "&"
    });
    el.style.setProperty('--amp-i', 7);
  }
  function setupInk() {
    $$('.site svg.ganesh, .site svg.fleuron, .site svg.hedera').forEach(prepInk);
    $$('#morse g > *').forEach((n, i) => n.style.setProperty('--i', i));
    const names = $('#names');
    if (names) { splitLetters(names); names.classList.add('ink-names'); }
    const ampPath = $('#amp path');
    if (ampPath) { ampPath.setAttribute('pathLength', '1'); }
    // fleurons, hedera etc. draw as they scroll in; hero items draw on open
    $$('.site svg.ink').forEach(s => { if (!s.closest('#invite')) drawWhenVisible(s); });
    const brFloral = $('.site__floral--br'); if (brFloral) drawWhenVisible(brFloral);
  }
  function inkOnOpen() {
    const items = [$('#invite svg.ganesh'), $('#names'), $('#morse'), $('.site__floral--tl')];
    items.forEach(el => el && el.classList.add('drawn'));
  }

  /* =====================================================================
     2. AFTERNOON → DUSK → NIGHT (with fireworks)
     ===================================================================== */
  // One steady progression through the celebrations: golden afternoon → dusk → night with fireworks.
  // Driven by overall position through the timeline (not per card), so it never flips back.
  const smooth = t => t * t * (3 - 2 * t);
  function buildStars(sky) {
    let stars = '';
    for (let k = 0; k < 40; k++) stars += `<i style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 70).toFixed(1)}%;--d:${(Math.random() * 4).toFixed(2)}s;--s:${(1 + Math.random() * 1.5).toFixed(1)}px"></i>`;
    $$('.sky__stars', sky).forEach(n => n.innerHTML = stars);
  }
  function fireworks(cv) {
    const g = cv.getContext('2d');
    const COLORS = ['#F7C860', '#F29A3E', '#F4B6B0', '#FFE9B8', '#E8C4C0', '#F0A848'];
    let W = 0, H = 0, running = false, want = false, last = 0, nextAt = 0;
    const rockets = [], sparks = [];
    function size() {
      const d = Math.min(window.devicePixelRatio || 1, 1.5);
      W = innerWidth; H = innerHeight; cv.width = Math.round(W * d); cv.height = Math.round(H * d);
      g.setTransform(d, 0, 0, d, 0, 0);
    }
    function launch() {
      rockets.push({ x: W * (.15 + Math.random() * .7), y: H + 10, vy: -(H * (.0105 + Math.random() * .004)), tx: H * (.12 + Math.random() * .3), col: COLORS[Math.floor(Math.random() * COLORS.length)] });
    }
    function burst(r) {
      const n = 46 + Math.floor(Math.random() * 30), sp = 2.2 + Math.random() * 1.6, alt = COLORS[Math.floor(Math.random() * COLORS.length)];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.283 + Math.random() * .1, v = sp * (.55 + Math.random() * .45);
        sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, decay: .010 + Math.random() * .008, col: i % 3 ? r.col : alt });
      }
    }
    function frame(now) {
      if (!running) return;
      const dt = Math.min(2.5, (now - last) / 16.7); last = now;
      // fade previous frame for soft trails (transparent canvas over the sky gradient)
      g.globalCompositeOperation = 'destination-out';
      g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'lighter';
      if (want && now > nextAt) { launch(); nextAt = now + 700 + Math.random() * 1300; }
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.y += r.vy * dt; r.vy *= .992;
        g.fillStyle = 'rgba(255,220,160,.9)'; g.beginPath(); g.arc(r.x, r.y, 1.4, 0, 6.283); g.fill();
        if (r.y <= r.tx || r.vy > -1) { burst(r); rockets.splice(i, 1); }
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.vx *= .985; s.vy = s.vy * .985 + .035 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= s.decay * dt;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        g.globalAlpha = s.life * .9; g.fillStyle = s.col;
        g.beginPath(); g.arc(s.x, s.y, 1.6 * (.5 + s.life * .5), 0, 6.283); g.fill();
      }
      g.globalAlpha = 1;
      if (!want && !rockets.length && !sparks.length) { running = false; g.clearRect(0, 0, W, H); return; }
      requestAnimationFrame(frame);
    }
    size(); addEventListener('resize', size);
    return {
      set(on) {
        want = on && !doc.hidden && !reduced;
        if (want && !running) { running = true; last = performance.now(); nextAt = last + 300; requestAnimationFrame(frame); }
      },
    };
  }
  function setupSky() {
    const sky = $('#sky'); if (!sky) return;
    buildStars(sky);
    const items = $$('.tl-item'); if (!items.length) return;
    const L = {}; $$('[data-mood]', sky).forEach(l => L[l.dataset.mood] = l);
    const fw = fireworks($('.sky__fireworks', sky));
    let ticking = false;
    function update() {
      ticking = false;
      const c = innerHeight * 0.5;
      const first = items[0].firstElementChild.getBoundingClientRect(), lastCard = items[items.length - 1].firstElementChild.getBoundingClientRect();
      const y0 = first.top + first.height / 2, y1 = lastCard.top + lastCard.height / 2;
      const p = (c - y0) / Math.max(1, y1 - y0);               // 0 at the first celebration, 1 at the last
      const fadeIn = smooth(clamp((p + .35) / .35)), fadeOut = 1 - smooth(clamp((p - 1.02) / .3));
      const vis = fadeIn * fadeOut;
      const dusk = smooth(clamp((p - .22) / .33)), night = smooth(clamp((p - .58) / .32));
      L.afternoon.style.opacity = vis.toFixed(3);
      L.dusk.style.opacity = (dusk * vis).toFixed(3);
      L.night.style.opacity = (night * vis).toFixed(3);
      const dark = night * vis;
      root.style.setProperty('--night', Math.max(dark, dusk * vis * .55).toFixed(3));
      sky.classList.toggle('is-live', vis > .01);
      sky.classList.toggle('is-night', dark > .05);
      fw.set(dark > .45);
    }
    const kick = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', kick);
    doc.addEventListener('visibilitychange', kick);
    update();
  }

  /* =====================================================================
     3. RANGOLI — deterministic from the guest's name
     ===================================================================== */
  function cyrb53(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return [h1 >>> 0, h2 >>> 0];
  }
  function mulberry32(a) {
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function rangoliSVG(name, animated) {
    const key = String(name || 'guest').trim().toLowerCase().replace(/\s+/g, ' ');
    const [a, b] = cyrb53(key);
    const R = mulberry32(a ^ b);
    const pick = arr => arr[Math.floor(R() * arr.length)];
    const range = (lo, hi) => lo + R() * (hi - lo);
    const GOLD = '#9A7A35';
    const pal = ['#7A1F2B', '#E39A3B', '#E8C4C0', '#7E8B6A', '#E2B34A', '#B5533C', '#C98A8F'];
    for (let i = pal.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [pal[i], pal[j]] = [pal[j], pal[i]]; }
    const [f0, f1, f2, f3] = pal;
    const n = pick([6, 8, 8, 10, 12, 12, 16]);
    const step = 360 / n;
    const f = v => v.toFixed(2);
    const petal = (kind, r0, r1, w) => {
      const L = r1 - r0, m = (r0 + r1) / 2;
      if (kind === 'leaf') return `M${f(r0)} 0Q${f(m)} ${f(w)} ${f(r1)} 0Q${f(m)} ${f(-w)} ${f(r0)} 0Z`;
      if (kind === 'drop') return `M${f(r0)} 0C${f(r0 + L * .15)} ${f(w * 1.15)} ${f(r1)} ${f(w * .95)} ${f(r1)} 0C${f(r1)} ${f(-w * .95)} ${f(r0 + L * .15)} ${f(-w * 1.15)} ${f(r0)} 0Z`;
      return `M${f(r0)} 0C${f(r0 + L * .35)} ${f(w)} ${f(r1 - L * .3)} ${f(w * .8)} ${f(r1)} 0C${f(r1 - L * .3)} ${f(-w * .8)} ${f(r0 + L * .35)} ${f(-w)} ${f(r0)} 0Z`;
    };
    let layer = 0, out = '';
    const S = animated ? ' class="s" pathLength="1"' : '';
    const SF = animated ? ' class="s sf" pathLength="1"' : '';
    const ring = (d, fill, sw = .8) => `<path d="${d}" fill="${fill || 'none'}" stroke="${GOLD}" stroke-width="${sw}"${fill ? SF : S}/>`;
    const circle = (r, fill, sw = .8, cx = 0, cy = 0) => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill || 'none'}" stroke="${GOLD}" stroke-width="${sw}"${fill ? SF : S}/>`;
    const group = (inner) => `<g style="--i:${layer++}">${inner}</g>`;
    const around = (count, offset, fn) => { let s = ''; for (let k = 0; k < count; k++) s += `<g transform="rotate(${f(offset + k * 360 / count)})">${fn(k)}</g>`; return s; };

    // centre
    out += group(circle(5, f0) + circle(8.5, null, .9));
    // inner lotus
    const kA = pick(['lotus', 'leaf', 'drop']), LA = range(17, 25), wA = LA * range(.3, .42), rA = 9 + LA;
    out += group(around(n, 0, () => ring(petal(kA, 9, rA, wA), f1) + ring(`M${f(9 + LA * .2)} 0L${f(rA - LA * .25)} 0`, null, .5)));
    // dot ring
    out += group(circle(rA + 3, null, .7) + around(n * 2, step / 4, () => circle(1.5, f2, .4, rA + 7.5, 0)));
    // main petals, offset half a step
    const kB = pick(['lotus', 'drop', 'leaf']), LB = range(22, 31), wB = Math.min(LB * range(.3, .4), (rA + 10) * Math.PI / n * 1.05), rB = rA + 10 + LB;
    out += group(around(n, step / 2, () => ring(petal(kB, rA + 10, rB, wB), f3) + ring(petal(kB, rA + 10 + LB * .22, rB - LB * .16, wB * .5), f0, .5)));
    // optional little leaves between the main petals
    if (R() > .35) out += group(around(n, 0, () => ring(petal('leaf', rB - LB * .55, rB - LB * .05, LB * .14), '#7E8B6A', .5)));
    // kolam loops
    const rC = rB + 9;
    out += group(circle(rB + 3.5, null, .7) + around(n * 2, 0, () => circle(3, null, .7, rC, 0) + circle(.9, GOLD, .3, rC, 0)));
    // border scallops
    const rE = rC + 9, kE = pick(['drop', 'lotus']);
    out += group(around(n * 2, step / 4, () => ring(petal(kE, rE - 4, rE + 7, Math.min(5.5, rE * Math.PI / (n * 2) * .8)), f1, .6)));
    out += group(circle(rE + 9.5, null, .9) + around(n * 4, 0, () => circle(1.1, GOLD, .3, rE + 13, 0)));
    return `<svg xmlns="${SVGNS}" viewBox="-108 -108 216 216" class="rangoli__svg">${out}</svg>`;
  }
  function showRangoli(name) {
    const box = $('#rangoli'); if (!box) return;
    box.innerHTML = rangoliSVG(name, !reduced);
    box.dataset.name = name;
    if (!reduced) requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add('drawn')));
    else box.classList.add('drawn');
  }
  async function saveRangoli() {
    const box = $('#rangoli'); const name = box && box.dataset.name; if (!name) return;
    const W = 1080, H = 1350, cv = doc.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    g.fillStyle = '#F3E6D5'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#9A7A35'; g.lineWidth = 3; g.strokeRect(40, 40, W - 80, H - 80);
    g.strokeStyle = '#BEA270'; g.lineWidth = 1.2; g.strokeRect(54, 54, W - 108, H - 108);
    const img = new Image();
    const url = URL.createObjectURL(new Blob([rangoliSVG(name, false)], { type: 'image/svg+xml' }));
    await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = url; });
    g.drawImage(img, (W - 820) / 2, 250, 820, 820);
    URL.revokeObjectURL(url);
    try { await Promise.all([doc.fonts.load('80px "Great Vibes"'), doc.fonts.load('28px Cinzel')]); } catch (e) {}
    g.textAlign = 'center'; g.fillStyle = '#7A1F2B'; g.font = '84px "Great Vibes", cursive';
    g.fillText('for ' + name.trim().split(/\s+/)[0], W / 2, 190);
    g.fillStyle = '#7A5E22'; g.font = '30px Cinzel, serif';
    if ('letterSpacing' in g) g.letterSpacing = '6px';
    g.fillText('RUCHIRA & YASH · 11–12 DECEMBER 2026', W / 2, 1180);
    g.font = '24px Cinzel, serif';
    g.fillText('VRINDAVAN', W / 2, 1230);
    const blob = await new Promise(ok => cv.toBlob(ok, 'image/png'));
    const file = new File([blob], 'rangoli-' + name.trim().split(/\s+/)[0].toLowerCase() + '.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'My rangoli · Ruchira & Yash' }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    const a = doc.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name;
    doc.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.parentNode.removeChild(a); }, 1000);
  }

  /* =====================================================================
     4. THE YAMUNA — diyas drifting on the river at dusk
     ===================================================================== */
  function setupRiver() {
    const wrap = $('#river'); if (!wrap) return;
    const cv = $('canvas', wrap), g = cv.getContext('2d');
    let W = 0, H = 0, running = false, visible = false, t0 = performance.now(), last = t0;
    const diyas = [], ripples = [], petals = [];
    function size() {
      const r = wrap.getBoundingClientRect(), d = DPR();
      W = r.width; H = r.height; cv.width = Math.round(W * d); cv.height = Math.round(H * d);
      g.setTransform(d, 0, 0, d, 0, 0);
    }
    const lanes = () => [H * .42, H * .58, H * .74];
    function spawn(x, lane, fresh) {
      const L = lanes(), y = lane == null ? L[Math.floor(Math.random() * L.length)] : lane;
      diyas.push({ x, y, s: .75 + (y / H) * .55, v: 6 + Math.random() * 7, ph: Math.random() * 6.28, fl: Math.random() * 6.28, born: fresh ? performance.now() : 0 });
      diyas.sort((a, b) => a.y - b.y);
    }
    function seed() {
      diyas.length = 0;
      const count = Math.max(4, Math.round(W / 70));
      for (let i = 0; i < count; i++) spawn((i + Math.random() * .6) * (W / count), null, false);
      for (let i = 0; i < 6; i++) petals.push({ x: Math.random() * W, y: H * (.35 + Math.random() * .55), v: 4 + Math.random() * 6, r: Math.random() * 6.28 });
    }
    function drawWater(t) {
      const grd = g.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, '#3A3552'); grd.addColorStop(.35, '#2E3A55'); grd.addColorStop(1, '#1F2940');
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      // far bank glow (aarti lights on the ghats)
      const bank = g.createLinearGradient(0, H * .18, 0, H * .36);
      bank.addColorStop(0, 'rgba(255,190,110,0)'); bank.addColorStop(.6, 'rgba(255,190,110,.14)'); bank.addColorStop(1, 'rgba(255,190,110,0)');
      g.fillStyle = bank; g.fillRect(0, H * .18, W, H * .18);
      for (let k = 0; k < 26; k++) {
        const x = (k * 97.3) % W, tw = .4 + .6 * Math.abs(Math.sin(t * .0013 + k));
        g.fillStyle = `rgba(255,205,130,${(.35 * tw).toFixed(3)})`; g.beginPath(); g.arc(x, H * .27 + (k % 3), 1.1, 0, 6.283); g.fill();
      }
      // gold ripples
      g.lineWidth = 1;
      for (let i = 0; i < 9; i++) {
        const y = H * (.36 + i * .07), amp = 1.2 + i * .35, len = 70 + i * 14, sp = (t * (0.012 + i * .002)) % (len * 2);
        g.strokeStyle = `rgba(214,180,110,${(.10 + i * .022).toFixed(3)})`;
        g.beginPath();
        for (let x = -len * 2 + sp; x < W + len; x += len * 2) {
          g.moveTo(x, y);
          g.bezierCurveTo(x + len * .3, y - amp, x + len * .7, y + amp, x + len, y);
        }
        g.stroke();
      }
    }
    function drawDiya(d, t) {
      const bob = Math.sin(t * .0016 + d.ph) * 1.6, x = d.x, y = d.y + bob, s = d.s;
      const flick = .82 + .18 * Math.sin(t * .021 + d.fl) * Math.sin(t * .013 + d.fl * 2);
      // reflection
      const ref = g.createLinearGradient(0, y + 4 * s, 0, y + 34 * s);
      ref.addColorStop(0, `rgba(255,190,90,${(.45 * flick).toFixed(3)})`); ref.addColorStop(1, 'rgba(255,190,90,0)');
      g.fillStyle = ref;
      for (let k = 0; k < 4; k++) {
        const w = (7 - k * 1.2) * s, yy = y + (6 + k * 6) * s, wob = Math.sin(t * .006 + k + d.ph) * 2 * s;
        g.fillRect(x - w / 2 + wob, yy, w, 2.2 * s);
      }
      // halo
      g.globalCompositeOperation = 'lighter';
      const halo = g.createRadialGradient(x, y - 9 * s, 0, x, y - 9 * s, 28 * s);
      halo.addColorStop(0, `rgba(255,180,80,${(.38 * flick).toFixed(3)})`); halo.addColorStop(1, 'rgba(255,180,80,0)');
      g.fillStyle = halo; g.beginPath(); g.arc(x, y - 9 * s, 28 * s, 0, 6.283); g.fill();
      g.globalCompositeOperation = 'source-over';
      // clay bowl
      g.fillStyle = '#9C5230';
      g.beginPath(); g.moveTo(x - 9 * s, y - 2 * s);
      g.quadraticCurveTo(x, y + 8 * s, x + 9 * s, y - 2 * s);
      g.quadraticCurveTo(x + 11 * s, y - 4 * s, x + 7 * s, y - 4 * s); g.lineTo(x - 7 * s, y - 4 * s);
      g.quadraticCurveTo(x - 11 * s, y - 4 * s, x - 9 * s, y - 2 * s); g.fill();
      g.fillStyle = '#C47A4A'; g.beginPath(); g.ellipse(x, y - 3.6 * s, 8 * s, 1.6 * s, 0, 0, 6.283); g.fill();
      g.fillStyle = '#E2B34A'; g.beginPath(); g.ellipse(x, y - 3.8 * s, 5.5 * s, .9 * s, 0, 0, 6.283); g.fill();
      // flame
      const fh = 9 * s * flick, sway = Math.sin(t * .009 + d.fl) * 1.2 * s;
      const fl = g.createRadialGradient(x, y - 6 * s, .5, x, y - 7 * s, fh);
      fl.addColorStop(0, '#FFF6D8'); fl.addColorStop(.35, '#FFD36E'); fl.addColorStop(1, 'rgba(240,120,40,0)');
      g.fillStyle = fl; g.beginPath();
      g.moveTo(x - 2.4 * s, y - 4.5 * s);
      g.quadraticCurveTo(x - 2.8 * s, y - 9 * s, x + sway, y - 4.5 * s - fh * 1.4);
      g.quadraticCurveTo(x + 2.8 * s, y - 9 * s, x + 2.4 * s, y - 4.5 * s);
      g.closePath(); g.fill();
      // new diyas fade in
      if (d.born) { const a = clamp((performance.now() - d.born) / 700); if (a >= 1) d.born = 0; }
    }
    function frame(now) {
      if (!running) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      drawWater(now);
      petals.forEach(p => {
        p.x += p.v * dt; if (p.x > W + 10) p.x = -10;
        g.save(); g.translate(p.x, p.y + Math.sin(now * .002 + p.r) * 1.2); g.rotate(p.r + now * .0004);
        g.fillStyle = 'rgba(227,154,59,.85)'; g.beginPath(); g.ellipse(0, 0, 3, 1.6, 0, 0, 6.283); g.fill(); g.restore();
      });
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i], a = 1 - (now - r.t) / 1400;
        if (a <= 0) { ripples.splice(i, 1); continue; }
        g.strokeStyle = `rgba(235,205,140,${(a * .7).toFixed(3)})`; g.lineWidth = 1;
        const rad = (1 - a) * 34;
        g.beginPath(); g.ellipse(r.x, r.y, rad, rad * .32, 0, 0, 6.283); g.stroke();
        g.beginPath(); g.ellipse(r.x, r.y, rad * .55, rad * .18, 0, 0, 6.283); g.stroke();
      }
      for (let i = diyas.length - 1; i >= 0; i--) {
        const d = diyas[i];
        d.x += d.v * dt;
        if (d.x > W + 30) { diyas.splice(i, 1); if (diyas.length < Math.max(4, Math.round(W / 70))) spawn(-30, null, false); continue; }
        g.globalAlpha = d.born ? clamp((now - d.born) / 700) : 1;
        drawDiya(d, now);
        g.globalAlpha = 1;
      }
      requestAnimationFrame(frame);
    }
    function start() { if (running || reduced) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
    function stop() { running = false; }
    size(); seed();
    if (reduced) { drawWater(0); diyas.forEach(d => drawDiya(d, 0)); }
    onVisible(wrap, v => { visible = v; v && !doc.hidden ? start() : stop(); });
    doc.addEventListener('visibilitychange', () => { doc.hidden ? stop() : visible && start(); });
    addEventListener('resize', () => { const w = W; size(); if (Math.abs(w - W) > 40) seed(); if (reduced) { drawWater(0); diyas.forEach(d => drawDiya(d, 0)); } });
    cv.addEventListener('pointerdown', e => {
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = clamp(e.clientY - r.top, H * .38, H * .86);
      ripples.push({ x, y: y + 2, t: performance.now() });
      if (diyas.length < 22) spawn(x, y, true);
      wrap.parentNode.classList.add('touched');
      if (reduced) { drawWater(0); diyas.forEach(d => drawDiya(d, 0)); }
    });
  }

  /* =====================================================================
     5. MARIGOLD TORAN — verlet rope with hanging strands
     ===================================================================== */
  function marigoldSprite(r, hue) {
    const d = DPR(), c = doc.createElement('canvas'), S = Math.ceil(r * 2 + 4);
    c.width = c.height = S * d; const g = c.getContext('2d'); g.scale(d, d); g.translate(S / 2, S / 2);
    const rings = [[r, 16, hue[0]], [r * .74, 12, hue[1]], [r * .46, 8, hue[2]]];
    rings.forEach(([rr, count, col], ri) => {
      for (let k = 0; k < count; k++) {
        const a = k / count * 6.283 + ri * .3;
        g.save(); g.rotate(a); g.fillStyle = col;
        g.beginPath(); g.ellipse(rr * .62, 0, rr * .42, rr * .26, 0, 0, 6.283); g.fill();
        g.restore();
      }
    });
    g.fillStyle = hue[3]; g.beginPath(); g.arc(0, 0, r * .22, 0, 6.283); g.fill();
    return { c, S };
  }
  function setupToran() {
    const cv = $('#toran'); if (!cv) return;
    const g = cv.getContext('2d');
    const ORANGE = ['#E8902E', '#F0A33E', '#D9772A', '#B95A1E'], YELLOW = ['#EDB548', '#F4C760', '#E2A33A', '#C07A1E'];
    let W = 0, H = 0, sprites = null, pts = [], links = [], strands = [], running = false, visible = false, still = 0;
    const GR = 0.32, DAMP = 0.985;
    function build() {
      const r = cv.getBoundingClientRect(), d = DPR();
      W = r.width; H = r.height; cv.width = Math.round(W * d); cv.height = Math.round(H * d); g.setTransform(d, 0, 0, d, 0, 0);
      const fr = W < 500 ? 5.4 : 6.4;
      sprites = { o: marigoldSprite(fr, ORANGE), y: marigoldSprite(fr, YELLOW), so: marigoldSprite(fr * .82, ORANGE), sy: marigoldSprite(fr * .82, YELLOW) };
      pts = []; links = []; strands = [];
      const swags = W < 500 ? 3 : 4, per = 11, span = W / swags, seg = span / per * 1.13, top = 7;
      const P = (x, y, pinned) => { const p = { x, y, px: x, py: y, pinned }; pts.push(p); return p; };
      let prev = null;
      for (let s = 0; s < swags; s++) {
        for (let k = (s ? 1 : 0); k <= per; k++) {
          const x = s * span + k * span / per, pin = k === 0 || k === per;
          const p = P(x, top + (pin ? 0 : Math.sin(k / per * Math.PI) * 12), pin);
          p.flower = !pin; p.alt = (k + s) % 2;
          if (prev) links.push([prev, p, seg]);
          prev = p;
          if (k === Math.round(per / 2) || pin) {
            // hanging strand
            let q = p; const len = pin ? 3 : 5, sl = fr * 1.85;
            for (let j = 1; j <= len; j++) {
              const c = P(q.x, q.y + sl, false); c.flower = true; c.small = true; c.alt = (j + s) % 2; c.tip = j === len;
              links.push([q, c, sl]); q = c;
            }
          }
        }
      }
      if (reduced) { for (let i = 0; i < 300; i++) step(); draw(); }
    }
    function step() {
      for (const p of pts) {
        if (p.pinned) continue;
        const vx = (p.x - p.px) * DAMP, vy = (p.y - p.py) * DAMP;
        p.px = p.x; p.py = p.y; p.x += vx; p.y += vy + GR;
      }
      for (let it = 0; it < 6; it++) for (const [a, b, len] of links) {
        const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy) || .001, diff = (dist - len) / dist;
        const ka = a.pinned ? 0 : (b.pinned ? 1 : .5), kb = b.pinned ? 0 : (a.pinned ? 1 : .5);
        a.x += dx * diff * ka; a.y += dy * diff * ka; b.x -= dx * diff * kb; b.y -= dy * diff * kb;
      }
    }
    function draw() {
      g.clearRect(0, 0, W, H);
      g.strokeStyle = 'rgba(120,90,40,.75)'; g.lineWidth = 1;
      g.beginPath(); for (const [a, b] of links) { g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); } g.stroke();
      // mango leaves at anchors
      for (const p of pts) if (p.pinned) {
        for (const [ang, len] of [[-.5, 20], [.15, 24], [.75, 19], [-1.1, 15], [1.3, 15]]) {
          g.save(); g.translate(p.x, p.y); g.rotate(Math.PI / 2 + ang);
          const lg = g.createLinearGradient(0, 0, len, 0); lg.addColorStop(0, '#4E6B35'); lg.addColorStop(1, '#7E8B6A');
          g.fillStyle = lg; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * .5, len * .22, len, 0); g.quadraticCurveTo(len * .5, -len * .22, 0, 0); g.fill();
          g.strokeStyle = 'rgba(40,60,25,.5)'; g.lineWidth = .5; g.beginPath(); g.moveTo(1, 0); g.lineTo(len * .92, 0); g.stroke();
          g.restore();
        }
        g.fillStyle = '#9A7A35'; g.beginPath(); g.arc(p.x, p.y, 2.2, 0, 6.283); g.fill();
      }
      for (const p of pts) if (p.flower) {
        const sp = p.small ? (p.alt ? sprites.sy : sprites.so) : (p.alt ? sprites.y : sprites.o);
        g.drawImage(sp.c, p.x - sp.S / 2, p.y - sp.S / 2, sp.S, sp.S);
        if (p.tip) { // little gold bell
          g.fillStyle = '#B8933F'; g.beginPath(); g.moveTo(p.x - 3, p.y + 10); g.quadraticCurveTo(p.x, p.y + 1, p.x + 3, p.y + 10); g.closePath(); g.fill();
          g.beginPath(); g.arc(p.x, p.y + 10.6, 1, 0, 6.283); g.fill();
        }
      }
    }
    function energy() { let e = 0; for (const p of pts) e += Math.abs(p.x - p.px) + Math.abs(p.y - p.py); return e; }
    function loop() {
      if (!running) return;
      step(); draw();
      still = energy() < .25 ? still + 1 : 0;
      if (still > 40) { running = false; return; }
      requestAnimationFrame(loop);
    }
    function wake() { if (reduced || !visible || running) return; running = true; still = 0; requestAnimationFrame(loop); }
    let lastY = scrollY;
    addEventListener('scroll', () => {
      const dy = scrollY - lastY; lastY = scrollY;
      if (!visible || reduced) return;
      const k = clamp(dy * .22, -9, 9);
      for (const p of pts) if (!p.pinned) { p.py -= k * (p.small ? 1.25 : .8); p.px += (Math.random() - .5) * Math.abs(k) * .25; }
      wake();
    }, { passive: true });
    addEventListener('pointermove', e => {
      if (!visible || reduced) return;
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (y < -10 || y > H + 10) return;
      let hit = false;
      for (const p of pts) if (!p.pinned) {
        const dx = p.x - x, dy = p.y - y, d2 = dx * dx + dy * dy;
        if (d2 < 900) { const f = (1 - d2 / 900) * 2.2; p.px -= (e.movementX || 0) * .12 * f; p.py -= (e.movementY || 0) * .12 * f; hit = true; }
      }
      if (hit) wake();
    }, { passive: true });
    build();
    onVisible(cv, v => { visible = v; if (v) { if (!running) { draw(); wake(); } } else running = false; });
    addEventListener('resize', () => { const w = W; if (Math.abs(cv.getBoundingClientRect().width - w) > 2) { build(); draw(); wake(); } });
    // a gentle settle when the invitation opens
    RY._toranWake = () => { for (const p of pts) if (!p.pinned) p.py -= 3 + Math.random() * 2; wake(); };
  }

  /* ===================================================================== */
  const RY = window.RY = {
    showRangoli, saveRangoli, rangoliSVG,
    onOpen() { inkOnOpen(); RY._toranWake && RY._toranWake(); },
  };
  function init() {
    setupInk(); setupSky(); setupRiver(); setupToran();
    const save = $('#saveRangoli'); if (save) save.addEventListener('click', () => saveRangoli().catch(() => {}));
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
