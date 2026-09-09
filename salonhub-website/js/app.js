/* ============================================================
   SalonHub — shared helpers used across every page
   ============================================================ */

function formatMoney(n) {
  return "R" + Number(n).toLocaleString("en-ZA");
}

function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });
}

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function allCities() {
  const cities = DB.getUsers().filter((u) => u.role === "provider").map((u) => u.city);
  return [...new Set(cities)].sort();
}

function initials(name) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

/* ---------- top navigation, rendered into #site-nav on every page ---------- */
function renderNav(active) {
  const nav = document.getElementById("site-nav");
  if (!nav) return;
  const user = DB.currentUser();

  let rightLinks = "";
  if (!user) {
    rightLinks = `
      <a href="login.html" class="nav-link">Log in</a>
      <a href="signup.html" class="nav-btn">Sign up</a>`;
  } else {
    const dashHref = user.role === "admin" ? "dashboard-admin.html"
      : user.role === "provider" ? "dashboard-provider.html"
      : "dashboard-customer.html";
    const unread = typeof NOTIFY !== "undefined" ? NOTIFY.unreadCount(user.id) : 0;
    const bell = `
      <a href="notifications.html" class="bell-link" title="Notifications">
        <svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        ${unread ? `<span class="bell-dot">${unread > 9 ? "9+" : unread}</span>` : ""}
      </a>`;
    rightLinks = `
      ${user.role !== "admin" ? bell : ""}
      <a href="${dashHref}" class="nav-link">${user.name.split(" ")[0]}'s dashboard</a>
      <a href="#" id="logout-link" class="nav-btn nav-btn-ghost">Log out</a>`;
  }

  nav.innerHTML = `
    <div class="nav-inner">
      <a href="index.html" class="brand"><img src="assets/favicon.svg" alt="" class="brand-mark" />Salon<span>Hub</span></a>
      <div class="nav-links">
        <a href="browse.html?type=housecall" class="nav-link ${active === "housecall" ? "is-active" : ""}">House calls</a>
        <a href="browse.html?type=salon" class="nav-link ${active === "salon" ? "is-active" : ""}">Salons</a>
      </div>
      <div class="nav-right">${rightLinks}</div>
    </div>`;

  const logout = document.getElementById("logout-link");
  if (logout) {
    logout.addEventListener("click", (e) => {
      e.preventDefault();
      DB.clearSession();
      window.location.href = "index.html";
    });
  }
}

/* ---------- shared provider listing row, used on the homepage & browse page ---------- */
function providerRowHTML(p) {
  const typeLabel = p.providerType === "housecall" ? p.category : "Salon";
  const badgeClass = p.providerType === "housecall" ? "badge-housecall" : "badge-salon";
  const servicesPreview = p.services.slice(0, 3).map((s) => s.name).join(" · ") || "No services listed yet";
  const fromPrice = p.services.length ? formatMoney(Math.min(...p.services.map((s) => s.price))) : "—";
  return `
    <a class="listing-row" href="provider.html?id=${p.id}" style="text-decoration:none;">
      <img class="avatar" src="${p.image}" alt="${p.name}" />
      <div>
        <h3 class="name">${p.name}</h3>
        <div class="meta">
          <span class="badge ${badgeClass}">${typeLabel}</span>
          <span>${p.city}</span>
          ${p.verified ? '<span class="badge badge-verified">Verified</span>' : '<span class="badge badge-pending">Pending review</span>'}
        </div>
        <div class="services-preview">${servicesPreview}</div>
      </div>
      <div class="small muted">From ${fromPrice}</div>
    </a>`;
}

function renderListing(containerId, providers, emptyMsg) {
  const el = document.getElementById(containerId);
  if (!providers.length) {
    el.innerHTML = `<div class="listing-empty">${emptyMsg || "No providers match your search yet."}</div>`;
    return;
  }
  el.innerHTML = providers.map(providerRowHTML).join("");
}

/* redirect helpers used at the top of protected pages */
function requireRole(roles) {
  const user = DB.currentUser();
  if (!user || !roles.includes(user.role)) {
    window.location.href = "login.html";
    return null;
  }
  return user;
}

function redirectIfLoggedIn() {
  const user = DB.currentUser();
  if (user) {
    const dashHref = user.role === "admin" ? "dashboard-admin.html"
      : user.role === "provider" ? "dashboard-provider.html"
      : "dashboard-customer.html";
    window.location.href = dashHref;
  }
}

function wireTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("is-active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("is-active"));
      btn.classList.add("is-active");
      document.getElementById("tab-" + btn.dataset.tab).classList.add("is-active");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});
