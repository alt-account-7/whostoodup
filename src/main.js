/* WhoStoodUp — client-side enhancement
   Pre-rendered table is already in the DOM for crawlers.
   This script: Day N counter, tickers, filters, sort, pagination, GA4 events. */
(function () {
  'use strict';

  // ── Read embedded data ───────────────────────────────────────────────────
  function readJson(id) {
    const el = document.getElementById(id);
    return el ? JSON.parse(el.textContent) : null;
  }

  const config = readJson('config-data') ?? {};
  const quotesData = readJson('quotes-data') ?? { quotes: [] };
  const entriesData = readJson('entries-data') ?? { entries: [] };
  const entries = entriesData.entries ?? [];

  // ── Day N counter ────────────────────────────────────────────────────────
  function updateDayN() {
    const el = document.getElementById('day-n');
    if (!el || !config.strike_start_date) return;
    const start = new Date(config.strike_start_date + 'T00:00:00+05:30');
    const diffDays = Math.floor((Date.now() - start.getTime()) / 86400000);
    el.textContent = Math.max(1, diffDays + 1);
  }

  // ── Relative time (timestamp is "YYYY-MM-DD HH:MM" in IST) ─────────────
  function relTime(timestamp) {
    const [datePart, timePart] = timestamp.split(' ');
    const [y, m, d] = datePart.split('-').map(Number);
    const [h, min] = timePart.split(':').map(Number);
    const utcMs = Date.UTC(y, m - 1, d, h - 5, min - 30);
    const diffMs = Date.now() - utcMs;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return `${Math.floor(diffH / 24)}d ago`;
  }

  // ── Utilities ────────────────────────────────────────────────────────────
  function escHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function safeUrl(url) {
    return /^https?:\/\//i.test(url ?? '') ? url : '#';
  }

  function slugify(str) {
    return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function stanceLabel(s) {
    return { support: 'SUPPORT', opposition: 'OPPOSED', neutral: 'NEUTRAL' }[s] ?? s.toUpperCase();
  }

  function rowId(entry) {
    return `entry-${slugify(entry.name)}-${entry.timestamp.split(' ')[0]}`;
  }

  // ── Entry ticker strip ───────────────────────────────────────────────────
  function initEntryTicker() {
    const wrap = document.getElementById('entry-ticker');
    if (!wrap) return;

    const cutoffMs = (config.ticker_window_hours ?? 48) * 3600000;
    const maxN = config.ticker_max_entries ?? 20;
    const cutoff = Date.now() - cutoffMs;

    const recent = entries.filter(e => {
      const [datePart, timePart] = e.timestamp.split(' ');
      const [y, m, d] = datePart.split('-').map(Number);
      const [h, min] = timePart.split(':').map(Number);
      return Date.UTC(y, m - 1, d, h - 5, min - 30) >= cutoff;
    }).slice(0, maxN);

    if (!recent.length) {
      wrap.closest('.ticker-strip')?.remove();
      return;
    }

    const itemsHtml = recent.map(e =>
      `<span class="ticker-item">` +
      `<span class="ticker-name">${escHtml(e.name)}</span>` +
      `<span class="ticker-stance stance-${e.stance}">${stanceLabel(e.stance)}</span>` +
      `<span class="ticker-time mono">${relTime(e.timestamp)}</span>` +
      `</span>`
    ).join('<span class="ticker-sep" aria-hidden="true">&nbsp;·&nbsp;</span>');

    // Duplicate for seamless infinite scroll
    wrap.innerHTML = itemsHtml + '<span aria-hidden="true">' + itemsHtml + '</span>';

    // Touch pause/resume
    const strip = wrap.closest('.ticker-strip');
    if (strip) {
      strip.addEventListener('touchstart', () => strip.classList.add('paused'), { passive: true });
      strip.addEventListener('touchend', () => strip.classList.remove('paused'), { passive: true });
    }
  }

  // ── Quote ticker ─────────────────────────────────────────────────────────
  function initQuoteTicker() {
    const bodyEl = document.getElementById('quote-body');
    const attrEl = document.getElementById('quote-attr');
    const blockEl = document.getElementById('quote-text');
    if (!bodyEl || !attrEl || !blockEl) return;

    const quotes = quotesData.quotes ?? [];
    if (!quotes.length) return;

    let idx = 0;
    const show = (q) => {
      bodyEl.textContent = '“' + q.text + '”';
      attrEl.textContent = '— ' + q.attribution;
    };

    show(quotes[0]);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    setInterval(() => {
      blockEl.classList.add('fade-out');
      setTimeout(() => {
        idx = (idx + 1) % quotes.length;
        show(quotes[idx]);
        blockEl.classList.remove('fade-out');
      }, 420);
    }, 7000);
  }

  // ── Summary counts & sparkline ───────────────────────────────────────────
  function updateSummary() {
    const counts = { support: 0, opposition: 0, neutral: 0 };
    entries.forEach(e => { if (counts[e.stance] !== undefined) counts[e.stance]++; });

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('support-count', counts.support);
    set('opposition-count', counts.opposition);
    set('total-count', entries.length);

    drawSparkline(counts);
  }

  function drawSparkline() {
    const svg = document.getElementById('sparkline');
    if (!svg || !entries.length) return;

    const byDay = {};
    entries.forEach(e => {
      const day = e.timestamp.split(' ')[0];
      if (!byDay[day]) byDay[day] = { support: 0, opposition: 0, other: 0 };
      if (e.stance === 'support') byDay[day].support++;
      else if (e.stance === 'opposition') byDay[day].opposition++;
      else byDay[day].other++;
    });

    const days = Object.keys(byDay).sort();
    const W = 120, H = 24;
    const colW = W / days.length;
    const barW = Math.max(2, colW - 1);
    const maxTotal = Math.max(...days.map(d => byDay[d].support + byDay[d].opposition + byDay[d].other));

    const rects = days.map((day, i) => {
      const x = i * colW;
      const { support: s, opposition: o, other: r } = byDay[day];
      let y = H;
      let out = '';
      const draw = (h, fill) => {
        if (!h) return;
        const ph = Math.max(2, (h / maxTotal) * H);
        y -= ph;
        out += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW}" height="${ph.toFixed(1)}" fill="${fill}"/>`;
      };
      draw(s, '#FF3D00');
      draw(o, '#FAFAFA');
      draw(r, '#737373');
      return out;
    }).join('');

    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = rects;
  }

  // ── Filter + sort + pagination state ────────────────────────────────────
  const filter = { stance: 'all', role: 'all', search: '' };
  const sort = { key: 'timestamp', dir: 'asc' };
  let page = 1;
  const PAGE_SIZE = 50;

  function filtered() {
    return entries
      .filter(e => {
        if (filter.stance !== 'all' && e.stance !== filter.stance) return false;
        if (filter.role !== 'all' && e.role !== filter.role) return false;
        if (filter.search) {
          const q = filter.search.toLowerCase();
          if (!e.name.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sort.key === 'timestamp') cmp = a.timestamp.localeCompare(b.timestamp);
        if (sort.key === 'stance') {
          const ord = { support: 0, opposition: 1, neutral: 2 };
          cmp = (ord[a.stance] ?? 3) - (ord[b.stance] ?? 3);
        }
        return sort.dir === 'asc' ? cmp : -cmp;
      });
  }

  function renderQuoteCell(e) {
    if (!e.quote) return '<span class="no-quote">Attended / no public statement</span>';
    if (e.visit_only) return `<em class="visit-note">${escHtml(e.quote)}</em>`;
    return `&ldquo;${escHtml(e.quote)}&rdquo;`;
  }

  function renderRow(e) {
    const nameHref = safeUrl(e.wiki_url);
    const nameEl = nameHref !== '#'
      ? `<a href="${escHtml(nameHref)}" target="_blank" rel="noopener noreferrer">${escHtml(e.name)}</a>`
      : escHtml(e.name);
    return `<tr id="${rowId(e)}" class="entry-row stance-${e.stance}">
      <td class="mono col-date">${escHtml(e.timestamp.split(' ')[0])}</td>
      <td class="col-name">${nameEl}</td>
      <td class="mono col-role">${escHtml(e.role.toUpperCase())}</td>
      <td class="col-stance"><span class="stance-badge stance-${e.stance}">${stanceLabel(e.stance)}</span></td>
      <td class="col-quote">${renderQuoteCell(e)}</td>
      <td class="col-source"><a href="${escHtml(safeUrl(e.source_url))}" target="_blank" rel="noopener noreferrer" class="source-link mono" data-entry="${escHtml(e.name)}">SOURCE ↗</a></td>
    </tr>`;
  }

  function renderTable() {
    const tbody = document.getElementById('entries-tbody');
    if (!tbody) return;

    const rows = filtered();
    const visible = rows.slice(0, page * PAGE_SIZE);

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state mono">No entries match the current filters.</td></tr>';
    } else {
      tbody.innerHTML = visible.map(renderRow).join('');
    }

    updatePagination(rows.length, visible.length);
  }

  function updatePagination(total, shown) {
    const el = document.getElementById('pagination');
    if (!el) return;

    if (shown >= total) {
      el.innerHTML = `<span class="result-count mono">${total} ENTR${total === 1 ? 'Y' : 'IES'}</span>`;
    } else {
      el.innerHTML =
        `<span class="result-count mono">${shown} of ${total}</span>` +
        `<button class="load-more-btn" id="load-more">LOAD MORE</button>`;
      document.getElementById('load-more')?.addEventListener('click', () => {
        page++;
        renderTable();
        track('load_more');
      });
    }
  }

  // ── Filter bar ───────────────────────────────────────────────────────────
  function initFilterBar() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const { filter: f, value: v } = btn.dataset;
        filter[f] = v;
        if (v === 'all') {
          filter.search = '';
          const si = document.getElementById('entry-search');
          if (si) si.value = '';
        }
        page = 1;
        document.querySelectorAll(`.filter-btn[data-filter="${f}"]`).forEach(b => {
          b.classList.toggle('active', b.dataset.value === v);
        });
        renderTable();
        track('filter_used', { filter_type: f, filter_value: v });
      });
    });

    const searchInput = document.getElementById('entry-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        filter.search = searchInput.value.trim();
        page = 1;
        renderTable();
      });
    }

    // Sticky observer
    const sentinel = document.getElementById('filter-sentinel');
    const bar = document.getElementById('filter-bar');
    if (sentinel && bar && 'IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        bar.classList.toggle('sticky', !entry.isIntersecting);
      }, { rootMargin: '-1px 0px 0px 0px' }).observe(sentinel);
    }
  }

  // ── Sort ─────────────────────────────────────────────────────────────────
  function initSort() {
    document.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.sort;
        if (sort.key === key) {
          sort.dir = sort.dir === 'asc' ? 'desc' : 'asc';
        } else {
          sort.key = key;
          sort.dir = key === 'timestamp' ? 'desc' : 'asc';
        }
        page = 1;
        document.querySelectorAll('.sort-indicator').forEach(ind => (ind.textContent = ''));
        btn.querySelector('.sort-indicator').textContent = sort.dir === 'asc' ? '↑' : '↓';
        renderTable();
        track('sort_used', { sort_key: key, sort_dir: sort.dir });
      });
    });
  }

  // ── Source link tracking ─────────────────────────────────────────────────
  function initTracking() {
    document.addEventListener('click', e => {
      const link = e.target.closest('.source-link');
      if (link) track('source_link_click', { entry_name: link.dataset.entry });
    });
  }

  // ── Last synced display ───────────────────────────────────────────────────
  function updateLastSynced() {
    const el = document.getElementById('last-synced');
    const genEl = document.getElementById('generated-at');
    if (!el || !genEl) return;
    try {
      const d = new Date(genEl.textContent.trim());
      el.textContent = 'Last synced: ' + d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
    } catch { /* noop */ }
  }

  // ── GA4 ──────────────────────────────────────────────────────────────────
  function track(name, params = {}) {
    if (typeof gtag === 'function') gtag('event', name, params);
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  function init() {
    updateDayN();
    setInterval(updateDayN, 60000);
    updateSummary();
    initEntryTicker();
    initQuoteTicker();
    // Replace pre-rendered table with JS-controlled version for filter/sort/pagination
    renderTable();
    initFilterBar();
    initSort();
    initTracking();
    updateLastSynced();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
