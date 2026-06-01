/* ═══════════════════════════════════════════════════════════
   GreenNode — main.js (complete rewrite)
   ═══════════════════════════════════════════════════════════ */

// ── Language: apply IMMEDIATELY before DOM events ─────────────
const _saved = localStorage.getItem('greennode-lang') || 'ko';
document.documentElement.setAttribute('data-lang', _saved);
let currentLang = _saved;

// ── Plant data  (ko = Korean display, en = English display, english = Unsplash search key)
const PLANTS = [
  // ✅ PlantVillage supported
  { ko:'토마토',   en:'Tomato',       english:'tomato',       sci:'Solanum lycopersicum',   emoji:'🍅', ok:true  },
  { ko:'감자',     en:'Potato',       english:'potato',       sci:'Solanum tuberosum',      emoji:'🥔', ok:true  },
  { ko:'고추',     en:'Pepper',       english:'red pepper',   sci:'Capsicum annuum',        emoji:'🌶️', ok:true  },
  { ko:'옥수수',   en:'Corn',         english:'corn',         sci:'Zea mays',               emoji:'🌽', ok:true  },
  { ko:'포도',     en:'Grape',        english:'grape',        sci:'Vitis vinifera',         emoji:'🍇', ok:true  },
  { ko:'사과',     en:'Apple',        english:'apple',        sci:'Malus domestica',        emoji:'🍎', ok:true  },
  { ko:'복숭아',   en:'Peach',        english:'peach',        sci:'Prunus persica',         emoji:'🍑', ok:true  },
  { ko:'딸기',     en:'Strawberry',   english:'strawberry',   sci:'Fragaria × ananassa',    emoji:'🍓', ok:true  },
  { ko:'블루베리', en:'Blueberry',    english:'blueberry',    sci:'Vaccinium corymbosum',   emoji:'🫐', ok:true  },
  { ko:'오렌지',   en:'Orange',       english:'orange',       sci:'Citrus sinensis',        emoji:'🍊', ok:true  },
  { ko:'체리',     en:'Cherry',       english:'cherry',       sci:'Prunus avium',           emoji:'🍒', ok:true  },
  { ko:'오이',     en:'Cucumber',     english:'cucumber',     sci:'Cucumis sativus',        emoji:'🥒', ok:true  },
  { ko:'호박',     en:'Pumpkin',      english:'pumpkin',      sci:'Cucurbita maxima',       emoji:'🎃', ok:true  },
  { ko:'콩',       en:'Bean',         english:'soybean',      sci:'Glycine max',            emoji:'🌱', ok:true  },
  // ⚠️ Decorative
  { ko:'몬스테라',   en:'Monstera',     english:'monstera',     sci:'Monstera deliciosa',     emoji:'🌿', ok:false },
  { ko:'스킨답서스', en:'Pothos',       english:'pothos',       sci:'Epipremnum aureum',      emoji:'🪴', ok:false },
  { ko:'산세베리아', en:'Sansevieria',  english:'sansevieria',  sci:'Dracaena trifasciata',   emoji:'🌵', ok:false },
  { ko:'고무나무',   en:'Rubber Tree',  english:'rubber plant', sci:'Ficus elastica',         emoji:'🌳', ok:false },
  { ko:'선인장',     en:'Cactus',       english:'cactus',       sci:'Cactaceae sp.',          emoji:'🌵', ok:false },
  { ko:'칼라데아',   en:'Calathea',     english:'calathea',     sci:'Calathea orbifolia',     emoji:'🍃', ok:false },
  { ko:'대나무야자', en:'Bamboo Palm',  english:'bamboo palm',  sci:'Chamaedorea seifrizii',  emoji:'🎋', ok:false },
  { ko:'필로덴드론', en:'Philodendron', english:'philodendron', sci:'Philodendron sp.',       emoji:'🌿', ok:false },
];
let selectedPlant = null;
function imgUrl(p, sz='80x80') {
  return `https://source.unsplash.com/${sz}/?${encodeURIComponent(p.english+',plant')}`;
}

// ── Language system ───────────────────────────────────────────
function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem('greennode-lang', lang);
  document.documentElement.setAttribute('data-lang', lang);
  document.documentElement.lang = lang === 'ko' ? 'ko' : 'en';
  document.querySelectorAll('[data-ko]').forEach(el => {
    const v = lang === 'ko' ? el.dataset.ko : el.dataset.en;
    if (v !== undefined) el.textContent = v;
  });
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });
}

