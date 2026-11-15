// SherpurMedi24 — demo frontend. Navigation switches between separate views.
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

// ===== SETTINGS =====
// Paste the "Publish to web -> CSV" links of your Google Sheet tabs here.
// Leave both empty to use the built-in demo data below. PUBLIC, non-sensitive data only.
const SHEET_CSV = { pharmacies: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQfK6K2ayJvYlY8Y0ZA2EArPReyOZDm9TJ2V_Bxbwcp0IveJaYmW_6nUmodswGnDGme0eSpf9B9f2fV/pub?gid=918088460&single=true&output=csv", medicines: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQfK6K2ayJvYlY8Y0ZA2EArPReyOZDm9TJ2V_Bxbwcp0IveJaYmW_6nUmodswGnDGme0eSpf9B9f2fV/pub?gid=1652526658&single=true&output=csv" };

const DEMO_NOTE = "এটি শুধু ডিজাইন দেখানোর জন্য তৈরি নমুনা ফার্মেসি।";
let pharmacies = [
  { id: "p1", name: "City Care Pharmacy", area: "গোয়ালাবাজার", description: DEMO_NOTE, is_demo: true },
  { id: "p2", name: "Sarker Bazar Pharmacy", area: "সরকার বাজার", description: DEMO_NOTE, is_demo: true },
  { id: "p3", name: "Aushkandi Health Point", area: "আউশকান্দি", description: DEMO_NOTE, is_demo: true }
];
// Demo medicines: fictional prices for layout testing only.
let medicines = [
  { pharmacy_id: "p1", name: "Paracetamol 500mg", generic: "Paracetamol", unit: "strip", price: 20, in_stock: true },
  { pharmacy_id: "p1", name: "Paracetamol 500mg", generic: "Paracetamol", unit: "piece", price: 2, in_stock: true },
  { pharmacy_id: "p1", name: "Cough Syrup 100ml", generic: "Cough syrup", unit: "bottle", price: 85, in_stock: true },
  { pharmacy_id: "p2", name: "Paracetamol 500mg", generic: "Paracetamol", unit: "strip", price: 22, in_stock: false },
  { pharmacy_id: "p2", name: "ORS", generic: "Oral saline", unit: "packet", price: 10, in_stock: true },
  { pharmacy_id: "p3", name: "Cough Syrup 100ml", generic: "Cough syrup", unit: "bottle", price: 90, in_stock: true }
];
const UNITS = {
  piece: { bn: "পিছ", en: "piece" }, strip: { bn: "পাতা", en: "strip" },
  bottle: { bn: "বোতল", en: "bottle" }, box: { bn: "বক্স", en: "box" }, packet: { bn: "প্যাকেট", en: "packet" }
};

const menuToggle = $("#menuToggle");
const mainNav = $("#mainNav");

function showPage(pageName, updateHistory = true) {
  const validPages = ["home", "pharmacies", "how-it-works", "about"];
  const page = validPages.includes(pageName) ? pageName : "home";

  $$(".page-view").forEach((view) => {
    const active = view.dataset.page === page;
    view.classList.toggle("is-active", active);
    view.hidden = !active;
  });

  $$("[data-route]").forEach((link) => {
    if (link.dataset.route === page) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  mainNav.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");

  if (updateHistory && location.hash !== `#${page}`) {
    history.pushState({ page }, "", `#${page}`);
  }
  window.scrollTo({ top: 0, behavior: "instant" });
}

function routeFromHash() {
  showPage(location.hash.replace("#", "") || "home", false);
}

menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

$$("[data-route]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showPage(link.dataset.route);
  });
});

window.addEventListener("popstate", routeFromHash);
window.addEventListener("hashchange", routeFromHash);

