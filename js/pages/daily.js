import { refresh } from '../actions.js';
import { MEALS, SWAPS, TARGETS, WARTEG, WARTEG_TIPS } from '../data.js';
import { put, state } from '../db.js';
import { addDays, mealKcal, mealProtein, todayISO } from '../logic.js';
import { chart, dateLong, dateMed, esc, icon, num, toast, val } from '../ui.js';

export function render(root, params, dateArg) {
  const today = todayISO();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateArg ?? '') && dateArg <= today ? dateArg : today;
  const isToday = date === today;
  const log = state.daily.find((l) => l.date === date) ?? { date, meals: [] };

  const from = addDays(today, -13);
  const days = Array.from({ length: 14 }, (_, i) => addDays(from, i)).map((d) => {
    const l = state.daily.find((x) => x.date === d);
    const cardio = state.workouts.filter((w) => w.date === d).reduce((t, w) => t + (w.cardioMinutes || 0), 0);
    return { date: d, steps: l?.steps ?? null, sleep: l?.sleep ?? null, water: l?.water ?? null,
      protein: l ? mealProtein(l) : null, kcal: l ? mealKcal(l) : null, cardio: cardio || null };
  });
  const pts = (k) => days.map((d) => [d.date, d[k]]);
  const cardioToday = state.workouts.filter((w) => w.date === date).reduce((t, w) => t + (w.cardioMinutes || 0), 0);

  const meals = Object.entries(MEALS).map(([k, m]) => `
    <label class="meal">
      <input type="checkbox" name="meals" value="${k}" data-protein="${m.protein}" data-kcal="${m.kcal}" ${log.meals?.includes(k) ? 'checked' : ''}>
      <span><b>${esc(m.label)}</b><small>${esc(m.menu)}</small></span>
      <span class="p">±${m.protein} g</span>
    </label>`).join('');

  const warteg = Object.entries(WARTEG).map(([group, items]) => `
    <h4>${esc(group)}</h4>
    <div class="lauk-grid">${items.map(([name, p, k]) => `
      <button type="button" class="lauk" data-add-protein="${p}" data-add-kcal="${k}">
        <span>${esc(name)}</span><b>+${p} g</b><small>±${k} kkal</small>
      </button>`).join('')}</div>`).join('');

  const hasData = days.some((d) => d.protein !== null || d.steps !== null || d.sleep !== null || d.cardio);
  const history = [...days].reverse().map((d) => {
    const parts = [
      d.protein !== null ? `${d.protein} g protein` : null,
      d.steps !== null ? `${num(d.steps)} langkah` : null,
      d.sleep !== null ? `tidur ${num(d.sleep, 1)} j` : null,
      d.cardio ? `jalan ${d.cardio} mnt` : null,
    ].filter(Boolean);
    const ok = d.protein !== null && d.protein >= TARGETS.proteinMin;
    return `<a class="row no-lead" href="#/harian/${d.date}">
      <span><span class="title">${esc(dateMed(d.date))}</span><span class="sub">${parts.length ? esc(parts.join(' · ')) : 'Belum diisi'}</span></span>
      <span class="trail">${d.protein !== null ? `<span class="pill ${ok ? 'ok' : ''}">${ok ? 'Protein cukup' : 'Protein kurang'}</span>` : ''}${icon('right')}</span>
    </a>`;
  }).join('');

  root.innerHTML = `
    <div class="datebar">
      <a class="iconbtn" href="#/harian/${addDays(date, -1)}" aria-label="Hari sebelumnya">${icon('left')}</a>
      <div><b>${isToday ? 'Hari ini' : esc(dateMed(date))}</b><span class="muted small">${esc(dateLong(date))}</span></div>
      ${isToday ? '<span class="iconbtn" aria-hidden="true"></span>' : `<a class="iconbtn" href="#/harian/${addDays(date, 1)}" aria-label="Hari berikutnya">${icon('right')}</a>`}
    </div>
    ${isToday ? '' : '<a class="btn tonal small self-start" href="#/harian">Kembali ke hari ini</a>'}
    <div class="grid-2">
      <form class="stack" id="daily-form">
        <section class="card">
          <div class="card-head"><h2>Makan</h2><span class="pill"><b data-total-protein>0</b> g protein</span></div>
          <span class="meter"><i data-protein-meter style="width:0"></i></span>
          <p class="muted small">±<b data-total-kcal>0</b> / ${num(TARGETS.kcal)} kkal · target protein ${TARGETS.proteinMin} g</p>
          <div class="meals">${meals}</div>
          <div class="form-grid">
            <div class="field"><label for="extraProtein">+ Protein</label>
              <div class="suffix"><input id="extraProtein" name="extraProtein" type="number" inputmode="numeric" min="0" max="500" value="${val(log.extraProtein)}"><span>g</span></div></div>
            <div class="field"><label for="extraKcal">+ Kalori</label>
              <div class="suffix"><input id="extraKcal" name="extraKcal" type="number" inputmode="numeric" min="0" max="5000" value="${val(log.extraKcal)}"><span>kkal</span></div></div>
          </div>
          <details class="howto warteg">
            <summary>Makan di warteg</summary>
            <p class="muted small">Ketuk lauk yang dimakan.</p>
            ${warteg}
            <div class="btn-row" style="align-items:center">
              <button type="button" class="btn ghost small" data-clear-extra>Kosongkan tambahan</button>
              <span class="save-state" data-lauk-log aria-live="polite"></span>
            </div>
            <ul class="tips">${WARTEG_TIPS.slice(0, 3).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          </details>
          <details class="howto">
            <summary>Tukar lauk</summary>
            <div class="tablewrap"><table><tbody>${SWAPS.map(([n, p]) => `<tr><td>${esc(n)}</td><td class="r">±${p} g</td></tr>`).join('')}</tbody></table></div>
          </details>
        </section>
        <section class="card">
          <h2>Aktivitas & istirahat</h2>
          <div class="form-grid">
            <div class="field full"><label for="steps">Langkah</label>
              <input id="steps" name="steps" type="number" inputmode="numeric" min="0" max="100000" value="${val(log.steps)}" placeholder="target ${num(TARGETS.steps)}"></div>
            <div class="field"><label for="sleep">Tidur</label>
              <div class="suffix"><input id="sleep" name="sleep" type="number" inputmode="decimal" step="0.5" min="0" max="24" value="${val(log.sleep)}" placeholder="7–8"><span>jam</span></div></div>
            <div class="field"><label for="water">Air</label>
              <div class="suffix"><input id="water" name="water" type="number" inputmode="decimal" step="0.25" min="0" max="15" value="${val(log.water)}" placeholder="2,5–3"><span>liter</span></div></div>
            ${cardioToday ? `<div class="field full"><span class="muted small">Treadmill hari ini: <b>${cardioToday} menit</b></span></div>` : ''}
            <div class="field full"><label for="dnotes">Catatan</label>
              <textarea id="dnotes" name="notes">${esc(log.notes)}</textarea></div>
          </div>
          <button class="btn primary block" type="submit">Simpan</button>
        </section>
      </form>
      ${hasData ? `<div class="stack">
        <section class="card"><h2>Protein · 14 hari</h2>
          ${chart({ type: 'bar', label: 'Protein', unit: 'g', points: pts('protein'), target: TARGETS.proteinMin, targetLabel: `${TARGETS.proteinMin} g`, empty: 'Belum ada catatan makan 14 hari terakhir.' })}</section>
        <section class="card"><h2>Langkah · 14 hari</h2>
          ${chart({ type: 'bar', label: 'Langkah', unit: '', points: pts('steps'), target: TARGETS.steps, targetLabel: num(TARGETS.steps), empty: 'Belum ada catatan langkah 14 hari terakhir.' })}</section>
        <section class="card"><h2>Tidur · 14 hari</h2>
          ${chart({ type: 'bar', label: 'Tidur', unit: 'jam', decimals: 1, points: pts('sleep'), target: TARGETS.sleepMin, targetLabel: `${TARGETS.sleepMin} jam`, empty: 'Belum ada catatan tidur 14 hari terakhir.' })}</section>
      </div>
      <section class="card span-2">
        <h2>14 hari terakhir</h2>
        <div class="list">${history}</div>
      </section>` : '<p class="chart-empty">Grafik muncul setelah catatan pertama.</p>'}
    </div>`;

  /* ---- Total makan langsung ---- */
  const form = root.querySelector('#daily-form');
  const exP = form.querySelector('[name=extraProtein]');
  const exK = form.querySelector('[name=extraKcal]');
  const recalc = () => {
    let p = Number(exP.value || 0), k = Number(exK.value || 0);
    form.querySelectorAll('input[name=meals]:checked').forEach((c) => { p += Number(c.dataset.protein); k += Number(c.dataset.kcal); });
    form.querySelector('[data-total-protein]').textContent = num(p);
    form.querySelector('[data-total-kcal]').textContent = num(k);
    const m = form.querySelector('[data-protein-meter]');
    m.style.width = Math.min(100, (p / TARGETS.proteinMin) * 100) + '%';
    m.parentElement.classList.toggle('ok', p >= TARGETS.proteinMin);
  };
  form.addEventListener('input', recalc);
  recalc();

  const picked = [];
  const logEl = form.querySelector('[data-lauk-log]');
  const showLog = () => { logEl.textContent = picked.length ? `+ ${picked.join(', ')}` : ''; };
  form.querySelectorAll('[data-add-protein]').forEach((b) => b.addEventListener('click', () => {
    exP.value = Number(exP.value || 0) + Number(b.dataset.addProtein);
    exK.value = Number(exK.value || 0) + Number(b.dataset.addKcal);
    picked.push(b.querySelector('span').textContent.split(',')[0]);
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    showLog(); recalc();
  }));
  form.querySelector('[data-clear-extra]').addEventListener('click', () => {
    exP.value = ''; exK.value = ''; picked.length = 0; showLog(); recalc();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const n = (k, max) => { const v = String(f.get(k) ?? '').replace(',', '.'); if (v === '') return null; const x = Number(v); return Number.isFinite(x) && x >= 0 && x <= max ? x : null; };
    await put('daily', {
      date,
      meals: f.getAll('meals').map(String).filter((k) => MEALS[k]),
      extraProtein: n('extraProtein', 500),
      extraKcal: n('extraKcal', 5000),
      steps: n('steps', 100000),
      sleep: n('sleep', 24),
      water: n('water', 15),
      notes: String(f.get('notes') ?? ''),
    });
    toast('Catatan harian tersimpan.');
    refresh();
  });
}