function initLang() {
  // Re-apply current lang (currentLang already set from top-level)
  applyLang(currentLang);
}

// ── Sidebar collapse ──────────────────────────────────────────
let sidebarCollapsed = localStorage.getItem('gn-sidebar') === '1';

function applySidebarState(sidebar, btn) {
  sidebar.classList.toggle('collapsed', sidebarCollapsed);
  if (btn) btn.textContent = sidebarCollapsed ? '▶' : '◀';
}

// ── Sidebar plant display ─────────────────────────────────────
function updateSidebarPlant(plant) {
  selectedPlant = plant;
  localStorage.setItem('gn-plant', plant.ko); // save by Korean name as stable key

  const nameEl  = document.getElementById('sb-plant-name');
  const badgeEl = document.getElementById('sb-plant-badge');
  const imgEl   = document.getElementById('sb-plant-img');
  const emojiEl = document.getElementById('sb-plant-emoji');

  if (emojiEl) emojiEl.textContent = plant.emoji;
  if (nameEl) {
    // Set bilingual data attributes so applyLang() keeps plant name in sync
    nameEl.dataset.ko = plant.ko;
    nameEl.dataset.en = plant.en;
    nameEl.textContent = currentLang === 'ko' ? plant.ko : plant.en;
  }
  if (badgeEl) {
    badgeEl.dataset.ko = plant.ok ? 'PlantVillage ✅' : '관엽식물 ⚠️';
    badgeEl.dataset.en = plant.ok ? 'PlantVillage ✅' : 'Decorative ⚠️';
    badgeEl.textContent = currentLang === 'ko' ? badgeEl.dataset.ko : badgeEl.dataset.en;
    badgeEl.className = `plant-badge ${plant.ok ? 'supported' : 'decorative'}`;
  }
  if (imgEl) {
    imgEl.classList.remove('loaded');
    imgEl.src = imgUrl(plant, '80x80');
    imgEl.onload  = () => imgEl.classList.add('loaded');
    imgEl.onerror = () => {};
  }

  // Warning banner
  const banner = document.getElementById('warn-banner');
  if (banner) banner.classList.toggle('show', !plant.ok);

  // Hero section (dashboard only)
  const heroImg   = document.getElementById('hero-img');
  const heroName  = document.getElementById('hero-plant-name');
  const heroSci   = document.getElementById('hero-sci');
  const heroEmoji = document.getElementById('hero-emoji');
  if (heroEmoji) heroEmoji.textContent = plant.emoji;
  if (heroName) {
    // Set bilingual data attributes — applyLang() will update on lang switch
    heroName.dataset.ko = plant.ko;
    heroName.dataset.en = plant.en;
    heroName.textContent = currentLang === 'ko' ? plant.ko : plant.en;
  }
  if (heroSci)   heroSci.textContent   = plant.sci;
  if (heroImg) {
    heroImg.classList.remove('loaded');
    heroImg.src = imgUrl(plant, '200x200');
    heroImg.onload  = () => heroImg.classList.add('loaded');
    heroImg.onerror = () => {};
  }
}

function loadSavedPlant() {
  const saved = localStorage.getItem('gn-plant');
  return PLANTS.find(p => p.ko === saved || p.en === saved) || PLANTS[0];
}

// ── Plant modal ───────────────────────────────────────────────
function buildPlantGrid() {
  const sup = document.getElementById('modal-sup');
  const dec = document.getElementById('modal-dec');
  if (!sup || !dec) return;
  sup.innerHTML = '';
  dec.innerHTML = '';
  PLANTS.forEach(p => {
    const btn = document.createElement('button');
    btn.className = `plant-card${p === selectedPlant ? ' selected' : ''}`;
    const displayName = currentLang === 'ko' ? p.ko : p.en;
    btn.innerHTML = `<div class="pc-img"><span>${p.emoji}</span><img alt="${displayName}" loading="lazy"/></div><span class="pc-name">${displayName}</span>`;
    const img = btn.querySelector('img');
    img.src = imgUrl(p, '80x80');
    img.onload  = () => img.classList.add('loaded');
    img.onerror = () => {};
    btn.addEventListener('click', () => {
      updateSidebarPlant(p);
      document.querySelectorAll('.plant-card').forEach(c => c.classList.remove('selected'));
      btn.classList.add('selected');
      setTimeout(closePlantModal, 280);
    });
    (p.ok ? sup : dec).appendChild(btn);
  });
}
function openPlantModal()  { buildPlantGrid(); document.getElementById('plant-modal').classList.add('open'); document.body.style.overflow = 'hidden'; }
function closePlantModal() { document.getElementById('plant-modal')?.classList.remove('open'); document.body.style.overflow = ''; }