// Pharmacy search works only on the pharmacy page.
const pharmacyGrid = $("#pharmacyGrid");
const searchInput = $("#searchInput");
const areaSelect = $("#areaSelect");
const searchForm = $("#searchForm");
const resultCount = $("#resultCount");
const emptyState = $("#emptyState");

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function renderPharmacies() {
  const query = searchInput.value.trim().toLocaleLowerCase("bn");
  const en = window.sm24Language === "en";
  const selectedArea = areaSelect.value;
  const byId = (id) => pharmacies.find((p) => p.id === id);

  const filtered = pharmacies.filter((pharmacy) => {
    const matchesText =
      pharmacy.name.toLocaleLowerCase().includes(query) ||
      pharmacy.area.toLocaleLowerCase().includes(query);
    return matchesText && (!selectedArea || pharmacy.area === selectedArea);
  });

  pharmacyGrid.innerHTML = filtered.map((pharmacy, i) => {
    const initials = pharmacy.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    const avatarClass = ["", "avatar-blue", "avatar-gold"][pharmacies.indexOf(pharmacy) % 3];
    const desc = pharmacy.is_demo ? (en ? "Sample pharmacy for demonstration only." : DEMO_NOTE) : pharmacy.description;
    return `
      <article class="pharmacy-card">
        <div class="pharmacy-card-head">
          <span class="pharmacy-avatar ${avatarClass}">${escapeHTML(initials)}</span>
          ${pharmacy.is_demo ? '<span class="demo-tag">DEMO</span>' : ""}
        </div>
        <h3>${escapeHTML(pharmacy.name)}</h3>
        <p class="pharmacy-area">${escapeHTML(pharmacy.area)}</p>
        <p class="pharmacy-description">${escapeHTML(desc)}</p>
        <div class="card-footer">
          <span class="open-status">${pharmacy.is_demo ? (en ? "Demo listing" : "ডেমো তালিকা") : (en ? "Listed" : "তালিকাভুক্ত")}</span><span class="arrow" aria-hidden="true">→</span>
        </div>
      </article>`;
  }).join("");

  // Medicine search: only when the person typed something.
  const medMatches = !query ? [] : medicines.filter((m) => {
    const ph = byId(m.pharmacy_id);
    return ph && (!selectedArea || ph.area === selectedArea) &&
      `${m.name} ${m.generic}`.toLocaleLowerCase("bn").includes(query);
  }).slice(0, 24);
  const medBox = $("#medicineResults");
  medBox.hidden = medMatches.length === 0;
  medBox.innerHTML = medMatches.length === 0 ? "" : `
    <h3 class="med-title">${en ? "Medicines" : "ওষুধ"}</h3>
    <div class="med-list">${medMatches.map((m) => {
      const ph = byId(m.pharmacy_id);
      const unit = UNITS[m.unit] ? UNITS[m.unit][en ? "en" : "bn"] : m.unit;
      const price = m.price.toLocaleString(en ? "en-US" : "bn-BD");
      return `
      <div class="med-item">
        <div class="med-info">
          <strong>${escapeHTML(m.name)}</strong>
          ${m.generic ? `<small>${escapeHTML(m.generic)}</small>` : ""}
          <small>${escapeHTML(ph.name)} · ${escapeHTML(ph.area)} ${ph.is_demo ? '<span class="demo-tag">DEMO</span>' : ""}</small>
        </div>
        <div class="med-price"><b>৳${price}</b><small>/ ${escapeHTML(unit)}</small>
          <span class="stock ${m.in_stock ? "ok" : "out"}">${m.in_stock ? (en ? "In stock" : "স্টক আছে") : (en ? "Out of stock" : "স্টক নেই")}</span></div>
      </div>`; }).join("")}</div>`;

  const allDemo = filtered.every((p) => p.is_demo);
  resultCount.textContent = en
    ? `${filtered.length} ${allDemo ? "demo " : ""}pharmacies`
    : `${filtered.length}টি ${allDemo ? "ডেমো " : ""}ফার্মেসি`;
  emptyState.hidden = filtered.length !== 0 || medMatches.length !== 0;
  pharmacyGrid.hidden = filtered.length === 0;
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  showPage("pharmacies");
  renderPharmacies();
});
searchInput.addEventListener("input", renderPharmacies);
areaSelect.addEventListener("change", renderPharmacies);

