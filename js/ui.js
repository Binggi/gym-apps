// Helper tampilan: escape teks, ikon, format angka & tanggal, toast.
import { parseISO } from './logic.js';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
/** Wajib untuk semua teks dari pengguna (catatan, nama file, dll). */
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export const num = (v, d = 0) => (v === null || v === undefined || v === '' ? '–'
  : new Intl.NumberFormat('id-ID', { maximumFractionDigits: d }).format(v));
/** Nilai untuk atribut value input (titik desimal, kosong kalau null). */
export const val = (v) => (v === null || v === undefined ? '' : String(v));

const fmt = (opts) => new Intl.DateTimeFormat('id-ID', opts);
export const dateShort = (iso) => fmt({ day: 'numeric', month: 'short' }).format(parseISO(iso));
export const dateMed = (iso) => fmt({ weekday: 'short', day: 'numeric', month: 'short' }).format(parseISO(iso));
export const dateLong = (iso) => fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(parseISO(iso));
export const dateDayMonth = (iso) => fmt({ weekday: 'long', day: 'numeric', month: 'short' }).format(parseISO(iso));
export const weekday = (iso) => fmt({ weekday: 'long' }).format(parseISO(iso));
export const monthShort = (iso) => fmt({ month: 'short' }).format(parseISO(iso));

const PATHS = {
  home: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>',
  dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  scale: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9.5a4 4 0 0 1 6 0M12 9.5l1.2-1.6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.5v.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M5 7h14M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3"/>',
  play: '<path d="M8 5l11 7-11 7z"/>',
  chart: '<path d="M4 19h16M7 16v-5M12 16V7M17 16v-8"/>',
  left: '<path d="M15 6l-6 6 6 6"/>',
  right: '<path d="M9 6l6 6-6 6"/>',
  save: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>',
};
export const icon = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] ?? ''}</svg>`;

let toastTimer;
export function toast(msg, tone = 'good') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${tone}`;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
}

export function trendNote(t) {
  const ic = { good: 'check', warning: 'alert', critical: 'alert', neutral: 'info' }[t.tone];
  const rate = t.rate === null ? '' : `${t.rate <= 0 ? '−' : '+'}${num(Math.abs(t.rate), 2)} kg/minggu. `;
  return `<div class="note ${t.tone}" role="status">${icon(ic)}<div><b>${esc(t.title)}</b> <span>${rate}${esc(t.text)}</span></div></div>`;
}

/** Spesifikasi grafik ditaruh di data-chart; charts.js yang menggambar. */
export const chart = (spec) => `<div class="chart" data-chart="${esc(JSON.stringify(spec))}"></div>`;

/** Foto gerakan bergerak: awal ↔ akhir bergantian. Ketuk untuk jeda. */
export function photos(e, caption = false) {
  const alt = esc(e.machine);
  return `<button type="button" class="anim" data-anim aria-pressed="false" aria-label="${alt}, animasi posisi awal ke akhir. Ketuk untuk jeda.">
      <img src="img/exercises/${e.slug}-0.jpg" alt="" loading="lazy" decoding="async" width="850" height="567">
      <img class="end" src="img/exercises/${e.slug}-1.jpg" alt="" loading="lazy" decoding="async" width="850" height="567">
      <span class="phase" aria-hidden="true"><span class="p1">Awal</span><span class="p2">Akhir</span></span>
      <span class="state">Ketuk untuk jeda</span>
    </button>${caption ? '<p class="cap">Bentuk alat bisa sedikit beda di tiap gym.</p>' : ''}`;
}
