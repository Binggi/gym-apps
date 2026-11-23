/* Catatan Gym — interaksi kecil tanpa build step:
   1) autosave set latihan, 2) timer istirahat, 3) total makan langsung, 4) grafik SVG. */
(() => {
  'use strict';

  const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
  const nf = (d = 0) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: d });
  const df = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' });
  const dfLong = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const svgNS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(svgNS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (parent) parent.appendChild(n);
    return n;
  };

  async function send(url, method, body) {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrf },
      body: JSON.stringify(body),
      credentials: 'same-origin',
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  /* ---------------- 1. Set latihan ---------------- */
  const rest = setupRestTimer();

  document.querySelectorAll('[data-set]').forEach((row) => {
    const url = row.dataset.url;
    const weight = row.querySelector('[name=weight_kg]');
    const reps = row.querySelector('[name=reps]');
    const btn = row.querySelector('.donebtn');
    const card = row.closest('.ex');
    const state = card?.querySelector('.save-state');
    let timer;

    const payload = () => ({
      weight_kg: weight && weight.value !== '' ? Number(weight.value.replace(',', '.')) : null,
      reps: reps.value !== '' ? Number(reps.value) : null,
      done: btn.getAttribute('aria-pressed') === 'true',
    });

    const save = async () => {
      clearTimeout(timer);
      if (state) state.textContent = 'Menyimpan…';
      try {
        await send(url, 'PATCH', payload());
        if (state) state.textContent = 'Tersimpan';
      } catch (e) {
        if (state) state.textContent = 'Gagal menyimpan — cek koneksi, lalu ubah lagi.';
      }
    };
    const later = () => { clearTimeout(timer); timer = setTimeout(save, 600); };

    [weight, reps].forEach((i) => i && i.addEventListener('input', later));
    [weight, reps].forEach((i) => i && i.addEventListener('change', save));

    btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-pressed') !== 'true';
      // Kalau repetisi kosong saat dicentang, isi dengan placeholder (target / sesi lalu)
      if (on && reps.value === '' && reps.placeholder && /^\d+$/.test(reps.placeholder)) reps.value = reps.placeholder;
      btn.setAttribute('aria-pressed', String(on));
      row.classList.toggle('is-done', on);
      save();
      updateExerciseDone(card);
      if (on) rest.start();
    });
  });

  function updateExerciseDone(card) {
    if (!card) return;
    const all = card.querySelectorAll('.donebtn');
    const done = [...all].every((b) => b.getAttribute('aria-pressed') === 'true');
    const badge = card.querySelector('.done-badge');
    if (badge) badge.hidden = !done;
  }
  document.querySelectorAll('.ex').forEach(updateExerciseDone);

  // Simpan cardio & catatan otomatis
  document.querySelectorAll('[data-autosave]').forEach((form) => {
    let t;
    const state = form.querySelector('.save-state');
    const go = async () => {
      const body = {};
      new FormData(form).forEach((v, k) => { if (k !== '_token' && k !== '_method') body[k] = v === '' ? null : v; });
      try { await send(form.dataset.autosave, 'PATCH', body); if (state) state.textContent = 'Tersimpan'; }
      catch { if (state) state.textContent = 'Gagal menyimpan'; }
    };
    form.addEventListener('input', () => { clearTimeout(t); if (state) state.textContent = '…'; t = setTimeout(go, 800); });
  });

  // Layar tetap menyala selama sesi latihan
  if (document.querySelector('[data-wakelock]') && 'wakeLock' in navigator) {
    let lock;
    const req = async () => { try { lock = await navigator.wakeLock.request('screen'); } catch { /* diabaikan */ } };
    req();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') req(); });
  }

  function setupRestTimer() {
    const box = document.getElementById('rest');
    if (!box) return { start() {} };
    const t = box.querySelector('.t');
    const lbl = box.querySelector('.lbl');
    const total = Number(box.dataset.seconds || 90);
    let end = 0, iv;
    const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const tick = () => {
      const left = Math.round((end - Date.now()) / 1000);
      if (left <= 0) {
        t.textContent = '0:00'; lbl.textContent = 'Set berikutnya';
        if (!box.classList.contains('over')) { box.classList.add('over'); navigator.vibrate?.([200, 100, 200]); }
        if (left < -60) stop();
        return;
      }
      t.textContent = fmt(left);
    };
    const stop = () => { clearInterval(iv); box.hidden = true; box.classList.remove('over'); };
    box.querySelector('[data-add]').addEventListener('click', () => { end = Math.max(end, Date.now()) + 30000; box.classList.remove('over'); lbl.textContent = 'Istirahat'; tick(); });
    box.querySelector('[data-stop]').addEventListener('click', stop);
    return {
      start() {
        end = Date.now() + total * 1000;
        box.hidden = false; box.classList.remove('over'); lbl.textContent = 'Istirahat';
        clearInterval(iv); tick(); iv = setInterval(tick, 250);
      },
    };
  }

  /* ---------------- 2. Total makan harian ---------------- */
  const mealForm = document.querySelector('[data-meals]');
  if (mealForm) {
    const out = {
      p: mealForm.querySelector('[data-total-protein]'),
      k: mealForm.querySelector('[data-total-kcal]'),
      m: mealForm.querySelector('[data-protein-meter]'),
    };
    const target = Number(mealForm.dataset.proteinTarget || 140);
    const recalc = () => {
      let p = Number(mealForm.querySelector('[name=extra_protein_g]')?.value || 0);
      let k = Number(mealForm.querySelector('[name=extra_kcal]')?.value || 0);
      mealForm.querySelectorAll('input[name="meals[]"]:checked').forEach((c) => { p += Number(c.dataset.protein); k += Number(c.dataset.kcal); });
      if (out.p) out.p.textContent = nf().format(p);
      if (out.k) out.k.textContent = nf().format(k);
      if (out.m) { out.m.style.width = Math.min(100, (p / target) * 100) + '%'; out.m.parentElement.classList.toggle('ok', p >= target); }
    };
    mealForm.addEventListener('input', recalc);
    recalc();
  }

  /* ---------------- 3. Grafik ---------------- */
  // Satu seri per grafik (tanpa legenda; judul kartu menamai seri). Garis 2px, area 10%,
  // gridline hairline, label nilai di ujung, crosshair + tooltip, tabel data sebagai alternatif.
  document.querySelectorAll('[data-chart]').forEach((host) => {
    let spec;
    try { spec = JSON.parse(host.dataset.chart); } catch { return; }
    const pts = (spec.points || []).map(([d, v]) => ({ d: parseDate(d), iso: d, v: v === null ? null : Number(v) }));
    const valued = pts.filter((p) => p.v !== null);

    const minPts = spec.type === 'line' ? 2 : 1;
    if (valued.length < minPts) {
      host.innerHTML = '';
      const e = document.createElement('div');
      e.className = 'chart-empty';
      e.textContent = spec.empty || 'Belum cukup data untuk grafik.';
      host.appendChild(e);
      return;
    }

    addTable(host, spec, pts);
    const draw = () => (spec.type === 'bar' ? drawBar : drawLine)(host, spec, pts, valued);
    draw();
    let w = host.clientWidth;
    new ResizeObserver(() => { if (Math.abs(host.clientWidth - w) > 4) { w = host.clientWidth; draw(); } }).observe(host);
  });

  function niceTicks(min, max, count = 4) {
    const span = max - min || 1;
    const raw = span / count;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) || raw;
    const lo = Math.floor(min / step) * step;
    const hi = Math.ceil(max / step) * step;
    const out = [];
    for (let v = lo; v <= hi + step / 2; v += step) out.push(Number(v.toFixed(6)));
    return out;
  }

  function frame(host, H) {
    host.querySelector('svg')?.remove();
    host.querySelector('.tip')?.remove();
    const W = Math.max(280, host.clientWidth);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', tabindex: '0' });
    host.prepend(svg);
    const tip = document.createElement('div');
    tip.className = 'tip'; tip.hidden = true;
    host.appendChild(tip);
    return { svg, tip, W };
  }

  function showTip(tip, x, y, value, label) {
    tip.replaceChildren();
    const b = document.createElement('b');
    const k = document.createElement('span'); k.className = 'k';
    b.append(k, document.createTextNode(value));
    tip.append(b, document.createTextNode(label));
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
    tip.hidden = false;
  }

  function fmtVal(spec, v) { return `${nf(spec.decimals ?? 0).format(v)}${spec.unit ? ' ' + spec.unit : ''}`; }

  function drawLine(host, spec, all, pts) {
    const H = spec.height || 200;
    const { svg, tip, W } = frame(host, H);
    const m = { l: 40, r: 64, t: 14, b: 26 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    let lo = Math.min(...pts.map((p) => p.v)), hi = Math.max(...pts.map((p) => p.v));
    if (spec.target != null) { lo = Math.min(lo, spec.target); hi = Math.max(hi, spec.target); }
    const pad = Math.max((hi - lo) * 0.15, spec.minSpan ?? 1);
    const ticks = niceTicks(lo - pad, hi + pad);
    const y0 = ticks[0], y1 = ticks[ticks.length - 1];
    const t0 = pts[0].d.getTime(), t1 = pts[pts.length - 1].d.getTime();
    const x = (d) => m.l + (t1 === t0 ? iw / 2 : ((d.getTime() - t0) / (t1 - t0)) * iw);
    const y = (v) => m.t + ih - ((v - y0) / (y1 - y0)) * ih;

    svg.setAttribute('aria-label', `${spec.label}: ${pts.length} titik, terakhir ${fmtVal(spec, pts[pts.length - 1].v)}`);

    const g = el('g', { class: 'grid' }, svg);
    const ax = el('g', { class: 'axis' }, svg);
    ticks.forEach((tv) => {
      el('line', { x1: m.l, x2: m.l + iw, y1: y(tv), y2: y(tv) }, g);
      const t = el('text', { x: m.l - 8, y: y(tv) + 4, 'text-anchor': 'end' }, ax);
      t.textContent = nf(spec.decimals ?? 0).format(tv);
    });
    const xt = pts.length > 2 ? [pts[0], pts[Math.floor(pts.length / 2)], pts[pts.length - 1]] : [pts[0], pts[pts.length - 1]];
    [...new Set(xt)].forEach((p, i, arr) => {
      const t = el('text', { x: x(p.d), y: H - 6, 'text-anchor': i === 0 ? 'start' : i === arr.length - 1 ? 'end' : 'middle' }, ax);
      t.textContent = df.format(p.d);
    });

    if (spec.target != null) {
      const r = el('g', { class: 'ref' }, svg);
      el('line', { x1: m.l, x2: m.l + iw, y1: y(spec.target), y2: y(spec.target) }, r);
      const t = el('text', { x: m.l + iw + 6, y: y(spec.target) + 4 }, r);
      t.textContent = spec.targetLabel || 'Target';
    }

    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.d).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
    el('path', { class: 'series-area', d: `${d}L${x(pts[pts.length - 1].d).toFixed(1)},${m.t + ih}L${x(pts[0].d).toFixed(1)},${m.t + ih}Z` }, svg);
    el('line', { class: 'baseline', x1: m.l, x2: m.l + iw, y1: m.t + ih, y2: m.t + ih }, svg);
    el('path', { class: 'series-line', d }, svg);
    const showDots = iw / pts.length > 14;
    pts.forEach((p, i) => { if (showDots || i === pts.length - 1) el('circle', { class: 'dot', cx: x(p.d), cy: y(p.v), r: 4 }, svg); });

    const last = pts[pts.length - 1];
    const end = el('text', { class: 'endlabel', x: x(last.d) + 8, y: y(last.v) + 4 }, svg);
    end.textContent = fmtVal(spec, last.v);

    // Hover: crosshair menempel ke titik terdekat
    const cross = el('line', { class: 'crosshair', y1: m.t, y2: m.t + ih, visibility: 'hidden' }, svg);
    const hl = el('circle', { class: 'dot', r: 5, visibility: 'hidden' }, svg);
    const hit = el('rect', { class: 'hit', x: m.l - 10, y: 0, width: iw + 20, height: H }, svg);
    let idx = pts.length - 1;
    const focus = (i) => {
      idx = Math.max(0, Math.min(pts.length - 1, i));
      const p = pts[idx], px = x(p.d), py = y(p.v);
      cross.setAttribute('x1', px); cross.setAttribute('x2', px); cross.setAttribute('visibility', 'visible');
      hl.setAttribute('cx', px); hl.setAttribute('cy', py); hl.setAttribute('visibility', 'visible');
      showTip(tip, px * (host.clientWidth / W), py * (svg.clientHeight / H), fmtVal(spec, p.v), dfLong.format(p.d));
    };
    const blur = () => { cross.setAttribute('visibility', 'hidden'); hl.setAttribute('visibility', 'hidden'); tip.hidden = true; };
    hit.addEventListener('pointermove', (ev) => {
      const r = svg.getBoundingClientRect();
      const mx = ((ev.clientX - r.left) / r.width) * W;
      let best = 0, bd = Infinity;
      pts.forEach((p, i) => { const dd = Math.abs(x(p.d) - mx); if (dd < bd) { bd = dd; best = i; } });
      focus(best);
    });
    hit.addEventListener('pointerleave', blur);
    svg.addEventListener('focus', () => focus(idx));
    svg.addEventListener('blur', blur);
    svg.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowLeft') { focus(idx - 1); ev.preventDefault(); }
      if (ev.key === 'ArrowRight') { focus(idx + 1); ev.preventDefault(); }
    });
  }

  function drawBar(host, spec, pts) {
    const H = spec.height || 180;
    const { svg, tip, W } = frame(host, H);
    // Label target duduk di margin kanan, di luar area batang, supaya tidak menimpa data
    const m = { l: 44, r: spec.target != null ? 50 : 12, t: 14, b: 26 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const vals = pts.filter((p) => p.v !== null).map((p) => p.v);
    const hi = Math.max(...vals, spec.target ?? 0) * 1.08 || 1;
    const ticks = niceTicks(0, hi, 3);
    const y1 = ticks[ticks.length - 1];
    const y = (v) => m.t + ih - (v / y1) * ih;
    const band = iw / pts.length;
    const bw = Math.min(24, band - 2);

    svg.setAttribute('aria-label', `${spec.label}, ${pts.length} hari`);
    const g = el('g', { class: 'grid' }, svg);
    const ax = el('g', { class: 'axis' }, svg);
    ticks.forEach((tv) => {
      if (tv > 0) el('line', { x1: m.l, x2: m.l + iw, y1: y(tv), y2: y(tv) }, g);
      const t = el('text', { x: m.l - 8, y: y(tv) + 4, 'text-anchor': 'end' }, ax);
      t.textContent = tv >= 10000 ? nf(0).format(tv / 1000) + 'rb' : nf(spec.decimals ?? 0).format(tv);
    });

    const every = band < 22 ? 2 : 1;
    pts.forEach((p, i) => {
      const cx = m.l + band * i + band / 2;
      if (i % every === (pts.length - 1) % every) {
        const t = el('text', { x: cx, y: H - 6, 'text-anchor': 'middle' }, ax);
        t.textContent = String(p.d.getDate());
      }
      let bar = null;
      if (p.v !== null && p.v > 0) {
        const top = y(p.v), x0 = cx - bw / 2, r = Math.min(4, bw / 2, (m.t + ih - top));
        const base = m.t + ih;
        bar = el('path', {
          class: 'bar',
          d: `M${x0},${base}V${top + r}Q${x0},${top} ${x0 + r},${top}H${x0 + bw - r}Q${x0 + bw},${top} ${x0 + bw},${top + r}V${base}Z`,
        }, svg);
      }
      const hit = el('rect', { class: 'hit', x: m.l + band * i, y: m.t, width: band, height: ih + m.b }, svg);
      const label = dfLong.format(p.d);
      const val = p.v === null ? 'Belum dicatat' : fmtVal(spec, p.v);
      hit.addEventListener('pointerenter', () => {
        bar?.classList.add('hover');
        showTip(tip, cx * (host.clientWidth / W), (p.v ? y(p.v) : m.t + ih) * (svg.clientHeight / H), val, label);
      });
      hit.addEventListener('pointerleave', () => { bar?.classList.remove('hover'); tip.hidden = true; });
    });
    el('line', { class: 'baseline', x1: m.l, x2: m.l + iw, y1: m.t + ih, y2: m.t + ih }, svg);

    if (spec.target != null) {
      const r = el('g', { class: 'ref' }, svg);
      el('line', { x1: m.l, x2: m.l + iw + 4, y1: y(spec.target), y2: y(spec.target) }, r);
      const t = el('text', { x: m.l + iw + 8, y: y(spec.target) - 3 }, r);
      t.textContent = 'target';
      const v = el('text', { x: m.l + iw + 8, y: y(spec.target) + 12 }, r);
      v.textContent = spec.targetLabel || nf(spec.decimals ?? 0).format(spec.target);
    }
  }

  function addTable(host, spec, pts) {
    const det = document.createElement('details');
    det.className = 'data';
    const sum = document.createElement('summary');
    sum.textContent = 'Lihat data';
    const wrap = document.createElement('div'); wrap.className = 'tablewrap';
    const table = document.createElement('table');
    const thead = table.createTHead().insertRow();
    ['Tanggal', spec.label].forEach((h, i) => { const th = document.createElement('th'); th.textContent = h; if (i) th.className = 'r'; thead.appendChild(th); });
    const tb = table.createTBody();
    [...pts].reverse().forEach((p) => {
      const r = tb.insertRow();
      r.insertCell().textContent = dfLong.format(p.d);
      const c = r.insertCell(); c.className = 'r'; c.textContent = p.v === null ? '–' : fmtVal(spec, p.v);
    });
    wrap.appendChild(table);
    det.append(sum, wrap);
    host.after(det);
  }

  // Konfirmasi untuk tombol hapus
  document.querySelectorAll('form[data-confirm]').forEach((f) => f.addEventListener('submit', (e) => { if (!confirm(f.dataset.confirm)) e.preventDefault(); }));
})();
