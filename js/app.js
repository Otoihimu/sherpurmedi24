// SherpurMedi24 — demo frontend. Navigation switches between separate views.
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

// Sheet links live in js/config.js (so updating app.js never erases them).
const SHEET_CSV = (window.SM24_CONFIG && window.SM24_CONFIG.SHEET_CSV) || {};

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
  const validPages = ["home", "pharmacies", "how-it-works", "about", "cart"];
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
          <span class="stock ${m.in_stock ? "ok" : "out"}">${m.in_stock ? (en ? "In stock" : "স্টক আছে") : (en ? "Out of stock" : "স্টক নেই")}</span>
          <button class="add-btn" type="button" data-add="${medicines.indexOf(m)}" ${m.in_stock ? "" : "disabled"}>${en ? "Add to cart" : "কার্টে যোগ"}</button></div>
      </div>`; }).join("")}</div>`;

  const allDemo = filtered.every((p) => p.is_demo);
  resultCount.textContent = en
    ? `${filtered.length} ${allDemo ? "demo " : ""}pharmacies`
    : `${filtered.length}টি ${allDemo ? "ডেমো " : ""}ফার্মেসি`;
  emptyState.hidden = filtered.length !== 0 || medMatches.length !== 0;
  pharmacyGrid.hidden = filtered.length === 0;
}

// ===== Cart (one pharmacy per order). Demo only: no order is sent anywhere. =====
let areas = [
  { area: "গোয়ালাবাজার", fee: 30 }, { area: "সরকার বাজার", fee: 40 }, { area: "আউশকান্দি", fee: 50 }
]; // demo delivery fees; replaced by the Areas tab of the Sheet
let cart = { pid: null, items: [] };
let cartArea = "";
try {
  const saved = JSON.parse(localStorage.getItem("sm24-cart") || "null");
  if (saved && Array.isArray(saved.items)) cart = saved;
  cartArea = localStorage.getItem("sm24-cart-area") || "";
} catch (e) { /* storage unavailable: cart lives in memory only */ }
function saveCart() {
  try { localStorage.setItem("sm24-cart", JSON.stringify(cart)); localStorage.setItem("sm24-cart-area", cartArea); } catch (e) {}
}
const tr = (bn, en) => (window.sm24Language === "en" ? en : bn);
const money = (n) => "৳" + n.toLocaleString(window.sm24Language === "en" ? "en-US" : "bn-BD");
const unitLabel = (u) => (UNITS[u] ? UNITS[u][window.sm24Language === "en" ? "en" : "bn"] : u);

function addToCart(m) {
  const ph = pharmacies.find((p) => p.id === m.pharmacy_id);
  if (!ph || !m.in_stock) return false;
  if (cart.pid && cart.pid !== m.pharmacy_id && cart.items.length) {
    if (!confirm(tr("আপনার কার্টে অন্য ফার্মেসির ওষুধ আছে। কার্ট খালি করে এই ফার্মেসির ওষুধ নেবেন?",
                    "Your cart has items from another pharmacy. Clear it and add this one?"))) return false;
    cart.items = [];
  }
  cart.pid = m.pharmacy_id;
  const line = cart.items.find((i) => i.name === m.name && i.unit === m.unit);
  if (line) line.qty = Math.min(99, line.qty + 1);
  else cart.items.push({ name: m.name, unit: m.unit, price: m.price, qty: 1 });
  saveCart(); renderCart();
  return true;
}

