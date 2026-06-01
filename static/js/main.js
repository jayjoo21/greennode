/* ═══════════════════════════════════════════════════════════
   GreenNode — main.js  (shared, all pages)
   ═══════════════════════════════════════════════════════════ */

// ── Plant data ────────────────────────────────────────────────
const PLANTS = [
  { name:"토마토",   en:"tomato",       sci:"Solanum lycopersicum",   emoji:"🍅", supported:true  },
  { name:"감자",     en:"potato",       sci:"Solanum tuberosum",      emoji:"🥔", supported:true  },
  { name:"고추",     en:"red pepper",   sci:"Capsicum annuum",        emoji:"🌶️", supported:true  },
  { name:"옥수수",   en:"corn",         sci:"Zea mays",               emoji:"🌽", supported:true  },
  { name:"포도",     en:"grape",        sci:"Vitis vinifera",         emoji:"🍇", supported:true  },
  { name:"사과",     en:"apple",        sci:"Malus domestica",        emoji:"🍎", supported:true  },
  { name:"복숭아",   en:"peach",        sci:"Prunus persica",         emoji:"🍑", supported:true  },
  { name:"딸기",     en:"strawberry",   sci:"Fragaria × ananassa",    emoji:"🍓", supported:true  },
  { name:"블루베리", en:"blueberry",    sci:"Vaccinium corymbosum",   emoji:"🫐", supported:true  },
  { name:"오렌지",   en:"orange",       sci:"Citrus sinensis",        emoji:"🍊", supported:true  },
  { name:"체리",     en:"cherry",       sci:"Prunus avium",           emoji:"🍒", supported:true  },
  { name:"오이",     en:"cucumber",     sci:"Cucumis sativus",        emoji:"🥒", supported:true  },
  { name:"호박",     en:"pumpkin",      sci:"Cucurbita maxima",       emoji:"🎃", supported:true  },
  { name:"콩",       en:"soybean",      sci:"Glycine max",            emoji:"🌱", supported:true  },
  { name:"몬스테라",   en:"monstera",     sci:"Monstera deliciosa",     emoji:"🌿", supported:false },
  { name:"스킨답서스", en:"pothos",       sci:"Epipremnum aureum",      emoji:"🪴", supported:false },
  { name:"산세베리아", en:"sansevieria",  sci:"Dracaena trifasciata",   emoji:"🌵", supported:false },
  { name:"고무나무",   en:"rubber plant", sci:"Ficus elastica",         emoji:"🌳", supported:false },
  { name:"선인장",     en:"cactus",       sci:"Cactaceae sp.",          emoji:"🌵", supported:false },
  { name:"칼라데아",   en:"calathea",     sci:"Calathea orbifolia",     emoji:"🍃", supported:false },
  { name:"대나무야자", en:"bamboo palm",  sci:"Chamaedorea seifrizii",  emoji:"🎋", supported:false },
  { name:"필로덴드론", en:"philodendron", sci:"Philodendron sp.",       emoji:"🌿", supported:false },
];

let selectedPlant = null;

function unsplashUrl(p, size = "400x400") {
  return `https://source.unsplash.com/${size}/?${encodeURIComponent(p.en + ",plant")}`;
}

// ── Language system ───────────────────────────────────────────
let currentLang = "ko";

function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem("greennode-lang", lang);

  document.querySelectorAll("[data-ko]").forEach(el => {
    const next = lang === "ko" ? el.dataset.ko : el.dataset.en;
    if (next !== undefined) {
      el.style.transition = "opacity .15s";
      el.style.opacity = "0";
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.textContent = next;
        el.style.opacity = "1";
      }));
    }
  });

  // Sync HTML lang attribute
  document.documentElement.lang = lang === "ko" ? "ko" : "en";

  // Update toggle buttons
  document.querySelectorAll(".lang-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.lang === lang);
  });
}

