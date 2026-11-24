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
  const validPages = ["home", "pharmacies", "how-it-works", "about", "cart", "admin", "pharmacy-apply"];
  const page = validPages.includes(pageName) ? pageName : "home";
  if (page === "admin" && !window.SM24_ADMIN?.isAdmin()) {
    window.SM24_ADMIN?.showDenied();
    return showPage("home", false);
  }

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
    <button class="button button-primary cart-checkout" type="button">${tr("Checkout / অর্ডার দিন", "Checkout")}</button>
    <p class="cart-note">${tr("অর্ডারটি ফার্মেসির নিশ্চিতকরণের অপেক্ষায় থাকবে। প্রদর্শিত মূল্য ও স্টক চূড়ান্ত নয়।", "Orders remain pending pharmacy confirmation. Displayed prices and stock are not final.")}</p>
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


// ===== Supabase customer authentication (corrected account states) =====
(() => {
  const cfg = window.SM24_CONFIG || {};
  const clientLib = window.supabase;
  const openBtn = document.getElementById("accountOpen");
  const overlay = document.getElementById("authOverlay");
  if (!openBtn || !overlay) return;
  const $id = id => document.getElementById(id);
  const authForm = $id("authForm");
  const tabsWrap = document.querySelector(".auth-tabs");
  const tabs = [...document.querySelectorAll("[data-auth-mode]")];
  const profile = $id("authProfile");
  const logoutBtn = $id("authLogout");
  const status = $id("authStatus");
  let mode = "login", currentUser = null, currentProfile = null, sessionReady = false, sb = null;
  let savedAddresses = [], editingAddressId = null;

  if (clientLib && cfg.SUPABASE_URL && cfg.SUPABASE_PUBLISHABLE_KEY) {
    sb = clientLib.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY);
  }
  function say(message, isError = false) {
    status.textContent = message || "";
    status.style.color = isError ? "#a23333" : "#087b43";
  }
  function toast(message, isError = false) {
    let node = $id("sm24Toast");
    if (!node) {
      node = document.createElement("div"); node.id = "sm24Toast";
      node.className = "sm24-toast"; node.setAttribute("role", "status");
      node.setAttribute("aria-live", "polite"); document.body.appendChild(node);
    }
    node.textContent = message; node.classList.toggle("is-error", isError);
    node.classList.add("is-visible"); clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove("is-visible"), 4200);
  }
  function setMode(next) {
    mode = next === "signup" ? "signup" : "login";
    $id("authNameWrap").hidden = mode !== "signup";
    $id("authPhoneWrap").hidden = mode !== "signup";
    $id("authAreaWrap").hidden = mode !== "signup";
    $id("authIdentifierText").textContent = mode === "signup" ? "Email address" : "Email or phone number";
    $id("authEmail").placeholder = mode === "signup" ? "name@example.com" : "Email or phone number";
    $id("authEmail").type = mode === "signup" ? "email" : "text";
    $id("authEmail").autocomplete = mode === "signup" ? "email" : "username";
    $id("authPassword").autocomplete = mode === "signup" ? "new-password" : "current-password";
    $id("authTitle").textContent = mode === "signup" ? "Create your account" : "Welcome back";
    $id("authMessage").textContent = mode === "signup" ? "Create an account to continue." : "Sign in to your SherpurMedi24 account.";
    $id("authSubmit").textContent = mode === "signup" ? "Create account" : "Login";
    tabs.forEach(t => t.classList.toggle("is-active", t.dataset.authMode === mode));
    say("");
  }
  function hide() { overlay.hidden = true; }
  function renderAccountState() {
    const signedIn = !!currentUser;
    const adminLink = document.getElementById("adminNavLink");
    if (adminLink) adminLink.hidden = !(currentProfile?.role === "admin" && currentProfile?.approved === true);
    authForm.hidden = signedIn;
    tabsWrap.hidden = signedIn;
    profile.hidden = !signedIn;
    logoutBtn.hidden = !signedIn;
    if (signedIn) {
      const meta = currentUser.user_metadata || {};
      const name = currentProfile?.full_name || meta.full_name || currentUser.email || currentUser.phone || "My account";
      openBtn.textContent = name;
      $id("authTitle").textContent = "Your account";
      $id("authMessage").textContent = "Your profile information";
      $id("authProfileName").textContent = name;
      $id("authProfileEmail").textContent = currentUser.email || currentUser.phone || "";
      $id("authProfilePhone").textContent = currentProfile?.phone || meta.phone || currentUser.phone || "—";
      $id("authProfileArea").textContent = currentProfile?.area || meta.area || "—";
      $id("authProfileAddress").textContent = currentProfile?.address || "—";
      const role = currentProfile?.role || "customer";
      $id("authProfileRole").textContent = role === "customer" ? "Customer" : role;
      $id("authProfileApproval").textContent = currentProfile ? (currentProfile.approved ? "Approved" : "Pending approval") : "Not loaded";
      renderSavedAddresses();
      say("");
    } else {
      currentProfile = null;
      openBtn.textContent = "লগইন";
      setMode(mode);
    }
  }
  const addressFields = ["addressLabel", "addressRecipient", "addressPhone", "addressArea", "addressVillage", "addressHouse", "addressLandmark", "addressNote", "addressDefault"];
  function addressStatus(message, isError = false) {
    const node = $id("addressStatus");
    if (node) { node.textContent = message || ""; node.style.color = isError ? "#a23333" : "#087b43"; }
  }
  function resetAddressForm() {
    editingAddressId = null;
    $id("addressForm").reset();
    $id("addressFormTitle").textContent = "Add a delivery address";
    $id("addressSave").textContent = "Save address";
    $id("addressCancel").hidden = true;
    addressStatus("");
  }
  function renderSavedAddresses() {
    const list = $id("addressList");
    if (!list) return;
    $id("addressCount").textContent = `${savedAddresses.length}/5`;
    if (!savedAddresses.length) {
      list.innerHTML = '<p class="address-empty">No saved delivery addresses yet. Add your Home address below.</p>';
    } else {
      list.innerHTML = savedAddresses.map(a => `
        <article class="address-card ${a.is_default ? "is-default" : ""}">
          <div class="address-card-top"><span class="address-card-title">${escapeHTML(a.label)}</span>${a.is_default ? '<span class="address-default-tag">DEFAULT</span>' : ""}</div>
          <p><strong>${escapeHTML(a.recipient_name)}</strong> · ${escapeHTML(a.phone)}<br>${escapeHTML(a.area)}, ${escapeHTML(a.village_road)}<br>${escapeHTML(a.house_building)}${a.landmark ? `<br>Landmark: ${escapeHTML(a.landmark)}` : ""}${a.delivery_note ? `<br>Note: ${escapeHTML(a.delivery_note)}` : ""}</p>
          <div class="address-card-actions">
            <button type="button" data-address-edit="${a.id}">Edit</button>
            ${a.is_default ? "" : `<button type="button" data-address-default="${a.id}">Make default</button>`}
            <button type="button" class="address-delete" data-address-delete="${a.id}">Delete</button>
          </div>
        </article>`).join("");
    }
    const limitReached = savedAddresses.length >= 5 && !editingAddressId;
    $id("addressForm").hidden = limitReached;
    if (limitReached) addressStatus("You can save up to 5 addresses.");
  }
  async function loadSavedAddresses() {
    if (!currentUser || !sb) return;
    const { data, error } = await sb.from("customer_addresses").select("id, label, recipient_name, phone, area, village_road, house_building, landmark, delivery_note, is_default, created_at").eq("user_id", currentUser.id).order("is_default", { ascending: false }).order("created_at", { ascending: false });
    if (error) { addressStatus("Address storage is not ready yet. Run the Phase 4C SQL setup first.", true); console.warn("Address load failed:", error.message); return; }
    savedAddresses = data || [];
    renderSavedAddresses();
  }
  function editSavedAddress(id) {
    const a = savedAddresses.find(x => x.id === id); if (!a) return;
    editingAddressId = id;
    $id("addressLabel").value = a.label;
    $id("addressRecipient").value = a.recipient_name;
    $id("addressPhone").value = a.phone;
    $id("addressArea").value = a.area;
    $id("addressVillage").value = a.village_road;
    $id("addressHouse").value = a.house_building;
    $id("addressLandmark").value = a.landmark || "";
    $id("addressNote").value = a.delivery_note || "";
    $id("addressDefault").checked = !!a.is_default;
    $id("addressFormTitle").textContent = "Edit delivery address";
    $id("addressSave").textContent = "Update address";
    $id("addressCancel").hidden = false;
    $id("addressForm").hidden = false;
    $id("addressForm").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  async function makeAddressDefault(id) {
    if (!currentUser) return;
    const { error: clearError } = await sb.from("customer_addresses").update({ is_default: false }).eq("user_id", currentUser.id);
    if (clearError) { addressStatus(clearError.message, true); return; }
    const { error } = await sb.from("customer_addresses").update({ is_default: true }).eq("id", id).eq("user_id", currentUser.id);
    if (error) addressStatus(error.message, true); else { addressStatus("Default address updated."); await loadSavedAddresses(); }
  }
  async function deleteSavedAddress(id) {
    if (!currentUser || !confirm("Delete this saved address?")) return;
    const { error } = await sb.from("customer_addresses").delete().eq("id", id).eq("user_id", currentUser.id);
    if (error) addressStatus(error.message, true); else { addressStatus("Address deleted."); await loadSavedAddresses(); if (editingAddressId === id) resetAddressForm(); }
  }
  $id("addressForm").addEventListener("submit", async e => {
    e.preventDefault(); if (!currentUser) return;
    const save = $id("addressSave"); save.disabled = true; addressStatus(editingAddressId ? "Updating address…" : "Saving address…");
    const payload = {
      user_id: currentUser.id,
      label: $id("addressLabel").value,
      recipient_name: $id("addressRecipient").value.trim(),
      phone: $id("addressPhone").value.trim(),
      area: $id("addressArea").value,
      village_road: $id("addressVillage").value.trim(),
      house_building: $id("addressHouse").value.trim(),
      landmark: $id("addressLandmark").value.trim() || null,
      delivery_note: $id("addressNote").value.trim() || null,
      is_default: $id("addressDefault").checked || savedAddresses.length === 0
    };
    try {
      if (payload.is_default) {
        const { error: clearError } = await sb.from("customer_addresses").update({ is_default: false }).eq("user_id", currentUser.id);
        if (clearError) throw clearError;
      }
      const result = editingAddressId
        ? await sb.from("customer_addresses").update(payload).eq("id", editingAddressId).eq("user_id", currentUser.id)
        : await sb.from("customer_addresses").insert(payload);
      if (result.error) throw result.error;
      resetAddressForm(); addressStatus("Address saved successfully."); await loadSavedAddresses();
    } catch (err) { addressStatus(err.message || "Could not save address.", true); }
    finally { save.disabled = false; }
  });
  $id("addressCancel").addEventListener("click", resetAddressForm);
  $id("addressList").addEventListener("click", e => {
    const edit = e.target.closest("[data-address-edit]");
    const def = e.target.closest("[data-address-default]");
    const del = e.target.closest("[data-address-delete]");
    if (edit) editSavedAddress(edit.dataset.addressEdit);
    if (def) makeAddressDefault(def.dataset.addressDefault);
    if (del) deleteSavedAddress(del.dataset.addressDelete);
  });


  // Phase 5: customer checkout. This is a development workflow, not live commerce.
  document.addEventListener("click", async (event) => {
    const checkoutButton = event.target.closest(".cart-checkout");
    if (!checkoutButton) return;
    if (!currentUser) {
      say("Please log in before checkout.", true);
      show();
      setMode("login");
      return;
    }
    if (!cart.items.length || !cart.pid) return;
    const pharmacy = pharmacies.find(p => p.id === cart.pid);
    if (!pharmacy || pharmacy.is_demo) {
      alert("ডেমো ফার্মেসিতে অর্ডার করা যাবে না। অনুমোদিত বাস্তব ফার্মেসির তালিকা যুক্ত হলে অর্ডার দিন।");
      return;
    }
    await loadSavedAddresses();
    if (!savedAddresses.length) {
      alert("Checkout-এর আগে Profile থেকে অন্তত একটি delivery address যোগ করুন।");
      show();
      return;
    }
    const availableAreas = areas.map(x => x.area);
    const choices = savedAddresses.filter(a => availableAreas.includes(a.area));
    if (!choices.length) {
      alert("আপনার Saved Address-এর এলাকার জন্য delivery fee সেট করা নেই।");
      return;
    }
    const previous = document.getElementById("checkoutPanel");
    if (previous) previous.remove();
    const panel = document.createElement("section");
    panel.id = "checkoutPanel";
    panel.className = "checkout-panel";
    panel.innerHTML = `
      <div class="checkout-panel-head"><h3>অর্ডার নিশ্চিত করুন</h3><button type="button" data-checkout-close aria-label="Close">×</button></div>
      <p>ফার্মেসি: <strong>${escapeHTML(pharmacy.name)}</strong></p>
      <label>ডেলিভারি ঠিকানা
        <select id="checkoutAddress" required>
          ${choices.map(ad => `<option value="${escapeHTML(ad.id)}" ${ad.is_default ? "selected" : ""}>${escapeHTML(ad.label)} — ${escapeHTML(ad.area)}, ${escapeHTML(ad.village_road)}</option>`).join("")}
        </select>
      </label>
      <label>পেমেন্ট পদ্ধতি
        <select id="checkoutPayment"><option value="cod">Cash on Delivery (COD)</option><option value="bkash" disabled>bKash — ফার্মেসির অনুমোদিত নম্বর যোগ হলে চালু হবে</option></select>
      </label>
      <label>অর্ডার নোট (ঐচ্ছিক)<textarea id="checkoutNote" rows="2" maxlength="500" placeholder="ফার্মেসির জন্য অতিরিক্ত তথ্য"></textarea></label>
      <div id="checkoutSummary" class="checkout-summary"></div>
      <button type="button" id="placeOrderButton" class="button button-primary">অর্ডার পাঠান</button>
      <p id="checkoutStatus" class="checkout-status" role="status" aria-live="polite"></p>
      <small>এটি ডেভেলপমেন্ট পর্যায়ের অর্ডার। কোনো পেমেন্ট নেওয়া হবে না; ফার্মেসি মূল্য, স্টক ও অর্ডার নিশ্চিত করবে।</small>`;
    $("#cartView").appendChild(panel);

    const getAddress = () => choices.find(ad => ad.id === $("#checkoutAddress").value) || choices[0];
    const updateSummary = () => {
      const ad = getAddress();
      const fee = areas.find(x => x.area === ad.area)?.fee;
      const subtotal = cart.items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);
      $("#checkoutSummary").textContent = fee == null
        ? "এই এলাকার ডেলিভারি চার্জ নির্ধারিত নয়।"
        : `ওষুধের আনুমানিক মূল্য: ${money(subtotal)} · ডেলিভারি: ${money(fee)} · মোট: ${money(subtotal + fee)}`;
      $("#placeOrderButton").disabled = fee == null;
    };
    $("#checkoutAddress").addEventListener("change", updateSummary);
    updateSummary();
  });

  document.addEventListener("click", async (event) => {
    if (event.target.closest("[data-checkout-close]")) {
      document.getElementById("checkoutPanel")?.remove();
      return;
    }
    const submit = event.target.closest("#placeOrderButton");
    if (!submit) return;
    const statusNode = $("#checkoutStatus");
    const address = savedAddresses.find(a => a.id === $("#checkoutAddress").value);
    const pharmacy = pharmacies.find(p => p.id === cart.pid);
    const fee = address && areas.find(x => x.area === address.area)?.fee;
    if (!currentUser || !address || !pharmacy || pharmacy.is_demo || fee == null || !cart.items.length) {
      statusNode.textContent = "Checkout তথ্য অসম্পূর্ণ। আবার চেষ্টা করুন।";
      return;
    }
    const subtotal = cart.items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);
    const deliveryAddress = [
      `Recipient: ${address.recipient_name}`, `Phone: ${address.phone}`, `Area: ${address.area}`,
      `Village/Road: ${address.village_road}`, `House: ${address.house_building}`,
      address.landmark ? `Landmark: ${address.landmark}` : "",
      address.delivery_note ? `Instructions: ${address.delivery_note}` : ""
    ].filter(Boolean).join("\\n");
    const payload = {
      pharmacy_id: String(cart.pid),
      status: "pending",
      customer_name: address.recipient_name,
      customer_phone: address.phone,
      delivery_area: address.area,
      delivery_address: deliveryAddress,
      note: $("#checkoutNote").value.trim() || null,
      subtotal, delivery_fee: Number(fee), total: subtotal + Number(fee),
      payment_method: "cod", payment_status: "unpaid",
      items: cart.items.map(item => ({ name: item.name, unit: item.unit, price: Number(item.price), qty: Number(item.qty) }))
    };
    submit.disabled = true;
    statusNode.textContent = "অর্ডার পাঠানো হচ্ছে…";
    try {
      const { data, error } = await sb.rpc("sm24_place_customer_order", { p_order: payload });
      if (error) throw error;
      cart.items = []; cart.pid = null; saveCart(); renderCart();
      const orderId = data || "—";
      $("#cartView").innerHTML = `<div class="order-success"><h2>অর্ডার জমা হয়েছে</h2><p>Order ID: <strong>${escapeHTML(orderId)}</strong></p><p>স্ট্যাটাস: Pending pharmacy confirmation</p><p>এখনো কোনো পেমেন্ট নেওয়া হয়নি। ফার্মেসি অর্ডার ও মূল্য নিশ্চিত করবে।</p></div>`;
    } catch (err) {
      statusNode.textContent = err.message || "অর্ডার জমা দেওয়া যায়নি।";
      statusNode.classList.add("is-error");
      submit.disabled = false;
    }
  });

  async function loadCurrentProfile(user) {
    if (!user || !sb) { currentProfile = null; return; }
    const statusNode = $id("authProfileLoadStatus");
    if (statusNode) statusNode.textContent = "Loading profile…";
    try {
      const { data, error } = await sb.from("profiles")
        .select("id, role, full_name, phone, address, area, pharmacy_id, approved, created_at")
        .eq("id", user.id).maybeSingle();
      if (error) throw error;
      currentProfile = data || null;
      if (statusNode) statusNode.textContent = data ? "Profile loaded from database." : "Profile row was not found yet.";
    } catch (err) {
      currentProfile = null;
      if (statusNode) statusNode.textContent = "Database profile could not be loaded; showing account details available from sign-in.";
      console.warn("Profile load failed:", err.message || err);
    }
    if (currentUser?.id === user.id) { renderAccountState(); renderPharmacyApplyState(); await loadSavedAddresses(); if (location.hash === "#admin" && window.SM24_ADMIN?.isAdmin()) window.SM24_ADMIN.refresh().catch(e => toast(e.message, true)); }
  }
  const pharmacyForm = document.getElementById("pharmacyApplicationForm");
  const pharmacyAuthNotice = document.getElementById("pharmacyApplyAuthNotice");
  const pharmacyExisting = document.getElementById("pharmacyApplicationExisting");
  function renderPharmacyApplyState() {
    if (!pharmacyForm) return;
    if (!currentUser) {
      pharmacyForm.hidden = true;
      pharmacyAuthNotice.hidden = false;
      pharmacyAuthNotice.textContent = "ফার্মেসির আবেদন করতে আগে Customer/Owner Account দিয়ে Login বা Registration করুন।";
      pharmacyExisting.hidden = true;
      return;
    }
    pharmacyAuthNotice.hidden = true;
    pharmacyForm.hidden = false;
    loadMyPharmacyApplication();
  }
  async function loadMyPharmacyApplication() {
    if (!currentUser || !pharmacyExisting) return;
    const { data, error } = await sb.from("pharmacy_applications")
      .select("pharmacy_name,status,created_at")
      .eq("applicant_id", currentUser.id)
      .order("created_at", {ascending:false}).limit(1);
    if (error) { pharmacyExisting.hidden = false; pharmacyExisting.textContent = "আবেদনের অবস্থা লোড করা যায়নি: " + error.message; return; }
    if (data && data.length) {
      const item = data[0];
      pharmacyExisting.hidden = false;
      pharmacyExisting.textContent = `সর্বশেষ আবেদন: ${item.pharmacy_name} — অবস্থা: ${item.status === "pending" ? "পর্যালোচনাধীন" : item.status === "approved" ? "অনুমোদিত" : "প্রত্যাখ্যাত"}`;
      if (item.status === "pending") pharmacyForm.hidden = true;
    } else pharmacyExisting.hidden = true;
  }
  pharmacyForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.getElementById("pharmacyApplicationStatus");
    const submit = document.getElementById("pharmacyApplicationSubmit");
    if (!currentUser || !sb) { status.textContent = "আবেদন করতে Login করুন।"; return; }
    const formData = new FormData(pharmacyForm);
    const payload = {
      applicant_id: currentUser.id,
      pharmacy_name: String(formData.get("pharmacy_name") || "").trim(),
      owner_name: String(formData.get("owner_name") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      area: String(formData.get("area") || "").trim(),
      address: String(formData.get("address") || "").trim(),
      license_number: String(formData.get("license_number") || "").trim(),
      status: "pending"
    };
    if (Object.values(payload).some(v => typeof v === "string" && !v)) { status.textContent = "সব তথ্য পূরণ করুন।"; return; }
    submit.disabled = true; status.textContent = "আবেদন জমা হচ্ছে…";
    try {
      const { data: existing, error: checkError } = await sb.from("pharmacy_applications")
        .select("id,status").eq("applicant_id", currentUser.id).eq("status","pending").limit(1);
      if (checkError) throw checkError;
      if (existing?.length) throw new Error("আপনার একটি আবেদন ইতিমধ্যে পর্যালোচনাধীন আছে।");
      const { error } = await sb.from("pharmacy_applications").insert(payload);
      if (error) throw error;
      pharmacyForm.reset();
      status.textContent = "আবেদন জমা হয়েছে। Admin যাচাই না করা পর্যন্ত ফার্মেসি সক্রিয় হবে না।";
      await loadMyPharmacyApplication();
    } catch (err) { status.textContent = err.message || "আবেদন জমা হয়নি।"; }
    finally { submit.disabled = false; }
  });
  if (currentUser) renderPharmacyApplyState();
  window.SM24_ADMIN = {
    isAdmin: () => !!currentUser && currentProfile?.role === "admin" && currentProfile?.approved === true,
    client: () => sb,
    user: () => currentUser,
    profile: () => currentProfile,
    showDenied: () => toast("Admin access denied. অনুমোদিত Admin Account দিয়ে Login করুন।", true),
    refresh: async () => {
      const statusEl = document.getElementById("adminStatus");
      const dash = document.getElementById("adminDashboard");
      if (!window.SM24_ADMIN.isAdmin()) { dash.hidden = true; statusEl.textContent = "এই অংশ ব্যবহারের অনুমতি নেই।"; return; }
      dash.hidden = false; statusEl.textContent = "Admin হিসেবে প্রবেশ অনুমোদিত।";
      const client = sb;
      const [apps, customers, orders] = await Promise.all([
        client.from("pharmacy_applications").select("id, pharmacy_name, owner_name, phone, area, address, license_number, license_file_url, status, created_at").order("created_at", {ascending:false}),
        client.from("profiles").select("id", {count:"exact", head:true}).eq("role","customer"),
        client.from("orders").select("id", {count:"exact", head:true})
      ]);
      if (apps.error) throw apps.error;
      if (customers.error) throw customers.error;
      if (orders.error) throw orders.error;
      document.getElementById("adminStats").innerHTML = [
        ["ফার্মেসি আবেদন", apps.data.length], ["Customer", customers.count ?? 0], ["মোট অর্ডার", orders.count ?? 0]
      ].map(([label,value]) => `<article class="admin-stat"><strong>${value}</strong><span>${label}</span></article>`).join("");
      const root = document.getElementById("adminApplications");
      if (!apps.data.length) { root.innerHTML = "<p>এখনো কোনো Pharmacy Application জমা পড়েনি।</p>"; return; }
      root.innerHTML = apps.data.map(a => `<article class="admin-application">
        <div><h4>${escapeHTML(a.pharmacy_name)}</h4><p>মালিক: ${escapeHTML(a.owner_name)} · ফোন: ${escapeHTML(a.phone)}<br>এলাকা: ${escapeHTML(a.area)}<br>ঠিকানা: ${escapeHTML(a.address)}<br>লাইসেন্স: ${escapeHTML(a.license_number || "দেওয়া হয়নি")}</p>
        <small>স্ট্যাটাস: ${escapeHTML(a.status)}</small></div>
        <div class="admin-actions">${a.license_file_url ? `<a href="${escapeHTML(a.license_file_url)}" target="_blank" rel="noopener">লাইসেন্স দেখুন</a>` : ""}
        ${a.status === "pending" ? `<button class="button button-primary" data-app-action="approved" data-app-id="${a.id}">Approve</button><button class="button button-danger" data-app-action="rejected" data-app-id="${a.id}">Reject</button>` : ""}</div>
      </article>`).join("");
      root.querySelectorAll("[data-app-action]").forEach(btn => btn.addEventListener("click", async () => {
        btn.disabled = true;
        try {
          const {error} = await client.from("pharmacy_applications").update({status:btn.dataset.appAction, reviewed_by:currentUser.id, reviewed_at:new Date().toISOString()}).eq("id",btn.dataset.appId);
          if (error) throw error;
          toast("আবেদনের অবস্থা আপডেট হয়েছে।"); await window.SM24_ADMIN.refresh();
        } catch(e) { toast(e.message || "Update failed", true); btn.disabled=false; }
      }));
    }
  };
  const adminLink = document.getElementById("adminNavLink");
  const updateAdminLink = () => { adminLink.hidden = !window.SM24_ADMIN.isAdmin(); };
  function show() {
    overlay.hidden = false;
    if (!sessionReady) {
      authForm.hidden = true; tabsWrap.hidden = true; profile.hidden = true; logoutBtn.hidden = true;
      $id("authTitle").textContent = "Checking your account…";
      $id("authMessage").textContent = "Please wait a moment.";
      return;
    }
    renderAccountState();
  }
  openBtn.addEventListener("click", show);
  $id("authClose").addEventListener("click", hide);
  overlay.addEventListener("click", e => { if (e.target === overlay) hide(); });
  tabs.forEach(t => t.addEventListener("click", () => {
    if (currentUser) return;
    setMode(t.dataset.authMode);
  }));

  if (!sb) {
    openBtn.addEventListener("click", () => say("Supabase configuration or client library is missing.", true));
    sessionReady = true;
    return;
  }

  authForm.addEventListener("submit", async e => {
    e.preventDefault();
    const identifier = $id("authEmail").value.trim();
    const password = $id("authPassword").value;
    const submit = $id("authSubmit");
    if (!identifier || !password) { say("Email/phone and password are required.", true); return; }
    submit.disabled = true; say(mode === "signup" ? "Creating account…" : "Signing in…");
    try {
      let result;
      if (mode === "signup") {
        const full_name = $id("authName").value.trim();
        if (!full_name) throw new Error("Please enter your name.");
        result = await sb.auth.signUp({
          email: identifier, password,
          options: { data: { full_name, phone: $id("authPhone").value.trim(), area: $id("authArea").value } }
        });
        if (result.error) throw result.error;
        if (result.data.session && result.data.user) {
          currentUser = result.data.user; await loadCurrentProfile(currentUser); renderAccountState(); hide();
          if (typeof showPage === "function") showPage("home");
          toast("রেজিস্ট্রেশন সফল হয়েছে। স্বাগতম!");
        } else {
          hide(); if (typeof showPage === "function") showPage("home");
          toast("রেজিস্ট্রেশন হয়েছে। লগইনের আগে ইমেইল যাচাই করুন।");
        }
      } else {
        const isEmail = identifier.includes("@");
        result = await sb.auth.signInWithPassword(isEmail ? { email: identifier, password } : { phone: identifier, password });
        if (result.error) throw result.error;
        currentUser = result.data.user; await loadCurrentProfile(currentUser); renderAccountState(); hide();
        if (typeof showPage === "function") showPage("home");
        toast("লগইন সফল হয়েছে। স্বাগতম!");
      }
    } catch (err) { say(err.message || "Authentication failed.", true); }
    finally { submit.disabled = false; }
  });
  logoutBtn.addEventListener("click", async () => {
    logoutBtn.disabled = true;
    try {
      const { error } = await sb.auth.signOut();
      if (error) throw error;
      currentUser = null; currentProfile = null; savedAddresses = []; resetAddressForm(); renderAccountState(); hide();
      if (typeof showPage === "function") showPage("home");
      toast("আপনি সফলভাবে লগআউট করেছেন।");
    } catch (err) { say(err.message || "Could not log out.", true); }
    finally { logoutBtn.disabled = false; }
  });
  sb.auth.getSession().then(async ({ data, error }) => {
    if (error) say(error.message, true);
    currentUser = data.session?.user || null; sessionReady = true;
    if (currentUser) await loadCurrentProfile(currentUser);
    renderAccountState();
    if (!currentUser && !overlay.hidden) renderAccountState();
  });
  sb.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null; sessionReady = true; renderPharmacyApplyState();
    if (!currentUser) { currentProfile = null; renderAccountState(); return; }
    // Avoid awaiting Supabase queries inside the auth callback.
    queueMicrotask(() => loadCurrentProfile(currentUser));
    renderAccountState();
  });
  setMode("login");
})();

// Admin dashboard page events
document.getElementById("adminRefresh")?.addEventListener("click", () => {
  window.SM24_ADMIN?.refresh().catch(err => {
    const node = document.getElementById("adminStatus");
    if (node) node.textContent = err.message || "Dashboard load failed.";
  });
});
window.addEventListener("hashchange", () => {
  if (location.hash === "#admin") window.SM24_ADMIN?.refresh().catch(err => {
    const node = document.getElementById("adminStatus"); if (node) node.textContent = err.message || "Dashboard load failed.";
  });
});
