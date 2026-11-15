// SherpurMedi24 — demo frontend. Navigation switches between separate views.
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const pharmacies = [
  {
    name: "City Care Pharmacy",
    area: "জিন্দাবাজার",
    description: "এটি শুধু ডিজাইন দেখানোর জন্য তৈরি নমুনা ফার্মেসি।"
  },
  {
    name: "Ambarkhana Pharmacy",
    area: "আম্বরখানা",
    description: "এটি শুধু ডিজাইন দেখানোর জন্য তৈরি নমুনা ফার্মেসি।"
  },
  {
    name: "Subidbazar Health Point",
    area: "সুবিদবাজার",
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
        <p class="pharmacy-description">${escapeHTML(pharmacy.description)}</p>
        <div class="card-footer">
          <span class="open-status">ডেমো তালিকা</span><span class="arrow" aria-hidden="true">→</span>
        </div>
      </article>`;
  }).join("");

  resultCount.textContent = `${filtered.length}টি ডেমো ফার্মেসি`;
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
