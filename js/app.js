// SherpurMedi24 — demo frontend. Navigation switches between separate views.
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const pharmacies = [
  {
    name: "City Care Pharmacy",
    area: "গোয়ালাবাজার",
    description: "এটি শুধু ডিজাইন দেখানোর জন্য তৈরি নমুনা ফার্মেসি।"
  },
  {
    name: "Sarker Bazar Pharmacy",
    area: "সরকার বাজার",
    description: "এটি শুধু ডিজাইন দেখানোর জন্য তৈরি নমুনা ফার্মেসি।"
  },
  {
    name: "Aushkandi Health Point",
    area: "আউশকান্দি",
    description: "এটি শুধু ডিজাইন দেখানোর জন্য তৈরি নমুনা ফার্মেসি।"
  }
];

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
  const englishUI = window.sm24Language === "en";
  const selectedArea = areaSelect.value;

  const filtered = pharmacies.filter((pharmacy) => {
    const matchesText =
      pharmacy.name.toLocaleLowerCase().includes(query) ||
      pharmacy.area.toLocaleLowerCase().includes(query);
    return matchesText && (!selectedArea || pharmacy.area === selectedArea);
  });

  pharmacyGrid.innerHTML = filtered.map((pharmacy) => {
    const initials = pharmacy.name.split(" ").slice(0, 2)
      .map((word) => word[0]).join("").toUpperCase();
    const index = pharmacies.indexOf(pharmacy);
    const avatarClass = ["", "avatar-blue", "avatar-gold"][index] || "";
    return `
      <article class="pharmacy-card">
        <div class="pharmacy-card-head">
          <span class="pharmacy-avatar ${avatarClass}">${escapeHTML(initials)}</span>
          <span class="demo-tag">DEMO</span>
        </div>
        <h3>${escapeHTML(pharmacy.name)}</h3>
        <p class="pharmacy-area">${escapeHTML(pharmacy.area)}</p>
        <p class="pharmacy-description">${englishUI ? "Sample pharmacy for demonstration only." : escapeHTML(pharmacy.description)}</p>
        <div class="card-footer">
          <span class="open-status">${englishUI ? "Demo listing" : "ডেমো তালিকা"}</span><span class="arrow" aria-hidden="true">→</span>
        </div>
      </article>`;
  }).join("");

  resultCount.textContent = englishUI ? `${filtered.length} demo pharmacies` : `${filtered.length}টি ডেমো ফার্মেসি`;
  emptyState.hidden = filtered.length !== 0;
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
  localStorage.setItem('sm24-language', chosen);
  if (languageSelect) languageSelect.value = chosen;
}
if (languageSelect) {
  languageSelect.addEventListener('change', () => applyLanguage(languageSelect.value));
  applyLanguage(localStorage.getItem('sm24-language') || 'bn');
}