$("#currentYear").textContent = new Date().getFullYear();
routeFromHash();
renderPharmacies();

// Bilingual interface: language choice is saved on this device only.
const languageSelect = $("#languageSelect");
const translations = {
  bn: {
    '.skip-link': 'মূল কনটেন্টে যান',
    '[data-route="home"]': 'হোম', '[data-route="pharmacies"]': 'ফার্মেসি',
    '[data-route="how-it-works"]': 'কীভাবে কাজ করে', '[data-route="about"]': 'আমাদের সম্পর্কে',
    '.nav-cta': 'ফার্মেসি খুঁজুন', '.eyebrow': 'শেরপুরের স্থানীয় ফার্মেসি ডিরেক্টরি',
    '.hero h1': 'আপনার এলাকার ফার্মেসি <span>খুঁজুন সহজেই</span>',
    '.hero-description': 'SherpurMedi24-এ অংশগ্রহণকারী ফার্মেসির তথ্য খুঁজে দেখুন। এটি বর্তমানে একটি পরীক্ষামূলক ডেমো ওয়েবসাইট।',
    '#searchInput': 'ফার্মেসি, এলাকা বা ওষুধের নাম লিখুন', '.search-button': 'খুঁজুন',
    '.search-note': 'ডেমো ডেটা ব্যবহার করা হয়েছে। এখানে এখনো বাস্তব অর্ডার নেওয়া হয় না।',
    '.pill-top': 'তথ্য খুঁজুন', '.pill-bottom': 'স্থানীয় ফার্মেসি',
    '.section-heading h2': 'ফার্মেসি খুঁজুন', '.section-heading p': 'আপনার নির্বাচিত এলাকার তালিকা দেখুন।',
    '.filter-chip': 'সব ফার্মেসি', '.demo-label': 'নমুনা তথ্য — বাস্তব প্রতিষ্ঠান নয়',
    '.empty-state h3': 'কোনো ফলাফল পাওয়া যায়নি', '.empty-state p': 'অন্য নাম বা এলাকা দিয়ে আবার খুঁজুন।',
    '.notice-box h2': 'গুরুত্বপূর্ণ নোট',
    '.notice-box p': 'SherpurMedi24 বর্তমানে একটি ডেমো ও ডেভেলপমেন্ট প্রজেক্ট। এখানে বাস্তব ওষুধ বিক্রি, প্রেসক্রিপশন যাচাই, চিকিৎসা পরামর্শ, পেমেন্ট বা ডেলিভারি চালু নেই। বাস্তব কার্যক্রম শুরুর আগে প্রযোজ্য লাইসেন্স, ফার্মেসি যাচাই, তথ্যের নিরাপত্তা এবং আইনগত শর্ত পূরণ করতে হবে।'
  },
  en: {
    '.skip-link': 'Skip to main content',
    '[data-route="home"]': 'Home', '[data-route="pharmacies"]': 'Pharmacies',
    '[data-route="how-it-works"]': 'How it works', '[data-route="about"]': 'About',
    '.nav-cta': 'Find pharmacies', '.eyebrow': 'LOCAL PHARMACY DIRECTORY',
    '.hero h1': 'Find pharmacies <span>near your area</span>',
    '.hero-description': 'Explore participating pharmacy information on SherpurMedi24. This is currently a test demo website.',
    '#searchInput': 'Enter pharmacy, area, or medicine name', '.search-button': 'Search',
    '.search-note': 'Demo data is being used. Real orders are not available yet.',
    '.pill-top': 'Find information', '.pill-bottom': 'Local pharmacies',
    '.section-heading h2': 'Find pharmacies', '.section-heading p': 'Browse pharmacies in your selected area.',
    '.filter-chip': 'All pharmacies', '.demo-label': 'Sample information — not real businesses',
    '.empty-state h3': 'No results found', '.empty-state p': 'Try another name or area.',
    '.notice-box h2': 'Important notice',
    '.notice-box p': 'SherpurMedi24 is currently a demo and development project. Real medicine sales, prescription review, medical advice, payments, and delivery are not active. Applicable licenses, pharmacy verification, data security, and legal requirements must be addressed before real operations begin.'
  }
};
const originalCardText = {
  bn: ['এটি শুধু ডিজাইন দেখানোর জন্য তৈরি নমুনা ফার্মেসি।', 'ডেমো তালিকা', 'টি ডেমো ফার্মেসি'],
  en: ['This is a sample pharmacy created for layout demonstration only.', 'Demo listing', ' demo pharmacies']
};
function applyLanguage(lang) {
  const chosen = translations[lang] ? lang : 'bn';
  window.sm24Language = chosen;
  document.documentElement.lang = chosen;
  Object.entries(translations[chosen]).forEach(([selector, value]) => {
    document.querySelectorAll(selector).forEach((element) => {
      if (element.tagName === 'INPUT') element.placeholder = value;
      else element.innerHTML = value;
    });
  });
  document.querySelectorAll('.pharmacy-description').forEach((el) => el.textContent = originalCardText[chosen][0]);
  document.querySelectorAll('.open-status').forEach((el) => el.textContent = originalCardText[chosen][1]);
  const count = document.querySelectorAll('.pharmacy-card').length;
  resultCount.textContent = chosen === 'bn' ? `${count}টি ডেমো ফার্মেসি` : `${count}${originalCardText.en[2]}`;
  const areaOptions = areaSelect.options;
  const labels = chosen === 'bn' ? ['সব এলাকা','গোয়ালাবাজার','সরকার বাজার','আউশকান্দি'] : ['All areas','Goalabazar','Sarker Bazar','Aushkandi'];
  [...areaOptions].forEach((option, i) => { if (labels[i]) option.textContent = labels[i]; });
  renderPharmacies();
  localStorage.setItem('sm24-language', chosen);
  if (languageSelect) languageSelect.value = chosen;
}
if (languageSelect) {
  languageSelect.addEventListener('change', () => applyLanguage(languageSelect.value));
  applyLanguage(localStorage.getItem('sm24-language') || 'bn');
}

