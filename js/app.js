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
  const validPages = ["home", "pharmacies", "how-it-works", "about", "cart", "admin", "pharmacy-apply", "pharmacy-dashboard", "my-orders", "rider-apply", "rider-dashboard"];
  const page = validPages.includes(pageName) ? pageName : "home";
  if (page === "pharmacy-dashboard" && !window.SM24_PHARMACY?.isOwner()) {
    window.SM24_PHARMACY?.showDenied();
    return showPage("home", false);
  }
  if (page === "rider-dashboard" && !(currentUser && currentProfile?.role === "rider" && currentProfile?.approved === true)) {
    toast("অনুমোদিত Rider Account দিয়ে Login করুন।", true);
    return showPage("home", false);
  }
  if (page === "my-orders" && !currentUser) {
    toast("অর্ডার দেখতে Customer Account দিয়ে Login করুন।", true);
    return showPage("home", false);
  }
  if (page === "cart" && currentProfile?.role === "pharmacy") {
    toast("Pharmacy Owner Account থেকে Customer Cart ব্যবহার করা যাবে না।", true);
    return showPage("home", false);
  }
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

  if (page === "cart") renderCart();

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
          <span class="stock ${m.in_stock ? "ok" : "out"}">${m.in_stock ? (m.stock_qty != null ? `${en ? "Stock" : "স্টক"}: ${m.stock_qty}` : (en ? "In stock" : "স্টক আছে")) : (en ? "Out of stock" : "স্টক নেই")}</span>
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
  const ph = pharmacies.find((p) => String(p.id) === String(m.pharmacy_id));
  if (!ph || !m.in_stock) return false;
  if (cart.pid && cart.pid !== m.pharmacy_id && cart.items.length) {
    if (!confirm(tr("আপনার কার্টে অন্য ফার্মেসির ওষুধ আছে। কার্ট খালি করে এই ফার্মেসির ওষুধ নেবেন?",
                    "Your cart has items from another pharmacy. Clear it and add this one?"))) return false;
    cart.items = [];
  }
  cart.pid = m.pharmacy_id;
  const line = cart.items.find((i) => i.name === m.name && i.unit === m.unit);
  if (line) line.qty = Math.min(m.stock_qty ?? 99, 99, line.qty + 1);
  else cart.items.push({ inventory_id: m.id || null, name: m.name, unit: m.unit, price: m.price, qty: 1, stock_qty: m.stock_qty ?? null });
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
  const ph = pharmacies.find((p) => String(p.id) === String(cart.pid));
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
async function loadApprovedPharmaciesFromSupabase() {
  const cfg = window.SM24_CONFIG || {};
  if (!window.supabase || !cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY) return [];
  const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY);
  const { data, error } = await client.from("pharmacies")
    .select("id, pharmacy_name, owner_name, phone, area, address")
    .eq("status", "approved").order("created_at", {ascending:false});
  if (error) { console.warn("Approved pharmacy list unavailable:", error.message); return []; }
  return (data || []).map(p => ({
    id: p.id, name: p.pharmacy_name, area: p.area,
    description: [p.address, p.phone ? "Phone: " + p.phone : ""].filter(Boolean).join(" · "),
    is_demo: false, owner_name: p.owner_name, source: "supabase"
  }));
}
async function loadLivePharmacyInventory() {
  const cfg = window.SM24_CONFIG || {};
  if (!window.supabase || !cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY) return [];
  const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY);
  const { data, error } = await client.from("pharmacy_inventory")
    .select("id, pharmacy_id, name, generic_name, unit, price, stock_qty, is_available, expiry_date")
    .eq("is_available", true).gt("stock_qty", 0).order("name");
  if (error) { console.warn("Live inventory unavailable:", error.message); return []; }
  const today = new Date(); today.setHours(0,0,0,0);
  const sellable = (data || []).filter(x => !x.expiry_date || new Date(x.expiry_date + "T00:00:00") > today);
  return sellable.map(x => ({
    id: x.id, pharmacy_id: String(x.pharmacy_id), name: x.name,
    generic: x.generic_name || "", unit: x.unit, price: Number(x.price),
    stock_qty: Number(x.stock_qty), in_stock: Number(x.stock_qty) > 0,
    is_demo: false, source: "supabase"
  }));
}
async function loadSheetData() {
  const get = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); });
  try {
    const [p, m, a] = await Promise.all([
      SHEET_CSV.pharmacies ? get(SHEET_CSV.pharmacies).catch(() => "") : Promise.resolve(""),
      SHEET_CSV.medicines ? get(SHEET_CSV.medicines).catch(() => "") : Promise.resolve(""),
      SHEET_CSV.areas ? get(SHEET_CSV.areas).catch(() => null) : Promise.resolve(null)
    ]);
    pharmacies = parseCSV(p).filter((r) => (r.status || "").toLowerCase() === "approved")
      .map((r) => ({ id: r.id, name: r.name, area: r.area, description: r.description || r.address || "", is_demo: isYes(r.is_demo) }));
    const livePharmacies = await loadApprovedPharmaciesFromSupabase();
    const knownIds = new Set(pharmacies.map(p => String(p.id)));
    pharmacies.push(...livePharmacies.filter(p => !knownIds.has(String(p.id))));
    medicines = parseCSV(m).map((r) => ({ pharmacy_id: r.pharmacy_id, name: r.medicine_name, generic: r.generic || "",
      unit: (r.unit || "").toLowerCase(), price: Number(r.price), in_stock: isYes(r.in_stock) }))
      .filter((r) => r.name && !isNaN(r.price));
    const liveInventory = await loadLivePharmacyInventory();
    const livePharmacyIds = new Set(liveInventory.map(x => String(x.pharmacy_id)));
    medicines = medicines.filter(m => !livePharmacyIds.has(String(m.pharmacy_id)));
    medicines.push(...liveInventory);
    if (a) {
      const parsed = parseCSV(a).map((r) => ({ area: r.area, fee: Number(r.delivery_fee) })).filter((r) => r.area && !isNaN(r.fee));
      if (parsed.length) areas = parsed;
    }
    // Refresh saved cart prices when a matching catalogue item exists.
    // Do not silently erase a customer's cart when a catalogue/API refresh is
    // incomplete or an item is temporarily absent; the database order RPC
    // remains the authority for current price, availability, and stock.
    cart.items = cart.items.map((i) => {
      const m2 = medicines.find((x) =>
        String(x.pharmacy_id) === String(cart.pid) &&
        String(x.name).trim() === String(i.name).trim() &&
        String(x.unit).trim() === String(i.unit).trim()
      );
      return m2 ? { ...i, price: m2.price } : i;
    });
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
    const pharmacyLink = document.getElementById("pharmacyDashboardNav");
    if (pharmacyLink) pharmacyLink.hidden = !(currentProfile?.role === "pharmacy" && currentProfile?.approved === true && !!currentProfile?.pharmacy_id);
    const applyLink = document.getElementById("pharmacyApplyNav");
    if (applyLink) applyLink.hidden = currentProfile?.role === "pharmacy" && currentProfile?.approved === true;
    const cartFab = document.getElementById("cartFab");
    if (cartFab) cartFab.hidden = ["pharmacy","admin","rider"].includes(currentProfile?.role);
    const myOrdersLink = document.getElementById("myOrdersNav");
    if (myOrdersLink) myOrdersLink.hidden = !signedIn || currentProfile?.role !== "customer";
    const riderApplyLink = document.getElementById("riderApplyNav");
    if (riderApplyLink) riderApplyLink.hidden = !signedIn || ["rider","admin","pharmacy"].includes(currentProfile?.role);
    const riderDashboardLink = document.getElementById("riderDashboardNav");
    if (riderDashboardLink) riderDashboardLink.hidden = !(signedIn && currentProfile?.role === "rider" && currentProfile?.approved === true);
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
      const isPharmacy = role === "pharmacy";
      $id("authProfileRole").textContent = role === "customer" ? "Customer" : role === "admin" ? "Admin" : role === "pharmacy" ? "Pharmacy Owner" : role === "rider" ? "Rider" : role;
      $id("authProfileApproval").textContent = currentProfile ? (currentProfile.approved ? "Approved" : "Pending approval") : "Not loaded";
      const savedAddressSection = document.querySelector(".saved-addresses");
      if (savedAddressSection) savedAddressSection.hidden = isPharmacy || role === "admin";
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
      items: cart.items.map(item => ({ inventory_id: item.inventory_id, name: item.name, unit: item.unit, price: Number(item.price), qty: Number(item.qty) }))
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
    if (currentUser?.id === user.id) { renderAccountState(); renderPharmacyApplyState(); await loadSavedAddresses(); if (location.hash === "#admin" && window.SM24_ADMIN?.isAdmin()) window.SM24_ADMIN.refresh().catch(e => toast(e.message, true));
      if (location.hash === "#pharmacy-dashboard" && window.SM24_PHARMACY?.isOwner()) window.SM24_PHARMACY.refresh().catch(e => toast(e.message, true));
      if (location.hash === "#my-orders") window.loadCustomerOrders?.();
      if (location.hash === "#rider-apply") window.loadRiderApplicationState?.();
      if (location.hash === "#rider-dashboard") window.loadRiderDeliveries?.(); }
  }
  window.loadCustomerOrders = async function() {
    const status = document.getElementById("customerOrdersStatus");
    const root = document.getElementById("customerOrdersList");
    if (!currentUser || !sb) { status.textContent = "অর্ডার দেখতে Customer Account দিয়ে Login করুন।"; root.innerHTML = ""; return; }
    status.textContent = "অর্ডার লোড হচ্ছে…";
    const { data, error } = await sb.from("orders")
      .select("id,created_at,status,pharmacy_id,delivery_area,delivery_address,subtotal,delivery_fee,total,payment_method,payment_status")
      .eq("customer_id", currentUser.id).order("created_at", {ascending:false}).limit(100);
    if (error) { status.textContent = "অর্ডার লোড করা যায়নি: " + error.message; return; }
    if (!data.length) { status.textContent = "আপনার এখনো কোনো অর্ডার নেই।"; root.innerHTML = ""; return; }
    const pharmacyIds = [...new Set(data.map(x=>x.pharmacy_id))];
    const [{ data: pharmacyRows }, { data: itemRows, error: itemError }] = await Promise.all([
      sb.from("pharmacies").select("id,pharmacy_name").in("id", pharmacyIds),
      sb.from("order_items").select("order_id,name,unit,price,qty").in("order_id", data.map(x=>x.id))
    ]);
    if (itemError) console.warn("Order item details unavailable:", itemError.message);
    const pnames = Object.fromEntries((pharmacyRows||[]).map(x=>[String(x.id),x.pharmacy_name]));
    const itemsByOrder = {};
    (itemRows||[]).forEach(item => (itemsByOrder[item.order_id] ||= []).push(item));
    const steps = ["pending","accepted","processing","ready","assigned","picked_up","out_for_delivery","delivered"];
    const labels = {pending:"ফার্মেসির অনুমোদনের অপেক্ষায়",accepted:"ফার্মেসি গ্রহণ করেছে",processing:"প্রস্তুত করা হচ্ছে",ready:"ডেলিভারির জন্য প্রস্তুত",rejected:"ফার্মেসি অর্ডার গ্রহণ করেনি",assigned:"Rider নিয়োগ হয়েছে",picked_up:"Rider সংগ্রহ করেছেন",out_for_delivery:"Rider পথে আছেন",delivered:"ডেলিভারি সম্পন্ন",cancelled:"বাতিল"};
    root.innerHTML = data.map(o => {
      const current = steps.indexOf(o.status);
      const timeline = ["rejected","cancelled"].includes(o.status)
        ? `<p class="tracking-terminal">${escapeHTML(labels[o.status])}</p>`
        : `<ol class="order-timeline">${steps.map((step,i)=>`<li class="${current >= i ? "is-complete" : ""}"><span></span>${escapeHTML(labels[step])}</li>`).join("")}</ol>`;
      const itemHtml = (itemsByOrder[o.id]||[]).map(it=>`<li>${escapeHTML(it.name)} — ${Number(it.qty)} ${escapeHTML(it.unit)} × ৳${Number(it.price).toFixed(2)}</li>`).join("");
      return `<article class="customer-order-card"><div class="customer-order-head"><strong>Order #${escapeHTML(String(o.id).slice(0,8))}</strong><span class="order-status">${escapeHTML(labels[o.status]||o.status)}</span></div><p>${escapeHTML(pnames[String(o.pharmacy_id)]||"Pharmacy")} · ${escapeHTML(o.delivery_area)} · <strong>৳${Number(o.total).toFixed(2)}</strong></p><small>${new Date(o.created_at).toLocaleString()}</small><div class="order-tracking"><h3>ডেলিভারি ট্র্যাকিং</h3>${timeline}</div><details><summary>অর্ডারের বিস্তারিত</summary><ul>${itemHtml || "<li>পণ্যের বিস্তারিত পাওয়া যায়নি</li>"}</ul><p>পণ্যের মূল্য: ৳${Number(o.subtotal).toFixed(2)} · ডেলিভারি: ৳${Number(o.delivery_fee).toFixed(2)}</p><p>পেমেন্ট: ${escapeHTML(o.payment_method||"cod")} · ${escapeHTML(o.payment_status||"unpaid")}</p><pre>${escapeHTML(o.delivery_address||"")}</pre></details></article>`;
    }).join("");
    status.textContent = `${data.length}টি অর্ডার পাওয়া গেছে। সর্বশেষ অবস্থা দেখতে Refresh চাপুন।`;
  }
  document.getElementById("refreshCustomerOrders")?.addEventListener("click", () => window.loadCustomerOrders());
  const riderForm = document.getElementById("riderApplicationForm");
  window.loadRiderApplicationState = async function() {
    const notice = document.getElementById("riderApplyNotice");
    const existing = document.getElementById("riderExisting");
    if (!currentUser) { riderForm.hidden=true; notice.textContent="Rider আবেদন করতে Login করুন।"; return; }
    const {data,error}=await sb.from("rider_applications").select("full_name,status,created_at").eq("applicant_id",currentUser.id).order("created_at",{ascending:false}).limit(1);
    if(error){notice.textContent="আবেদন অবস্থা লোড হয়নি: "+error.message;return;}
    if(data?.length){riderForm.hidden=data[0].status==="pending"||data[0].status==="approved";existing.hidden=false;existing.textContent=`সর্বশেষ আবেদন: ${data[0].full_name} — ${data[0].status}`;}
    else {riderForm.hidden=false; existing.hidden=true;}
  }
  riderForm?.addEventListener("submit",async e=>{
    e.preventDefault(); const status=document.getElementById("riderApplyStatus");
    if(!currentUser){status.textContent="আগে Login করুন।";return;}
    const fd=new FormData(riderForm);
    const payload={applicant_id:currentUser.id,full_name:String(fd.get("full_name")).trim(),phone:String(fd.get("phone")).trim(),area:String(fd.get("area")).trim(),address:String(fd.get("address")).trim(),id_reference:String(fd.get("id_reference")).trim(),status:"pending"};
    const btn=document.getElementById("riderApplySubmit");btn.disabled=true;status.textContent="আবেদন জমা হচ্ছে…";
    try{const {error}=await sb.from("rider_applications").insert(payload);if(error)throw error;riderForm.reset();status.textContent="আবেদন জমা হয়েছে। Admin যাচাই করবেন।";await window.loadRiderApplicationState?.();}
    catch(err){status.textContent=err.message||"আবেদন জমা হয়নি।";}
    finally{btn.disabled=false;}
  });
  if (location.hash === "#my-orders" && currentUser) window.loadCustomerOrders?.();
  if (location.hash === "#rider-apply" && currentUser) window.loadRiderApplicationState?.();
  window.loadRiderDeliveries = async function() {
    const status=document.getElementById("riderDashboardStatus"), root=document.getElementById("riderDashboardOrders");
    if(!currentUser || currentProfile?.role!=="rider" || currentProfile?.approved!==true){status.textContent="Rider access অনুমোদিত নয়।";return;}
    status.textContent="আপনার Delivery লোড হচ্ছে…";
    const {data,error}=await sb.from("orders").select("id,created_at,status,customer_name,customer_phone,delivery_area,delivery_address,note,total")
      .eq("rider_id",currentUser.id).order("created_at",{ascending:false}).limit(100);
    if(error){status.textContent="Delivery লোড হয়নি: "+error.message;return;}
    const next={assigned:"picked_up",picked_up:"out_for_delivery",out_for_delivery:"delivered"};
    const labels={assigned:"নতুন বরাদ্দ",picked_up:"প্যাকেট সংগ্রহ হয়েছে",out_for_delivery:"ডেলিভারি পথে",delivered:"সম্পন্ন"};
    root.innerHTML=data.length?data.map(o=>`<article class="customer-order-card"><div class="customer-order-head"><strong>Order #${escapeHTML(String(o.id).slice(0,8))}</strong><span class="order-status">${labels[o.status]||o.status}</span></div><p>${escapeHTML(o.customer_name)} · ${escapeHTML(o.customer_phone)} · ${escapeHTML(o.delivery_area)} · ৳${Number(o.total).toFixed(2)}</p><details><summary>ডেলিভারি ঠিকানা</summary><pre>${escapeHTML(o.delivery_address||"")}</pre>${o.note?`<p>${escapeHTML(o.note)}</p>`:""}</details>${next[o.status]?`<button class="button" data-rider-next="${next[o.status]}" data-order-id="${o.id}">${next[o.status]==="picked_up"?"প্যাকেট সংগ্রহ করেছি":next[o.status]==="out_for_delivery"?"ডেলিভারি শুরু":"ডেলিভারি সম্পন্ন"}</button>`:""}</article>`).join(""):"এখনো কোনো Delivery বরাদ্দ করা হয়নি।";
    status.textContent=`${data.length}টি Delivery পাওয়া গেছে।`;
    root.querySelectorAll("[data-rider-next]").forEach(btn=>btn.addEventListener("click",async()=>{
      btn.disabled=true;const nextStatus=btn.dataset.riderNext;
      const allowed={picked_up:"assigned",out_for_delivery:"picked_up",delivered:"out_for_delivery"};
      const {error:updateError}=await sb.from("orders").update({status:nextStatus,updated_at:new Date().toISOString()})
        .eq("id",btn.dataset.orderId).eq("rider_id",currentUser.id).eq("status",allowed[nextStatus]);
      if(updateError){toast(updateError.message,true);btn.disabled=false;return;}
      await window.loadRiderDeliveries();
    }));
  };
  window.loadAdminDeliveryQueue = async function(){
    const root=document.getElementById("adminDeliveryOrders"); if(!root)return;
    const [orders,riders]=await Promise.all([
      sb.from("orders").select("id,created_at,status,customer_name,delivery_area,total,rider_id").in("status",["ready","assigned","picked_up","out_for_delivery"]).order("created_at",{ascending:false}).limit(100),
      sb.from("profiles").select("id,full_name,phone").eq("role","rider").eq("approved",true)
    ]);
    if(orders.error)throw orders.error;if(riders.error)throw riders.error;
    root.innerHTML=orders.data.length?orders.data.map(o=>`<article class="admin-application"><div><strong>Order #${escapeHTML(String(o.id).slice(0,8))}</strong><p>${escapeHTML(o.customer_name)} · ${escapeHTML(o.delivery_area)} · ৳${Number(o.total).toFixed(2)}<br>Status: ${escapeHTML(o.status)}</p></div><div class="admin-actions"><select data-assign-rider="${o.id}"><option value="">${o.rider_id?"Rider assigned":"Select approved Rider"}</option>${riders.data.map(r=>`<option value="${r.id}" ${r.id===o.rider_id?"selected":""}>${escapeHTML(r.full_name||r.phone||r.id)}</option>`).join("")}</select><button class="button button-primary" data-assign-save="${o.id}">Assign</button></div></article>`).join(""):"Ready বা চলমান কোনো Delivery নেই।";
    root.querySelectorAll("[data-assign-save]").forEach(btn=>btn.addEventListener("click",async()=>{
      const select=root.querySelector(`[data-assign-rider="${btn.dataset.assignSave}"]`);
      if(!select.value){toast("একজন অনুমোদিত Rider নির্বাচন করুন।",true);return;}
      btn.disabled=true;
      const {error}=await sb.from("orders").update({rider_id:select.value,status:"assigned",updated_at:new Date().toISOString()}).eq("id",btn.dataset.assignSave).eq("status","ready");
      if(error){toast(error.message,true);btn.disabled=false;return;}
      toast("Rider বরাদ্দ হয়েছে।");await window.loadAdminDeliveryQueue();
    }));
  };
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
      if (item.status === "pending" || item.status === "approved") pharmacyForm.hidden = true;
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
  const inventoryForm = document.getElementById("inventoryForm");
  const pharmacyDashStatus = document.getElementById("pharmacyDashboardStatus");
  const inventoryList = document.getElementById("inventoryList");
  function resetInventoryForm() {
    inventoryForm?.reset();
    if (inventoryForm?.elements.id) inventoryForm.elements.id.value = "";
    const cancel = document.getElementById("inventoryCancel"); if (cancel) cancel.hidden = true;
    const save = document.getElementById("inventorySave"); if (save) save.textContent = "Save medicine";
  }
  async function refreshInventory() {
    if (!window.SM24_PHARMACY.isOwner()) throw new Error("Pharmacy owner permission required.");
    const pid = currentProfile.pharmacy_id;
    const {data,error} = await sb.from("pharmacy_inventory").select("id,pharmacy_id,name,generic_name,unit,price,stock_qty,is_available,low_stock_threshold,expiry_date").eq("pharmacy_id",pid).order("name");
    if (error) throw error;
    const today=new Date(); today.setHours(0,0,0,0);
    const lowStock=data.filter(x=>Number(x.stock_qty)<=Number(x.low_stock_threshold??5));
    const expiryAlerts=data.filter(x=>x.expiry_date && new Date(x.expiry_date+"T00:00:00")<=new Date(today.getTime()+90*86400000));
    const lowNode=document.getElementById("inventoryLowStockSummary");
    if(lowNode)lowNode.textContent=`Low stock: ${lowStock.length}টি · Expiry alert (আগামী ৯০ দিন/মেয়াদ শেষ): ${expiryAlerts.length}টি`;
    inventoryList.innerHTML = data.length ? data.map(x => {
      const low=Number(x.stock_qty)<=Number(x.low_stock_threshold??5);
      const expiry=x.expiry_date?new Date(x.expiry_date+"T00:00:00"):null;
      const expired=expiry && expiry<today;
      const expiring=expiry && !expired && expiry<=new Date(today.getTime()+90*86400000);
      const expiryLabel=expired?"Expired":expiring?"Expiry soon":"";
      return `<div class="inventory-row ${low?"inventory-low-stock":""} ${expired?"inventory-expired":""}"><div><strong>${escapeHTML(x.name)} ${low?'<span class="low-stock-badge">Low stock</span>':""} ${expiryLabel?`<span class="expiry-badge">${expiryLabel}</span>`:""}</strong><small>${escapeHTML(x.generic_name || "")} · ${escapeHTML(x.unit)} · ৳${Number(x.price).toFixed(2)} · Stock: ${x.stock_qty} · Alert at: ${x.low_stock_threshold??5} · Expiry: ${x.expiry_date||"Not set"} · ${x.is_available ? "Available" : "Unavailable"}</small></div><div class="inventory-actions"><button class="button button-secondary" data-edit="${x.id}">Edit</button><button class="button button-secondary" data-delete="${x.id}">Delete</button></div></div>`;
    }).join("") : "এখনো কোনো ওষুধ যোগ করা হয়নি।";
    inventoryList.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => {
      const x=data.find(y=>String(y.id)===b.dataset.edit); if(!x)return;
      ["name","generic_name","unit","price","stock_qty","low_stock_threshold","expiry_date","is_available"].forEach(k=>{if(inventoryForm.elements[k].type==="checkbox") inventoryForm.elements[k].checked=!!x[k]; else inventoryForm.elements[k].value=x[k] ?? "";});
      inventoryForm.elements.id.value=x.id; document.getElementById("inventoryCancel").hidden=false; document.getElementById("inventorySave").textContent="Update medicine";
    }));
    inventoryList.querySelectorAll("[data-delete]").forEach(b => b.addEventListener("click", async()=>{
      if(!confirm("এই ওষুধটি মুছবেন?"))return;
      const {error:e}=await sb.from("pharmacy_inventory").delete().eq("id",b.dataset.delete).eq("pharmacy_id",pid);
      if(e) toast(e.message,true); else await refreshInventory();
    }));
  }
  async function refreshStockHistory() {
    const status = document.getElementById("stockHistoryStatus");
    const list = document.getElementById("stockHistoryList");
    if (!window.SM24_PHARMACY.isOwner()) throw new Error("Pharmacy owner permission required.");
    if (status) status.textContent = "Stock history লোড হচ্ছে…";
    const pid = currentProfile.pharmacy_id;
    const { data, error } = await sb.from("sm24_stock_movements")
      .select("id,inventory_id,medicine_name,movement_type,old_stock,new_stock,quantity_change,actor_id,occurred_at")
      .eq("pharmacy_id", pid).order("occurred_at", { ascending: false }).limit(100);
    if (error) throw error;
    const labels = { stock_added: "নতুন inventory", stock_changed: "Stock পরিবর্তন", stock_removed: "Inventory মুছে ফেলা" };
    if (!data.length) {
      if (status) status.textContent = "এখনো কোনো stock movement রেকর্ড নেই। Phase 6Q SQL ইনস্টল করার পর stock পরিবর্তন করুন।";
      if (list) list.innerHTML = "";
      return;
    }
    if (status) status.textContent = `মোট ${data.length}টি সাম্প্রতিক রেকর্ড দেখানো হচ্ছে (সর্বোচ্চ ১০০টি)।`;
    if (list) list.innerHTML = data.map(row => {
      const change = row.quantity_change == null ? "—" : `${Number(row.quantity_change) > 0 ? "+" : ""}${row.quantity_change}`;
      const before = row.old_stock == null ? "—" : row.old_stock;
      const after = row.new_stock == null ? "—" : row.new_stock;
      return `<article class="inventory-row"><div><strong>${escapeHTML(row.medicine_name || "Unknown medicine")}</strong><small>${escapeHTML(labels[row.movement_type] || row.movement_type)} · আগের stock: ${before} · নতুন stock: ${after} · পরিবর্তন: ${change}</small><small>${new Date(row.occurred_at).toLocaleString()} · Actor: ${escapeHTML(row.actor_id || "System/unknown")}</small></div></article>`;
    }).join("");
  }
  let pharmacyOrdersCache = [];
  async function refreshPharmacyOrders() {
    if (!window.SM24_PHARMACY.isOwner()) throw new Error("Pharmacy owner permission required.");
    const pid = currentProfile.pharmacy_id;
    const { data, error } = await sb.from("orders")
      .select("id,created_at,status,customer_name,customer_phone,delivery_area,delivery_address,note,subtotal,delivery_fee,total,payment_method,payment_status")
      .eq("pharmacy_id", pid).order("created_at", {ascending:false}).limit(200);
    if (error) throw error;
    pharmacyOrdersCache = data || [];
    const orderStats = {
      total: pharmacyOrdersCache.length,
      pending: pharmacyOrdersCache.filter(o=>o.status==="pending").length,
      active: pharmacyOrdersCache.filter(o=>["accepted","processing","ready","assigned","picked_up","out_for_delivery"].includes(o.status)).length,
      delivered: pharmacyOrdersCache.filter(o=>o.status==="delivered").length,
      deliveredValue: pharmacyOrdersCache.filter(o=>o.status==="delivered").reduce((sum,o)=>sum+Number(o.total||0),0)
    };
    const statsNode=document.getElementById("pharmacyOrderStats");
    if(statsNode)statsNode.innerHTML=[
      ["সাম্প্রতিক অর্ডার",orderStats.total],
      ["নতুন Pending",orderStats.pending],
      ["চলমান",orderStats.active],
      ["Delivered",orderStats.delivered],
      ["Delivered Order Value","৳"+orderStats.deliveredValue.toFixed(2)]
    ].map(([label,value])=>`<article class="pharmacy-order-stat"><strong>${escapeHTML(String(value))}</strong><span>${escapeHTML(label)}</span></article>`).join("");
    const ids=pharmacyOrdersCache.map(o=>o.id);
    let itemRows=[];
    if(ids.length){
      const {data:items,error:itemError}=await sb.from("order_items").select("order_id,name,unit,price,qty").in("order_id",ids);
      if(itemError) console.warn("Order item detail query:",itemError.message);
      itemRows=items||[];
    }
    const byOrder={}; itemRows.forEach(item=>(byOrder[item.order_id] ||= []).push(item));
    const node=document.getElementById("pharmacyOrdersList");
    const search=(document.getElementById("pharmacyOrderSearch")?.value||"").trim().toLowerCase();
    const status=document.getElementById("pharmacyOrderStatus")?.value||"all";
    const filtered=pharmacyOrdersCache.filter(o=>{
      const hay=[o.id,o.customer_name,o.customer_phone,o.delivery_area].join(" ").toLowerCase();
      return (!search||hay.includes(search))&&(status==="all"||o.status===status);
    });
    const summary=document.getElementById("pharmacyOrdersSummary");
    if(summary)summary.textContent=`মোট ${pharmacyOrdersCache.length}টি অর্ডার · ফিল্টারে ${filtered.length}টি`;
    const labels={pending:"Pending",accepted:"Accepted",rejected:"Rejected",processing:"Processing",ready:"Ready",assigned:"Rider assigned",picked_up:"Picked up",out_for_delivery:"Out for delivery",delivered:"Delivered",cancelled:"Cancelled"};
    node.innerHTML=filtered.length?filtered.map(o=>{
      const items=(byOrder[o.id]||[]).map(it=>`<li>${escapeHTML(it.name)} — ${Number(it.qty)} ${escapeHTML(it.unit)} × ৳${Number(it.price).toFixed(2)}</li>`).join("");
      return `<article class="pharmacy-order-row"><div class="pharmacy-order-main"><strong>Order ${escapeHTML(String(o.id).slice(0,8))}</strong><small>${escapeHTML(o.customer_name)} · ${escapeHTML(o.customer_phone)} · ${escapeHTML(o.delivery_area)} · ৳${Number(o.total).toFixed(2)}</small><small>Status: <b>${escapeHTML(labels[o.status]||o.status)}</b> · Payment: ${escapeHTML(o.payment_status||"unpaid")}</small><small>${new Date(o.created_at).toLocaleString()}</small><details><summary>Order items & delivery details</summary><ul>${items||"<li>Item details unavailable</li>"}</ul><p>Subtotal: ৳${Number(o.subtotal).toFixed(2)} · Delivery: ৳${Number(o.delivery_fee).toFixed(2)}</p><p>Payment method: ${escapeHTML(o.payment_method||"cod")} · Status: ${escapeHTML(o.payment_status||"unpaid")}</p><pre>${escapeHTML(o.delivery_address||"")}</pre>${o.note?`<p>Note: ${escapeHTML(o.note)}</p>`:""}</details></div><div class="inventory-actions">${o.status==="pending"?`<button class="button" data-order-action="accepted" data-order-id="${o.id}">Accept</button><button class="button button-secondary" data-order-action="rejected" data-order-id="${o.id}">Reject</button>`:""}${o.status==="accepted"?`<button class="button" data-order-action="processing" data-order-id="${o.id}">Processing</button>`:""}${o.status==="processing"?`<button class="button" data-order-action="ready" data-order-id="${o.id}">Ready</button>`:""}</div></article>`;
    }).join(""):"এই Filter/Search অনুযায়ী কোনো Order নেই।";
    node.querySelectorAll("[data-order-action]").forEach(btn=>btn.addEventListener("click",async()=>{
      btn.disabled=true; const next=btn.dataset.orderAction;
      const previous=next==="accepted"||next==="rejected"?"pending":next==="processing"?"accepted":"processing";
      const {error:updateError}=await sb.from("orders").update({status:next,updated_at:new Date().toISOString()}).eq("id",btn.dataset.orderId).eq("pharmacy_id",pid).eq("status",previous);
      if(updateError){toast(updateError.message,true);btn.disabled=false;return;}
      await refreshPharmacyOrders();
    }));
  }
  window.SM24_PHARMACY = {
    isOwner:()=>!!currentUser && currentProfile?.role==="pharmacy" && currentProfile?.approved===true && !!currentProfile?.pharmacy_id,
    showDenied:()=>toast("অনুমোদিত Pharmacy Owner Account দিয়ে Login করুন।",true),
    refresh:async()=>{
      const content=document.getElementById("pharmacyDashboardContent");
      if(!window.SM24_PHARMACY.isOwner()){content.hidden=true; pharmacyDashStatus.textContent="এই অংশ ব্যবহারের অনুমতি নেই।";return;}
      content.hidden=false; pharmacyDashStatus.textContent="Pharmacy Owner হিসেবে প্রবেশ অনুমোদিত।"; await refreshInventory(); await refreshPharmacyOrders(); await refreshStockHistory();
    }
  };
  document.getElementById("pharmacyOrdersRefresh")?.addEventListener("click",()=>refreshPharmacyOrders().catch(e=>toast(e.message,true)));
  document.getElementById("pharmacyOrderSearch")?.addEventListener("input",()=>refreshPharmacyOrders().catch(e=>toast(e.message,true)));
  document.getElementById("pharmacyOrderStatus")?.addEventListener("change",()=>refreshPharmacyOrders().catch(e=>toast(e.message,true)));
  inventoryForm?.addEventListener("submit",async e=>{
    e.preventDefault(); const status=document.getElementById("inventoryStatus");
    if(!window.SM24_PHARMACY.isOwner()){status.textContent="অনুমতি নেই।";return;}
    const fd=new FormData(inventoryForm), payload={pharmacy_id:currentProfile.pharmacy_id,name:String(fd.get("name")||"").trim(),generic_name:String(fd.get("generic_name")||"").trim()||null,unit:String(fd.get("unit")||""),price:Number(fd.get("price")),stock_qty:Number(fd.get("stock_qty")),low_stock_threshold:Number(fd.get("low_stock_threshold")??5),expiry_date:String(fd.get("expiry_date")||"")||null,is_available:fd.get("is_available")==="on"};
    if(!payload.name || !Number.isFinite(payload.price)||payload.price<=0||!Number.isInteger(payload.stock_qty)||payload.stock_qty<0||!Number.isInteger(payload.low_stock_threshold)||payload.low_stock_threshold<0||payload.low_stock_threshold>100000){status.textContent="সঠিক নাম, দাম ও স্টক দিন।";return;}
    const id=fd.get("id"), btn=document.getElementById("inventorySave"); btn.disabled=true; status.textContent="সংরক্ষণ হচ্ছে…";
    try{const q=id?sb.from("pharmacy_inventory").update(payload).eq("id",id).eq("pharmacy_id",currentProfile.pharmacy_id):sb.from("pharmacy_inventory").insert(payload);const {error}=await q;if(error)throw error;resetInventoryForm();status.textContent="Inventory সংরক্ষিত হয়েছে।";await refreshInventory();}catch(err){status.textContent=err.message||"সংরক্ষণ ব্যর্থ হয়েছে।";}finally{btn.disabled=false;}
  });
  document.getElementById("inventoryCancel")?.addEventListener("click",resetInventoryForm);
  document.getElementById("inventoryRefresh")?.addEventListener("click",()=>refreshInventory().catch(e=>toast(e.message,true)));
  document.getElementById("stockHistoryRefresh")?.addEventListener("click",()=>refreshStockHistory().catch(e=>{const n=document.getElementById("stockHistoryStatus");if(n)n.textContent=e.message||"History load failed."; }));

  window.loadAdminPaymentOrders = async function() {
    const root = document.getElementById("adminPaymentOrders");
    if (!root || !window.SM24_ADMIN?.isAdmin()) return;
    root.textContent = "লোড হচ্ছে…";
    const {data,error}=await sb.from("orders")
      .select("id,created_at,status,customer_name,customer_phone,total,payment_method,payment_status")
      .order("created_at",{ascending:false}).limit(100);
    if(error){root.textContent="অর্ডার লোড করা যায়নি: "+error.message;return;}
    if(!data.length){root.textContent="কোনো অর্ডার নেই।";return;}
    root.innerHTML=data.map(o=>`<article class="admin-application"><div><strong>Order #${escapeHTML(String(o.id).slice(0,8))}</strong><p>${escapeHTML(o.customer_name)} · ${escapeHTML(o.customer_phone)} · ৳${Number(o.total).toFixed(2)}<br>Order: ${escapeHTML(o.status)} · Payment: ${escapeHTML(o.payment_status||"unpaid")}</p></div><div class="admin-actions"><select data-payment-state="${o.id}"><option value="unpaid" ${o.payment_status==="unpaid"?"selected":""}>Unpaid</option><option value="paid" ${o.payment_status==="paid"?"selected":""}>Paid</option><option value="refunded" ${o.payment_status==="refunded"?"selected":""}>Refunded</option></select><button class="button button-primary" data-payment-save="${o.id}">Save</button></div></article>`).join("");
    root.querySelectorAll("[data-payment-save]").forEach(btn=>btn.addEventListener("click",async()=>{
      const select=root.querySelector(`[data-payment-state="${btn.dataset.paymentSave}"]`);
      if(!select)return;
      if(select.value==="paid" && !confirm("আপনি কি নিশ্চিত যে টাকা বাস্তবে গ্রহণ ও যাচাই করেছেন?"))return;
      btn.disabled=true;
      const {error:rpcError}=await sb.rpc("sm24_admin_set_payment_status",{p_order_id:btn.dataset.paymentSave,p_payment_status:select.value});
      if(rpcError){toast(rpcError.message,true);btn.disabled=false;return;}
      toast("Payment status updated.");
      await window.loadAdminPaymentOrders();
    }));
  };

  window.loadAdminDeliveryAreas = async function() {
    const root=document.getElementById("adminDeliveryAreas");
    if(!root || !window.SM24_ADMIN?.isAdmin()) return;
    root.textContent="লোড হচ্ছে…";
    const {data,error}=await sb.rpc("sm24_admin_list_delivery_areas");
    if(error){root.textContent="Area list লোড করা যায়নি: "+error.message;return;}
    if(!data?.length){root.textContent="কোনো Delivery Area নেই।";return;}
    root.innerHTML=data.map(a=>`<article class="admin-application"><div><strong>${escapeHTML(a.area)}</strong><p>৳${Number(a.fee).toFixed(2)} · ${a.is_active?"Active":"Inactive"}</p></div><div class="admin-actions"><button class="button button-secondary" type="button" data-area-edit="${escapeHTML(a.area)}" data-area-fee="${a.fee}" data-area-active="${a.is_active}">Edit</button></div></article>`).join("");
    root.querySelectorAll("[data-area-edit]").forEach(btn=>btn.addEventListener("click",()=>{
      const form=document.getElementById("adminAreaForm");
      form.elements.area.value=btn.dataset.areaEdit;
      form.elements.fee.value=btn.dataset.areaFee;
      form.elements.active.checked=btn.dataset.areaActive==="true";
      form.scrollIntoView({behavior:"smooth",block:"center"});
    }));
  };
  const adminAreaForm=document.getElementById("adminAreaForm");
  adminAreaForm?.addEventListener("submit",async event=>{
    event.preventDefault();
    if(!window.SM24_ADMIN?.isAdmin()){window.SM24_ADMIN?.showDenied();return;}
    const form=event.currentTarget;
    const area=form.elements.area.value.trim();
    const fee=Number(form.elements.fee.value);
    const active=form.elements.active.checked;
    if(!area || !Number.isFinite(fee) || fee<0 || fee>10000){toast("Area name বা fee সঠিক নয়।",true);return;}
    const button=form.querySelector('button[type="submit"]');button.disabled=true;
    const {error}=await sb.rpc("sm24_admin_set_delivery_area",{p_area:area,p_fee:fee,p_is_active:active});
    button.disabled=false;
    if(error){toast(error.message,true);return;}
    toast("Delivery Area saved.");
    form.reset();form.elements.active.checked=true;
    await window.loadAdminDeliveryAreas();
  });

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
      window.loadAdminPaymentOrders().catch(e=>console.warn("Payment queue:",e));
      window.loadAdminDeliveryAreas().catch(e=>console.warn("Delivery areas:",e));
      const client = sb;
      const [apps, customers, orders, riders] = await Promise.all([
        client.from("pharmacy_applications").select("id, pharmacy_name, owner_name, phone, area, address, license_number, license_file_url, status, created_at").order("created_at", {ascending:false}),
        client.from("profiles").select("id", {count:"exact", head:true}).eq("role","customer"),
        client.from("orders").select("id", {count:"exact", head:true}),
        client.from("rider_applications").select("id,applicant_id,full_name,phone,area,address,id_reference,status,created_at").order("created_at",{ascending:false})
      ]);
      if (apps.error) throw apps.error;
      if (customers.error) throw customers.error;
      if (orders.error) throw orders.error;
      if (riders.error) throw riders.error;
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
          toast(btn.dataset.appAction === "approved" ? "ফার্মেসি অনুমোদিত হয়েছে এবং Pharmacy profile তৈরি হয়েছে।" : "আবেদন প্রত্যাখ্যান করা হয়েছে।"); await window.SM24_ADMIN.refresh();
        } catch(e) { toast(e.message || "Update failed", true); btn.disabled=false; }
      }));
      const riderRoot=document.getElementById("adminRiderApplications");
      riderRoot.innerHTML = riders.data.length ? riders.data.map(r=>`<article class="admin-application"><div><h4>${escapeHTML(r.full_name)}</h4><p>ফোন: ${escapeHTML(r.phone)}<br>এলাকা: ${escapeHTML(r.area)}<br>ঠিকানা: ${escapeHTML(r.address)}<br>ID reference: ${escapeHTML(r.id_reference)}</p><small>স্ট্যাটাস: ${escapeHTML(r.status)}</small></div><div class="admin-actions">${r.status==="pending"?`<button class="button button-primary" data-rider-action="approved" data-rider-id="${r.id}">Approve</button><button class="button button-danger" data-rider-action="rejected" data-rider-id="${r.id}">Reject</button>`:""}</div></article>`).join(""):"কোনো Rider আবেদন নেই।";
      await window.loadAdminDeliveryQueue();
      riderRoot.querySelectorAll("[data-rider-action]").forEach(btn=>btn.addEventListener("click",async()=>{
        btn.disabled=true;
        try{const {error}=await client.from("rider_applications").update({status:btn.dataset.riderAction,reviewed_by:currentUser.id,reviewed_at:new Date().toISOString()}).eq("id",btn.dataset.riderId);if(error)throw error;await window.SM24_ADMIN.refresh();}
        catch(e){toast(e.message||"Rider update failed",true);btn.disabled=false;}
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

window.addEventListener("hashchange",()=>{if(location.hash==="#pharmacy-dashboard")window.SM24_PHARMACY?.refresh().catch(e=>{const n=document.getElementById("pharmacyDashboardStatus");if(n)n.textContent=e.message||"Dashboard load failed.";});});

window.addEventListener("hashchange", () => {
  if (location.hash === "#my-orders") window.loadCustomerOrders?.();
  if (location.hash === "#rider-apply") window.loadRiderApplicationState?.();
});

document.getElementById("adminRiderRefresh")?.addEventListener("click",()=>window.SM24_ADMIN?.refresh().catch(e=>toast(e.message,true)));

window.addEventListener("hashchange",()=>{if(location.hash==="#rider-dashboard")window.loadRiderDeliveries?.();if(location.hash==="#admin")window.loadAdminDeliveryQueue?.();});
document.getElementById("adminDeliveryRefresh")?.addEventListener("click",()=>window.loadAdminDeliveryQueue?.().catch(e=>toast(e.message,true)));
  document.getElementById("adminPaymentRefresh")?.addEventListener("click", () => window.loadAdminPaymentOrders());
  document.getElementById("adminAreasRefresh")?.addEventListener("click", () => window.loadAdminDeliveryAreas());
