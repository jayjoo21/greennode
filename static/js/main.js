/* ═══════════════════════════════════════════════════════════
   GreenNode — main.js  (shared across all pages)
   ═══════════════════════════════════════════════════════════ */

// ── Plant data ────────────────────────────────────────────────
const PLANTS = [
  // ✅ PlantVillage supported
  { name:"토마토",   en:"tomato",       sci:"Solanum lycopersicum", emoji:"🍅", supported:true  },
  { name:"감자",     en:"potato",       sci:"Solanum tuberosum",    emoji:"🥔", supported:true  },
  { name:"고추",     en:"red pepper",   sci:"Capsicum annuum",      emoji:"🌶️", supported:true  },
  { name:"옥수수",   en:"corn",         sci:"Zea mays",             emoji:"🌽", supported:true  },
  { name:"포도",     en:"grape",        sci:"Vitis vinifera",       emoji:"🍇", supported:true  },
  { name:"사과",     en:"apple",        sci:"Malus domestica",      emoji:"🍎", supported:true  },
  { name:"복숭아",   en:"peach",        sci:"Prunus persica",       emoji:"🍑", supported:true  },
  { name:"딸기",     en:"strawberry",   sci:"Fragaria × ananassa",  emoji:"🍓", supported:true  },
  { name:"블루베리", en:"blueberry",    sci:"Vaccinium corymbosum", emoji:"🫐", supported:true  },
  { name:"오렌지",   en:"orange",       sci:"Citrus sinensis",      emoji:"🍊", supported:true  },
  { name:"체리",     en:"cherry",       sci:"Prunus avium",         emoji:"🍒", supported:true  },
  { name:"오이",     en:"cucumber",     sci:"Cucumis sativus",      emoji:"🥒", supported:true  },
  { name:"호박",     en:"pumpkin",      sci:"Cucurbita maxima",     emoji:"🎃", supported:true  },
  { name:"콩",       en:"soybean",      sci:"Glycine max",          emoji:"🌱", supported:true  },
  // ⚠️ Decorative (unsupported)
  { name:"몬스테라",   en:"monstera",     sci:"Monstera deliciosa",    emoji:"🌿", supported:false },
  { name:"스킨답서스", en:"pothos",       sci:"Epipremnum aureum",     emoji:"🪴", supported:false },
  { name:"산세베리아", en:"sansevieria",  sci:"Dracaena trifasciata",  emoji:"🌵", supported:false },
  { name:"고무나무",   en:"rubber plant", sci:"Ficus elastica",        emoji:"🌳", supported:false },
  { name:"선인장",     en:"cactus",       sci:"Cactaceae sp.",         emoji:"🌵", supported:false },
  { name:"칼라데아",   en:"calathea",     sci:"Calathea orbifolia",    emoji:"🍃", supported:false },
  { name:"대나무야자", en:"bamboo palm",  sci:"Chamaedorea seifrizii", emoji:"🎋", supported:false },
  { name:"필로덴드론", en:"philodendron", sci:"Philodendron sp.",      emoji:"🌿", supported:false },
];

let selectedPlant = null;

function unsplashUrl(p, size = "400x400") {
  return `https://source.unsplash.com/${size}/?${encodeURIComponent(p.en + ",plant")}`;
}

// ── localStorage persistence ──────────────────────────────────
function loadSavedPlant() {
  const saved = localStorage.getItem("gn_plant");
  if (saved) {
    const found = PLANTS.find(p => p.name === saved);
    if (found) return found;
  }
  return PLANTS[0]; // default: tomato
}
function savePlant(p) {
  localStorage.setItem("gn_plant", p.name);
}

// ── Sidebar plant display ──────────────────────────────────────
function updateSidebarPlant(plant) {
  selectedPlant = plant;
  savePlant(plant);

  const nameEl  = document.getElementById("sb-plant-name");
  const badgeEl = document.getElementById("sb-plant-badge");
  const imgEl   = document.getElementById("sb-plant-img");
  const emojiEl = document.getElementById("sb-plant-emoji");

  if (nameEl)  nameEl.textContent  = plant.name;
  if (emojiEl) emojiEl.textContent = plant.emoji;
  if (badgeEl) {
    badgeEl.textContent = plant.supported ? "PlantVillage AI ✅" : "관엽식물 ⚠️";
    badgeEl.className   = `plant-badge ${plant.supported ? "supported" : "decorative"}`;
  }
  if (imgEl) {
    imgEl.classList.remove("loaded");
    imgEl.src = unsplashUrl(plant, "200x200");
    imgEl.onload  = () => imgEl.classList.add("loaded");
    imgEl.onerror = () => {};
  }

  // Warning banner (present on all pages)
  const banner = document.getElementById("warn-banner");
  if (banner) banner.style.display = plant.supported ? "none" : "block";

  // Plant hero (dashboard only)
  const heroImg   = document.getElementById("hero-img");
  const heroName  = document.getElementById("hero-name");
  const heroSci   = document.getElementById("hero-sci");
  const heroEmoji = document.getElementById("hero-emoji");
  if (heroImg) {
    heroImg.classList.remove("loaded");
    heroImg.src = unsplashUrl(plant, "1200x400");
    heroImg.onload  = () => heroImg.classList.add("loaded");
    heroImg.onerror = () => {};
  }
  if (heroName)  heroName.textContent  = plant.name;
  if (heroSci)   heroSci.textContent   = plant.sci;
  if (heroEmoji) heroEmoji.textContent = plant.emoji;
}

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
        <img alt="${p.name}" />
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
      setTimeout(closePlantModal, 300);
    });
    (p.supported ? sup : dec).appendChild(card);
  });
}

function openPlantModal() {
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
setInterval(updateClock, 1000);
updateClock();

// ── Alert badge refresh ────────────────────────────────────────
async function refreshAlertBadge() {
  try {
    const d = await (await fetch("/api/alerts/unread-count")).json();
    document.querySelectorAll(".alert-badge").forEach(b => {
      b.textContent = d.count;
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
  hbg?.addEventListener("click", () => { sidebar.classList.toggle("open"); overlay?.classList.toggle("open"); });
  overlay?.addEventListener("click", () => { sidebar.classList.remove("open"); overlay.classList.remove("open"); });
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initSidebar();
  updateSidebarPlant(loadSavedPlant());
  refreshAlertBadge();
  setInterval(refreshAlertBadge, 15_000);

  document.getElementById("open-plant-modal")?.addEventListener("click", openPlantModal);
  document.getElementById("close-plant-modal")?.addEventListener("click", closePlantModal);
  document.getElementById("plant-modal")?.addEventListener("click", e => {
    if (e.target === e.currentTarget) closePlantModal();
  });
});

// ── Shared helpers (used by page scripts) ─────────────────────
function moistureColor(v) {
  return v < 300 ? "#3b82f6" : v < 700 ? "#22c55e" : "#f59e0b";
}
function statusKr(s) {
  return {dry:"건조 🌵", normal:"적정 🌿", wet:"습함 💧"}[s] || s;
}
function severityKr(s) {
  return {normal:"정상 🟢", caution:"주의 🟡", critical:"위험 🔴"}[s] || s;
}