// ===== Google Sheet loader (read-only, public CSV) =====
function parseCSV(text) {
  const rows = []; let row = [], f = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(f); rows.push(row); row = []; f = ""; }
    else f += c;
  }
  if (f !== "" || row.length) { row.push(f); rows.push(row); }
  const [head, ...rest] = rows;
  return rest.filter((r) => r.some((v) => v.trim() !== ""))
    .map((r) => Object.fromEntries(head.map((k, i) => [k.trim(), (r[i] || "").trim()])));
}
const isYes = (v) => String(v || "").trim().toLowerCase() === "yes";
async function loadSheetData() {
  if (!SHEET_CSV.pharmacies || !SHEET_CSV.medicines) return;
  try {
    const [p, m] = await Promise.all([SHEET_CSV.pharmacies, SHEET_CSV.medicines].map((u) =>
      fetch(u).then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); })));
    pharmacies = parseCSV(p).filter((r) => (r.status || "").toLowerCase() === "approved")
      .map((r) => ({ id: r.id, name: r.name, area: r.area, description: r.description || r.address || "", is_demo: isYes(r.is_demo) }));
    medicines = parseCSV(m).map((r) => ({ pharmacy_id: r.pharmacy_id, name: r.medicine_name, generic: r.generic || "",
      unit: (r.unit || "").toLowerCase(), price: Number(r.price), in_stock: isYes(r.in_stock) }))
      .filter((r) => r.name && !isNaN(r.price));
    renderPharmacies();
  } catch (err) {
    console.warn("Sheet load failed; using built-in demo data.", err);
  }
}
loadSheetData();
