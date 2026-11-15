/* Ruchira & Yash — invitation behaviour. Content lives in config.js */
(function () {
  'use strict';
  var C = window.WEDDING || {};
  var doc = document, body = doc.body, root = doc.documentElement;
  var $ = function (s, el) { return (el || doc).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(s)); };
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');

  var store = {
    get: function (k) { try { return localStorage.getItem('ry:' + k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem('ry:' + k, v); } catch (e) {} },
  };
  var el = function (tag, attrs, html) {
    var n = doc.createElement(tag);
    for (var k in attrs || {}) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    return n;
  };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var SVGNS = 'http://www.w3.org/2000/svg';

  /* ---------------- content from config ---------------- */
  function fill(key, value) { $$('[data-cfg="' + key + '"]').forEach(function (n) { n.textContent = value; }); }
  function applyConfig() {
    if (C.couple) { fill('bride', C.couple.bride); fill('groom', C.couple.groom); }
    if (C.shloka) $$('[data-cfg="shloka"]').forEach(function (n) { n.innerHTML = C.shloka.map(function (l) { return '<span>' + esc(l) + '</span>'; }).join(''); });
    if (C.dateBlock) { fill('weekday', C.dateBlock.weekday); fill('day', C.dateBlock.day); fill('monthYear', C.dateBlock.monthYear); }
    if (C.venue) { fill('venueName', C.venue.name); fill('venueAddr', C.venue.address); $('#eventsVenue').textContent = 'All at ' + C.venue.name; }
    if (C.contact) fill('contact', C.contact);
    if (C.pinLine) fill('pinLine', C.pinLine);
    if (C.interlude) fill('interlude', C.interlude);
    if (C.closing) { fill('closingLine', C.closing.line); fill('signoff', C.closing.signoff); fill('ps', C.closing.ps); fill('egg', C.closing.egg); }
    var hp = C.heroPhoto;
    if (hp) $$('.card__photo picture, .photo picture').forEach(function (p) {
      // values may be a single path or a srcset list ("a.jpg 800w, b.jpg 1400w")
      $('source', p).srcset = hp.webp; var img = $('img', p);
      if (/\s\d+w/.test(hp.jpg)) { img.srcset = hp.jpg; img.src = hp.jpg.split(',').map(function (s) { return s.trim().split(/\s+/)[0]; })[1] || hp.jpg.split(/\s+/)[0]; }
      else { img.removeAttribute('srcset'); img.src = hp.jpg; }
      if (img.id === 'heroImg') img.alt = hp.alt;
      if (hp.width) { img.width = hp.width; img.height = hp.height; }
    });
  }

  /* ---------------- Morse divider: R & Y ---------------- */
  function buildMorse() {
    var svg = $('#morse'); if (!svg) return;
    var letters = ['.-.', '.-...', '-.--'];
    var x = 0, parts = [], h = 8, mid = 4;
    letters.forEach(function (L, li) {
      L.split('').forEach(function (s, i) {
        if (i) x += 4;
        if (s === '.') { parts.push('<circle cx="' + (x + 1.6) + '" cy="' + mid + '" r="1.6"/>'); x += 3.2; }
        else { parts.push('<rect x="' + x + '" y="' + (mid - 1.2) + '" width="11" height="2.4" rx="1.2"/>'); x += 11; }
      });
      if (li < letters.length - 1) {
        x += 9; parts.push('<path d="M' + x + ' ' + mid + 'l2.2-2.2 2.2 2.2-2.2 2.2z" fill="none" stroke="currentColor" stroke-width=".7"/>'); x += 4.4 + 9;
      }
    });
    svg.setAttribute('viewBox', '0 0 ' + x.toFixed(1) + ' ' + h);
    svg.style.width = (x * 1.15).toFixed(0) + 'px';
    svg.innerHTML = '<g fill="currentColor">' + parts.join('') + '</g>';
  }

  /* ---------------- Countdown (fixed IST offset) ---------------- */
  function countdown() {
    var target = Date.parse(C.weddingStart || '2026-12-12T14:00:00+05:30');
    var after = Date.parse(C.thankYouFrom || '2026-12-13T00:00:00+05:30');
    var grid = $('#cdGrid'), msg = $('#cdMsg');
    var D = $('#cdD'), H = $('#cdH'), M = $('#cdM'), S = $('#cdS');
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    function tick() {
      var now = Date.now(), diff = target - now;
      if (diff <= 0) {
        grid.hidden = true; msg.hidden = false;
        msg.textContent = now >= after ? 'Thank you for celebrating with us' : 'The celebrations have begun';
        return false;
      }
      var s = Math.floor(diff / 1000);
      D.textContent = Math.floor(s / 86400); H.textContent = pad(Math.floor(s % 86400 / 3600));
      M.textContent = pad(Math.floor(s % 3600 / 60)); S.textContent = pad(s % 60);
      return true;
    }
    if (tick()) var t = setInterval(function () { if (!tick()) clearInterval(t); }, 1000);
    setTimeout(function () { if (!grid.hidden || msg.textContent.indexOf('Today') === 0) setInterval(tick, 60000); }, 1500);
  }

  /* ---------------- Events timeline ---------------- */
  var stamp = function (d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
  var icsEsc = function (s) { return String(s).replace(/\\/g, '\\\\').replace(/[;,]/g, '\\$&').replace(/\n/g, '\\n'); };
  var siteUrl = function () { return location.href.split('#')[0].split('?')[0]; };
  function eventTitle(ev) { return ev.id + ' · ' + C.couple.bride + ' & ' + C.couple.groom; }
  function eventDetails(ev) { return (ev.note ? 'Dress note: ' + ev.note + '\n' : '') + siteUrl(); }
  function gcalHref(ev) {
    var s = new Date(ev.start), e = new Date(s.getTime() + (ev.hours || 3) * 36e5);
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(eventTitle(ev)) + '&dates=' + stamp(s) + '/' + stamp(e) +
      '&details=' + encodeURIComponent(eventDetails(ev)) + '&location=' + encodeURIComponent(C.venue.name + ', ' + C.venue.address) +
      '&ctz=Asia/Kolkata';
  }
  var BUNTING = '<svg class="bunting" viewBox="0 0 92 34" aria-hidden="true"><defs><clipPath id="yflag"><rect x="61" y="9.4" width="14" height="12"/></clipPath></defs>' +
    '<path d="M1 4Q46 18 91 4" fill="none" stroke="#BEA270" stroke-width=".8"/>' +
    '<g transform="rotate(8 24 9)"><rect x="17" y="9.4" width="14" height="12" fill="#A65A5E"/><rect x="22.6" y="9.4" width="2.8" height="12" fill="#D9BC72"/><rect x="17" y="14" width="14" height="2.8" fill="#D9BC72"/></g>' +
    '<path d="M38.5 11h15L46 30z" fill="#E8C4C0"/><path d="M46 19.4c-.5-1-2.6-1.6-2.6.1c0 1.2 1.4 1.8 2.6 3c1.2-1.2 2.6-1.8 2.6-3c0-1.7-2.1-1.1-2.6-.1z" fill="#A65A5E"/>' +
    '<g transform="rotate(-8 68 9)"><g clip-path="url(#yflag)"><rect x="61" y="9.4" width="14" height="12" fill="#D9BC72"/>' +
    '<path d="M55 21l12-12M60 21l12-12M65 21l12-12M70 21l12-12" stroke="#A65A5E" stroke-width="2.2"/></g></g></svg>';
  function renderEvents() {
    var ol = $('#timeline'); if (!ol || !C.events) return;
    var html = '', lastDay = '';
    C.events.forEach(function (ev) {
      if (ev.day !== lastDay) { html += '<li class="tl-day">' + esc(ev.day) + '</li>'; lastDay = ev.day; }
      html += '<li class="tl-item"><article class="ev" aria-label="' + esc(ev.id + ', ' + ev.day + ', ' + ev.time) + '">' +
        (ev.bunting ? BUNTING : '') +
        '<div class="ev__head"><svg class="ev__icon" aria-hidden="true"><use href="#i-' + esc(ev.icon) + '"/></svg>' +
        '<div><h3 class="ev__name">' + esc(ev.id) + '</h3><p class="ev__time">' + esc(ev.time) + '</p></div></div>' +
        (ev.note ? '<p class="ev__note">' + (ev.swatch ? '<span class="swatch" style="background:' + esc(ev.swatch) + '" aria-hidden="true"></span>' : '') + esc(ev.note) + '</p>' : '') +
        '</article></li>';
    });
    ol.innerHTML = html;
    var one = $('#calGoogleOne');
    if (one) one.innerHTML = C.events.map(function (ev) { return '<a href="' + esc(gcalHref(ev)) + '" target="_blank" rel="noopener">' + esc(ev.id) + '</a>'; }).join('');
    var all = $('#calGoogleAll');
    if (all) all.href = 'https://calendar.google.com/calendar/render?cid=' +
      encodeURIComponent('webcal://' + location.host + location.pathname.replace(/[^\/]*$/, '') + 'assets/ruchira-yash-wedding.ics');
    ol.insertAdjacentHTML('beforeend', '<li aria-hidden="true" style="list-style:none"><svg class="timeline__anchor"><use href="#anchor"/></svg></li>');
  }

  /* ---------------- Venue map (lazy) ---------------- */
  function setupMap() {
    var q = encodeURIComponent(C.venue.mapQuery || C.venue.name);
    $('#mapsBtn').href = 'https://www.google.com/maps/search/?api=1&query=' + q;
    var box = $('#mapFrame');
    var load = function () {
      if (box.firstChild) return;
      var f = el('iframe', { src: 'https://www.google.com/maps?q=' + q + '&z=15&output=embed', title: 'Map showing ' + C.venue.name, loading: 'lazy', referrerpolicy: 'no-referrer-when-downgrade', allowfullscreen: '' });
      box.appendChild(f);
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { load(); io.disconnect(); } }, { rootMargin: '400px 0px' });
      io.observe(box);
    } else load();
  }

  /* ---------------- Gallery ---------------- */
  function setupGallery() {
    var items = C.gallery || [];
    if (!items.length) return;
    var sec = $('#gallery'), track = $('#galleryTrack'), lb = $('#lightbox'), lbImg = $('#lightboxImg');
    sec.hidden = false;
    track.innerHTML = items.map(function (g, i) {
      return '<li><button type="button" data-i="' + i + '" aria-label="View photo ' + (i + 1) + ' of ' + items.length + '"><picture>' +
        (g.srcset ? '<source type="image/webp" srcset="' + esc(g.srcset) + '" sizes="(min-width: 700px) 400px, 78vw">' : '') +
        '<img src="' + esc(g.fallback || g.src) + '" alt="' + esc(g.alt || '') + '" loading="lazy" decoding="async"' + (g.w ? ' width="' + g.w + '" height="' + g.h + '"' : '') + '></picture></button></li>';
    }).join('');
    track.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var g = items[+b.dataset.i]; lbImg.src = g.src; lbImg.alt = g.alt || '';
      if (lb.showModal) lb.showModal(); else window.open(g.src, '_blank');
    });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.closest('.lightbox__close')) lb.close(); });
  }

  /* ---------------- RSVP ---------------- */
  function setupRsvp() {
    var R = C.rsvp || {};
    var form = $('#rsvpForm'), done = $('#rsvpDone'), closedBox = $('#rsvpClosed');
    var closesAt = Date.parse(R.closesAt || '2026-12-05T23:59:59+05:30');
    try {
      $('#rsvpSub').textContent = 'by ' + new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(closesAt));
    } catch (e) {}
    if (Date.now() > closesAt) {
      form.hidden = true; closedBox.hidden = false; $('#rsvpSub').hidden = true; return;
    }
    if (R.askSide === false) { var sf = $('#sideField'); sf && sf.remove(); }

    var partyField = $('#partyField'), sideField = $('#sideField');
    var picked = function (n) { return (form.querySelector('input[name=' + n + ']:checked') || {}).value; };
    // side and party are only asked once someone accepts
    function syncParty() {
      var yes = picked('attending') === 'yes';
      partyField.hidden = !yes;
      if (sideField) sideField.hidden = !yes;
    }
    form.addEventListener('change', function (e) {
      if (e.target.name === 'attending') $('#eAttend').hidden = true;
      if (e.target.name === 'party') $('#eParty').hidden = true;
      syncParty();
    });
    // a private random ID kept on this device, so a second reply updates the first
    function guestId() {
      var g = store.get('gid');
      if (!g) {
        g = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
        store.set('gid', g);
      }
      return g;
    }
    var msg = $('#fMsg'), cnt = $('#msgCount');
    msg.addEventListener('input', function () { cnt.textContent = msg.value.length; });

    function prefill(d) {
      form.name.value = d.name || '';
      if (d.side && form.side) $$('input[name=side]', form).forEach(function (r) { r.checked = r.value === d.side; });
      $$('input[name=attending]', form).forEach(function (r) { r.checked = r.value === d.attending; });
      $$('input[name=party]', form).forEach(function (r) { r.checked = d.guests && r.value === String(d.guests); });
      msg.value = d.message || ''; cnt.textContent = msg.value.length;
      syncParty();
    }
    var saved = null;
    try { saved = JSON.parse(store.get('rsvp') || 'null'); } catch (e) {}
    if (saved) { prefill(saved); $('#rsvpReturning').hidden = false; }
    $('#rsvpChange').addEventListener('click', function () { form.name.focus(); });

    function showDone(d, updated) {
      if (window.RY) RY.showRangoli(d.name);
      var firstOf = function (n) { return String(n || '').trim().split(/\s+/)[0]; };
      var yes = d.attending === 'yes', both = yes && d.guests === 2;
      var who = firstOf(d.name);
      $('#doneTitle').textContent = yes ? 'Thank you, ' + who + '!' : 'Thank you, ' + who;
      $('#doneText').textContent = (updated ? 'Your response has been updated. ' : '') +
        (both ? 'We can’t wait to celebrate with you both in Vrindavan.' :
         yes ? 'We can’t wait to celebrate with you in Vrindavan.' : 'We’ll miss you dearly, and we’re grateful for your blessings from afar.');
      form.hidden = true; $('#rsvpReturning').hidden = true; done.hidden = false;
      done.focus({ preventScroll: true });
      done.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    }
    $('#rsvpEdit').addEventListener('click', function () { done.hidden = true; form.hidden = false; $('#rsvpReturning').hidden = false; form.name.focus(); });

    var btn = $('#rsvpSubmit'), eForm = $('#eForm');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      eForm.hidden = true;
      var name = form.name.value.trim();
      var attending = picked('attending'), party = picked('party');
      var needParty = attending === 'yes' && !party;
      var bad = null;
      $('#eName').hidden = name.length >= 2; if (name.length < 2) bad = bad || form.name;
      $('#eAttend').hidden = !!attending; if (!attending) bad = bad || form.querySelector('input[name=attending]');
      $('#eParty').hidden = !needParty; if (needParty) bad = bad || form.querySelector('input[name=party]');
      form.name.setAttribute('aria-invalid', name.length < 2);
      if (bad) { bad.focus(); return; }

      var guests = attending === 'yes' ? (party === '2' ? 2 : 1) : 0;
      var data = { id: guestId(), name: name,
        side: attending === 'yes' ? picked('side') || '' : '', attending: attending, guests: guests,
        message: msg.value.trim().slice(0, 300), website: form.website.value };

      var saveLocal = function () { var c = Object.assign({}, data); delete c.website; store.set('rsvp', JSON.stringify(c)); };
      if (data.website) { showDone(data, false); return; } // honeypot: pretend success, send nothing

      btn.disabled = true; btn.textContent = 'Sending…';
      var fail = function (text) {
        btn.disabled = false; btn.textContent = 'Try again';
        eForm.textContent = text || 'We couldn’t send your reply. Please check your connection and try again — your answers are still here.';
        eForm.hidden = false;
      };
      var finish = function (updated) { btn.disabled = false; btn.textContent = 'Send reply'; saveLocal(); showDone(data, updated); };

      if (!R.endpoint) {
        if (/[?&]rsvpdemo\b/.test(location.search)) { setTimeout(function () { finish(!!saved); saved = data; }, 700); }
        else fail('RSVPs aren’t connected yet. Please try again a little later.');
        return;
      }
      var ctrl = window.AbortController ? new AbortController() : null;
      var to = setTimeout(function () { ctrl && ctrl.abort(); }, 25000);
      fetch(R.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data), redirect: 'follow', signal: ctrl && ctrl.signal })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          clearTimeout(to);
          if (res && res.ok) { saved = data; finish(!!res.updated); }
          else fail(res && res.error ? 'Sorry — ' + res.error : null);
        })
        .catch(function () { clearTimeout(to); fail(); });
    });
  }

  /* ---------------- Music + shehnai ---------------- */
  var Music = {
    ctx: null, gain: null, ready: false,
    muted: store.get('muted') === '1',
    btn: null,
    vol: function () { return (C.audio && C.audio.volume) || 0.55; },
    ramp: function (v, secs) {
      var g = this.gain.gain, t = this.ctx.currentTime;
      g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(v, t + secs);
    },
    start: function () { // must run inside the tap gesture
      var self = this, src = C.audio && C.audio.src;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!src || !AC || !window.fetch) return;
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
      try {
        this.ctx = new AC();
        this.gain = this.ctx.createGain(); this.gain.gain.value = 0; this.gain.connect(this.ctx.destination);
        var unlock = this.ctx.createBufferSource(); unlock.buffer = this.ctx.createBuffer(1, 1, 22050); unlock.connect(this.ctx.destination); unlock.start(0);
        if (this.ctx.resume) this.ctx.resume();
      } catch (e) { return; }
      fetch(src).then(function (r) { if (!r.ok) throw new Error('no audio'); return r.arrayBuffer(); })
        .then(function (ab) { return new Promise(function (ok, no) { var p = self.ctx.decodeAudioData(ab, ok, no); if (p && p.catch) p.catch(no); }); })
        .then(function (buf) {
          var s = self.ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.connect(self.gain); s.start(0);
          self.ready = true; self.showButton();
          if (self.muted || doc.hidden) self.ctx.suspend(); else self.ramp(self.vol(), (C.audio && C.audio.fadeInSeconds) || 2);
        })
        .catch(function () { try { self.ctx.close(); } catch (e) {} self.ctx = null; });
    },
    showButton: function () {
      var b = this.btn = $('#shehnai'), self = this;
      b.setAttribute('aria-pressed', String(!this.muted));
      b.setAttribute('aria-label', 'Background music');
      b.hidden = false;
      b.addEventListener('click', function () { self.setMuted(!self.muted); });
      doc.addEventListener('visibilitychange', function () {
        if (!self.ctx) return;
        if (doc.hidden) self.ctx.suspend();
        else if (!self.muted) self.ctx.resume().then(function () { self.ramp(self.vol(), .6); });
      });
    },
    setMuted: function (m) {
      var self = this; this.muted = m; store.set('muted', m ? '1' : '0');
      this.btn.setAttribute('aria-pressed', String(!m));
      if (m) { this.ramp(0, .8); setTimeout(function () { if (self.muted) self.ctx.suspend(); }, 850); }
      else { this.gain.gain.setValueAtTime(0, this.ctx.currentTime); this.ctx.resume().then(function () { self.ramp(self.vol(), 1.2); }); }
    },
  };

  /* ---------------- Cover: envelope → card → invitation ---------------- */
  function layoutEnvelope() {
    var cover = $('#cover'); if (!cover) return;
    var vw = window.innerWidth, vh = window.innerHeight;
    var eh = Math.min(vh * 0.5, (vw - 48) * 1.45, 520), ew = eh / 1.45;
    var cw = Math.min(vw - 32, (vh - 100) * 853 / 1090, 460), ch = cw * 1090 / 853;
    var sc = 0.86 * ew / cw, sch = sc * ch;
    var v = { '--ew': ew, '--eh': eh, '--cw': cw, '--s': sc, '--inY': 0.46 * eh - sch / 2, '--outY': -0.17 * eh - sch / 2, '--drop': 0.28 * eh };
    for (var k in v) cover.style.setProperty(k, k === '--s' ? v[k].toFixed(4) : v[k].toFixed(1) + 'px');
  }
  function setupCover() {
    var cover = $('#cover'), seal = $('#openBtn'), cardBtn = $('#cardBtn'), hint = $('#coverHint'), site = $('#site');
    var stage = 0, T = reduced ? [0, 0, 500] : [950, 2150, 3850];
    layoutEnvelope();
    window.addEventListener('resize', function () { if (stage < 3) layoutEnvelope(); });
    seal.addEventListener('click', function () {
      if (stage) return; stage = 1;
      Music.start();
      cover.classList.add('is-unsealed');
      setTimeout(function () { cover.classList.add('is-out'); }, T[0]);
      setTimeout(function () { cover.classList.add('is-center'); }, T[1]);
      setTimeout(openSite, T[2]); // card settles for a beat, then opens by itself
    });
    function openSite() {
      stage = 3;
      window.scrollTo(0, 0);
      site.removeAttribute('inert'); site.inert = false;
      body.classList.remove('is-closed'); body.classList.add('is-opening', 'draw');
      motionUpdate();
      if (window.RY) RY.onOpen();
      setTimeout(function () {
        cover.parentNode.removeChild(cover); body.classList.remove('is-opening'); body.classList.add('is-open');
        var h = $('#names'); h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true });
        reveal();
      }, reduced ? 450 : 1250);
      setTimeout(function () { body.classList.remove('draw'); }, 4000);
    }
  }

  /* ---------------- Scroll motion (Apple-style) ----------------
     Every effect is scrubbed by scroll position — things glide in as you scroll and glide back out
     in reverse — and driven by a *smoothed* scroll value that eases toward the real one, which gives
     the motion weight and inertia. Native scrolling itself is never touched. Only transform and
     opacity are animated. */
  var motionUpdate = function () {}, motionRefresh = function () {};
  function setupMotion() {
    if (reduced) { root.classList.add('no-motion'); return; }
    var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
    var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    var smooth = function (t) { return t * t * (3 - 2 * t); };
    var it = $('#interludeText'), words = [];
    if (it) {
      it.innerHTML = it.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w">' + esc(w) + '</span>'; }).join(' ');
      words = $$('.w', it);
    }
    // measure the pinned photo so the spacing around it fits any screen size
    var pin = $('#pin');
    function sizePin() {
      if (!pin) return;
      var ph = $('.pin__photo', pin), ln = $('.pin__line', pin);
      pin.style.setProperty('--pin-h', ((ph ? ph.offsetHeight : 0) + 18 + (ln ? ln.offsetHeight : 0)) + 'px');
    }
    sizePin();
    var scenes = $$('[data-scene]'), revs = [];
    var sy = window.scrollY, running = false, lastT = 0;

    function apply() {
      var vh = window.innerHeight, real = window.scrollY, lag = real - sy;
      var maxScroll = Math.max(0, root.scrollHeight - vh);
      // --- read everything first (no layout thrash) ---
      var sr = scenes.map(function (el) { return el.getBoundingClientRect(); });
      var rr = revs.map(function (el) { return el.getBoundingClientRect(); });
      // --- then write ---
      scenes.forEach(function (el, i) {
        var r = sr[i], top = r.top + lag, bottom = r.bottom + lag;
        if (bottom < -vh * .5 || top > vh * 1.5) return;
        var mode = el.dataset.scene, p;
        if (mode === 'pin') {
          p = clamp(-top / Math.max(1, r.height - vh));
          el.style.setProperty('--e', ease(clamp(p / .62)).toFixed(4));
        } else if (mode === 'exit') {
          p = clamp(-top / Math.max(1, r.height));
        } else {
          p = clamp((vh - top) / (vh + r.height));
          el.style.setProperty('--line', clamp((vh * .72 - top) / r.height).toFixed(4));
        }
        el.style.setProperty('--p', p.toFixed(4));
        if (mode === 'words' && words.length) {
          var lit = Math.round(clamp((p - .2) / .32) * words.length);
          for (var k = 0; k < words.length; k++) words[k].classList.toggle('on', k < lit);
        }
      });
      revs.forEach(function (el, i) {
        var r = rr[i], prev = el._r == null ? 0 : el._r;
        // undo our own offset so the element's motion doesn't feed back into its measurement
        var own = el._kind === 'y' ? (1 - prev) * 36 + (1 - prev) * .015 * r.height : 0;
        var trueTop = r.top - own;
        var docTop = trueTop + real;
        var range = Math.min(vh * .3, r.height * .9 + 60);
        var finalTop = docTop - maxScroll;                     // where it sits when the page is scrolled to the end
        range = Math.min(range, Math.max(24, vh - finalTop));  // so things near the bottom still fully arrive
        var v = smooth(clamp((vh - (trueTop + lag)) / range));
        if (Math.abs(v - prev) > .0015 || (v === 1 && prev !== 1) || (v === 0 && prev !== 0)) {
          el._r = v; el.style.setProperty('--r', v.toFixed(3));
        }
      });
    }
    function frame(now) {
      var dt = lastT ? Math.min(64, now - lastT) : 16.7; lastT = now;
      var target = window.scrollY;
      sy += (target - sy) * (1 - Math.pow(1 - .14, dt / 16.7));   // frame-rate independent easing
      if (Math.abs(target - sy) < .4) sy = target;
      apply();
      if (sy !== target) requestAnimationFrame(frame); else { running = false; lastT = 0; }
    }
    function kick() { if (!running) { running = true; requestAnimationFrame(frame); } }
    motionUpdate = function () { sy = window.scrollY; apply(); };
    motionRefresh = function () {
      revs = $$('.reveal, .tl-item');
      revs.forEach(function (el) { el._kind = el.classList.contains('tl-item') ? 'x' : 'y'; });
      apply();
    };
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', function () { sizePin(); sy = window.scrollY; apply(); });
    var heroImg = $('#heroImg'); if (heroImg && !heroImg.complete) heroImg.addEventListener('load', sizePin);
    if ('ResizeObserver' in window) new ResizeObserver(function () { apply(); }).observe(doc.body);
    motionRefresh();
  }

  /* ---------------- Reveal on scroll ---------------- */
  function reveal() {
    if (!reduced) {
      $$('.h2').forEach(function (h) {
        h.innerHTML = h.textContent.trim().split(/\s+/).map(function (w, i) { return '<span class="wd"><span style="--i:' + i + '">' + esc(w) + '</span></span>'; }).join(' ');
      });
      $$('.sub, section > .fleuron, .venue__name, .venue__addr, #mapsBtn, .rsvp__card, .closing > p, .closing > .hedera, .seal, .river__water, .interlude__text').forEach(function (n) { n.classList.add('reveal'); });
    }
    motionRefresh();
    var items = $$('.reveal, .tl-item, .h2');
    if (!('IntersectionObserver' in window)) { items.forEach(function (n) { n.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (n) { io.observe(n); });
  }

  /* ---------------- Saat phere: 7 taps on "&" ---------------- */
  function setupEgg() {
    var amp = $('#amp'), egg = $('#egg'), card = $('.egg__card'), petals = $('#petals');
    var taps = 0, timer = null, lastFocus = null;
    function reset() { taps = 0; amp.style.setProperty('--glow', 0); }
    amp.addEventListener('click', function () {
      taps++; clearTimeout(timer); timer = setTimeout(reset, 3000);
      amp.style.setProperty('--glow', Math.min(taps, 6));
      if (taps >= 7) { clearTimeout(timer); reset(); open(); }
    });
    amp.addEventListener('dblclick', function (e) { e.preventDefault(); });
    function open() {
      lastFocus = doc.activeElement;
      egg.hidden = false; card.focus({ preventScroll: true });
      if (!reduced) shower();
    }
    function close() { egg.hidden = true; petals.innerHTML = ''; if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); }
    egg.addEventListener('click', function (e) { if (e.target === egg) close(); });
    $('#eggClose').addEventListener('click', close);
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !egg.hidden) close(); });
    function shower() {
      var cols = ['#E8962E', '#F0A93B', '#DB7A22', '#F2B84B', '#E58A2A'], html = '';
      for (var i = 0; i < 28; i++) {
        var s = 9 + Math.random() * 9;
        html += '<span style="--x:' + (Math.random() * 100).toFixed(1) + 'vw;--s:' + s.toFixed(1) + 'px;--c:' + cols[i % cols.length] +
          ';--d:' + (3.2 + Math.random() * 2.4).toFixed(2) + 's;--delay:' + (Math.random() * 1.2).toFixed(2) + 's;--drift:' +
          ((Math.random() - .5) * 120).toFixed(0) + 'px;--r:' + (Math.random() * 720 - 360).toFixed(0) + 'deg"></span>';
      }
      petals.innerHTML = html;
      setTimeout(function () { petals.innerHTML = ''; }, 7000);
    }
  }

  /* ---------------- init ---------------- */
  function init() {
    applyConfig(); buildMorse(); countdown(); renderEvents(); setupMap(); setupGallery(); setupRsvp(); setupMotion(); setupCover(); setupEgg();
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