// ── Count-up animation ────────────────────────────────────────
function countUp(el, target, suffix = '', duration = 600) {
  if (!el) return;
  const start = performance.now();
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const e = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(target * e) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ── Card stagger ──────────────────────────────────────────────
function staggerCards() {
  document.querySelectorAll('.card').forEach((card, i) => {
    setTimeout(() => card.classList.add('visible'), i * 80);
  });
}

// ── Ripple ────────────────────────────────────────────────────
function initRipple(btn) {
  if (!btn) return;
  btn.addEventListener('click', e => {
    const span = document.createElement('span');
    span.className = 'ripple-effect';
    const rect = btn.getBoundingClientRect();
    const sz   = Math.max(rect.width, rect.height);
    span.style.cssText = `width:${sz}px;height:${sz}px;left:${e.clientX-rect.left-sz/2}px;top:${e.clientY-rect.top-sz/2}px`;
    btn.appendChild(span);
    span.addEventListener('animationend', () => span.remove());
  });
}

// ── Page transitions ──────────────────────────────────────────
function initPageTransitions() {
  document.querySelectorAll('a[href]').forEach(link => {
    try {
      if (new URL(link.href).hostname !== location.hostname) return;
    } catch { return; }
    link.addEventListener('click', e => {
      e.preventDefault();
      const href = link.href;
      document.body.classList.add('fade-out');
      setTimeout(() => location.href = href, 200);
    });
  });
}

// ── Clock ──────────────────────────────────────────────────────
function updateClock() {
  const el = document.getElementById('topbar-time');
  if (!el) return;
  el.textContent = new Date().toLocaleDateString('ko-KR', {
    year:'numeric', month:'long', day:'numeric', weekday:'short', hour:'2-digit', minute:'2-digit'
  });
}

// ── Alert badge ───────────────────────────────────────────────
async function refreshAlertBadge() {
  try {
    const d = await (await fetch('/api/alerts/unread-count')).json();
    document.querySelectorAll('.alert-badge').forEach(b => {
      b.textContent   = d.count;
      b.style.display = d.count > 0 ? 'flex' : 'none';
    });
  } catch(e) {}
}

// ── Helpers (used by page scripts) ────────────────────────────
function moistureColor(v) { return v < 300 ? '#3b82f6' : v < 700 ? '#3D7A4F' : '#F0A500'; }
function statusKr(s)  { return ({dry:['건조','Dry'], normal:['적정','Normal'], wet:['습함','Wet']}[s]||[s,s])[currentLang==='ko'?0:1]; }
function severityKr(s){ return ({normal:['정상','Normal'], caution:['주의','Caution'], critical:['위험','Critical']}[s]||[s,s])[currentLang==='ko'?0:1]; }

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Language (first)
  initLang();
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => applyLang(btn.dataset.lang));
  });

  // Sidebar collapse
  const sidebar  = document.getElementById('sidebar');
  const sbToggle = document.getElementById('sidebar-toggle');
  const sbOver   = document.getElementById('sb-overlay');
  const hamburger = document.getElementById('hamburger');
  if (window.innerWidth < 768) sidebarCollapsed = true;
  applySidebarState(sidebar, sbToggle);
  sbToggle?.addEventListener('click', () => {
    sidebarCollapsed = !sidebarCollapsed;
    localStorage.setItem('gn-sidebar', sidebarCollapsed ? '1' : '0');
    applySidebarState(sidebar, sbToggle);
  });
  hamburger?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sbOver?.classList.toggle('open');
  });
  sbOver?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sbOver.classList.remove('open');
  });

  // Plant
  updateSidebarPlant(loadSavedPlant());
  document.getElementById('open-plant-modal')?.addEventListener('click', openPlantModal);
  document.getElementById('close-plant-modal')?.addEventListener('click', closePlantModal);
  document.getElementById('plant-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closePlantModal();
  });

  // Shared
  initPageTransitions();
  staggerCards();
  updateClock();
  setInterval(updateClock, 1000);
  refreshAlertBadge();
  setInterval(refreshAlertBadge, 15_000);
});