function initLang() {
  const saved = localStorage.getItem("greennode-lang") || "ko";
  // Apply immediately without animation on first load
  document.querySelectorAll("[data-ko]").forEach(el => {
    const v = saved === "ko" ? el.dataset.ko : el.dataset.en;
    if (v !== undefined) el.textContent = v;
  });
  document.querySelectorAll(".lang-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.lang === saved);
  });
  currentLang = saved;
  document.documentElement.lang = saved === "ko" ? "ko" : "en";
}

function initLangToggle() {
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => applyLang(btn.dataset.lang));
  });
}

// ── Count-up animation ───────────────────────────────────────
function countUp(el, target, suffix = "", duration = 800) {
  if (!el) return;
  const startTime = performance.now();
  const start = 0;
  function tick(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
    el.textContent = Math.round(start + (target - start) * eased) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ── Card stagger animation ────────────────────────────────────
function staggerCards() {
  document.querySelectorAll(".card").forEach((card, i) => {
    setTimeout(() => card.classList.add("card-visible"), i * 80);
  });
}

// ── Ripple effect ─────────────────────────────────────────────
function initRipple(btn) {
  if (!btn) return;
  btn.addEventListener("click", e => {
    const span = document.createElement("span");
    span.className = "ripple-effect";
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    span.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
    btn.appendChild(span);
    span.addEventListener("animationend", () => span.remove());
  });
}

// ── Page fade-out before navigation ──────────────────────────
function initPageTransitions() {
  document.querySelectorAll("a[href]").forEach(link => {
    if (!link.href || link.target === "_blank") return;
    try {
      const url = new URL(link.href);
      if (url.hostname !== window.location.hostname) return;
    } catch { return; }
    link.addEventListener("click", e => {
      e.preventDefault();
      const href = link.href;
      document.body.classList.add("fade-out");
      setTimeout(() => { window.location.href = href; }, 200);
    });
  });
}

// ── Sidebar plant update ──────────────────────────────────────
function updateSidebarPlant(plant) {
  selectedPlant = plant;
  savePlant(plant);

  const nameEl  = document.getElementById("sb-plant-name");
  const badgeEl = document.getElementById("sb-plant-badge");
  const imgEl   = document.getElementById("sb-plant-img");
  const emojiEl = document.getElementById("sb-plant-emoji");

  if (emojiEl) emojiEl.textContent = plant.emoji;
  if (nameEl)  nameEl.textContent  = plant.name;
  if (badgeEl) {
    const k = plant.supported
      ? { text: "PlantVillage AI ✅", ko: "PlantVillage AI ✅", en: "PlantVillage AI ✅" }
      : { text: "관엽식물 ⚠️",       ko: "관엽식물 ⚠️",       en: "Decorative ⚠️" };
    badgeEl.textContent = currentLang === "ko" ? k.ko : k.en;
    badgeEl.className = `plant-badge ${plant.supported ? "supported" : "decorative"}`;
  }
  if (imgEl) {
    imgEl.classList.remove("loaded");
    imgEl.src = unsplashUrl(plant, "200x200");
    imgEl.onload  = () => imgEl.classList.add("loaded");
    imgEl.onerror = () => {};
  }

  // Warning banner
  const banner = document.getElementById("warn-banner");
  if (banner) {
    banner.style.display = plant.supported ? "none" : "block";
    banner.classList.toggle("show", !plant.supported);
  }

  // Hero section (dashboard only)
  const heroImg   = document.getElementById("hero-img");
  const heroSkel  = document.getElementById("hero-skeleton");
  const heroName  = document.getElementById("hero-plant-name");
  const heroSci   = document.getElementById("hero-sci");
  const heroEmoji = document.getElementById("hero-emoji-fallback");

  if (heroEmoji) heroEmoji.textContent = plant.emoji;
  if (heroName) heroName.textContent = plant.name;
  if (heroSci)  heroSci.textContent  = plant.sci;

  if (heroImg) {
    if (heroSkel) heroSkel.classList.remove("gone");
    heroImg.classList.remove("loaded");
    heroImg.src = unsplashUrl(plant, "600x600");
    heroImg.onload = () => {
      heroImg.classList.add("loaded");
      if (heroSkel) heroSkel.classList.add("gone");
    };
    heroImg.onerror = () => {
      if (heroSkel) heroSkel.classList.add("gone");
    };
  }
}

function loadSavedPlant() {
  const saved = localStorage.getItem("gn_plant");
  return PLANTS.find(p => p.name === saved) || PLANTS[0];
}
function savePlant(p) { localStorage.setItem("gn_plant", p.name); }

// ── Plant modal ───────────────────────────────────────────────
function buildPlantGrid() {
  const sup = document.getElementById("modal-sup");
  const dec = document.getElementById("modal-dec");
  if (!sup || !dec) return;
  sup.innerHTML = "";
  dec.innerHTML = "";
  PLANTS.forEach(p => {
    const card = document.createElement("button");
    card.className = `plant-card${p === selectedPlant ? " selected" : ""}`;
    card.innerHTML = `
      <div class="pc-img">
        <span>${p.emoji}</span>
        <img alt="${p.name}" loading="lazy" />
      </div>
      <span class="pc-name">${p.name}</span>`;
    const img = card.querySelector("img");
    img.src = unsplashUrl(p, "200x200");
    img.onload  = () => img.classList.add("loaded");
    img.onerror = () => {};
    card.addEventListener("click", () => {
      updateSidebarPlant(p);
      document.querySelectorAll(".plant-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      setTimeout(closePlantModal, 280);
    });
    (p.supported ? sup : dec).appendChild(card);
  });
}

function openPlantModal()  {
  buildPlantGrid();
  document.getElementById("plant-modal").classList.add("open");
  document.body.style.overflow = "hidden";
}
function closePlantModal() {
  document.getElementById("plant-modal").classList.remove("open");
  document.body.style.overflow = "";
}

// ── Clock ──────────────────────────────────────────────────────
function updateClock() {
  const el = document.getElementById("topbar-time");
  if (!el) return;
  el.textContent = new Date().toLocaleDateString("ko-KR", {
    year:"numeric", month:"long", day:"numeric", weekday:"short", hour:"2-digit", minute:"2-digit"
  });
}

// ── Alert badge ───────────────────────────────────────────────
async function refreshAlertBadge() {
  try {
    const d = await (await fetch("/api/alerts/unread-count")).json();
    document.querySelectorAll(".alert-badge").forEach(b => {
      b.textContent   = d.count;
      b.style.display = d.count > 0 ? "flex" : "none";
    });
  } catch(e) {}
}

// ── Mobile sidebar ─────────────────────────────────────────────
function initSidebar() {
  const sidebar  = document.getElementById("sidebar");
  const overlay  = document.getElementById("sb-overlay");
  const hbg      = document.getElementById("hamburger");
  if (!sidebar) return;
  hbg?.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    overlay?.classList.toggle("open");
  });
  overlay?.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("open");
  });
}

// ── Helpers (used by page scripts) ────────────────────────────
function moistureColor(v) {
  return v < 300 ? "#3b82f6" : v < 700 ? "#3D7A4F" : "#F0A500";
}
function statusKr(s) {
  const m = {dry:["건조","Dry"], normal:["적정","Normal"], wet:["습함","Wet"]};
  return (m[s] || [s,s])[currentLang === "ko" ? 0 : 1];
}
function severityKr(s) {
  const m = {normal:["정상","Normal"], caution:["주의","Caution"], critical:["위험","Critical"]};
  return (m[s] || [s,s])[currentLang === "ko" ? 0 : 1];
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initLang();
  initLangToggle();
  initSidebar();
  initPageTransitions();
  updateSidebarPlant(loadSavedPlant());
  refreshAlertBadge();
  staggerCards();
  updateClock();
  setInterval(updateClock,      1_000);
  setInterval(refreshAlertBadge, 15_000);

  document.getElementById("open-plant-modal")?.addEventListener("click", openPlantModal);
  document.getElementById("close-plant-modal")?.addEventListener("click", closePlantModal);
  document.getElementById("plant-modal")?.addEventListener("click", e => {
    if (e.target === e.currentTarget) closePlantModal();
  });
});
