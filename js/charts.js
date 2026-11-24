// Grafik SVG buatan sendiri. Satu seri per grafik (judul kartu menamai seri, jadi tanpa legenda).
// Garis 2px, area 10%, gridline hairline, label nilai di ujung, crosshair + tooltip,
// dan tabel "Lihat data" sebagai alternatif tanpa hover.
import { parseISO } from './logic.js';

const svgNS = 'http://www.w3.org/2000/svg';
const nf = (d = 0) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: d });
const df = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' });
const dfLong = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

function el(tag, attrs = {}, parent) {
  const n = document.createElementNS(svgNS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
}

function fmtVal(spec, v) { return `${nf(spec.decimals ?? 0).format(v)}${spec.unit ? ' ' + spec.unit : ''}`; }

export function renderCharts(root) {
  root.querySelectorAll('[data-chart]').forEach((host) => {
    let spec;
    try { spec = JSON.parse(host.dataset.chart); } catch { return; }
    const pts = (spec.points || []).map(([d, v]) => ({ d: parseISO(d), iso: d, v: v === null || v === undefined ? null : Number(v) }));
    const valued = pts.filter((p) => p.v !== null);

    if (valued.length < (spec.type === 'line' ? 2 : 1)) {
      host.replaceChildren();
      const e = document.createElement('div');
      e.className = 'chart-empty';
      e.textContent = spec.empty || 'Belum cukup data untuk grafik.';
      host.appendChild(e);
      return;
    }

    addTable(host, spec, pts);
    const draw = () => (spec.type === 'bar' ? drawBar(host, spec, pts) : drawLine(host, spec, valued));
    draw();
    let w = host.clientWidth;
    new ResizeObserver(() => { if (Math.abs(host.clientWidth - w) > 4) { w = host.clientWidth; draw(); } }).observe(host);
  });
}

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

function drawLine(host, spec, pts) {
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

  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.d).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
  el('path', { class: 'series-area', d: `${d}L${x(pts[pts.length - 1].d).toFixed(1)},${m.t + ih}L${x(pts[0].d).toFixed(1)},${m.t + ih}Z` }, svg);
  el('line', { class: 'baseline', x1: m.l, x2: m.l + iw, y1: m.t + ih, y2: m.t + ih }, svg);
  el('path', { class: 'series-line', d }, svg);
  const showDots = iw / pts.length > 14;
  pts.forEach((p, i) => { if (showDots || i === pts.length - 1) el('circle', { class: 'dot', cx: x(p.d), cy: y(p.v), r: 4 }, svg); });

  const last = pts[pts.length - 1];
  const end = el('text', { class: 'endlabel', x: x(last.d) + 8, y: y(last.v) + 4 }, svg);
  end.textContent = fmtVal(spec, last.v);

  // Crosshair menempel ke titik terdekat
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
    const value = p.v === null ? 'Belum dicatat' : fmtVal(spec, p.v);
    hit.addEventListener('pointerenter', () => {
      bar?.classList.add('hover');
      showTip(tip, cx * (host.clientWidth / W), (p.v ? y(p.v) : m.t + ih) * (svg.clientHeight / H), value, label);
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