function renderCart() {
  const count = cart.items.reduce((n, i) => n + i.qty, 0);
  const fab = $("#cartFab");
  fab.querySelector(".cart-label").textContent = tr("কার্ট", "Cart");
  const badge = fab.querySelector(".cart-count");
  badge.textContent = count; badge.hidden = count === 0;

  const view = $("#cartView");
  const ph = pharmacies.find((p) => p.id === cart.pid);
  if (!cart.items.length || !ph) {
    view.innerHTML = `<h2>${tr("আপনার কার্ট", "Your cart")}</h2>
      <div class="empty-state"><span>🛒</span><h3>${tr("কার্ট খালি", "Your cart is empty")}</h3>
      <p>${tr("ওষুধ খুঁজে কার্টে যোগ করুন।", "Search for a medicine and add it to your cart.")}</p>
      <a class="button button-primary" href="#pharmacies">${tr("ওষুধ খুঁজুন", "Find medicines")}</a></div>`;
    return;
  }
  const subtotal = cart.items.reduce((n, i) => n + i.price * i.qty, 0);
  const areaRow = areas.find((a) => a.area === cartArea);
  const fee = areaRow ? areaRow.fee : null;
  view.innerHTML = `
    <h2>${tr("আপনার কার্ট", "Your cart")}</h2>
    <p class="cart-pharmacy">🏪 ${escapeHTML(ph.name)} · ${escapeHTML(ph.area)} ${ph.is_demo ? '<span class="demo-tag">DEMO</span>' : ""}</p>
    <div class="cart-lines">${cart.items.map((i, idx) => `
      <div class="cart-line">
        <div class="cart-name"><strong>${escapeHTML(i.name)}</strong><small>${money(i.price)} / ${escapeHTML(unitLabel(i.unit))}</small></div>
        <div class="qty"><button type="button" data-dec="${idx}" aria-label="−">−</button><span>${i.qty} ${escapeHTML(unitLabel(i.unit))}</span><button type="button" data-inc="${idx}" aria-label="+">+</button></div>
        <div class="cart-sum">${money(i.price * i.qty)}</div>
        <button class="cart-remove" type="button" data-rem="${idx}" aria-label="${tr("বাদ দিন", "Remove")}">✕</button>
      </div>`).join("")}</div>
    <label class="cart-area">${tr("ডেলিভারির এলাকা", "Delivery area")}
      <select id="cartArea"><option value="">${tr("এলাকা বেছে নিন", "Select area")}</option>
      ${areas.map((a) => `<option value="${escapeHTML(a.area)}" ${a.area === cartArea ? "selected" : ""}>${escapeHTML(a.area)}</option>`).join("")}</select></label>
    <div class="cart-totals">
      <div><span>${tr("ওষুধের মূল্য", "Subtotal")}</span><b>${money(subtotal)}</b></div>
      <div><span>${tr("ডেলিভারি চার্জ", "Delivery fee")}</span><b>${fee === null ? "—" : money(fee)}</b></div>
      <div class="cart-total"><span>${tr("সর্বমোট", "Total")}</span><b>${fee === null ? "—" : money(subtotal + fee)}</b></div>
    </div>
    <button class="button button-primary cart-checkout" type="button" disabled>${tr("অর্ডার নিশ্চিত করুন (শীঘ্রই)", "Confirm order (coming soon)")}</button>
    <p class="cart-note">${tr("এটি একটি ডেমো কার্ট। এখনো কোনো অর্ডার পাঠানো হয় না। মূল্য ও স্টক ফার্মেসি কর্তৃক নিশ্চিত করা হবে।",
      "This is a demo cart. No order is sent yet. Prices and stock will be confirmed by the pharmacy.")}</p>
    <button class="cart-clear" type="button" data-clear>${tr("কার্ট খালি করুন", "Clear cart")}</button>`;
}

$("#cartView").addEventListener("click", (event) => {
  const t = event.target.closest("button"); if (!t) return;
  const d = t.dataset;
  if (d.inc !== undefined) { const l = cart.items[+d.inc]; if (l) l.qty = Math.min(99, l.qty + 1); }
  else if (d.dec !== undefined) { const l = cart.items[+d.dec]; if (l && --l.qty <= 0) cart.items.splice(+d.dec, 1); }
  else if (d.rem !== undefined) cart.items.splice(+d.rem, 1);
  else if (d.clear !== undefined) cart.items = [];
  else return;
  if (!cart.items.length) cart.pid = null;
  saveCart(); renderCart();
});
$("#cartView").addEventListener("change", (event) => {
  if (event.target.id === "cartArea") { cartArea = event.target.value; saveCart(); renderCart(); }
});
$("#medicineResults").addEventListener("click", (event) => {
  const btn = event.target.closest("[data-add]");
  if (!btn || btn.disabled) return;
  if (addToCart(medicines[+btn.dataset.add])) {
    const old = btn.textContent; btn.textContent = "✓";
    setTimeout(() => { btn.textContent = old; }, 900);
  }
});

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
  renderCart();
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
  const get = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); });
  try {
    const [p, m, a] = await Promise.all([get(SHEET_CSV.pharmacies), get(SHEET_CSV.medicines),
      SHEET_CSV.areas ? get(SHEET_CSV.areas).catch(() => null) : Promise.resolve(null)]);
    pharmacies = parseCSV(p).filter((r) => (r.status || "").toLowerCase() === "approved")
      .map((r) => ({ id: r.id, name: r.name, area: r.area, description: r.description || r.address || "", is_demo: isYes(r.is_demo) }));
    medicines = parseCSV(m).map((r) => ({ pharmacy_id: r.pharmacy_id, name: r.medicine_name, generic: r.generic || "",
      unit: (r.unit || "").toLowerCase(), price: Number(r.price), in_stock: isYes(r.in_stock) }))
      .filter((r) => r.name && !isNaN(r.price));
    if (a) {
      const parsed = parseCSV(a).map((r) => ({ area: r.area, fee: Number(r.delivery_fee) })).filter((r) => r.area && !isNaN(r.fee));
      if (parsed.length) areas = parsed;
    }
    // Refresh cart prices from the latest Sheet data; drop items that no longer exist.
    cart.items = cart.items.map((i) => {
      const m2 = medicines.find((x) => x.pharmacy_id === cart.pid && x.name === i.name && x.unit === i.unit);
      return m2 && m2.in_stock ? { ...i, price: m2.price } : null;
    }).filter(Boolean);
    if (!cart.items.length) cart.pid = null;
    saveCart();
    renderPharmacies(); renderCart();
  } catch (err) {
    console.warn("Sheet load failed; using built-in demo data.", err);
  }
}
loadSheetData();
